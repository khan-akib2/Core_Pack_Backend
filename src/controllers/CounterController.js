import counterService from '../services/CounterService.js';

export const getNextNumber = async (req, res, next) => {
  try {
    const { type } = req.query;
    const nextNumber = await counterService.getNextPreview(type || 'invoice');
    res.json({
      success: true,
      data: {
        nextNumber,
        type: type || 'invoice',
        todayDate: new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    next(error);
  }
};
