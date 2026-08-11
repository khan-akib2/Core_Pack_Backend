import quotationRepository from '../repositories/QuotationRepository.js';
import customerRepository from '../repositories/CustomerRepository.js';
import companyRepository from '../repositories/CompanyRepository.js';
import counterService from './CounterService.js';
import NumberToWordsService from './NumberToWordsService.js';

class QuotationService {
  async createQuotation(data, userId) {
    const customer = await customerRepository.findById(data.customerId);
    if (!customer) throw new Error('Customer not found');

    const company = await companyRepository.getSettings();

    const isInterstate = customer.billingAddress?.stateCode !== company.address?.stateCode;

    let subtotal = 0;
    let totalDiscount = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const items = data.items.map(item => {
      const qty = Number(item.qty);
      const rate = Number(item.rate);
      const discount = Number(item.discount || 0);
      const taxRate = Number(item.taxRate || 18);

      const grossAmount = qty * rate;
      const taxableAmount = grossAmount - discount;

      let cgst = 0, sgst = 0, igst = 0;

      if (isInterstate) {
        igst = (taxableAmount * taxRate) / 100;
        igstTotal += igst;
      } else {
        cgst = (taxableAmount * (taxRate / 2)) / 100;
        sgst = (taxableAmount * (taxRate / 2)) / 100;
        cgstTotal += cgst;
        sgstTotal += sgst;
      }

      subtotal += taxableAmount;
      totalDiscount += discount;

      return {
        productId: (item.productId && String(item.productId).trim() !== '') ? item.productId : undefined,
        name: item.name || 'Packaging Solution',
        hsnCode: item.hsnCode || '44151000',
        qty,
        rate,
        discount,
        unit: item.unit || 'Pcs',
        taxRate,
        taxableAmount,
        cgst,
        sgst,
        igst,
        totalAmount: taxableAmount + cgst + sgst + igst
      };
    });

    const totalTax = isInterstate ? igstTotal : (cgstTotal + sgstTotal);
    const grandTotal = Math.round(subtotal + totalTax);
    const amountInWords = NumberToWordsService.convert(grandTotal);
    let quoteNumber;
    if (data.quoteNumber && String(data.quoteNumber).trim() !== '') {
      quoteNumber = String(data.quoteNumber).trim();
      const existing = await quotationRepository.findOne({ quoteNumber }, { paranoid: false });
      if (existing) {
        if (existing.deletedAt) {
          existing.quoteNumber = `${existing.quoteNumber}_deleted_${Date.now()}`;
          await existing.save({ paranoid: false });
        } else {
          throw new Error('Quotation number already exists');
        }
      }
    } else {
      quoteNumber = await counterService.generateQuotationNumber();
      const existingQuote = await quotationRepository.findOne({ quoteNumber }, { paranoid: false });
      if (existingQuote) {
        quoteNumber = await counterService.generateQuotationNumber();
      }
    }

    const formattedTerms = Array.isArray(data.terms)
      ? data.terms
      : (typeof data.terms === 'string' ? [data.terms] : (Array.isArray(company.termsAndConditions) ? company.termsAndConditions : [String(company.termsAndConditions || '')]));

    const quotation = await quotationRepository.create({
      quoteNumber,
      quoteDate: data.quoteDate || new Date(),
      validUntil: data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      customerId: customer._id,
      customerSnapshot: {
        name: customer.name,
        companyName: customer.companyName,
        gstin: customer.gstin,
        pan: customer.pan,
        email: customer.email,
        phone: customer.phone,
        billingAddress: customer.billingAddress,
        shippingAddress: customer.shippingAddress
      },
      items,
      subtotal,
      discountTotal: totalDiscount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      isInterstate,
      grandTotal,
      amountInWords,
      status: 'Sent',
      notes: data.notes || '',
      terms: formattedTerms,
      createdBy: userId
    });

    return quotation;
  }

  async updateQuotation(id, data, userId) {
    const existingQuote = await quotationRepository.findById(id);
    if (!existingQuote) throw new Error('Quotation not found');

    const customer = await customerRepository.findById(data.customerId || existingQuote.customerId);
    if (!customer) throw new Error('Customer not found');

    const company = await companyRepository.getSettings();

    const isInterstate = customer.billingAddress?.stateCode !== company.address?.stateCode;

    let subtotal = 0;
    let totalDiscount = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const items = data.items.map(item => {
      const qty = Number(item.qty);
      const rate = Number(item.rate);
      const discount = Number(item.discount || 0);
      const taxRate = Number(item.taxRate || 18);

      const grossAmount = qty * rate;
      const taxableAmount = grossAmount - discount;

      let cgst = 0, sgst = 0, igst = 0;

      if (isInterstate) {
        igst = (taxableAmount * taxRate) / 100;
        igstTotal += igst;
      } else {
        cgst = (taxableAmount * (taxRate / 2)) / 100;
        sgst = (taxableAmount * (taxRate / 2)) / 100;
        cgstTotal += cgst;
        sgstTotal += sgst;
      }

      subtotal += taxableAmount;
      totalDiscount += discount;

      return {
        productId: (item.productId && String(item.productId).trim() !== '') ? item.productId : undefined,
        name: item.name || 'Packaging Solution',
        hsnCode: item.hsnCode || '44151000',
        qty,
        rate,
        discount,
        unit: item.unit || 'Pcs',
        taxRate,
        taxableAmount,
        cgst,
        sgst,
        igst,
        totalAmount: taxableAmount + cgst + sgst + igst
      };
    });

    const totalTax = isInterstate ? igstTotal : (cgstTotal + sgstTotal);
    const grandTotal = Math.round(subtotal + totalTax);
    const amountInWords = NumberToWordsService.convert(grandTotal);

    let quoteNumber = existingQuote.quoteNumber;
    if (data.customQuoteNumber && data.customQuoteNumber.trim() !== '' && data.customQuoteNumber.trim() !== quoteNumber) {
      const existing = await quotationRepository.findOne({ quoteNumber: data.customQuoteNumber.trim() }, { paranoid: false });
      if (existing) {
        if (existing.deletedAt) {
          existing.quoteNumber = `${existing.quoteNumber}_deleted_${Date.now()}`;
          await existing.save({ paranoid: false });
        } else {
          throw new Error('Quotation number already exists');
        }
      }
      quoteNumber = data.customQuoteNumber.trim();
    }

    let formattedTerms = existingQuote.terms;
    if (data.terms) {
      formattedTerms = Array.isArray(data.terms)
        ? data.terms
        : (typeof data.terms === 'string' ? [data.terms] : formattedTerms);
    }

    const updatedQuotation = await quotationRepository.update(id, {
      quoteNumber,
      quoteDate: data.quoteDate || existingQuote.quoteDate,
      validUntil: data.validUntil || existingQuote.validUntil,
      customerId: customer._id,
      customerSnapshot: {
        name: customer.name,
        companyName: customer.companyName,
        gstin: customer.gstin,
        pan: customer.pan,
        email: customer.email,
        phone: customer.phone,
        billingAddress: customer.billingAddress,
        shippingAddress: customer.shippingAddress
      },
      items,
      subtotal,
      discountTotal: totalDiscount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      isInterstate,
      grandTotal,
      amountInWords,
      notes: data.notes !== undefined ? data.notes : existingQuote.notes,
      terms: formattedTerms,
    });

    return updatedQuotation;
  }
}

const quotationService = new QuotationService();
export default quotationService;
