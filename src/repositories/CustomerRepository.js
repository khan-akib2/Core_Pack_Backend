import { Op } from 'sequelize';
import BaseRepository from './BaseRepository.js';
import Customer from '../models/Customer.js';

class CustomerRepository extends BaseRepository {
  constructor() {
    super(Customer);
  }

  async searchCustomers(queryStr) {
    if (!queryStr) return [];
    return await this.model.findAll({
      where: {
        [Op.or]: [
          { companyName: { [Op.like]: `%${queryStr}%` } },
          { name: { [Op.like]: `%${queryStr}%` } },
          { gstin: { [Op.like]: `%${queryStr}%` } },
          { phone: { [Op.like]: `%${queryStr}%` } }
        ],
        isActive: true
      },
      limit: 20
    });
  }
}

const customerRepository = new CustomerRepository();
export default customerRepository;
