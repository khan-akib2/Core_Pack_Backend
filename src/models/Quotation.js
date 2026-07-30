import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Quotation = sequelize.define('Quotation', {
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
  quoteNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  quoteDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  validUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  customerSnapshot: {
    type: DataTypes.TEXT,
    get() {
      const raw = this.getDataValue('customerSnapshot');
      try { return JSON.parse(raw || '{}'); } catch (e) { return {}; }
    },
    set(val) {
      this.setDataValue('customerSnapshot', JSON.stringify(val || {}));
    }
  },
  items: {
    type: DataTypes.TEXT,
    get() {
      const raw = this.getDataValue('items');
      try { return JSON.parse(raw || '[]'); } catch (e) { return []; }
    },
    set(val) {
      this.setDataValue('items', JSON.stringify(val || []));
    }
  },
  subtotal: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  cgstTotal: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  sgstTotal: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  igstTotal: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  grandTotal: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Sent'
  },
  terms: {
    type: DataTypes.TEXT,
    get() {
      const raw = this.getDataValue('terms');
      try { return JSON.parse(raw || '[]'); } catch (e) { return []; }
    },
    set(val) {
      this.setDataValue('terms', JSON.stringify(val || []));
    }
  }
}, {
  timestamps: true,
  tableName: 'quotations'
});

export default Quotation;
