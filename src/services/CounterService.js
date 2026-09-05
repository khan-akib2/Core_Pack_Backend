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
    if (nextSeq >= 10000) {
      nextSeq = nextSeq % 10000;
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

    const getFullSeq = (seq) => {
      const pad = seq.toString().padStart(4, '0');
      if (sequenceType === 'invoice') return `INV-${fiscalYear}-${pad}`;
      if (sequenceType === 'challan') return `CH-${fiscalYear}-${pad}`;
      if (sequenceType === 'quote') return `QT-${fiscalYear}-${pad}`;
      return pad;
    };

    let fullSeq = getFullSeq(nextSeq);
    if (model) {
      let exists = await model.findOne({ where: { [field]: fullSeq }, paranoid: false });
      while (exists) {
        nextSeq++;
        fullSeq = getFullSeq(nextSeq);
        exists = await model.findOne({ where: { [field]: fullSeq }, paranoid: false });
      }
    }

    await counter.update({ seq: nextSeq });
    return { seq: nextSeq, fiscalYear, fullSeq };
  }

  async getNextPreview(type = 'invoice') {
    const fiscalYear = this.getFiscalYear();
    const seqType = type === 'challan' ? 'challan' : type === 'quote' ? 'quote' : 'invoice';
    const sequenceName = `${seqType}_${fiscalYear}`;

    const counter = await Counter.findByPk(sequenceName);
    let nextSeq = (counter ? counter.seq : 0) + 1;
    if (nextSeq >= 10000) {
      nextSeq = nextSeq % 10000;
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

    const getFullSeq = (seq) => {
      const pad = seq.toString().padStart(4, '0');
      if (seqType === 'invoice') return `INV-${fiscalYear}-${pad}`;
      if (seqType === 'challan') return `CH-${fiscalYear}-${pad}`;
      if (seqType === 'quote') return `QT-${fiscalYear}-${pad}`;
      return pad;
    };

    let fullSeq = getFullSeq(nextSeq);
    if (model) {
      let exists = await model.findOne({ where: { [field]: fullSeq }, paranoid: false });
      while (exists) {
        nextSeq++;
        fullSeq = getFullSeq(nextSeq);
        exists = await model.findOne({ where: { [field]: fullSeq }, paranoid: false });
      }
    }

    return fullSeq;
  }

  async generateInvoiceNumber() {
    const { fullSeq } = await this.getNextSequence('invoice');
    return fullSeq;
  }

  async generateChallanNumber() {
    const { fullSeq } = await this.getNextSequence('challan');
    return fullSeq;
  }

  async generateQuotationNumber() {
    const { fullSeq } = await this.getNextSequence('quote');
    return fullSeq;
  }
}

const counterService = new CounterService();
export default counterService;
