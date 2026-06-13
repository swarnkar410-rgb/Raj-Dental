import { Schema, model } from 'mongoose';

const PaymentSchema = new Schema({
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'], required: true },
  transactionId: { type: String, default: '' },
  paymentDate: { type: String, required: true } // Format: YYYY-MM-DD
}, {
  timestamps: true
});

export const Payment = model('Payment', PaymentSchema);
