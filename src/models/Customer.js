import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Customer = sequelize.define('Customer', {
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
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gstin: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  email: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  billingAddress: {
    type: DataTypes.TEXT,
    get() {
      const raw = this.getDataValue('billingAddress');
      try {
        return JSON.parse(raw || '{}');
      } catch (e) {
        return { street: '', state: 'Maharashtra', stateCode: '27' };
      }
    },
    set(val) {
      this.setDataValue('billingAddress', JSON.stringify(val || {}));
    }
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    get() {
      const raw = this.getDataValue('shippingAddress');
      try { return JSON.parse(raw || '{}'); } catch (e) { return {}; }
    },
    set(val) {
      this.setDataValue('shippingAddress', JSON.stringify(val || {}));
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  paranoid: true,
  tableName: 'customers'
});

export default Customer;
