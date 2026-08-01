import deliveryChallanRepository from '../repositories/DeliveryChallanRepository.js';
import deliveryChallanService from '../services/DeliveryChallanService.js';

export const getChallans = async (req, res, next) => {
  try {
    const { search, status, page, limit } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { challanNumber: { $regex: search, $options: 'i' } },
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

    const result = await deliveryChallanRepository.find(filter, options);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const getChallanById = async (req, res, next) => {
  try {
    const challan = await deliveryChallanRepository.findById(req.params.id);
    if (!challan) {
      return res.status(404).json({ success: false, message: 'Delivery Challan not found' });
    }
    res.json({ success: true, data: challan });
  } catch (error) {
    next(error);
  }
};

export const createChallan = async (req, res, next) => {
  try {
    const challan = await deliveryChallanService.createChallan(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Delivery Challan created successfully', data: challan });
  } catch (error) {
    next(error);
  }
};

export const updateChallan = async (req, res, next) => {
  try {
    const challan = await deliveryChallanService.updateChallan(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: 'Delivery Challan updated successfully', data: challan });
  } catch (error) {
    next(error);
  }
};

export const updateChallanStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const challan = await deliveryChallanRepository.update(req.params.id, { status });
    if (!challan) {
      return res.status(404).json({ success: false, message: 'Delivery Challan not found' });
    }
    res.json({ success: true, message: 'Status updated successfully', data: challan });
  } catch (error) {
    next(error);
  }
};

export const deleteChallan = async (req, res, next) => {
  try {
    const challan = await deliveryChallanRepository.delete(req.params.id);
    if (!challan) {
      return res.status(404).json({ success: false, message: 'Delivery Challan not found' });
    }
    res.json({ success: true, message: 'Delivery Challan deleted successfully' });
  } catch (error) {
    next(error);
  }
};
