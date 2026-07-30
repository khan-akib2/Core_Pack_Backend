import BaseRepository from './BaseRepository.js';
import Invoice from '../models/Invoice.js';

class InvoiceRepository extends BaseRepository {
  constructor() {
    super(Invoice);
  }
}

const invoiceRepository = new InvoiceRepository();
export default invoiceRepository;
