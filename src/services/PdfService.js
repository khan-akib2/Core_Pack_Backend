import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import invoiceRepository from '../repositories/InvoiceRepository.js';
import quotationRepository from '../repositories/QuotationRepository.js';
import deliveryChallanRepository from '../repositories/DeliveryChallanRepository.js';
import companyRepository from '../repositories/CompanyRepository.js';

dotenv.config();

class PdfService {
  async getFallbackHtml(type, id) {
    let doc = null;
    let comp = null;

    try {
      if (type === 'invoice') doc = await invoiceRepository.findById(id);
      else if (type === 'quotation') doc = await quotationRepository.findById(id);
      else if (type === 'challan') doc = await deliveryChallanRepository.findById(id);
    } catch (e) {
      console.error('[PdfService] Error fetching document for HTML fallback:', e);
    }

    try {
      comp = await companyRepository.getSettings();
    } catch (e) {
      console.error('[PdfService] Error fetching company settings for HTML fallback:', e);
    }

    const docNo = doc?.invoiceNumber || doc?.quoteNumber || doc?.challanNumber || id;
    const docTitle = type === 'invoice' ? 'TAX INVOICE' : type === 'quotation' ? 'OFFICIAL QUOTATION' : 'DELIVERY CHALLAN';
    const cust = doc?.customerSnapshot || {};
    const companyName = comp?.companyName || 'CORE PACK INDIA';
    const companyAddress = comp?.address?.street || comp?.address || 'MIDC Chakan Phase 2, Pune';
    const companyGstin = comp?.gstin || '';
    const companyPhone = comp?.phone || '';
    const companyEmail = comp?.email || '';

    const items = doc?.items || [];
    let itemsRows = '';
    items.forEach((item, index) => {
      itemsRows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">
            <strong>${item.name || 'Item'}</strong>
            ${item.boxSize ? `<br><small>Box Size: ${item.boxSize}</small>` : ''}
          </td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${item.hsnCode || ''}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">${item.qty || 1} ${item.unit || 'Pcs'}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">₹${(item.rate || 0).toLocaleString('en-IN')}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">₹${((item.qty || 1) * (item.rate || 0)).toLocaleString('en-IN')}</td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #F26522; padding-bottom: 15px; margin-bottom: 20px; }
          .company-title { font-size: 24px; font-weight: bold; color: #F26522; }
          .doc-title { font-size: 20px; font-weight: bold; text-align: right; color: #0f172a; }
          .meta-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
          .meta-table td { padding: 4px; font-size: 13px; vertical-align: top; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          .items-table th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          .total-box { margin-top: 20px; text-align: right; font-size: 14px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-title">${companyName}</div>
            <div style="font-size: 12px; color: #64748b;">${companyAddress}</div>
            <div style="font-size: 12px; color: #64748b;">GSTIN: ${companyGstin} | Phone: ${companyPhone}</div>
          </div>
          <div>
            <div class="doc-title">${docTitle}</div>
            <div style="font-size: 14px; font-weight: bold; text-align: right; color: #475569;"># ${docNo}</div>
          </div>
        </div>

        <table class="meta-table">
          <tr>
            <td width="50%">
              <strong>Billed To:</strong><br>
              ${cust.companyName || cust.name || 'Customer'}<br>
              ${cust.billingAddress?.street || ''} ${cust.billingAddress?.city || ''}<br>
              ${cust.gstin ? `GSTIN: ${cust.gstin}` : ''}
            </td>
            <td width="50%" style="text-align: right;">
              <strong>Date:</strong> ${doc?.invoiceDate ? new Date(doc.invoiceDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}<br>
              ${doc?.dueDate ? `<strong>Due Date:</strong> ${new Date(doc.dueDate).toLocaleDateString('en-IN')}` : ''}
            </td>
          </tr>
        </table>

        <table class="items-table">
          <thead>
            <tr>
              <th width="5%">#</th>
              <th>Description</th>
              <th width="15%">HSN/SAC</th>
              <th width="15%" style="text-align: right;">Qty</th>
              <th width="15%" style="text-align: right;">Rate</th>
              <th width="20%" style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="total-box">
          Grand Total: ₹${(doc?.grandTotal || doc?.subtotal || 0).toLocaleString('en-IN')}
        </div>
      </body>
      </html>
    `;
  }

  async generateDocumentPdf(type, id, token, queryParams = '') {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
      });

      const page = await browser.newPage();

      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 1,
      });

      let baseUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = `https://${baseUrl}`;
      }

      const url = `${baseUrl}/print/${type}/${id}?token=${token}${queryParams}`;

      let loadedSuccessfully = false;
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
        const errorText = await page.evaluate(() => {
          const errEl = document.querySelector('.text-rose-500');
          return errEl ? errEl.innerText : null;
        });

        if (!errorText) {
          loadedSuccessfully = true;
        } else {
          console.warn(`[PdfService] Render returned component error (${errorText}), falling back to direct HTML rendering.`);
        }
      } catch (navErr) {
        console.warn(`[PdfService] Navigation to ${url} failed (${navErr.message}). Using direct HTML rendering fallback.`);
      }

      if (!loadedSuccessfully) {
        const htmlContent = await this.getFallbackHtml(type, id);
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });

      return pdfBuffer;
    } catch (error) {
      console.error('Puppeteer PDF generation error:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

export default new PdfService();
