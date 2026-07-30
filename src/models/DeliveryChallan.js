import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const DeliveryChallan = sequelize.define('DeliveryChallan', {
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
  challanNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  challanDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
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
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Dispatched'
  },
  remarks: {
    type: DataTypes.TEXT,
    defaultValue: ''
  }
}, {
  timestamps: true,
  tableName: 'delivery_challans'
});

export default DeliveryChallan;
