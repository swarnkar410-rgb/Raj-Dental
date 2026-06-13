import { Request, Response } from 'express';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { Treatment } from '../models/Treatment';
import { Patient } from '../models/Patient';
import { AuditLog } from '../models/AuditLog';

export const createTreatment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, appointmentId, title, notes, status, teeth, cost, discount, date } = req.body;

    if (!patientId || !title || cost === undefined || !date) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const discountVal = discount || 0;
    const totalAmount = cost - discountVal;

    const treatment = await Treatment.create({
      patientId,
      appointmentId,
      title,
      notes: notes || '',
      status: status || 'completed',
      teeth: teeth || [],
      cost,
      discount: discountVal,
      totalAmount,
      date
    });

    res.status(201).json({ success: true, data: treatment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listPatientTreatments = async (req: Request, res: Response): Promise<void> => {
  try {
    const treatments = await Treatment.find({ patientId: req.params.patientId }).sort({ date: -1 });
    res.status(200).json({ success: true, data: treatments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, treatmentIds, discount, tax, issueDate, dueDate } = req.body;

    if (!patientId || !treatmentIds || treatmentIds.length === 0 || !issueDate || !dueDate) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    // Hydrate treatments to compute subtotal
    const treatments = await Treatment.find({ _id: { $in: treatmentIds } });
    if (treatments.length === 0) {
      res.status(404).json({ success: false, message: 'No treatments found for given IDs' });
      return;
    }

    const subtotal = treatments.reduce((sum, t) => sum + t.totalAmount, 0);
    const discountVal = discount || 0;
    const taxVal = tax || 0;
    const totalAmount = subtotal - discountVal + taxVal;

    // Generate unique invoice number
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      patientId,
      treatmentIds,
      subtotal,
      discount: discountVal,
      tax: taxVal,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      status: 'UNPAID',
      issueDate,
      dueDate
    });

    await AuditLog.create({
      action: 'INVOICE_CREATED',
      details: `Issued invoice ${invoiceNumber} to patient ${patientId} for total ${totalAmount}`
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const invoices = await Invoice.find(query)
      .populate('patientId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('patientId')
      .populate('treatmentIds');

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    const payments = await Payment.find({ invoiceId: invoice._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        invoice,
        payments
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, paymentMethod, transactionId, paymentDate } = req.body;

    if (!amount || !paymentMethod || !paymentDate) {
      res.status(400).json({ success: false, message: 'Amount, paymentMethod, and paymentDate are required' });
      return;
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    // Record the payment
    const payment = await Payment.create({
      invoiceId: invoice._id,
      amount,
      paymentMethod,
      transactionId: transactionId || '',
      paymentDate
    });

    // Update invoice calculations
    const nextPaid = ((invoice as any).paidAmount || 0) + amount;
    (invoice as any).paidAmount = nextPaid;
    (invoice as any).balanceAmount = Math.max(0, invoice.totalAmount - nextPaid);

    if ((invoice as any).balanceAmount <= 0) {
      (invoice as any).status = 'PAID';
    } else if ((invoice as any).paidAmount > 0) {
      (invoice as any).status = 'PARTIALLY_PAID';
    } else {
      (invoice as any).status = 'UNPAID';
    }

    await invoice.save();

    await AuditLog.create({
      action: 'PAYMENT_RECEIVED',
      details: `Received payment of ${amount} via ${paymentMethod} for invoice ${invoice.invoiceNumber}`
    });

    res.status(201).json({ success: true, data: payment, invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
