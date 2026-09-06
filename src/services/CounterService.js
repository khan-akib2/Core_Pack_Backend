import { Op } from 'sequelize';
import Counter from '../models/Counter.js';
import Invoice from '../models/Invoice.js';
import DeliveryChallan from '../models/DeliveryChallan.js';
import Quotation from '../models/Quotation.js';

class CounterService {
  getFiscalYear() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    // Indian FY: April (3) to March (2)
    if (month < 3) {
      return `${year - 1}-${year.toString().slice(2)}`;
    }
    return `${year}-${(year + 1).toString().slice(2)}`;
  }

  getSequenceName(sequenceType) {
    const fiscalYear = this.getFiscalYear();
    return `${sequenceType}_${fiscalYear}`;
  }

  getFiscalYearDateRange() {
    const now = new Date();
    const month = now.getMonth();
    let year = now.getFullYear();
    if (month < 3) {
      year = year - 1;
    }
    const startDate = new Date(year, 3, 1);
    const endDate = new Date(year + 1, 3, 1);
    return { startDate, endDate };
  }

  async extractMaxSequence(model, field) {
    const { startDate, endDate } = this.getFiscalYearDateRange();
    const records = await model.findAll({
      attributes: [field],
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lt]: endDate
        }
      },
      paranoid: false // Include deleted to find true max
    });
    
    let max = 0;
    
    for (const record of records) {
      const numStr = record[field];
      if (!numStr) continue;
      
      const cleanFormat = numStr.split('_deleted_')[0];
      const match = cleanFormat.match(/(\d+)$/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > max) {
          max = seq;
        }
      }
    }
    
    return max;
  }
  
  async getFormatSample(model, field) {
    if (!model) return null;
    const latest = await model.findOne({
      attributes: [field],
      order: [['createdAt', 'DESC']],
      paranoid: false
    });
    if (latest && latest[field]) {
      return latest[field].split('_deleted_')[0];
    }
    return null;
  }

  formatSequence(seq, sequenceType, formatSample) {
    const pad = seq.toString().padStart(3, '0'); // Defaults to 3 digits based on prod data
    
    if (formatSample) {
      // Replace the numeric part at the end of the format sample with the new padded sequence
      return formatSample.replace(/\d+$/, seq.toString().padStart(formatSample.match(/(\d+)$/)[1].length, '0'));
    }
    
    return pad;
  }

  async getNextSequence(sequenceType) {
    const sequenceName = this.getSequenceName(sequenceType);

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

    // Try to find the counter
    let counter = await Counter.findOne({ where: { name: sequenceName } });
    
    // Self-heal: If counter is ahead of actual DB records (e.g. from failed creations), reset it
    if (counter && model) {
      const max = await this.extractMaxSequence(model, field);
      if (counter.seq > max) {
        counter.seq = max;
        await counter.save();
      }
    }

    let nextSeq = 1;
    let formatSample = await this.getFormatSample(model, field);

    if (!counter && model) {
      // Recovery logic: Scoped to current FY
      const max = await this.extractMaxSequence(model, field);
      nextSeq = max + 1;
      
      try {
        counter = await Counter.create({
          name: sequenceName,
          seq: nextSeq
        });
      } catch (err) {
        // Race condition: another request created the counter
        counter = await Counter.findOne({ where: { name: sequenceName } });
        await Counter.increment('seq', { where: { name: sequenceName } });
        await counter.reload();
        nextSeq = counter.seq;
      }
    } else if (counter) {
      // Atomic increment for existing counter
      await Counter.increment('seq', { where: { name: sequenceName } });
      await counter.reload();
      nextSeq = counter.seq;
    }

    if (nextSeq >= 100000) {
      nextSeq = nextSeq % 100000;
      if (nextSeq === 0) nextSeq = 1;
      if (counter) await counter.update({ seq: nextSeq });
    }

    let fullSeq = this.formatSequence(nextSeq, sequenceType, formatSample);

    // Collision protection (safety net for DB uniqueness)
    if (model) {
      let exists = await model.findOne({ where: { [field]: fullSeq }, paranoid: false });
      while (exists) {
        nextSeq++;
        if (counter) await counter.update({ seq: nextSeq });
        fullSeq = this.formatSequence(nextSeq, sequenceType, formatSample);
        exists = await model.findOne({ where: { [field]: fullSeq }, paranoid: false });
      }
    }
    
    return { seq: nextSeq, fiscalYear: this.getFiscalYear(), fullSeq };
  }

  async getNextPreview(type = 'invoice') {
    const seqType = type === 'challan' ? 'challan' : type === 'quote' ? 'quote' : 'invoice';
    const sequenceName = this.getSequenceName(seqType);

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

    let counter = await Counter.findOne({ where: { name: sequenceName } });
    
    // Self-heal: If counter is ahead of actual DB records
    if (counter && model) {
      const max = await this.extractMaxSequence(model, field);
      if (counter.seq > max) {
        counter.seq = max;
        await counter.save();
      }
    }

    let formatSample = await this.getFormatSample(model, field);
    
    let nextSeq = 1;
    if (!counter && model) {
      const max = await this.extractMaxSequence(model, field);
      nextSeq = max + 1;
    } else if (counter) {
      nextSeq = counter.seq + 1;
    }

    if (nextSeq >= 100000) {
      nextSeq = nextSeq % 100000;
      if (nextSeq === 0) nextSeq = 1;
    }

    let fullSeq = this.formatSequence(nextSeq, seqType, formatSample);

    if (model) {
      let exists = await model.findOne({ where: { [field]: fullSeq }, paranoid: false });
      while (exists) {
        nextSeq++;
        fullSeq = this.formatSequence(nextSeq, seqType, formatSample);
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
