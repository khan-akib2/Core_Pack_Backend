import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const CompanySettings = sequelize.define('CompanySettings', {
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
  companyName: {
    type: DataTypes.STRING,
    defaultValue: 'CORE PACK INDIA'
  },
  tagline: {
    type: DataTypes.STRING,
    defaultValue: 'Manufacturers of Wooden & Corrugated Packaging Solutions'
  },
  logoUrl: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  gstin: {
    type: DataTypes.STRING,
    defaultValue: '27AAAAA0000A1Z5'
  },
  email: {
    type: DataTypes.STRING,
    defaultValue: 'info@corepackindia.com'
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: '+91 98765 43210'
  },
  alternatePhone: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  address: {
    type: DataTypes.TEXT,
    get() {
      const raw = this.getDataValue('address');
      try {
        return JSON.parse(raw || '{}');
      } catch (e) {
        return { street: 'Plot No. 42, Industrial Area, Phase II', city: 'Pune', state: 'Maharashtra', stateCode: '27', pincode: '411026' };
      }
    },
    set(val) {
      this.setDataValue('address', JSON.stringify(val || {}));
    }
  },
  bankDetails: {
    type: DataTypes.TEXT,
    get() {
      const raw = this.getDataValue('bankDetails');
      try {
        const parsed = JSON.parse(raw || '{}');
        return {
          ...parsed,
          accountNumber: parsed.accountNumber || parsed.accountNo || '50200012345678',
          accountNo: parsed.accountNo || parsed.accountNumber || '50200012345678',
          ifscCode: parsed.ifscCode || parsed.ifsc || 'HDFC0001234',
          ifsc: parsed.ifsc || parsed.ifscCode || 'HDFC0001234'
        };
      } catch (e) {
        return {
          bankName: 'HDFC Bank Ltd',
          accountName: 'CORE PACK INDIA',
          accountNo: '50200012345678',
          accountNumber: '50200012345678',
          ifsc: 'HDFC0001234',
          ifscCode: 'HDFC0001234',
          branch: 'Chinchwad, Pune'
        };
      }
    },
    set(val) {
      this.setDataValue('bankDetails', JSON.stringify(val || {}));
    }
  },
  categories: {
    type: DataTypes.TEXT,
    get() {
      const raw = this.getDataValue('categories');
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
      return ['Wooden Packaging Boxes', 'Corrugated Boxes', 'Wooden Pallets', 'Wooden Crates', 'Custom Packaging'];
    },
    set(val) {
      this.setDataValue('categories', JSON.stringify(val || []));
    }
  },
  certificationText: {
    type: DataTypes.TEXT,
    defaultValue: 'I/We hereby certify that my/our registration certificate under the Goods and Service Tax, is in force on the date on which the sale of goods specified on this Tax Invoice is made by me/us & that the transaction of sale covered by this Tax Invoice has been affected by me/us & it shall be accounted for in the turnover of sales while filing of return & the due Tax, if any, payable on the sale has been paid or shall be paid.'
  },
  challanBannerText: {
    type: DataTypes.TEXT,
    defaultValue: 'Please receive the following goods in good order & condition.'
  }
}, {
  timestamps: true,
  tableName: 'company_settings'
});

export default CompanySettings;
