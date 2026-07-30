import BaseRepository from './BaseRepository.js';
import Customer from '../models/Customer.js';

class CustomerRepository extends BaseRepository {
  constructor() {
    super(Customer);
  }

  async searchCustomers(queryStr) {
    if (!queryStr) return [];
    return await this.model.find({
      $or: [
        { companyName: { $regex: queryStr, $options: 'i' } },
        { name: { $regex: queryStr, $options: 'i' } },
        { gstin: { $regex: queryStr, $options: 'i' } },
        { phone: { $regex: queryStr, $options: 'i' } }
      ],
      isActive: true
    }).limit(20).exec();
  }
}

const customerRepository = new CustomerRepository();
export default customerRepository;
