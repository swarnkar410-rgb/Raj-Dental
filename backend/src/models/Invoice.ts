import { Schema, model } from 'mongoose';

const InvoiceSchema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true, index: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  treatmentIds: [{ type: Schema.Types.ObjectId, ref: 'Treatment' }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, required: true },
  status: { type: String, enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'], default: 'UNPAID', index: true },
  issueDate: { type: String, required: true },
  dueDate: { type: String, required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

InvoiceSchema.virtual('amountPaid').get(function(this: any) {
  return this.paidAmount;
});

InvoiceSchema.virtual('balanceDue').get(function(this: any) {
  return this.balanceAmount;
});

export const Invoice = model('Invoice', InvoiceSchema);
