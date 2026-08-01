import invoiceRepository from '../repositories/InvoiceRepository.js';
import invoiceService from '../services/InvoiceService.js';

export const getInvoices = async (req, res, next) => {
  try {
    const { search, paymentStatus, status, page, limit } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { challanNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.companyName': { $regex: search, $options: 'i' } }
      ];
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (status) {
      filter.status = status;
    }

    const options = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50
    };

    const result = await invoiceRepository.find(filter, options);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await invoiceRepository.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.createInvoice(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Tax Invoice generated successfully', data: invoice });
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.updateInvoice(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: 'Invoice updated successfully', data: invoice });
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const invoice = await invoiceService.recordPayment(req.params.id, req.body);
    res.json({ success: true, message: 'Payment recorded successfully', data: invoice });
  } catch (error) {
    next(error);
  }
};

export const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const invoice = await invoiceRepository.update(req.params.id, { status });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Status updated successfully', data: invoice });
  } catch (error) {
    next(error);
  }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceRepository.delete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Invoice cancelled / deleted successfully' });
  } catch (error) {
    next(error);
  }
};
