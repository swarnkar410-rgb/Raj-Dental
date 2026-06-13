'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Check, 
  X, 
  ArrowLeftRight, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarDays,
  Lock,
  AlertCircle,
  Ban,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../utils/api';
import CustomDatePicker from '../../../components/CustomDatePicker';
import { formatDate, formatMonthYear, toISODateString } from '../../../utils/date';

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [availabilitySettings, setAvailabilitySettings] = useState<any>({
    schedules: [],
    leaves: [],
    blocked: []
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [selectedDate, setSelectedDate] = useState(toISODateString(new Date()));

  // Timezone and notice buffer helper (60 minutes notice buffer)
  const isSlotPastOrBuffer = (dateStr: string, timeSlotStr: string) => {
    const now = new Date();
    
    const match = timeSlotStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return false;
    let [_, hr, min, ampm] = match;
    let hours = parseInt(hr);
    const minutes = parseInt(min);
    if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const localUTC = Date.UTC(year, month - 1, day, hours, minutes, 0);
    const slotTime = new Date(localUTC - 330 * 60 * 1000); // UTC+5:30 offset
    
    return slotTime.getTime() <= now.getTime() + 60 * 60 * 1000;
  };

  const getSlotDateTime = (dateStr: string, timeSlotStr: string): Date => {
    const match = timeSlotStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return new Date();
    let [_, hr, min, ampm] = match;
    let hours = parseInt(hr);
    const minutes = parseInt(min);
    if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const localUTC = Date.UTC(year, month - 1, day, hours, minutes, 0);
    return new Date(localUTC - 330 * 60 * 1000); // UTC+5:30 offset
  };

  const getTodayKolkataStr = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayKolkataStr();

  // Appointment creation form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Completion & Payment popup state
  const [completingAppointment, setCompletingAppointment] = useState<any | null>(null);
  const [completionPaidAmount, setCompletionPaidAmount] = useState(0);
  const [completionPaymentMethod, setCompletionPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('Cash');
  const [completionTransactionId, setCompletionTransactionId] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [submittingCompletion, setSubmittingCompletion] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    treatmentType: 'Dental Implants',
    date: toISODateString(new Date()),
    timeSlot: '10:30 AM',
    notes: '',
    duration: 30
  });

  // Reschedule state
  const [reschedulingApp, setReschedulingApp] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:30 AM');

  // Daily computed slots list
  const [dailySlots, setDailySlots] = useState<any[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(false);

  const treatments = [
    'Dental Implants',
    'Root Canal Treatment (RCT)',
    'Smile Designing',
    'Braces Treatment',
    'Dental Crowns',
    'Teeth Whitening',
    'Tooth Extraction',
    'Laser Dental Treatment',
    'Clear Aligners'
  ];

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', 
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', 
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'
  ];

  // Helper to load availability configurations & leaves
  const loadAvailabilitySettings = async () => {
    try {
      const res = await apiRequest('/availability');
      if (res.success) {
        setAvailabilitySettings(res.data);
      }
    } catch (err) {
      console.error('Failed to load scheduling config:', err);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      // Calculate date ranges for filters based on selected month/week/day
      let url = '/appointments';
      const targetDate = new Date(selectedDate);
      
      if (viewMode === 'Daily') {
        url = `/appointments?startDate=${selectedDate}&endDate=${selectedDate}`;
      } else if (viewMode === 'Weekly') {
        const day = targetDate.getDay();
        const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const monday = toISODateString(new Date(targetDate.setDate(diff)));
        
        const end = new Date(monday);
        end.setDate(end.getDate() + 6); // Sunday
        const sunday = toISODateString(end);
        
        url = `/appointments?startDate=${monday}&endDate=${sunday}`;
      } else if (viewMode === 'Monthly') {
        const y = targetDate.getFullYear();
        const m = targetDate.getMonth();
        const firstDay = toISODateString(new Date(y, m, 1));
        const lastDay = toISODateString(new Date(y, m + 1, 0));
        
        url = `/appointments?startDate=${firstDay}&endDate=${lastDay}`;
      }

      const res = await apiRequest(url);
      if (res.success) {
        setAppointments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Compute daily timeline slots directly from backend dynamic endpoints
  const loadDailySlots = async () => {
    setLoadingDaily(true);
    try {
      const res = await apiRequest(`/availability/date?date=${selectedDate}&view=doctor`);
      if (res.success) {
        setDailySlots(res.data);
      }
    } catch (err) {
      console.error('Failed to compute daily timeline:', err);
    } finally {
      setLoadingDaily(false);
    }
  };

  useEffect(() => {
    loadAvailabilitySettings();
  }, []);

  useEffect(() => {
    loadAppointments();
    if (viewMode === 'Daily') {
      loadDailySlots();
    }
  }, [selectedDate, viewMode]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await apiRequest('/appointments', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (res.success) {
        setShowAddForm(false);
        setFormData({
          patientName: '',
          patientPhone: '',
          patientEmail: '',
          treatmentType: 'Dental Implants',
          date: selectedDate,
          timeSlot: '10:30 AM',
          notes: '',
          duration: 30
        });
        loadAppointments();
        if (viewMode === 'Daily') {
          loadDailySlots();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to schedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const getTreatmentCost = (treatmentType: string): number => {
    const norm = treatmentType.toLowerCase();
    if (norm.includes('implant')) return 30000;
    if (norm.includes('rct') || norm.includes('root canal')) return 8000;
    if (norm.includes('smile') || norm.includes('design')) return 25000;
    if (norm.includes('brace') || norm.includes('orthodontic')) return 40000;
    if (norm.includes('crown') || norm.includes('bridge')) return 12000;
    if (norm.includes('whiten') || norm.includes('bleach')) return 5000;
    if (norm.includes('extract') || norm.includes('removal')) return 2000;
    if (norm.includes('laser')) return 15000;
    return 2000; // Default fallback cost
  };

  const startCompletion = (app: any) => {
    setCompletingAppointment(app);
    const cost = getTreatmentCost(app.treatmentType);
    setCompletionPaidAmount(0);
    setCompletionPaymentMethod('Cash');
    setCompletionTransactionId('');
    setCompletionNotes(app.notes || '');
  };

  const handleCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingAppointment) return;
    setSubmittingCompletion(true);
    try {
      const res = await apiRequest(`/appointments/${completingAppointment._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'COMPLETED',
          amountPaid: Number(completionPaidAmount),
          paymentMethod: completionPaymentMethod,
          transactionId: completionTransactionId,
          notes: completionNotes
        })
      });
      if (res.success) {
        setCompletingAppointment(null);
        loadAppointments();
        if (viewMode === 'Daily') {
          loadDailySlots();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete appointment');
    } finally {
      setSubmittingCompletion(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await apiRequest(`/appointments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res.success) {
        loadAppointments();
        if (viewMode === 'Daily') {
          loadDailySlots();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingApp) return;

    try {
      const res = await apiRequest(`/appointments/${reschedulingApp._id}/reschedule`, {
        method: 'PUT',
        body: JSON.stringify({ date: rescheduleDate, timeSlot: rescheduleTime })
      });
      if (res.success) {
        setReschedulingApp(null);
        loadAppointments();
        if (viewMode === 'Daily') {
          loadDailySlots();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reschedule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    try {
      const res = await apiRequest(`/appointments/${id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        loadAppointments();
        if (viewMode === 'Daily') {
          loadDailySlots();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleDateShift = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate);
    if (viewMode === 'Daily') {
      current.setDate(current.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'Weekly') {
      current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'Monthly') {
      current.setMonth(current.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(toISODateString(current));
  };

  // Helper client-side check to see if a date is a closed leave day
  const getDayDetails = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    
    // Check leaves
    const isLeave = availabilitySettings.leaves?.some((l: any) => 
      l.startDate <= dateStr && l.endDate >= dateStr && l.isActive
    );
    if (isLeave) return { status: 'leave', label: 'Doctor Leave', color: 'bg-red-500/10 border-red-500/20 text-red-400' };

    // Check week closed
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = weekdays[dateObj.getDay()];
    const sched = availabilitySettings.schedules?.find((s: any) => s.dayOfWeek === dayName);
    
    if (sched?.isClosed || !sched) {
      return { status: 'closed', label: 'Closed', color: 'bg-white/5 border-white/5 text-gray-500' };
    }

    // Compute slot occupancy ratio
    // Total Slots generated by weekly shifts
    let totalShiftsSlots = 0;
    sched.shifts?.forEach((shift: any) => {
      const startParts = shift.startTime.split(':').map(Number);
      const endParts = shift.endTime.split(':').map(Number);
      const startMins = startParts[0] * 60 + startParts[1];
      const endMins = endParts[0] * 60 + endParts[1];
      totalShiftsSlots += Math.floor((endMins - startMins) / 30);
    });

    // Subtract Blocked Slots
    const dayBlocks = availabilitySettings.blocked?.filter((b: any) => b.date === dateStr);
    let blockedSlotCount = 0;
    dayBlocks?.forEach((block: any) => {
      const startParts = block.startTime.split(':').map(Number);
      const endParts = block.endTime.split(':').map(Number);
      const startMins = startParts[0] * 60 + startParts[1];
      const endMins = endParts[0] * 60 + endParts[1];
      blockedSlotCount += Math.floor((endMins - startMins) / 30);
    });

    const netCapacity = Math.max(0, totalShiftsSlots - blockedSlotCount);

    // Booked appointments count for this date
    const booked = appointments.filter(app => 
      app.date === dateStr && ['BOOKED', 'approved', 'pending', 'rescheduled'].includes(app.status)
    ).length;

    if (netCapacity === 0) {
      return { status: 'closed', label: 'Closed', color: 'bg-white/5 border-white/5 text-gray-500' };
    }

    const occupancyRate = netCapacity > 0 ? (booked / netCapacity) * 100 : 0;
    let color = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'; // Green (<50%)
    
    if (occupancyRate >= 100) {
      color = 'bg-red-500/10 border-red-500/25 text-red-500'; // Red (FULL)
    } else if (occupancyRate >= 50) {
      color = 'bg-amber-500/10 border-amber-500/20 text-amber-400'; // Yellow (>=50%)
    }

    return {
      status: 'active',
      booked,
      total: netCapacity,
      label: `${booked} / ${netCapacity}`,
      color
    };
  };

  // Generate days array for Monthly calendar grid
  const getMonthlyGridDays = () => {
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // weekday of 1st day of month
    const totalDays = new Date(year, month + 1, 0).getDate(); // days in current month

    const days: any[] = [];

    // Prev month pad
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        dateStr: toISODateString(prevDate),
        dayNum: prevDate.getDate(),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const currDate = new Date(year, month, i);
      days.push({
        dateStr: toISODateString(currDate),
        dayNum: i,
        isCurrentMonth: true
      });
    }

    // Next month pad to complete 42 cells grid
    const totalCells = 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        dateStr: toISODateString(nextDate),
        dayNum: i,
        isCurrentMonth: false
      });
    }

    return days;
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Raj Dental Scheduler</h1>
          <p className="text-xs sm:text-sm text-gray-400">Clinical calendar, slot reservation engine, and website synchronization portal.</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Selectors */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider">
            {(['Daily', 'Weekly', 'Monthly'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                  viewMode === mode ? 'bg-[#3B82F6] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setFormData({ ...formData, date: selectedDate });
              setShowAddForm(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b76ca] hover:to-[#5ea0ff] text-white text-xs sm:text-sm font-bold shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Slot</span>
          </button>
        </div>
      </div>

      {/* Date Navigation Strip */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0B1220] border border-white/5">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => handleDateShift('prev')}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-white cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-extrabold text-sm sm:text-base text-white">
            {viewMode === 'Daily' 
              ? formatDate(selectedDate)
              : formatMonthYear(selectedDate)}
          </span>
          <button 
            onClick={() => handleDateShift('next')}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-white cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Date Selector input */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-400 font-bold uppercase">Go to date:</span>
          <div className="w-36">
            <CustomDatePicker
              value={selectedDate}
              onChange={(val) => setSelectedDate(val)}
            />
          </div>
        </div>
      </div>

      {/* MAIN VIEW CONTROLLER */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="h-[50vh] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* MONTHLY CALENDAR GRID */}
            {viewMode === 'Monthly' && (
              <div className="panel-card p-6 rounded-3xl border-white/5">
                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2">{day}</div>
                  ))}
                </div>

                {/* Days Cells Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {getMonthlyGridDays().map((day, idx) => {
                    const details = getDayDetails(day.dateStr);
                    const isSelected = selectedDate === day.dateStr;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedDate(day.dateStr);
                          setViewMode('Daily');
                        }}
                        className={`min-h-[90px] p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                          isSelected 
                            ? 'bg-[#3B82F6]/20 border-[#3B82F6] shadow-[0_0_15px_rgba(59,130,246,0.25)]' 
                            : day.isCurrentMonth
                            ? 'bg-white/3 border-white/5 hover:border-white/15'
                            : 'bg-transparent border-transparent opacity-25'
                        }`}
                      >
                        <span className={`text-xs font-bold ${day.isCurrentMonth ? 'text-white' : 'text-gray-500'}`}>
                          {day.dayNum}
                        </span>

                        {day.isCurrentMonth && (
                          <div className={`mt-2 text-[9px] font-extrabold px-2 py-1.5 rounded-lg border text-center uppercase tracking-wider w-full ${details.color}`}>
                            {details.status === 'active' && <div className="text-[7px] text-gray-400 font-semibold mb-0.5">Booked</div>}
                            {details.label}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WEEKLY TIMELINE PLANNERS */}
            {viewMode === 'Weekly' && (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {Array.from({ length: 7 }).map((_, i) => {
                  const target = new Date(selectedDate);
                  const day = target.getDay();
                  const diff = target.getDate() - day + (day === 0 ? -6 : 1) + i; // Offset Mon -> Sun
                  const dayDate = toISODateString(new Date(target.setDate(diff)));
                  
                  const details = getDayDetails(dayDate);
                  const isSelected = selectedDate === dayDate;
                  
                  const dObj = new Date(dayDate);
                  const dNum = String(dObj.getDate()).padStart(2, '0');
                  const mShort = dObj.toLocaleDateString('en-IN', { month: 'short' });
                  const weekdayShort = `${dNum} ${mShort}`;

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(dayDate)}
                      className={`panel-card p-4 rounded-2xl border text-left flex flex-col justify-between min-h-[140px] cursor-pointer transition-all hover:-translate-y-1 ${
                        isSelected 
                          ? 'bg-[#3B82F6]/25 border-[#3B82F6] shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                          : 'border-white/5'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white uppercase">{weekdayShort}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                          {new Date(dayDate).toLocaleDateString('en-US', { weekday: 'long' })}
                        </div>
                      </div>

                      <div className={`text-[10px] font-extrabold px-2.5 py-2 rounded-xl border text-center uppercase tracking-wider w-full mt-6 ${details.color}`}>
                        {details.status === 'active' && <div className="text-[8px] text-gray-400 font-semibold mb-0.5">Capacity</div>}
                        {details.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* DAILY DYNAMIC TIMELINE TIMINGS */}
            {viewMode === 'Daily' && (
              <div className="space-y-6">
                {loadingDaily ? (
                  <div className="h-[30vh] flex items-center justify-center">
                    <Loader2 className="animate-spin text-[#3B82F6]" size={32} />
                  </div>
                ) : dailySlots.length === 0 ? (
                  <div className="panel-card p-12 text-center text-gray-400 space-y-4">
                    <Ban size={40} className="mx-auto text-red-400/50" />
                    <div>
                      <h3 className="font-extrabold text-white text-lg">Clinic Closed / Leave Active</h3>
                      <p className="text-xs text-gray-500 mt-1">There are no operational slots generated for this date based on scheduling hours or active leaves.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDate < todayStr && (
                      <div className="flex items-center space-x-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mb-4 animate-fadeIn">
                        <AlertCircle size={16} />
                        <span className="text-xs font-bold">Cannot book appointments in the past.</span>
                      </div>
                    )}
                    <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Daily Slots Timeline</h3>
                    
                    {dailySlots.map((slot, index) => {
                      const now = new Date();
                      const statusNorm = slot.status ? slot.status.toUpperCase() : '';
                      const isBooked = statusNorm === 'BOOKED' || statusNorm === 'COMPLETED' || ['APPROVED', 'PENDING', 'RESCHEDULED'].includes(statusNorm);
                      const isCompleted = statusNorm === 'COMPLETED';
                      const isNoShow = statusNorm === 'NO_SHOW';
                      const isRequested = statusNorm === 'REQUESTED';
                      const isReserved = statusNorm === 'RESERVED';
                      const isBlocked = statusNorm === 'BLOCKED';
                      const isUnavailable = statusNorm === 'UNAVAILABLE';
                      const isUnused = statusNorm === 'UNUSED_SLOT';
                      const isCancelled = statusNorm === 'CANCELLED';
                      const isPastDate = selectedDate < todayStr;
                      const isPastTime = selectedDate === todayStr && isSlotPastOrBuffer(selectedDate, slot.timeSlot);
                      const isSlotDisabled = isPastDate || isPastTime;

                      // Exact slot date-time calculation for permission enforcement
                      const slotTime = getSlotDateTime(selectedDate, slot.timeSlot);
                      const isFutureSlot = slotTime.getTime() > now.getTime();
                      const isPastBooked = !isFutureSlot && isPastDate && (statusNorm === 'BOOKED' || ['APPROVED', 'PENDING', 'RESCHEDULED'].includes(statusNorm));

                      return (
                        <div 
                          key={index}
                          className={`flex items-center p-4 rounded-2xl border transition-all ${
                            isBooked 
                              ? 'bg-white/3 border-white/5 hover:bg-white/5'
                              : isNoShow
                              ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                              : isCancelled
                              ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                              : isUnused
                              ? 'bg-white/2 border-white/5 opacity-40'
                              : isRequested
                              ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 animate-pulse'
                              : isReserved
                              ? 'bg-blue-500/5 border-blue-500/20 border-dashed'
                              : isBlocked
                              ? 'bg-white/2 border-white/5 opacity-50'
                              : isUnavailable
                              ? 'bg-red-500/5 border-red-500/10 opacity-40 cursor-not-allowed'
                              : isSlotDisabled ? 'bg-gray-700/30 border-gray-600 text-gray-400 cursor-not-allowed' : 'bg-[#0B1220]/40 border-white/5 hover:border-white/15'
                          }`}
                        >
                          {/* Time tag */}
                          <div className="flex items-center space-x-2 w-32 shrink-0">
                            <Clock size={14} className="text-gray-400" />
                            <span className="text-xs font-extrabold text-white">{slot.timeSlot}</span>
                          </div>

                          {/* Status Badge */}
                          <div className="w-28 shrink-0">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              statusNorm === 'BOOKED' || ['APPROVED', 'PENDING', 'RESCHEDULED'].includes(statusNorm)
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                : statusNorm === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : statusNorm === 'CANCELLED'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : statusNorm === 'NO_SHOW'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : statusNorm === 'REQUESTED'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                : statusNorm === 'RESERVED'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : statusNorm === 'BLOCKED'
                                ? 'bg-white/10 text-gray-400 border border-white/5'
                                : statusNorm === 'UNAVAILABLE'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : statusNorm === 'UNUSED_SLOT'
                                ? 'bg-white/5 text-gray-400 border border-white/10'
                                : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            }`}>
                              {statusNorm === 'UNUSED_SLOT' ? 'UNUSED SLOT' : (statusNorm || 'AVAILABLE')}
                            </span>
                          </div>

                          {/* Patient Details & Info */}
                          <div className="flex-1 text-xs text-gray-400 px-4">
                            {(isBooked || isNoShow || isCancelled) && slot.details && (
                              <div className="space-y-0.5">
                                {slot.details.patientId ? (
                                  <span 
                                    onClick={() => {
                                      const pId = slot.details.patientId._id || slot.details.patientId;
                                      router.push(`/dashboard/patients/${pId}`);
                                    }}
                                    className={`font-bold text-sm hover:underline hover:text-[#3B82F6] cursor-pointer transition-colors block w-fit ${isCancelled ? 'text-gray-400 line-through font-normal' : 'text-white'}`}
                                    title="Click to view patient profile"
                                  >
                                    {slot.details.patientName || 'Linked Patient'}
                                  </span>
                                ) : (
                                  <span className={`font-bold text-sm block w-fit ${isCancelled ? 'text-gray-400 line-through' : 'text-white'}`}>
                                    {slot.details.patientName || 'Linked Patient'}
                                  </span>
                                )}
                                <div className="text-[10px] text-gray-500 flex items-center space-x-2 flex-wrap">
                                  <span>Phone: {slot.details.patientPhone}</span>
                                  <span>&bull;</span>
                                  <span className={isCancelled ? 'text-red-400/70 font-semibold' : 'text-emerald-400'}>
                                    {slot.details.treatmentType}
                                  </span>
                                  {isCancelled && slot.details.cancellationReason && (
                                    <>
                                      <span>&bull;</span>
                                      <span className="text-red-400/80">Reason: {slot.details.cancellationReason}</span>
                                    </>
                                  )}
                                </div>
                                {isPastBooked && (
                                  <div className="flex items-center space-x-1.5 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl w-fit mt-1.5 animate-pulse">
                                    <AlertCircle size={12} className="text-amber-500" />
                                    <span className="font-extrabold uppercase tracking-wider text-[9px]">Appointment requires outcome</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {isRequested && slot.details && (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2 flex-wrap">
                                  <span className="font-bold text-white text-sm">
                                    {slot.details.patientName}
                                  </span>
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-[#3B82F6] border border-blue-500/20 uppercase tracking-wider">
                                    Pending Review
                                  </span>
                                </div>
                                <div className="text-[10px] text-gray-500 flex items-center space-x-2">
                                  <span>Phone: {slot.details.patientPhone}</span>
                                  <span>&bull;</span>
                                  <span>Treatment: {slot.details.treatmentType}</span>
                                </div>
                              </div>
                            )}

                            {isReserved && (
                              <div className="flex items-center space-x-2 text-blue-400">
                                <Lock size={12} />
                                <span className="font-bold">Held by checkout session</span>
                              </div>
                            )}

                            {isBlocked && (
                              <div className="flex items-center space-x-2 text-gray-500">
                                <Ban size={12} />
                                <span className="font-bold">Slot Blocked by Doctor</span>
                              </div>
                            )}

                            {isUnavailable && (
                              <div className="flex items-center space-x-2 text-red-400/60">
                                <AlertCircle size={12} />
                                <span className="font-bold">Unavailable</span>
                              </div>
                            )}

                            {isUnused && (
                              <div className="flex items-center space-x-2 text-gray-500">
                                <Clock size={12} />
                                <span className="font-bold">No patient scheduled</span>
                              </div>
                            )}

                            {statusNorm === 'AVAILABLE' && (
                              <button 
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    date: selectedDate,
                                    timeSlot: slot.timeSlot
                                  });
                                  setShowAddForm(true);
                                }}
                                className="flex items-center space-x-1 hover:text-white cursor-pointer font-bold transition-colors text-gray-500"
                              >
                                <Plus size={12} />
                                <span>Schedule patient manual slot</span>
                              </button>
                            )}
                          </div>

                          {/* Quick Actions (Actions buttons) */}
                          <div className="space-x-1.5 flex items-center shrink-0">
                            {(isBooked || isNoShow || isCancelled) && slot.details && (
                              <>
                                {(statusNorm === 'BOOKED' || ['APPROVED', 'PENDING', 'RESCHEDULED'].includes(statusNorm)) && (
                                  <>
                                    {!isFutureSlot && (
                                      <>
                                        <button
                                          onClick={() => startCompletion(slot.details)}
                                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
                                          title="Mark Completed"
                                        >
                                          <Check size={14} />
                                        </button>
                                        <button
                                          onClick={() => handleStatusChange(slot.details._id, 'NO_SHOW')}
                                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 cursor-pointer"
                                          title="Mark No Show"
                                        >
                                          <Ban size={14} />
                                        </button>
                                      </>
                                    )}
                                    
                                    {!isPastDate && (
                                      <button
                                        onClick={() => handleStatusChange(slot.details._id, 'CANCELLED')}
                                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                                        title="Cancel Appointment"
                                      >
                                        <X size={14} />
                                      </button>
                                    )}
                                  </>
                                )}
                                
                                {(statusNorm === 'BOOKED' || ['APPROVED', 'PENDING', 'RESCHEDULED'].includes(statusNorm) || isNoShow) && !isPastDate && (
                                  <button
                                    onClick={() => {
                                      setReschedulingApp(slot.details);
                                      setRescheduleDate(slot.details.date);
                                      setRescheduleTime(slot.details.timeSlot);
                                    }}
                                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                                    title="Reschedule Slot"
                                  >
                                    <ArrowLeftRight size={14} />
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDelete(slot.details._id)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 cursor-pointer"
                                  title="Delete Record"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE MANUAL APPOINTMENT MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="font-extrabold text-base text-white">Schedule Appointment</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-lg bg-white/5 text-gray-400 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Amit Sharma"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Treatment</label>
                  <select
                    value={formData.treatmentType}
                    onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm appearance-none cursor-pointer"
                  >
                    {treatments.map((t) => (
                      <option key={t} value={t} className="bg-[#0B1220] text-white">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Date *</label>
                  <CustomDatePicker
                    value={formData.date}
                    onChange={(val) => setFormData({ ...formData, date: val })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Time Slot</label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm appearance-none cursor-pointer"
                  >
                    {timeSlots.map((ts) => {
                      const disabled = isSlotPastOrBuffer(formData.date, ts);
                      return (
                        <option key={ts} value={ts} disabled={disabled} className="bg-[#0B1220] text-white disabled:text-gray-600">
                          {ts} {disabled ? '(Unavailable)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Clinical Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes for visit..."
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-1 px-5 py-2 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] text-white text-xs font-bold cursor-pointer shadow-md"
                >
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  <span>Schedule visit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {reschedulingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl relative p-6 space-y-4">
            <h3 className="font-extrabold text-base text-white border-b border-white/5 pb-2">
              Reschedule: {reschedulingApp.patientName}
            </h3>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">New Date *</label>
                <CustomDatePicker
                  value={rescheduleDate}
                  onChange={(val) => setRescheduleDate(val)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Preferred Time Slot</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm appearance-none cursor-pointer"
                >
                  {timeSlots.map((ts) => {
                    const disabled = isSlotPastOrBuffer(rescheduleDate, ts);
                    return (
                      <option key={ts} value={ts} disabled={disabled} className="bg-[#0B1220] text-white disabled:text-gray-600">
                        {ts} {disabled ? '(Unavailable)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setReschedulingApp(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] text-white text-xs font-bold cursor-pointer shadow-md"
                >
                  Save Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETION & PAYMENT DETAILS POPUP MODAL */}
      {completingAppointment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="font-extrabold text-base text-white">Record Treatment Completion</h3>
              <button
                onClick={() => setCompletingAppointment(null)}
                className="p-1 rounded-lg bg-white/5 text-gray-400 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-1 bg-white/3 border border-white/5 p-3.5 rounded-xl text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold uppercase">Patient:</span>
                <span className="text-white font-extrabold">{completingAppointment.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold uppercase">Treatment:</span>
                <span className="text-blue-400 font-extrabold">{completingAppointment.treatmentType}</span>
              </div>
              <div className="flex justify-between border-t border-white/5 mt-2 pt-2">
                <span className="text-gray-400 font-bold uppercase">Standard Cost:</span>
                <span className="text-emerald-400 font-black">₹{getTreatmentCost(completingAppointment.treatmentType).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleCompletionSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Amount Paid (₹) *</label>
                <input
                  type="number"
                  min="0"
                  max={getTreatmentCost(completingAppointment.treatmentType)}
                  required
                  value={completionPaidAmount || ''}
                  onChange={(e) => setCompletionPaidAmount(Math.min(getTreatmentCost(completingAppointment.treatmentType), Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                />
                <span className="text-[10px] text-gray-500 block">
                  Pending Amount: ₹{(getTreatmentCost(completingAppointment.treatmentType) - completionPaidAmount).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Payment Method</label>
                <select
                  value={completionPaymentMethod}
                  onChange={(e: any) => setCompletionPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm appearance-none cursor-pointer"
                >
                  <option value="Cash" className="bg-[#0B1220]">Cash</option>
                  <option value="UPI" className="bg-[#0B1220]">UPI</option>
                  <option value="Card" className="bg-[#0B1220]">Card</option>
                  <option value="Bank Transfer" className="bg-[#0B1220]">Bank Transfer</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Clinical / Invoicing Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes about partial payment, next visit expectations, etc..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCompletingAppointment(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCompletion}
                  className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] text-white text-xs font-bold cursor-pointer shadow-md"
                >
                  {submittingCompletion ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  <span>Confirm Completion</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

