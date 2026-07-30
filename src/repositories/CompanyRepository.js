import BaseRepository from './BaseRepository.js';
import CompanySettings from '../models/CompanySettings.js';

class CompanyRepository extends BaseRepository {
  constructor() {
    super(CompanySettings);
  }

  async getSettings() {
    let settings = await this.model.findOne();
    if (!settings) {
      settings = await this.model.create({});
    }
    return settings;
  }

  async updateSettings(updateData) {
    if (updateData && updateData.bankDetails) {
      const acc = updateData.bankDetails.accountNumber || updateData.bankDetails.accountNo || '';
      const ifsc = updateData.bankDetails.ifscCode || updateData.bankDetails.ifsc || '';
      updateData.bankDetails.accountNo = acc;
      updateData.bankDetails.accountNumber = acc;
      updateData.bankDetails.ifsc = ifsc;
      updateData.bankDetails.ifscCode = ifsc;
    }
    let settings = await this.model.findOne();
    if (!settings) {
      return await this.model.create(updateData);
    }
    await settings.update(updateData);
    return settings;
  }
}

const companyRepository = new CompanyRepository();
export default companyRepository;
