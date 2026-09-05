import EmailService from '../services/EmailService.js';
import WhatsAppService from '../services/WhatsAppService.js';
import invoiceRepository from '../repositories/InvoiceRepository.js';
import quotationRepository from '../repositories/QuotationRepository.js';
import deliveryChallanRepository from '../repositories/DeliveryChallanRepository.js';
import PdfService from '../services/PdfService.js';

export const sendDocumentEmail = async (req, res) => {
  try {
    const { id, type } = req.params;
    const { toEmail, subject, message } = req.body;

    if (!toEmail) {
      return res.status(400).json({ success: false, message: 'Recipient email is required.' });
    }

    // Extract token to pass to PdfService
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token missing.' });
    }

    // Basic verification that the document exists and belongs to the user's company
    const companyId = req.user.companyId;
    let documentFound = null;

    if (type === 'invoice') {
      documentFound = await invoiceRepository.findById(id);
    } else if (type === 'quotation') {
      documentFound = await quotationRepository.findById(id);
    } else if (type === 'challan') {
      documentFound = await deliveryChallanRepository.findById(id);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid document type.' });
    }

    if (!documentFound) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Generate PDF server-side using Puppeteer
    const pdfBuffer = await PdfService.generateDocumentPdf(type, id, token);

    // Determine default filename
    const filename = `${type.toUpperCase()}-${documentFound.invoiceNumber || documentFound.quoteNumber || documentFound.quotationNumber || documentFound.challanNumber || id}.pdf`;

    // Send email
    await EmailService.sendDocumentEmail({
      toEmail,
      subject,
      message,
      attachmentBuffer: pdfBuffer,
      filename,
    });

    res.status(200).json({ success: true, message: 'Email sent successfully.' });
  } catch (error) {
    console.error('sendDocumentEmail error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send email.' });
  }
};

export const downloadDocumentPdf = async (req, res) => {
  try {
    const { id, type } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token missing.' });
    }

    let documentFound = null;
    if (type === 'invoice') {
      documentFound = await invoiceRepository.findById(id);
    } else if (type === 'quotation') {
      documentFound = await quotationRepository.findById(id);
    } else if (type === 'challan') {
      documentFound = await deliveryChallanRepository.findById(id);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid document type.' });
    }

    if (!documentFound) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const pdfBuffer = await PdfService.generateDocumentPdf(type, id, token);
    const filename = `${type.toUpperCase()}-${documentFound.invoiceNumber || documentFound.quoteNumber || documentFound.quotationNumber || documentFound.challanNumber || id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('downloadDocumentPdf error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate PDF.' });
  }
};

export const sendDocumentWhatsApp = async (req, res) => {
  try {
    const { id, type } = req.params;
    const { toNumber, toNumbers, message } = req.body;

    const rawRecipients = Array.isArray(toNumbers) && toNumbers.length > 0
      ? toNumbers
      : (toNumber ? [toNumber] : []);

    const recipientList = [...new Set(rawRecipients.filter(Boolean))];

    if (recipientList.length === 0) {
      return res.status(400).json({ success: false, message: 'Recipient WhatsApp number(s) required.' });
    }

    // Check WhatsApp connection before generating PDF (Part D requirement 28)
    if (WhatsAppService.status !== 'READY' || !WhatsAppService.client) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp client is not connected. Please scan the QR code in settings.'
      });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token missing.' });
    }

    const companyId = req.user.companyId;
    let documentFound = null;

    if (type === 'invoice') {
      documentFound = await invoiceRepository.findById(id);
    } else if (type === 'quotation') {
      documentFound = await quotationRepository.findById(id);
    } else if (type === 'challan') {
      documentFound = await deliveryChallanRepository.findById(id);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid document type.' });
    }

    if (!documentFound) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Generate PDF server-side ONCE using Puppeteer (Part D requirement 21 & 22)
    console.log(`[DocumentDeliveryController] Generating PDF ONCE for ${recipientList.length} recipient(s)...`);
    const pdfBuffer = await PdfService.generateDocumentPdf(type, id, token);

    const filename = `${type.toUpperCase()}-${documentFound.invoiceNumber || documentFound.quoteNumber || documentFound.quotationNumber || documentFound.challanNumber || id}.pdf`;

    // Send PDF sequentially to each recipient using the SINGLE pdfBuffer
    const results = [];
    let successCount = 0;

    for (const num of recipientList) {
      try {
        await WhatsAppService.sendDocumentWhatsApp({
          toNumber: num,
          message,
          attachmentBuffer: pdfBuffer,
          filename,
        });
        results.push({ toNumber: num, success: true });
        successCount++;
      } catch (err) {
        console.error(`Failed sending to ${num}:`, err.message);
        results.push({ toNumber: num, success: false, error: err.message });
      }
    }

    if (recipientList.length === 1) {
      if (results[0].success) {
        return res.status(200).json({ success: true, message: 'WhatsApp message sent successfully.', results });
      } else {
        return res.status(500).json({ success: false, message: results[0].error || 'Failed to send WhatsApp message.', results });
      }
    }

    res.status(200).json({
      success: successCount > 0,
      message: `${successCount} of ${recipientList.length} WhatsApp messages sent successfully.`,
      sentCount: successCount,
      totalCount: recipientList.length,
      results
    });
  } catch (error) {
    console.error('sendDocumentWhatsApp error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send WhatsApp message.' });
  }
};
