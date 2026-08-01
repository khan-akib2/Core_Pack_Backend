import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/db.js';
import { ROLES } from '../constants/roles.js';

const User = sequelize.define('User', {
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
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: ROLES.ADMIN
  },
  customPermissions: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('customPermissions');
      try { return JSON.parse(raw || '[]'); } catch (e) { return []; }
    },
    set(val) {
      this.setDataValue('customPermissions', JSON.stringify(val || []));
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true,
  tableName: 'users',
  defaultScope: {
    attributes: { exclude: ['passwordHash'] }
  },
  scopes: {
    withPassword: {
      attributes: { include: ['passwordHash'] }
    }
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

User.hashPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export default User;
