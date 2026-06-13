'use client';

import React from 'react';
import { X, Check } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  data: {
    patientName: string;
    treatmentType: string;
    date: string;
    timeSlot: string;
  } | null;
}

export default function ConfirmModal({ isOpen, onClose, onConfirm, submitting, data }: ConfirmModalProps) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 animate-scaleUp">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <h3 className="text-lg font-bold text-white">Appointment Confirmation</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="py-6 space-y-4">
          <p className="text-sm text-gray-300 font-medium">Are you sure you want to approve this appointment request?</p>
          
          <div className="p-4 bg-[#020817] border border-white/5 rounded-xl space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-bold">Patient:</span>
              <span className="text-white font-extrabold">{data.patientName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-bold">Treatment:</span>
              <span className="text-white font-semibold">{data.treatmentType}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-bold">Date:</span>
              <span className="text-white font-semibold">{data.date}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-bold">Time:</span>
              <span className="text-[#3B82F6] font-extrabold">{data.timeSlot}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-white/5">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-[#10B981] hover:bg-[#0da471] text-white text-sm font-bold shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={16} />
            )}
            <span>Confirm Appointment</span>
          </button>
        </div>
      </div>
    </div>
  );
}
