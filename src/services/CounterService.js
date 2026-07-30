import Counter from '../models/Counter.js';
import Invoice from '../models/Invoice.js';
import DeliveryChallan from '../models/DeliveryChallan.js';
import Quotation from '../models/Quotation.js';

class CounterService {
  getFiscalYear() {
    const year = new Date().getFullYear();
    const nextYear = (year + 1).toString().slice(2);
    return `${year}-${nextYear}`;
  }

  async getNextSequence(sequenceType) {
    const fiscalYear = this.getFiscalYear();
    const sequenceName = `${sequenceType}_${fiscalYear}`;

    let [counter] = await Counter.findOrCreate({
      where: { name: sequenceName },
      defaults: { name: sequenceName, seq: 0 }
    });

    let nextSeq = counter.seq + 1;
    if (nextSeq >= 1000) {
      nextSeq = nextSeq % 1000;
      if (nextSeq === 0) nextSeq = 1;
    }

    let model = null;
    let field = 'invoiceNumber';
    if (sequenceType === 'invoice') {
      model = Invoice;
      field = 'invoiceNumber';
    } else if (sequenceType === 'challan') {
      model = DeliveryChallan;
      field = 'challanNumber';
    } else if (sequenceType === 'quote') {
      model = Quotation;
      field = 'quoteNumber';
    }

    let paddedSeq = nextSeq.toString().padStart(3, '0');
    if (model) {
      let exists = await model.findOne({ where: { [field]: paddedSeq } });
      while (exists) {
        nextSeq++;
        paddedSeq = nextSeq.toString().padStart(3, '0');
        exists = await model.findOne({ where: { [field]: paddedSeq } });
      }
    }

    await counter.update({ seq: nextSeq });
    return { seq: nextSeq, fiscalYear, paddedSeq };
  }

  async getNextPreview(type = 'invoice') {
    const fiscalYear = this.getFiscalYear();
    const seqType = type === 'challan' ? 'challan' : type === 'quote' ? 'quote' : 'invoice';
    const sequenceName = `${seqType}_${fiscalYear}`;

    const counter = await Counter.findByPk(sequenceName);
    let nextSeq = (counter ? counter.seq : 0) + 1;
    if (nextSeq >= 1000) {
      nextSeq = nextSeq % 1000;
      if (nextSeq === 0) nextSeq = 1;
    }

    let model = null;
    let field = 'invoiceNumber';
    if (seqType === 'invoice') {
      model = Invoice;
      field = 'invoiceNumber';
    } else if (seqType === 'challan') {
      model = DeliveryChallan;
      field = 'challanNumber';
    } else if (seqType === 'quote') {
      model = Quotation;
      field = 'quoteNumber';
    }

    let paddedSeq = nextSeq.toString().padStart(3, '0');
    if (model) {
      let exists = await model.findOne({ where: { [field]: paddedSeq } });
      while (exists) {
        nextSeq++;
        paddedSeq = nextSeq.toString().padStart(3, '0');
        exists = await model.findOne({ where: { [field]: paddedSeq } });
      }
    }

    return paddedSeq;
  }

  async generateInvoiceNumber() {
    const { paddedSeq } = await this.getNextSequence('invoice');
    return paddedSeq;
  }

  async generateChallanNumber() {
    const { paddedSeq } = await this.getNextSequence('challan');
    return paddedSeq;
  }

  async generateQuotationNumber() {
    const { paddedSeq } = await this.getNextSequence('quote');
    return paddedSeq;
  }
}

const counterService = new CounterService();
export default counterService;
