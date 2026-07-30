import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'corepack_erp',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '4212',
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
    await sequelize.authenticate();
    console.log('[MySQL Connected]: Connection to MySQL database successfully established.');
    await sequelize.sync({ alter: true });
    console.log('[MySQL Schema Synced]: All tables synchronized.');
  } catch (error) {
    console.error(`[MySQL Connection Error]: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
