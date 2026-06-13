'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Printer, 
  IndianRupee, 
  Clock, 
  User, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { apiRequest } from '../../../../../utils/api';
import { formatDateToDMY } from '../../../../../utils/date';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`/billing/invoices/${invoiceId}`);
        if (res.success) {
          setInvoice(res.data.invoice);
          setPayments(res.data.payments);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !invoice) {
    return (
      <div className="h-[60vh] flex items-center justify-center no-print">
        <div className="w-8 h-8 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back and Print buttons */}
      <div className="flex justify-between items-center no-print">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Invoice Overview</span>
            <h1 className="text-xl sm:text-2xl font-black text-white">{invoice.invoiceNumber}</h1>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b76ca] hover:to-[#5ea0ff] text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer"
        >
          <Printer size={16} />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Invoice Document Box */}
      <div className="bg-[#0B1220] border border-white/10 p-8 sm:p-12 rounded-3xl shadow-2xl relative overflow-hidden print-card print:border-none print:p-0 print:shadow-none text-gray-300">
        {/* Glow Strip */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6]/30 to-transparent no-print" />

        {/* Brand header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/10 pb-8 print:border-gray-300">
          <div>
            <div className="flex items-center space-x-2">
              <div className="relative w-8 h-8 flex items-center justify-center bg-gradient-to-tr from-[#145DA0] to-[#3B82F6] rounded-lg print:border print:border-[#145DA0] print:bg-none">
                <span className="font-extrabold text-white text-sm print:text-[#145DA0]">RD</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-white text-base tracking-wide print:text-black leading-tight">RAJ DENTAL & IMPLANT HOSPITAL</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none">Patna, Bihar</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-3 max-w-xs leading-relaxed print:text-gray-600">
              Raj Sadan, Jahaji Kothi Rd, Near Rajdhani Market, Dariyapur Gola, Salimpur Ahra, Kadamkuan, Patna, 800004
              <br />
              Phone: +91 91994 19594 &bull; Dr. Manoj Kumar
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h2 className="text-2xl font-black text-white print:text-black">INVOICE</h2>
            <div className="text-xs text-gray-400 print:text-gray-600">Invoice Ref: <span className="font-bold text-white print:text-black">{invoice.invoiceNumber}</span></div>
            <div className="text-xs text-gray-400 print:text-gray-600">Date Issued: {formatDateToDMY(invoice.issueDate)}</div>
            <div className="text-xs text-gray-400 print:text-gray-600">Due Date: {formatDateToDMY(invoice.dueDate)}</div>
            <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-2 border ${
              invoice.status === 'PAID' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 print:border-emerald-500 print:text-emerald-600' 
                : invoice.status === 'PARTIALLY_PAID'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 print:border-amber-500 print:text-amber-600'
                : 'bg-red-500/10 text-red-400 border-red-500/20 print:border-red-500 print:text-red-600'
            }`}>
              {invoice.status === 'PARTIALLY_PAID' ? 'Partially Paid' : invoice.status === 'PAID' ? 'Paid' : 'Unpaid'}
            </span>
          </div>
        </div>

        {/* Patient info row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8 border-b border-white/10 print:border-gray-300">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Billed To</span>
            <div className="font-extrabold text-white text-base print:text-black">{invoice.patientId?.name || 'Patient'}</div>
            <div className="text-xs text-gray-400 print:text-gray-600">ID: {invoice.patientId?.patientId}</div>
            <div className="text-xs text-gray-400 print:text-gray-600">Phone: {invoice.patientId?.phone}</div>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-8">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[500px] sm:min-w-0">
              <thead>
                <tr className="border-b border-white/10 print:border-gray-300 text-gray-400 print:text-gray-600 uppercase text-[9px] font-bold tracking-wider">
                  <th className="pb-3">Treatment / Procedure Details</th>
                  <th className="pb-3 text-center">Teeth</th>
                  <th className="pb-3 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-gray-200 text-gray-300 print:text-black">
                {invoice.treatmentIds && invoice.treatmentIds.length > 0 ? (
                  invoice.treatmentIds.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-white/2">
                      <td className="py-4">
                        <div className="font-bold text-white print:text-black">{item.title}</div>
                        <div className="text-xs text-gray-400 print:text-gray-600 mt-1">{item.notes}</div>
                      </td>
                      <td className="py-4 text-center font-semibold text-[#D4AF37] print:text-yellow-600">
                        {item.teeth && item.teeth.length > 0 ? item.teeth.join(', ') : 'General'}
                      </td>
                      <td className="py-4 text-right font-bold">₹{item.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-gray-500">No treatments mapped to this invoice.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary calculations */}
        <div className="border-t border-white/10 print:border-gray-300 pt-8 flex justify-end">
          <div className="w-72 space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400 print:text-gray-600">Subtotal</span>
              <span className="font-bold text-white print:text-black">₹{invoice.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Discount Applied</span>
                <span>-₹{invoice.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-white/5 print:border-gray-200 pt-3">
              <span className="font-bold text-white print:text-black text-base">Total Bill</span>
              <span className="font-black text-white print:text-black text-base">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 print:text-gray-600">Total Paid</span>
              <span className="font-bold text-emerald-400 print:text-emerald-600">₹{invoice.amountPaid.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-t-2 border-white/10 print:border-gray-300 pt-3 text-sm">
              <span className="font-extrabold text-white print:text-black">Balance Due</span>
              <span className="font-black text-red-400 print:text-red-600 text-base">₹{invoice.balanceDue.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Payment history list */}
        {payments && payments.length > 0 && (
          <div className="pt-12 border-t border-white/10 print:border-gray-300 mt-12 space-y-4">
            <h4 className="font-extrabold text-sm text-white print:text-black">Payment Receipt Logs</h4>
            <div className="space-y-2 text-xs">
              {payments.map((p: any) => (
                <div key={p._id} className="p-3 bg-white/3 print:bg-gray-100 rounded-xl border border-white/5 print:border-none flex justify-between items-center">
                  <div className="space-y-0.5">
                    <div className="font-bold text-white print:text-black">Received: ₹{p.amount.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-gray-500 font-semibold uppercase">Method: {p.paymentMethod} {p.transactionId && `(ID: ${p.transactionId})`}</div>
                  </div>
                  <span className="text-gray-400 print:text-gray-600 font-bold">{formatDateToDMY(p.paymentDate)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print Terms Footer */}
        <div className="text-center pt-12 border-t border-white/5 print:border-gray-200 mt-12 text-[10px] text-gray-500 leading-relaxed print:text-gray-600">
          This is a computer-generated invoice printout issued by Raj Dental & Implant Hospital.
          <br />
          For any questions, please contact +91 91994 19594 or visit Near Rajdhani Market, Patna.
        </div>
      </div>
    </div>
  );
}
