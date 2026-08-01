import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';

const dbName = process.env.DB_NAME || 'corepack_erp';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASS !== undefined ? process.env.DB_PASS : '4212';

const isAiven = String(process.env.DATABASE_URL || process.env.DB_HOST).includes('aivencloud');
const dialectOptions = (process.env.DB_SSL === 'true' || isAiven) ? {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
} : {};

export const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'production' ? false : console.log,
      dialectOptions
    })
  : new Sequelize(dbName, dbUser, dbPassword, {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'production' ? false : console.log,
      dialectOptions,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
    });

const connectDB = async () => {
  try {
    console.log(`[DEBUG Connection Details]: Host="${process.env.DB_HOST || 'localhost'}", Port="${process.env.DB_PORT || 3306}", User="${dbUser}", Pass="${dbPassword}", DB="${dbName}"`);
    
    // We only try to create the database if we are NOT on Aiven and NOT using DATABASE_URL
    if (!isAiven && !process.env.DATABASE_URL) {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: dbUser,
        password: dbPassword,
        ssl: dialectOptions.ssl
      });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
      await connection.end();
      console.log(`[MySQL Database Check]: Database "${dbName}" checked/created.`);
    }

    await sequelize.authenticate();
    console.log('[MySQL Connected]: Connection to MySQL database successfully established.');
    
    if (process.env.NODE_ENV === 'production') {
      await sequelize.sync({ alter: true });
      console.log('[MySQL Schema Synced]: All tables synchronized natively with alter enabled.');
    } else {
      await sequelize.sync({ alter: true });
      console.log('[MySQL Schema Synced]: All tables synchronized and altered.');
    }
    
    return true;
  } catch (error) {
    console.error(`[MySQL Connection Error]: ${error.message}`);
    console.warn('[MySQL Startup Warning]: Continuing without a database connection. API routes may fail until MySQL is reachable.');
    return false;
  }
};

export default connectDB;
