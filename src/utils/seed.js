import dotenv from 'dotenv';
import connectDB, { sequelize } from '../config/db.js';
import User from '../models/User.js';
import CompanySettings from '../models/CompanySettings.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Counter from '../models/Counter.js';
import { ROLES } from '../constants/roles.js';

dotenv.config();

export async function seedDatabase() {
  try {
    await connectDB();
    console.log('[MySQL Seeding]: Synchronizing schema and seeding initial data...');

    const existingAdmin = await User.findOne({ where: { email: 'admin.corepack@gmail.com' } });
    if (!existingAdmin) {
      const passwordHash = await User.hashPassword('corepack@123!');
      await User.create({
        name: 'CorePack Admin',
        email: 'admin.corepack@gmail.com',
        passwordHash,
        role: ROLES.ADMIN,
        phone: '+91 98200 12345'
      });
      console.log('[MySQL Seeding]: Created Admin User (admin.corepack@gmail.com / corepack@123!)');
    }

    const existingCompany = await CompanySettings.findOne();
    if (!existingCompany) {
      await CompanySettings.create({
        companyName: 'Core Pack India',
        tagline: 'Industrial & Export Packaging Solutions',
        gstin: '27AABCC1234D1Z5',
        email: 'info@corepack.in',
        phone: '+91 98200 12345',
        address: {
          street: 'Plot No. 42, MIDC Industrial Area, Bhosari',
          city: 'Pune',
          state: 'Maharashtra',
          stateCode: '27',
          pincode: '411026',
          country: 'India'
        },
        bankDetails: {
          bankName: 'HDFC Bank Ltd',
          accountName: 'Core Pack India',
          accountNumber: '50200012345678',
          ifscCode: 'HDFC0001234',
          branch: 'Bhosari Industrial Area, Pune',
          upiId: 'corepack@hdfcbank'
        },
        categories: ['Wooden Packaging Boxes', 'Corrugated Boxes', 'Wooden Pallets', 'Wooden Crates', 'Custom Packaging']
      });
      console.log('[MySQL Seeding]: Created Company Settings Profile');
    }

    console.log('[MySQL Seeding]: Database initialization and seeding complete.');
  } catch (error) {
    console.error('[MySQL Seeding Error]:', error);
  }
}

if (process.argv[1]?.includes('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}
