'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Receipt, 
  IndianRupee, 
  Search, 
  Printer, 
  Hourglass, 
  CheckCircle2, 
  ChevronRight,
  Plus,
  Loader2
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { formatDateToDMY } from '../../../utils/date';

const parseInvoiceDate = (dateStr: string): Date => {
  if (!dateStr) return new Date(0);
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  return new Date(dateStr);
};

export default function BillingPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest-first');
  
  // Payment recording state
  const [payingInvoice, setPayingInvoice] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const getSortedInvoices = () => {
    let filtered = [...invoices];
    if (statusFilter !== 'All') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }
    return filtered.sort((a, b) => {
      if (sortBy === 'newest-first') {
        const dateA = parseInvoiceDate(a.issueDate).getTime();
        const dateB = parseInvoiceDate(b.issueDate).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'oldest-first') {
        const dateA = parseInvoiceDate(a.issueDate).getTime();
        const dateB = parseInvoiceDate(b.issueDate).getTime();
        return dateA - dateB;
      }
      if (sortBy === 'highest-amount') {
        return b.totalAmount - a.totalAmount;
      }
      if (sortBy === 'lowest-amount') {
        return a.totalAmount - b.totalAmount;
      }
      if (sortBy === 'patient-az') {
        const nameA = (a.patientId?.name || '').toLowerCase();
        const nameB = (b.patientId?.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'pending-amount') {
        return (b.balanceDue || 0) - (a.balanceDue || 0);
      }
      return 0;
    });
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/billing/invoices');
      if (res.success) {
        setInvoices(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }
    if (paymentAmount > payingInvoice.balanceDue) {
      alert('Payment amount exceeds pending amount.');
      return;
    }

    setSubmittingPayment(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await apiRequest(`/billing/invoices/${payingInvoice._id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: paymentAmount,
          paymentMethod,
          transactionId,
          paymentDate: today
        })
      });

      if (res.success) {
        setPayingInvoice(null);
        setPaymentAmount(0);
        setTransactionId('');
        loadInvoices();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Billing & Invoices</h1>
          <p className="text-xs sm:text-sm text-gray-400">Track pending amounts, patient invoices, and record clinic payments.</p>
        </div>
      </div>

      {/* Summary Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Recent Invoices */}
        <div className="panel-card p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Invoices</span>
              <div className="text-3xl font-black text-white">
                {invoices.length}
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/15 text-[#3B82F6] group-hover:bg-[#3B82F6]/25 transition-all">
              <Receipt size={18} />
            </div>
          </div>
          <span className="text-[10px] text-blue-400 font-bold mt-4 block border-t border-white/5 pt-3">
            Active billing records
          </span>
        </div>

        {/* Card 2: Unpaid Balances */}
        <div className="panel-card p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pending Amount</span>
              <div className="text-3xl font-black text-red-400 flex items-center">
                <span>₹</span>
                <span>{invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/15 text-red-400 group-hover:bg-red-500/25 transition-all">
              <Hourglass size={18} />
            </div>
          </div>
          <span className="text-[10px] text-red-400 font-bold mt-4 block border-t border-white/5 pt-3">
            Awaiting patient collections
          </span>
        </div>

        {/* Card 3: Recent Revenue */}
        <div className="panel-card p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Recent Revenue</span>
              <div className="text-3xl font-black text-emerald-400 flex items-center">
                <span>₹</span>
                <span>{invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500/25 transition-all">
              <IndianRupee size={18} />
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold mt-4 block border-t border-white/5 pt-3">
            Total recorded payments
          </span>
        </div>
      </div>

      {/* Filter and Sort Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B1220] p-4 rounded-2xl border border-white/5">
        {/* Status filters */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider">
          {[
            { label: 'All', value: 'All' },
            { label: 'Paid', value: 'PAID' },
            { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
            { label: 'Unpaid', value: 'UNPAID' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                statusFilter === tab.value ? 'bg-[#3B82F6] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort selector dropdown */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-400 font-bold uppercase">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-white/10 bg-[#0B1220] text-white focus:outline-none focus:border-[#3B82F6] text-xs font-bold cursor-pointer pr-8 relative"
          >
            <option value="newest-first">Newest First</option>
            <option value="oldest-first">Oldest First</option>
            <option value="highest-amount">Highest Amount</option>
            <option value="lowest-amount">Lowest Amount</option>
            <option value="patient-az">Patient Name A-Z</option>
            <option value="pending-amount">Pending Amount</option>
          </select>
        </div>
      </div>

      {/* Invoice list table */}
      {loading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : getSortedInvoices().length === 0 ? (
        <div className="panel-card p-12 text-center text-gray-400 space-y-4">
          <Receipt size={40} className="mx-auto text-gray-600" />
          <div>
            <h3 className="font-extrabold text-white text-lg">No Invoices Found</h3>
            <p className="text-xs text-gray-500 mt-1">There are no records matching your status filter.</p>
          </div>
        </div>
      ) : (() => {
        const sortedInvoices = getSortedInvoices();
        return (
          <div className="panel-card overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5 text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="p-4 sm:p-5">Invoice #</th>
                  <th className="p-4 sm:p-5">Patient</th>
                  <th className="p-4 sm:p-5">Issue Date</th>
                  <th className="p-4 sm:p-5">Total Amount</th>
                  <th className="p-4 sm:p-5">Paid Amount</th>
                  <th className="p-4 sm:p-5">Balance Due</th>
                  <th className="p-4 sm:p-5">Status</th>
                  <th className="p-4 sm:p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {sortedInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-white/3 transition-colors">
                    <td className="p-4 sm:p-5 font-bold text-white">
                      <button
                        onClick={() => router.push(`/dashboard/billing/invoice/${inv._id}`)}
                        className="hover:text-[#3B82F6] transition-colors font-extrabold text-left cursor-pointer"
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>
                    <td className="p-4 sm:p-5">
                      {inv.patientId ? (
                        <button
                          onClick={() => router.push(`/dashboard/patients/${inv.patientId._id}`)}
                          className="hover:text-[#3B82F6] hover:underline font-bold text-left cursor-pointer"
                        >
                          {inv.patientId.name}
                        </button>
                      ) : (
                        <span className="italic text-gray-500">Deleted Patient</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5 text-gray-200 font-extrabold text-xs tracking-wide">
                      {formatDateToDMY(inv.issueDate)}
                    </td>
                    <td className="p-4 sm:p-5 font-bold text-white">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="p-4 sm:p-5 font-bold text-emerald-400">₹{(inv.amountPaid || 0).toLocaleString('en-IN')}</td>
                    <td className="p-4 sm:p-5 font-bold text-white">
                      {inv.balanceDue > 0 ? (
                        <span className="text-red-400 font-semibold">₹{inv.balanceDue.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">₹0</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        inv.status === 'PAID' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : inv.status === 'PARTIALLY_PAID'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {inv.status === 'PARTIALLY_PAID' ? 'Partially Paid' : inv.status === 'PAID' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 text-right space-x-1.5 flex justify-end items-center">
                      {/* Record Payment button */}
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => {
                            setPayingInvoice(inv);
                            setPaymentAmount(inv.balanceDue);
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-gray-200 hover:text-white cursor-pointer"
                        >
                          <Plus size={12} className="text-[#3B82F6]" />
                          <span>Record Payment</span>
                        </button>
                      )}

                      <button
                        onClick={() => router.push(`/dashboard/billing/invoice/${inv._id}`)}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                        title="Print Invoice"
                      >
                        <Printer size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* Record Payment Modal popup */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl relative p-6 space-y-4 animate-fadeIn">
            <h3 className="font-extrabold text-base text-white border-b border-white/5 pb-2">
              Payment: {payingInvoice.invoiceNumber}
            </h3>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="p-4 rounded-xl bg-white/3 border border-white/5 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Invoice</span>
                  <span className="font-bold text-white">₹{payingInvoice.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Balance Due</span>
                  <span className="font-bold text-red-400">₹{payingInvoice.balanceDue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Payment Amount (INR) *</label>
                <input
                  type="number"
                  required
                  max={payingInvoice.balanceDue}
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm appearance-none cursor-pointer"
                  >
                    <option value="UPI" className="bg-[#0B1220]">UPI</option>
                    <option value="Cash" className="bg-[#0B1220]">Cash</option>
                    <option value="Card" className="bg-[#0B1220]">Card</option>
                    <option value="Bank Transfer" className="bg-[#0B1220]">Bank Transfer</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Transaction ID</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Ref ID / UPI Txn No"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] text-white text-xs font-bold cursor-pointer shadow-md"
                >
                  {submittingPayment ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                  <span>Save Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
