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
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    dialectOptions: (process.env.DB_SSL === 'true' || String(process.env.DB_HOST).includes('aivencloud')) ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    console.log(`[DEBUG Connection Details]: Host="${process.env.DB_HOST || 'localhost'}", Port="${process.env.DB_PORT || 3306}", User="${dbUser}", Pass="${dbPassword}", DB="${dbName}"`);
    
    // Aiven requires SSL, so let's dynamically enforce it if the host is Aiven
    const isAiven = String(process.env.DB_HOST).includes('aivencloud');
    const sslConfig = (process.env.DB_SSL === 'true' || isAiven) ? { rejectUnauthorized: false } : undefined;

    // We only try to create the database if we are NOT on Aiven, 
    // because Aiven managed users do not have CREATE DATABASE privileges.
    if (!isAiven) {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: dbUser,
        password: dbPassword,
        ssl: sslConfig
      });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
      await connection.end();
      console.log(`[MySQL Database Check]: Database "${dbName}" checked/created.`);
    }

    await sequelize.authenticate();
    console.log('[MySQL Connected]: Connection to MySQL database successfully established.');
    
    if (process.env.NODE_ENV === 'production') {
      await sequelize.sync();
      console.log('[MySQL Schema Synced]: All tables synchronized natively.');
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
