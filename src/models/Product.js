import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const PRODUCT_CATEGORIES = [
  'Wooden Packaging Boxes',
  'Corrugated Boxes',
  'Wooden Pallets',
  'Export Boxes',
  'Industrial Packaging Solutions'
];

export const PRODUCT_UNITS = [
  'Pcs',
  'Boxes',
  'Pallets',
  'Sets',
  'Kg',
  'SqFt',
  'Meters'
];

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  _id: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('id');
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sku: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Wooden Packaging Boxes'
  },
  hsnCode: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '44151000'
  },
  gstRate: {
    type: DataTypes.FLOAT,
    defaultValue: 5
  },
  defaultRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'Pcs'
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'products'
});

export default Product;
