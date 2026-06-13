'use client';

import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (date: string, timeSlot: string) => void;
  submitting: boolean;
  currentDate: string;
  currentTimeSlot: string;
}

const CLINIC_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '06:00 PM',
  '06:30 PM'
];

const timeAMPMTo24 = (ampmStr: string): string => {
  const match = ampmStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "09:00";
  let [_, hr, min, ampm] = match;
  let hours = parseInt(hr, 10);
  const minutes = parseInt(min, 10);
  
  if (ampm.toUpperCase() === 'PM' && hours < 12) {
    hours += 12;
  }
  if (ampm.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const getKolkataDate = (dateStr: string, timeSlotStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const time24 = timeAMPMTo24(timeSlotStr);
  const [hours, minutes] = time24.split(':').map(Number);
  
  // Construct UTC timestamp matching Asia/Kolkata timezone offset (UTC+5:30)
  const localUTC = Date.UTC(year, month - 1, day, hours, minutes, 0);
  return new Date(localUTC - 330 * 60 * 1000);
};

const getKolkataTodayString = (): string => {
  const now = new Date();
  const kolkataTime = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000);
  const year = kolkataTime.getFullYear();
  const month = String(kolkataTime.getMonth() + 1).padStart(2, '0');
  const day = String(kolkataTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSlotInPast = (dateStr: string, slotStr: string): boolean => {
  const slotDate = getKolkataDate(dateStr, slotStr);
  const now = new Date();
  return slotDate.getTime() <= now.getTime();
};

export default function RescheduleModal({ isOpen, onClose, onReschedule, submitting, currentDate, currentTimeSlot }: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(currentTimeSlot);

  if (!isOpen) return null;

  const todayStr = getKolkataTodayString();
  const isDateInPast = selectedDate < todayStr;
  const isCurrentTimeSlotPast = selectedDate && selectedTimeSlot ? isSlotInPast(selectedDate, selectedTimeSlot) : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTimeSlot || isDateInPast || isCurrentTimeSlotPast) return;
    onReschedule(selectedDate, selectedTimeSlot);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 animate-scaleUp">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2 text-[#F59E0B]">
            <Calendar size={20} />
            <h3 className="text-lg font-bold text-white">Reschedule Appointment</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-6 space-y-5">
          {/* Select Date */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Choose Date</label>
            <CustomDatePicker
              value={selectedDate}
              onChange={(val) => {
                setSelectedDate(val);
                // Clear selected slot if new date makes it invalid
                if (val < todayStr) {
                  setSelectedTimeSlot('');
                }
              }}
            />
          </div>

          {/* Select Time Slot */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Available Time Slots</label>
            
            {isDateInPast ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">
                Cannot reschedule appointments to a past date.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {CLINIC_SLOTS.map(slot => {
                  const isSelected = selectedTimeSlot === slot;
                  const isOriginal = currentTimeSlot === slot && currentDate === selectedDate;
                  const isPast = isSlotInPast(selectedDate, slot);

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isPast}
                      title={isPast ? "Past time slot" : undefined}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                        isPast
                          ? 'bg-white/5 border-white/5 text-gray-600 opacity-30 cursor-not-allowed'
                          : isSelected 
                          ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-white shadow-sm cursor-pointer'
                          : isOriginal
                          ? 'bg-white/5 border-dashed border-gray-500 text-gray-300 cursor-pointer'
                          : 'bg-[#020817] border-white/5 text-gray-400 hover:text-white hover:border-white/10 cursor-pointer'
                      }`}
                    >
                      <span>{slot}</span>
                      {isOriginal && <span className="block text-[8px] text-gray-500">(Original)</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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
              disabled={
                !selectedDate || 
                !selectedTimeSlot || 
                submitting || 
                isDateInPast || 
                isCurrentTimeSlotPast || 
                (selectedDate === currentDate && selectedTimeSlot === currentTimeSlot)
              }
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#d98200] text-[#020817] text-sm font-bold shadow-[0_4px_15px_rgba(245,158,11,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-[#020817] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Reschedule</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
