import { Op } from 'sequelize';

function transformQueryVal(val) {
  if (val === null || val === undefined) return val;
  if (val instanceof Date) return val;

  if (typeof val === 'object' && !Array.isArray(val)) {
    const res = {};
    if (val.$ne !== undefined) res[Op.ne] = val.$ne;
    if (val.$eq !== undefined) res[Op.eq] = val.$eq;
    if (val.$gte !== undefined) res[Op.gte] = val.$gte;
    if (val.$lte !== undefined) res[Op.lte] = val.$lte;
    if (val.$gt !== undefined) res[Op.gt] = val.$gt;
    if (val.$lt !== undefined) res[Op.lt] = val.$lt;
    if (val.$in !== undefined) res[Op.in] = val.$in;
    if (val.$nin !== undefined) res[Op.notIn] = val.$nin;
    if (val.$regex !== undefined) res[Op.like] = `%${val.$regex}%`;
    
    if (Object.getOwnPropertySymbols(res).length > 0 || Object.keys(res).length > 0) {
      return res;
    }
  }
  return val;
}

function buildSequelizeWhere(filter = {}) {
  if (!filter || typeof filter !== 'object') return {};
  const where = {};

  Object.keys(filter).forEach(key => {
    const val = filter[key];

    if (key === '$or' && Array.isArray(val)) {
      where[Op.or] = val.map(item => buildSequelizeWhere(item));
      return;
    }

    if (key === '$and' && Array.isArray(val)) {
      where[Op.and] = val.map(item => buildSequelizeWhere(item));
      return;
    }

    const normKey = (key === '_id' || key === 'id') ? 'id' : key;

    // Ignore MongoDB nested field notation like 'customerSnapshot.companyName'
    if (normKey.includes('.')) {
      return;
    }

    where[normKey] = transformQueryVal(val);
  });

  return where;
}

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async findById(id) {
    if (!id) return null;
    return await this.model.findByPk(id);
  }

  async findOne(filter = {}) {
    const where = buildSequelizeWhere(filter);
    return await this.model.findOne({ where });
  }

  async find(filter = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = [['createdAt', 'DESC']]
    } = options;

    const offset = (Number(page) - 1) * Number(limit);
    const where = buildSequelizeWhere(filter);

    let order = [['createdAt', 'DESC']];
    if (Array.isArray(sort)) {
      order = sort;
    } else if (typeof sort === 'object') {
      order = Object.keys(sort).map(k => [k, sort[k] === -1 || sort[k] === 'desc' ? 'DESC' : 'ASC']);
    }

    const { rows: data, count: total } = await this.model.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order
    });

    return {
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    };
  }

  async updateById(id, updateData) {
    const doc = await this.findById(id);
    if (!doc) return null;
    await doc.update(updateData);
    return doc;
  }

  async update(id, updateData) {
    return await this.updateById(id, updateData);
  }

  async deleteById(id) {
    const doc = await this.findById(id);
    if (!doc) return null;
    await doc.destroy();
    return doc;
  }

  async delete(id) {
    return await this.deleteById(id);
  }
}

export default BaseRepository;
