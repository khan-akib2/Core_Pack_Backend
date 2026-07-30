import BaseRepository from './BaseRepository.js';
import DeliveryChallan from '../models/DeliveryChallan.js';

class DeliveryChallanRepository extends BaseRepository {
  constructor() {
    super(DeliveryChallan);
  }
}

const deliveryChallanRepository = new DeliveryChallanRepository();
export default deliveryChallanRepository;
