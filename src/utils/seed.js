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

    const existingAdmin = await User.findOne({ where: { email: 'admin@corepack.in' } });
    if (!existingAdmin) {
      const passwordHash = await User.hashPassword('adminpassword123');
      await User.create({
        name: 'CorePack Admin',
        email: 'admin@corepack.in',
        passwordHash,
        role: ROLES.ADMIN,
        phone: '+91 98200 12345'
      });
      console.log('[MySQL Seeding]: Created Admin User (admin@corepack.in / adminpassword123)');
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

    const productCount = await Product.count();
    if (productCount === 0) {
      await Product.create({
        sku: 'WPB-1200-1000',
        name: 'Heavy Duty Wooden Pallet Box (1200x1000x800mm)',
        description: 'ISPM-15 Heat Treated Pine Wood Box suitable for heavy machinery export',
        category: 'Wooden Packaging Boxes',
        unit: 'Pcs',
        defaultRate: 3850,
        hsnCode: '44151000',
        gstRate: 18
      });

      await Product.create({
        sku: 'COR-7PLY-500',
        name: '7-Ply Corrugated Export Carton Box (500x400x400mm)',
        description: 'Heavy duty 7-ply kraft paper corrugated box for safe freight shipping',
        category: 'Corrugated Boxes',
        unit: 'Pcs',
        defaultRate: 185,
        hsnCode: '481910',
        gstRate: 18
      });

      await Product.create({
        sku: 'PAL-EURO-1200',
        name: 'Euro Spec Wooden Pallet (1200x800mm)',
        description: 'Four-way entry heat-treated pine wood pallet certified for Europe export',
        category: 'Wooden Pallets',
        unit: 'Pcs',
        defaultRate: 1450,
        hsnCode: '441520',
        gstRate: 18
      });
      console.log('[MySQL Seeding]: Created Sample Products');
    }

    const customerCount = await Customer.count();
    if (customerCount === 0) {
      await Customer.create({
        name: 'Rajesh Kumar',
        companyName: 'Tata AutoComp Systems Ltd',
        gstin: '27AAACT1234P1Z2',
        email: 'procurement@tataautocomp.com',
        phone: '+91 98765 43210',
        billingAddress: {
          street: 'Gat No. 312, Chakan Industrial Area',
          city: 'Pune',
          state: 'Maharashtra',
          stateCode: '27',
          pincode: '410501'
        }
      });
      console.log('[MySQL Seeding]: Created Sample Customer');
    }

    console.log('[MySQL Seeding]: Database initialization and seeding complete.');
  } catch (error) {
    console.error('[MySQL Seeding Error]:', error);
  }
}

if (process.argv[1]?.includes('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}
