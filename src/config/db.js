import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';

const dbName = process.env.DB_NAME || 'corepack_erp';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASS !== undefined ? process.env.DB_PASS : '4212';

export const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPassword,
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    console.log(`[DEBUG Connection Details]: Host="${process.env.DB_HOST || 'localhost'}", Port="${process.env.DB_PORT || 3306}", User="${dbUser}", Pass="${dbPassword}", DB="${dbName}"`);
    
    // Automatically create database if not exists
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: dbUser,
      password: dbPassword
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();
    console.log(`[MySQL Database Check]: Database "${dbName}" checked/created.`);

    await sequelize.authenticate();
    console.log('[MySQL Connected]: Connection to MySQL database successfully established.');
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('[MySQL Schema Synced]: All tables synchronized.');
    return true;
  } catch (error) {
    console.error(`[MySQL Connection Error]: ${error.message}`);
    console.warn('[MySQL Startup Warning]: Continuing without a database connection. API routes may fail until MySQL is reachable.');
    return false;
  }
};

export default connectDB;
