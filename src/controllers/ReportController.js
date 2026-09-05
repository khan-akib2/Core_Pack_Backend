import invoiceRepository from '../repositories/InvoiceRepository.js';

export const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { status: { $ne: 'Cancelled' } };

    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }

    const result = await invoiceRepository.find(filter, { limit: 10000 });
    const invoices = result.data || [];

    let totalRevenue = 0;
    let totalTaxCollected = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let paidAmountTotal = 0;
    let outstandingAmountTotal = 0;

    invoices.forEach(inv => {
      totalRevenue += inv.subtotal || 0;
      
      let invCgst = inv.cgstTotal || 0;
      let invSgst = inv.sgstTotal || 0;
      
      if (!invCgst && !invSgst && inv.igstTotal) {
        invCgst = inv.igstTotal / 2;
        invSgst = inv.igstTotal / 2;
      } else if (!invCgst && !invSgst && inv.totalTax) {
        invCgst = inv.totalTax / 2;
        invSgst = inv.totalTax / 2;
      }
      
      totalCgst += invCgst;
      totalSgst += invSgst;
      totalIgst += 0;
      paidAmountTotal += inv.paidAmount || 0;
      outstandingAmountTotal += inv.dueAmount || 0;
    });

    totalTaxCollected = totalCgst + totalSgst + totalIgst;

    res.json({
      success: true,
      data: {
        summary: {
          totalInvoicesCount: invoices.length,
          totalRevenue,
          totalTaxCollected,
          totalCgst,
          totalSgst,
          totalIgst: 0,
          paidAmountTotal,
          outstandingAmountTotal,
          grandTotalSum: totalRevenue + totalTaxCollected
        },
        invoices
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getGstr1Report = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const m = month ? parseInt(month, 10) - 1 : new Date().getMonth();
    const y = year ? parseInt(year, 10) : new Date().getFullYear();

    const startDate = new Date(y, m, 1);
    const endDate = new Date(y, m + 1, 0, 23, 59, 59);

    const result = await invoiceRepository.find({
      invoiceDate: { $gte: startDate, $lte: endDate },
      status: { $ne: 'Cancelled' }
    }, { limit: 10000 });

    const invoices = result.data || [];

    const b2b = invoices.filter(inv => inv.customerSnapshot?.gstin);
    const b2c = invoices.filter(inv => !inv.customerSnapshot?.gstin);

    res.json({
      success: true,
      data: {
        period: { month: m + 1, year: y },
        b2bInvoices: b2b,
        b2cInvoices: b2c,
        totalB2B: b2b.reduce((acc, inv) => acc + inv.grandTotal, 0),
        totalB2C: b2c.reduce((acc, inv) => acc + inv.grandTotal, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const downloadReportPdf = async (req, res, next) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    
    // Convert to query string for Puppeteer to pass to the frontend
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryParams = params.toString() ? `&${params.toString()}` : '';

    // Generate PDF using existing PdfService, pointing to frontend /print/reports/sales
    const pdfBuffer = await (await import('../services/PdfService.js')).default.generateDocumentPdf('reports', 'sales', req.user.token, queryParams);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Report_${month || 'Current'}_${year || new Date().getFullYear()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Report PDF Generation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report PDF' });
  }
};
