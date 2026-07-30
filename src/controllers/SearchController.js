import customerRepository from '../repositories/CustomerRepository.js';
import productRepository from '../repositories/ProductRepository.js';
import invoiceRepository from '../repositories/InvoiceRepository.js';
import quotationRepository from '../repositories/QuotationRepository.js';
import deliveryChallanRepository from '../repositories/DeliveryChallanRepository.js';

export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { customers: [], products: [], invoices: [], quotations: [], challans: [] } });
    }

    const regex = new RegExp(q, 'i');

    const [customersRes, productsRes, invoicesRes, quotationsRes, challansRes] = await Promise.all([
      customerRepository.find({ $or: [{ name: regex }, { companyName: regex }, { phone: regex }] }, { limit: 5 }),
      productRepository.find({ $or: [{ name: regex }, { sku: regex }, { hsnCode: regex }] }, { limit: 5 }),
      invoiceRepository.find({ $or: [{ invoiceNumber: regex }, { 'customerSnapshot.companyName': regex }] }, { limit: 5 }),
      quotationRepository.find({ $or: [{ quoteNumber: regex }, { 'customerSnapshot.companyName': regex }] }, { limit: 5 }),
      deliveryChallanRepository.find({ $or: [{ challanNumber: regex }, { vehicleNo: regex }] }, { limit: 5 })
    ]);

    res.json({
      success: true,
      data: {
        customers: customersRes.data || [],
        products: productsRes.data || [],
        invoices: invoicesRes.data || [],
        quotations: quotationsRes.data || [],
        challans: challansRes.data || []
      }
    });
  } catch (error) {
    next(error);
  }
};
