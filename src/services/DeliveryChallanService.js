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
      boxSize: item.boxSize || '',
      hsnCode: item.hsnCode || '44151000',
      qty: Number(item.qty) || 1,
      unit: item.unit || 'Pcs',
      remarks: item.remarks || ''
    }));

    let challanNumber;
    if (data.challanNumber && String(data.challanNumber).trim() !== '') {
      challanNumber = String(data.challanNumber).trim();
      const existing = await deliveryChallanRepository.findOne({ challanNumber }, { paranoid: false });
      if (existing) {
        if (existing.deletedAt) {
          existing.challanNumber = `${existing.challanNumber}_deleted_${Date.now()}`;
          await existing.save({ paranoid: false });
        } else {
          throw new Error('Challan number already exists');
        }
      }
    } else {
      challanNumber = await counterService.generateChallanNumber();
      const existingChallan = await deliveryChallanRepository.findOne({ challanNumber }, { paranoid: false });
      if (existingChallan) {
        challanNumber = await counterService.generateChallanNumber();
      }
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

  async updateChallan(id, data, userId) {
    const existingChallan = await deliveryChallanRepository.findById(id);
    if (!existingChallan) throw new Error('Challan not found');

    const customer = await customerRepository.findById(data.customerId || existingChallan.customerId);
    if (!customer) throw new Error('Customer not found');

    const items = data.items.map(item => ({
      productId: (item.productId && String(item.productId).trim() !== '') ? item.productId : undefined,
      name: item.name || 'Packaging Product',
      boxSize: item.boxSize || '',
      hsnCode: item.hsnCode || '44151000',
      qty: Number(item.qty) || 1,
      unit: item.unit || 'Pcs',
      remarks: item.remarks || ''
    }));

    let challanNumber = existingChallan.challanNumber;
    if (data.challanNumber && data.challanNumber.trim() !== '' && data.challanNumber.trim() !== challanNumber) {
      const existing = await deliveryChallanRepository.findOne({ challanNumber: data.challanNumber.trim() }, { paranoid: false });
      if (existing) {
        if (existing.deletedAt) {
          existing.challanNumber = `${existing.challanNumber}_deleted_${Date.now()}`;
          await existing.save({ paranoid: false });
        } else {
          throw new Error('Challan number already exists');
        }
      }
      challanNumber = data.challanNumber.trim();
    }

    const updatedChallan = await deliveryChallanRepository.update(id, {
      challanNumber,
      challanDate: data.challanDate || existingChallan.challanDate,
      vehicleNo: data.vehicleNo !== undefined ? data.vehicleNo : existingChallan.vehicleNo,
      transportMode: data.transportMode || existingChallan.transportMode,
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
      notes: data.notes !== undefined ? data.notes : existingChallan.notes,
    });

    return updatedChallan;
  }
}

const deliveryChallanService = new DeliveryChallanService();
export default deliveryChallanService;
