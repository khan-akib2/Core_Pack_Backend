import BaseRepository from './BaseRepository.js';
import Quotation from '../models/Quotation.js';

class QuotationRepository extends BaseRepository {
  constructor() {
    super(Quotation);
  }
}

const quotationRepository = new QuotationRepository();
export default quotationRepository;
