'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  submitting: boolean;
}

const REJECT_REASONS = [
  'Slot Unavailable',
  'Clinic Closed',
  'Duplicate Booking',
  'Patient Unreachable',
  'Other'
];

export default function RejectModal({ isOpen, onClose, onReject, submitting }: RejectModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;
    
    const finalReason = selectedReason === 'Other' && customReason 
      ? `Other: ${customReason}` 
      : selectedReason;
      
    onReject(finalReason);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 animate-scaleUp">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2 text-[#EF4444]">
            <AlertTriangle size={20} />
            <h3 className="text-lg font-bold text-white">Reject Appointment Request</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-6 space-y-4">
          <p className="text-sm text-gray-300">
            Please specify a reason for rejecting this appointment request. An automated SMS/Email notification will be sent to the patient.
          </p>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Rejection Reason</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#020817] border border-white/10 rounded-xl text-white text-sm focus:border-[#EF4444] outline-none transition-colors"
            >
              <option value="" disabled>Select a reason...</option>
              {REJECT_REASONS.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {selectedReason === 'Other' && (
            <div className="space-y-2 animate-fadeIn">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Detailed Reason</label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
                rows={3}
                placeholder="Specify the reason..."
                className="w-full px-4 py-3 bg-[#020817] border border-white/10 rounded-xl text-white text-sm focus:border-[#EF4444] outline-none transition-colors resize-none"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedReason || submitting}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-[#EF4444] hover:bg-[#dc3545] text-white text-sm font-bold shadow-[0_4px_15px_rgba(239,68,68,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Reject &amp; Archive</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
