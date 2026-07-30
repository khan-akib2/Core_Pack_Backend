import BaseRepository from './BaseRepository.js';
import Product from '../models/Product.js';

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  async searchProducts(queryStr) {
    if (!queryStr) return [];
    return await this.model.find({
      $or: [
        { name: { $regex: queryStr, $options: 'i' } },
        { hsnCode: { $regex: queryStr, $options: 'i' } },
        { category: { $regex: queryStr, $options: 'i' } },
        { sku: { $regex: queryStr, $options: 'i' } }
      ],
      isActive: true
    }).limit(20).exec();
  }
}

const productRepository = new ProductRepository();
export default productRepository;
