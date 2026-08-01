import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Invoice = sequelize.define('Invoice', {
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
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  invoiceDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  dueDate: {
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
  challanNumber: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  challanDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  vehicleNo: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  transportDetails: {
    type: DataTypes.TEXT,
    get() {
      const raw = this.getDataValue('transportDetails');
      try { return JSON.parse(raw || '{}'); } catch (e) { return {}; }
    },
    set(val) {
      this.setDataValue('transportDetails', JSON.stringify(val || {}));
    }
  },
  transportMode: {
    type: DataTypes.STRING,
    defaultValue: 'Road'
  },
  placeOfSupply: {
    type: DataTypes.STRING,
    defaultValue: 'Maharashtra'
  },
  isReverseCharge: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  discountTotal: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  transportationCharges: {
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
  isInterstate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  roundOff: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  grandTotal: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  amountInWords: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  paidAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  dueAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  balanceAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  paymentStatus: {
    type: DataTypes.STRING,
    defaultValue: 'Unpaid'
  },
  payments: {
    type: DataTypes.TEXT,
    get() {
      const raw = this.getDataValue('payments');
      try { return JSON.parse(raw || '[]'); } catch (e) { return []; }
    },
    set(val) {
      this.setDataValue('payments', JSON.stringify(val || []));
    }
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Issued'
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
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true,
  tableName: 'invoices'
});

export default Invoice;
