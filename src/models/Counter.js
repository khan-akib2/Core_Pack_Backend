import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Counter = sequelize.define('Counter', {
  name: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  seq: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  }
}, {
  timestamps: true,
  tableName: 'counters'
});

export default Counter;
