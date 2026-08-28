import { Op } from 'sequelize';
import BaseRepository from './BaseRepository.js';
import Product from '../models/Product.js';

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  async searchProducts(queryStr) {
    if (!queryStr) return [];
    return await this.model.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${queryStr}%` } },
          { hsnCode: { [Op.like]: `%${queryStr}%` } },
          { category: { [Op.like]: `%${queryStr}%` } },
          { sku: { [Op.like]: `%${queryStr}%` } }
        ],
        isActive: true
      },
      limit: 20
    });
  }
}

const productRepository = new ProductRepository();
export default productRepository;
