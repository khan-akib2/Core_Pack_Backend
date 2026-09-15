import paymentService from '../services/PaymentService.js';
import invoiceRepository from '../repositories/InvoiceRepository.js';
import customerRepository from '../repositories/CustomerRepository.js';

export const recordPayment = async (req, res, next) => {
  try {
    const { invoiceId } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ success: false, message: 'invoiceId is required' });
    }
    const payment = await paymentService.recordPayment(invoiceId, req.body, req.user?.id);
    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: payment });
  } catch (error) {
    next(error);
  }
};

export const deletePayment = async (req, res, next) => {
  try {
    await paymentService.deletePayment(req.params.id);
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await paymentService.getPaymentHistory(req.params.invoiceId);
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

export const getPendingPayments = async (req, res, next) => {
  try {
    // We want all invoices that are not "Paid" and not "Cancelled"
    const { status, search } = req.query;
    
    let filter = { 
      paymentStatus: { $ne: 'Paid' },
      status: { $ne: 'Cancelled' }
    };

    if (status === 'Unpaid' || status === 'Partial' || status === 'Paid') {
      filter.paymentStatus = status;
    }

    if (search) {
      filter = {
        ...filter,
        $or: [
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
          { 'customerSnapshot.companyName': { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Since outstanding totals are cached cleanly in Invoice by PaymentService, we can query invoices directly
    const result = await invoiceRepository.find(filter, { limit: 10000, sort: { createdAt: -1 } });
    
    // We also need total aggregated outstanding for summary cards
    const summary = result.data.reduce((acc, inv) => {
      acc.totalOutstanding += (inv.dueAmount || 0);
      if (inv.paymentStatus === 'Unpaid') acc.unpaidCount++;
      if (inv.paymentStatus === 'Partial') acc.partialCount++;
      
      // Check overdue (dueDate exists, > 0 outstanding, due date < current date)
      if (inv.dueAmount > 0 && inv.dueDate && new Date(inv.dueDate) < new Date()) {
        acc.overdueCount++;
        acc.overdueAmount += (inv.dueAmount || 0);
      }
      return acc;
    }, { totalOutstanding: 0, unpaidCount: 0, partialCount: 0, overdueCount: 0, overdueAmount: 0 });

    res.json({
      success: true,
      data: {
        invoices: result.data,
        summary
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerSummary = async (req, res, next) => {
  try {
    // Get all non-cancelled invoices for a customer to build a statement
    const { customerId } = req.query;
    if (!customerId) return res.status(400).json({ success: false, message: 'customerId is required' });

    const customer = await customerRepository.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const result = await invoiceRepository.find({ customerId, status: { $ne: 'Cancelled' } }, { limit: 10000, sort: { invoiceDate: -1 } });
    const invoices = result.data || [];

    const summary = invoices.reduce((acc, inv) => {
      acc.totalInvoiced += (inv.grandTotal || 0);
      acc.totalReceived += (inv.paidAmount || 0);
      acc.outstanding += (inv.dueAmount || 0);
      if (inv.dueAmount > 0) acc.openInvoices++;
      return acc;
    }, { totalInvoiced: 0, totalReceived: 0, outstanding: 0, openInvoices: 0 });

    res.json({
      success: true,
      data: {
        customer,
        summary,
        invoices
      }
    });
  } catch (error) {
    next(error);
  }
};
