import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Payment = sequelize.define('Payment', {
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
  invoiceId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  mode: {
    type: DataTypes.STRING,
    defaultValue: 'Bank Transfer'
  },
  referenceNo: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true,
  tableName: 'payments'
});

export default Payment;
