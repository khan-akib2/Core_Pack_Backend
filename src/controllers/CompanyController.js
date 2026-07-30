import companyRepository from '../repositories/CompanyRepository.js';

export const getCompanySettings = async (req, res, next) => {
  try {
    const settings = await companyRepository.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateCompanySettings = async (req, res, next) => {
  try {
    const settings = await companyRepository.updateSettings(req.body);
    res.json({ success: true, message: 'Company settings updated successfully', data: settings });
  } catch (error) {
    next(error);
  }
};
