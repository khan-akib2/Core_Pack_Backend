import quotationRepository from '../repositories/QuotationRepository.js';
import quotationService from '../services/QuotationService.js';

export const getQuotations = async (req, res, next) => {
  try {
    const { search, status, page, limit } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { quoteNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.companyName': { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    const options = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50
    };

    const result = await quotationRepository.find(filter, options);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const getQuotationById = async (req, res, next) => {
  try {
    const quotation = await quotationRepository.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    res.json({ success: true, data: quotation });
  } catch (error) {
    next(error);
  }
};

export const createQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.createQuotation(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Quotation created successfully', data: quotation });
  } catch (error) {
    next(error);
  }
};

export const updateQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.updateQuotation(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: 'Quotation updated successfully', data: quotation });
  } catch (error) {
    next(error);
  }
};

export const updateQuotationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const quotation = await quotationRepository.update(req.params.id, { status });
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    res.json({ success: true, message: 'Status updated successfully', data: quotation });
  } catch (error) {
    next(error);
  }
};

export const deleteQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationRepository.delete(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    next(error);
  }
};
