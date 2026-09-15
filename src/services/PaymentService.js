import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import { sequelize } from '../config/db.js';

class PaymentService {
  /**
   * Recalculates the paid amount, due amount, and payment status for an invoice.
   * Updates the Invoice record within the given transaction.
   */
  async updateInvoiceTotals(invoiceId, transaction) {
    const invoice = await Invoice.findByPk(invoiceId, { transaction });
    if (!invoice) throw new Error('Invoice not found');

    const payments = await Payment.findAll({
      where: { invoiceId },
      transaction
    });

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const grandTotal = Number(invoice.grandTotal || 0);

    const newDueAmount = Math.max(0, grandTotal - totalPaid);

    let paymentStatus = 'Unpaid';
    if (newDueAmount <= 0) {
      paymentStatus = 'Paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'Partial';
    }

    await invoice.update({
      paidAmount: totalPaid,
      dueAmount: newDueAmount,
      balanceAmount: newDueAmount, // keep balanceAmount consistent
      paymentStatus
    }, { transaction });

    return { invoice, totalPaid, newDueAmount, paymentStatus };
  }

  async recordPayment(invoiceId, paymentData, userId) {
    return await sequelize.transaction(async (t) => {
      const invoice = await Invoice.findByPk(invoiceId, { transaction: t });
      if (!invoice) throw new Error('Invoice not found');

      const amountToPay = Number(paymentData.amount);
      if (isNaN(amountToPay) || amountToPay <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      const currentDue = Number(invoice.dueAmount || 0);
      if (amountToPay > currentDue) {
        throw new Error(`Payment amount cannot exceed the outstanding balance of ${currentDue}`);
      }

      // Create the payment record
      const payment = await Payment.create({
        invoiceId,
        amount: Number(paymentData.amount),
        paymentDate: paymentData.paymentDate || new Date(),
        mode: paymentData.mode || 'Bank Transfer',
        referenceNo: paymentData.referenceNo || '',
        notes: paymentData.notes || ''
      }, { transaction: t });

      // Recalculate totals on the invoice
      await this.updateInvoiceTotals(invoiceId, t);

      return payment;
    });
  }

  async deletePayment(paymentId) {
    return await sequelize.transaction(async (t) => {
      const payment = await Payment.findByPk(paymentId, { transaction: t });
      if (!payment) throw new Error('Payment not found');

      const invoiceId = payment.invoiceId;
      await payment.destroy({ transaction: t });

      // Recalculate totals on the invoice
      await this.updateInvoiceTotals(invoiceId, t);

      return true;
    });
  }

  async getPaymentHistory(invoiceId) {
    return await Payment.findAll({
      where: { invoiceId },
      order: [['paymentDate', 'ASC'], ['createdAt', 'ASC']]
    });
  }

  async getPendingPayments(filter = {}, options = {}) {
    // This will be called by the controller to get all unpaid/partially paid invoices.
    // We can just rely on the existing Invoice model's caching (dueAmount, paymentStatus)
    // because PaymentService guarantees they are perfectly in sync.
    // However, the controller might just use InvoiceRepository for that.
  }
}

const paymentService = new PaymentService();
export default paymentService;
