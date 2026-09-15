import { sequelize } from '../src/config/db.js';
import Invoice from '../src/models/Invoice.js';
import Payment from '../src/models/Payment.js';

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // Ensure table exists
    await Payment.sync({ alter: true });
    console.log('Payment table synced.');

    const invoices = await Invoice.findAll({ paranoid: false });
    console.log(`Found ${invoices.length} invoices.`);

    let migrationCount = 0;

    for (const invoice of invoices) {
      // Access the JSON array of payments
      const rawPayments = invoice.getDataValue('payments');
      let paymentsArray = [];
      try {
        paymentsArray = JSON.parse(rawPayments || '[]');
      } catch (e) {
        paymentsArray = [];
      }

      if (paymentsArray && paymentsArray.length > 0) {
        // Check if there are already payments in the new table for this invoice
        const existingPayments = await Payment.findAll({ where: { invoiceId: invoice.id } });
        
        if (existingPayments.length === 0) {
          // Migrate them
          for (const p of paymentsArray) {
            await Payment.create({
              invoiceId: invoice.id,
              amount: p.amount || 0,
              paymentDate: p.paymentDate || invoice.createdAt,
              mode: p.mode || 'Unknown',
              referenceNo: p.referenceNo || '',
              notes: p.notes || ''
            });
            migrationCount++;
          }
        }
      }
    }

    console.log(`Migration complete. Inserted ${migrationCount} payment records.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
