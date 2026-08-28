import invoiceRepository from '../repositories/InvoiceRepository.js';
import customerRepository from '../repositories/CustomerRepository.js';
import companyRepository from '../repositories/CompanyRepository.js';
import quotationRepository from '../repositories/QuotationRepository.js';
import deliveryChallanRepository from '../repositories/DeliveryChallanRepository.js';
import counterService from './CounterService.js';
import NumberToWordsService from './NumberToWordsService.js';

class InvoiceService {
  async createInvoice(data, userId) {
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
        name: item.name || 'Wooden Packaging Solution',
        hsnCode: item.hsnCode || '44151000',
        qty,
        rate,
        discount,
        unit: item.unit || 'Pcs',
        taxRate,
        taxableAmount,
        boxSize: item.boxSize || '',
        palletSize: item.palletSize || '',
        cgst,
        sgst,
        igst,
        totalAmount: taxableAmount + cgst + sgst + igst
      };
    });

    const transportationCharges = Number(data.transportationCharges || 0);
    const amountBeforeTax = subtotal + transportationCharges;
    
    const commonTaxRate = items.length > 0 ? Number(items[0].taxRate || 18) : 18;
    if (isInterstate) {
      igstTotal = (amountBeforeTax * commonTaxRate) / 100;
    } else {
      cgstTotal = (amountBeforeTax * (commonTaxRate / 2)) / 100;
      sgstTotal = (amountBeforeTax * (commonTaxRate / 2)) / 100;
    }
    
    const totalTax = isInterstate ? igstTotal : (cgstTotal + sgstTotal);
    const grandTotalCalculated = amountBeforeTax + totalTax;

    const roundOff = data.roundOff !== undefined ? Number(data.roundOff) : Math.round(grandTotalCalculated) - grandTotalCalculated;
    const grandTotal = Math.round(grandTotalCalculated + roundOff);

    const amountInWords = NumberToWordsService.convert(grandTotal);

    let invoiceNumber;
    if (data.customInvoiceNumber && data.customInvoiceNumber.trim() !== '') {
      invoiceNumber = data.customInvoiceNumber.trim();
      const existingInvoice = await invoiceRepository.findOne({ invoiceNumber }, { paranoid: false });
      if (existingInvoice) {
        if (existingInvoice.deletedAt) {
          existingInvoice.invoiceNumber = `${existingInvoice.invoiceNumber}_deleted_${Date.now()}`;
          await existingInvoice.save({ paranoid: false });
        } else {
          throw new Error('Invoice number already exists');
        }
      }
    } else if (data.invoiceNumber && data.invoiceNumber.trim() !== '') {
      invoiceNumber = data.invoiceNumber.trim();
      const existingInvoice = await invoiceRepository.findOne({ invoiceNumber }, { paranoid: false });
      if (existingInvoice) {
        invoiceNumber = await counterService.generateInvoiceNumber();
      }
    } else {
      invoiceNumber = await counterService.generateInvoiceNumber();
    }

    const formattedTerms = Array.isArray(data.terms)
      ? data.terms
      : (typeof data.terms === 'string' ? [data.terms] : (Array.isArray(company.termsAndConditions) ? company.termsAndConditions : [String(company.termsAndConditions || '')]));

    const invoice = await invoiceRepository.create({
      invoiceNumber,
      invoiceDate: data.invoiceDate || new Date(),
      dueDate: data.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      challanNumber: data.challanNumber || '',
      challanDate: data.challanDate ? new Date(data.challanDate) : undefined,
      vehicleNo: data.vehicleNo || '',
      transportMode: data.transportMode || 'Road',
      placeOfSupply: customer.billingAddress?.state || company.address?.state || 'Maharashtra',
      isReverseCharge: data.isReverseCharge || false,
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
      transportationCharges,
      discountTotal: totalDiscount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      isInterstate,
      roundOff,
      grandTotal,
      paidAmount: 0,
      dueAmount: grandTotal,
      balanceAmount: grandTotal,
      paymentStatus: 'Unpaid',
      payments: [],
      amountInWords,
      status: 'Issued',
      notes: data.notes || '',
      terms: formattedTerms,
      createdBy: userId
    });

    if (data.quotationId) {
      await quotationRepository.update(data.quotationId, { status: 'Accepted' });
    }
    if (data.challanId) {
      await deliveryChallanRepository.update(data.challanId, { status: 'Invoiced' });
    }

    return invoice;
  }

  async updateInvoice(id, data, userId) {
    const existingInvoice = await invoiceRepository.findById(id);
    if (!existingInvoice) throw new Error('Invoice not found');

    const customer = await customerRepository.findById(data.customerId || existingInvoice.customerId);
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
        name: item.name || 'Wooden Packaging Solution',
        hsnCode: item.hsnCode || '44151000',
        qty,
        rate,
        discount,
        unit: item.unit || 'Pcs',
        taxRate,
        taxableAmount,
        boxSize: item.boxSize || '',
        palletSize: item.palletSize || '',
        cgst,
        sgst,
        igst,
        totalAmount: taxableAmount + cgst + sgst + igst
      };
    });

    const transportationCharges = Number(data.transportationCharges || 0);
    const amountBeforeTax = subtotal + transportationCharges;
    
    const commonTaxRate = items.length > 0 ? Number(items[0].taxRate || 18) : 18;
    if (isInterstate) {
      igstTotal = (amountBeforeTax * commonTaxRate) / 100;
    } else {
      cgstTotal = (amountBeforeTax * (commonTaxRate / 2)) / 100;
      sgstTotal = (amountBeforeTax * (commonTaxRate / 2)) / 100;
    }
    
    const totalTax = isInterstate ? igstTotal : (cgstTotal + sgstTotal);
    const grandTotalCalculated = amountBeforeTax + totalTax;

    const roundOff = data.roundOff !== undefined ? Number(data.roundOff) : Math.round(grandTotalCalculated) - grandTotalCalculated;
    const grandTotal = Math.round(grandTotalCalculated + roundOff);

    const amountInWords = NumberToWordsService.convert(grandTotal);

    let formattedTerms = existingInvoice.terms;
    if (data.terms) {
      formattedTerms = Array.isArray(data.terms)
        ? data.terms
        : (typeof data.terms === 'string' ? [data.terms] : formattedTerms);
    }

    const currentPaid = Number(existingInvoice.paidAmount || 0);
    const newDueAmount = Math.max(0, grandTotal - currentPaid);

    let paymentStatus = 'Unpaid';
    if (newDueAmount <= 0) {
      paymentStatus = 'Paid';
    } else if (currentPaid > 0) {
      paymentStatus = 'Partial';
    }

    let invoiceNumber = existingInvoice.invoiceNumber;
    if (data.customInvoiceNumber && data.customInvoiceNumber.trim() !== '' && data.customInvoiceNumber.trim() !== invoiceNumber) {
      const existing = await invoiceRepository.findOne({ invoiceNumber: data.customInvoiceNumber.trim() }, { paranoid: false });
      if (existing) {
        if (existing.deletedAt) {
          existing.invoiceNumber = `${existing.invoiceNumber}_deleted_${Date.now()}`;
          await existing.save({ paranoid: false });
        } else {
          throw new Error('Invoice number already exists');
        }
      }
      invoiceNumber = data.customInvoiceNumber.trim();
    }

    const updatedInvoice = await invoiceRepository.update(id, {
      invoiceNumber,
      invoiceDate: data.invoiceDate || existingInvoice.invoiceDate,
      dueDate: data.dueDate || existingInvoice.dueDate,
      challanNumber: data.challanNumber !== undefined ? data.challanNumber : existingInvoice.challanNumber,
      challanDate: data.challanDate ? new Date(data.challanDate) : existingInvoice.challanDate,
      vehicleNo: data.vehicleNo !== undefined ? data.vehicleNo : existingInvoice.vehicleNo,
      transportMode: data.transportMode || existingInvoice.transportMode,
      placeOfSupply: customer.billingAddress?.state || company.address?.state || 'Maharashtra',
      isReverseCharge: data.isReverseCharge !== undefined ? data.isReverseCharge : existingInvoice.isReverseCharge,
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
      transportationCharges,
      discountTotal: totalDiscount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      isInterstate,
      roundOff,
      grandTotal,
      dueAmount: newDueAmount,
      balanceAmount: newDueAmount,
      paymentStatus,
      amountInWords,
      notes: data.notes !== undefined ? data.notes : existingInvoice.notes,
      terms: formattedTerms,
    });

    return updatedInvoice;
  }

  async recordPayment(invoiceId, paymentData) {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const amountPaid = Number(paymentData.amount);
    const currentPaid = Number(invoice.paidAmount || 0);
    const grandTotal = Number(invoice.grandTotal || 0);

    const newPaidAmount = currentPaid + amountPaid;
    const newDueAmount = Math.max(0, grandTotal - newPaidAmount);

    let paymentStatus = 'Unpaid';
    if (newDueAmount <= 0) {
      paymentStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'Partial';
    }

    const existingPayments = Array.isArray(invoice.payments) ? invoice.payments : [];

    const updatedPayments = [
      ...existingPayments,
      {
        paymentDate: paymentData.paymentDate || new Date(),
        amount: amountPaid,
        mode: paymentData.mode || 'Bank Transfer',
        referenceNo: paymentData.referenceNo || '',
        notes: paymentData.notes || ''
      }
    ];

    return await invoiceRepository.update(invoiceId, {
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      balanceAmount: newDueAmount,
      paymentStatus,
      payments: updatedPayments
    });
  }
}

const invoiceService = new InvoiceService();
export default invoiceService;
