import deliveryChallanRepository from '../repositories/DeliveryChallanRepository.js';
import customerRepository from '../repositories/CustomerRepository.js';
import companyRepository from '../repositories/CompanyRepository.js';
import counterService from './CounterService.js';

class DeliveryChallanService {
  async createChallan(data, userId) {
    const customer = await customerRepository.findById(data.customerId);
    if (!customer) throw new Error('Customer not found');

    const company = await companyRepository.getSettings();

    const items = data.items.map(item => ({
      productId: (item.productId && String(item.productId).trim() !== '') ? item.productId : undefined,
      name: item.name || 'Packaging Product',
      hsnCode: item.hsnCode || '44151000',
      qty: Number(item.qty) || 1,
      unit: item.unit || 'Pcs',
      remarks: item.remarks || ''
    }));

    let challanNumber = await counterService.generateChallanNumber();
    const existingChallan = await deliveryChallanRepository.findOne({ challanNumber });
    if (existingChallan) {
      challanNumber = await counterService.generateChallanNumber();
    }

    const challan = await deliveryChallanRepository.create({
      challanNumber,
      challanDate: data.challanDate || new Date(),
      vehicleNo: data.vehicleNo || '',
      transportMode: data.transportMode || 'Road',
      customerId: customer._id,
      customerSnapshot: {
        name: customer.name,
        companyName: customer.companyName,
        gstin: customer.gstin,
        email: customer.email,
        phone: customer.phone,
        billingAddress: customer.billingAddress,
        shippingAddress: customer.shippingAddress
      },
      items,
      status: 'Dispatched',
      notes: data.notes || '',
      createdBy: userId
    });

    return challan;
  }
}

const deliveryChallanService = new DeliveryChallanService();
export default deliveryChallanService;
