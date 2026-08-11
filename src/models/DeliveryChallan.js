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
  vehicleNo: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
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
  paranoid: true,
  tableName: 'delivery_challans',
  hooks: {
    beforeDestroy: async (instance, options) => {
      const suffix = `_deleted_${Date.now()}`;
      instance.challanNumber = `${instance.challanNumber}${suffix}`;
      await instance.save({ transaction: options.transaction, paranoid: false });
    }
  }
});

export default DeliveryChallan;
