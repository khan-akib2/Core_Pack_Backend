import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  familyId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  hashedRefreshToken: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isRevoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },

}, {
  timestamps: true,
  tableName: 'sessions',
  indexes: [
    { fields: ['familyId'] },
    { fields: ['userId'] },
    { fields: ['hashedRefreshToken'] }
  ]
});

export default Session;
