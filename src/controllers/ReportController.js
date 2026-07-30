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
