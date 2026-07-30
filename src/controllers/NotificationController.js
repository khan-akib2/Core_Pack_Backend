import invoiceRepository from '../repositories/InvoiceRepository.js';
import deliveryChallanRepository from '../repositories/DeliveryChallanRepository.js';
import quotationRepository from '../repositories/QuotationRepository.js';

export const getNotifications = async (req, res, next) => {
  try {
    const [invRes, dcRes, qRes] = await Promise.all([
      invoiceRepository.find({}, { limit: 5 }),
      deliveryChallanRepository.find({}, { limit: 5 }),
      quotationRepository.find({}, { limit: 5 })
    ]);

    const invoices = invRes.data || [];
    const challans = dcRes.data || [];
    const quotations = qRes.data || [];

    const notifications = [];

    invoices.forEach(inv => {
      notifications.push({
        id: `inv-${inv._id}`,
        type: 'invoice',
        title: 'Tax Invoice Issued',
        message: `Tax Invoice ${inv.invoiceNumber} (₹${inv.grandTotal?.toLocaleString('en-IN') || 0}) was generated.`,
        createdAt: inv.createdAt,
        link: `/invoices/${inv._id}`,
        status: inv.paymentStatus
      });

      if (Array.isArray(inv.payments) && inv.payments.length > 0) {
        inv.payments.forEach((p, idx) => {
          notifications.push({
            id: `pay-${inv._id}-${idx}`,
            type: 'payment',
            title: 'Payment Received',
            message: `Payment of ₹${p.amount?.toLocaleString('en-IN')} received via ${p.mode} for Invoice ${inv.invoiceNumber}.`,
            createdAt: p.paymentDate || inv.updatedAt,
            link: `/invoices/${inv._id}`,
            status: 'Paid'
          });
        });
      }
    });

    challans.forEach(dc => {
      notifications.push({
        id: `dc-${dc._id}`,
        type: 'challan',
        title: 'Delivery Challan Dispatched',
        message: `Challan ${dc.challanNumber} for ${dc.customerSnapshot?.companyName || dc.customerSnapshot?.name || 'Client'} has been dispatched.`,
        createdAt: dc.createdAt,
        link: `/delivery-challans/${dc._id}`,
        status: dc.status
      });
    });

    quotations.forEach(q => {
      notifications.push({
        id: `q-${q._id}`,
        type: 'quotation',
        title: 'Quotation Generated',
        message: `Quotation ${q.quoteNumber} (₹${q.grandTotal?.toLocaleString('en-IN') || 0}) created.`,
        createdAt: q.createdAt,
        link: `/quotations/${q._id}`,
        status: q.status
      });
    });

    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      unreadCount: Math.min(notifications.length, 5),
      data: notifications.slice(0, 10)
    });
  } catch (error) {
    next(error);
  }
};
