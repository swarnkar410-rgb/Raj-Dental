'use client';

import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Calendar, 
  Check, 
  Ban, 
  Loader2, 
  Save, 
  AlertCircle,
  CalendarDays,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../../../utils/api';
import { formatDateToDMY, toISODateString } from '../../../utils/date';
import CustomDatePicker from '../../../components/CustomDatePicker';

interface ShiftError {
  index: number;
  message: string;
}

const parseTimeToMinutes = (timeStr: string): number | null => {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const getDayValidationErrors = (shifts: any[] = []): ShiftError[] => {
  const errors: ShiftError[] = [];
  const parsedShifts = shifts.map((shift, idx) => {
    const startMins = parseTimeToMinutes(shift.startTime);
    const endMins = parseTimeToMinutes(shift.endTime);
    return {
      index: idx,
      startTime: shift.startTime,
      endTime: shift.endTime,
      startMins,
      endMins
    };
  });

  parsedShifts.forEach((shift, idx) => {
    // 1. Missing times
    if (!shift.startTime || !shift.endTime) {
      errors.push({
        index: idx,
        message: 'Start and end times are required.'
      });
      return;
    }

    // 2. Start >= End
    if (shift.startMins !== null && shift.endMins !== null && shift.startMins >= shift.endMins) {
      errors.push({
        index: idx,
        message: 'Start time must be before end time.'
      });
    }

    // Compare with other shifts for duplicates and overlaps
    for (let j = 0; j < parsedShifts.length; j++) {
      if (idx === j) continue;
      const other = parsedShifts[j];
      if (!other.startTime || !other.endTime || other.startMins === null || other.endMins === null) continue;

      if (shift.startMins !== null && shift.endMins !== null) {
        // Duplicate check
        if (shift.startTime === other.startTime && shift.endTime === other.endTime) {
          if (!errors.some(e => e.index === idx && e.message.includes('Duplicate'))) {
            errors.push({
              index: idx,
              message: `Duplicate shift detected with Shift ${j + 1}.`
            });
          }
        }
        // Overlap check
        else if (shift.startMins < other.endMins && shift.endMins > other.startMins) {
          if (!errors.some(e => e.index === idx && e.message.includes('Overlap'))) {
            errors.push({
              index: idx,
              message: `Overlaps with Shift ${j + 1} (${other.startTime} - ${other.endTime}).`
            });
          }
        }
      }
    }
  });

  return errors;
};

export default function AvailabilityPage() {
  const [activeTab, setActiveTab] = useState<'Hours' | 'Leaves' | 'Blocked'>('Hours');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  interface WeekDaySchedule {
    dayOfWeek: string;
    isClosed: boolean;
    shifts: {
      startTime: string;
      endTime: string;
    }[];
  }

  // Availability Settings from API
  const [weekSchedules, setWeekSchedules] = useState<WeekDaySchedule[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);

  // Forms state
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [blockedForm, setBlockedForm] = useState({
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    reason: ''
  });

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/availability');
      if (res.success) {
        const dbSchedules = res.data.schedules || [];
        
        setLeaves(res.data.leaves || []);
        setBlockedSlots(res.data.blocked || []);

        const nextWeekSchedules = weekdays.map((day) => {
          const recSched = dbSchedules.find((s: any) => s.dayOfWeek === day) || { isClosed: true, shifts: [] };
          const recShifts = (recSched.shifts || []).map((s: any) => ({
            startTime: s.startTime,
            endTime: s.endTime
          }));

          return {
            dayOfWeek: day,
            isClosed: recSched.isClosed,
            shifts: recShifts
          };
        });

        setWeekSchedules(nextWeekSchedules);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Shift Management Helpers
  const handleToggleClosed = (index: number) => {
    const next = [...weekSchedules];
    next[index].isClosed = !next[index].isClosed;
    if (!next[index].isClosed && next[index].shifts.length === 0) {
      next[index].shifts = [{ startTime: '09:00', endTime: '17:00' }];
    }
    setWeekSchedules(next);
  };

  const handleAddShift = (dayIndex: number) => {
    const next = [...weekSchedules];
    const dayShifts = next[dayIndex].shifts || [];
    let prefills = { startTime: '', endTime: '' };
    if (dayShifts.length > 0) {
      const lastShift = dayShifts[dayShifts.length - 1];
      if (lastShift.endTime) {
        prefills.startTime = lastShift.endTime;
      }
    }
    next[dayIndex].shifts.push(prefills);
    setWeekSchedules(next);
  };

  const handleShiftTimeChange = (dayIndex: number, shiftIndex: number, field: 'startTime' | 'endTime', value: string) => {
    const next = [...weekSchedules];
    next[dayIndex].shifts[shiftIndex][field] = value;
    setWeekSchedules(next);
  };

  const handleDeleteShift = (dayIndex: number, shiftIndex: number) => {
    const next = [...weekSchedules];
    next[dayIndex].shifts.splice(shiftIndex, 1);
    if (next[dayIndex].shifts.length === 0) {
      next[dayIndex].isClosed = true;
    }
    setWeekSchedules(next);
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const schedulesPayload = weekdays.map(day => {
        const dayData = weekSchedules.find(w => w.dayOfWeek === day);
        if (!dayData) {
          return { dayOfWeek: day, isClosed: true, shifts: [] };
        }
        return {
          dayOfWeek: day,
          isClosed: dayData.isClosed,
          shifts: dayData.shifts.map(s => ({ startTime: s.startTime, endTime: s.endTime }))
        };
      });

      const res = await apiRequest('/availability', {
        method: 'POST',
        body: JSON.stringify({
          schedules: schedulesPayload
        })
      });
      if (res.success) {
        alert('Availability schedule saved successfully!');
        loadSettings();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  // Leaves Management Handlers
  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      alert('Please fill out all leave fields');
      return;
    }

    setSaving(true);
    try {
      const res = await apiRequest('/availability/leave', {
        method: 'POST',
        body: JSON.stringify(leaveForm)
      });
      if (res.success) {
        setLeaveForm({ startDate: '', endDate: '', reason: '' });
        loadSettings();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create leave');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLeave = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave?')) return;
    try {
      const res = await apiRequest(`/availability/leave/${id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        loadSettings();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete leave');
    }
  };

  // Blocked Slots Management Handlers
  const handleAddBlockedSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedForm.date || !blockedForm.startTime || !blockedForm.endTime || !blockedForm.reason) {
      alert('Please fill out all blocked fields');
      return;
    }

    setSaving(true);
    try {
      const res = await apiRequest('/availability/block', {
        method: 'POST',
        body: JSON.stringify(blockedForm)
      });
      if (res.success) {
        setBlockedForm({ date: '', startTime: '09:00', endTime: '10:00', reason: '' });
        loadSettings();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to block slot');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlockedSlot = async (id: string) => {
    if (!confirm('Are you sure you want to unblock this slot?')) return;
    try {
      const res = await apiRequest(`/availability/block/${id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        loadSettings();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete blocked slot');
    }
  };

  const hasValidationErrors = weekSchedules.some(sched => {
    if (sched.isClosed) return false;
    const dayErrors = getDayValidationErrors(sched.shifts || []);
    return dayErrors.length > 0;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Availability Manager</h1>
        <p className="text-xs sm:text-sm text-gray-400">Configure Dr. Manoj's operating shifts, Leaves, Holidays, and blocked slots.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5 space-x-6 text-sm font-bold uppercase tracking-wider">
        {(['Hours', 'Leaves', 'Blocked'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 border-b-2 cursor-pointer transition-all ${
              activeTab === tab 
                ? 'border-[#3B82F6] text-white' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'Hours' ? 'Working Hours' : tab === 'Leaves' ? 'Holidays & Leaves' : 'Blocked Slots'}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="panel-card p-6 md:p-8 rounded-3xl border-white/5">
          <AnimatePresence mode="wait">
            {/* WORKING HOURS CONFIG */}
            {activeTab === 'Hours' && (
              <motion.div
                key="Hours"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div className="text-xs text-gray-400 font-bold uppercase flex items-center space-x-1">
                    <Clock size={14} className="text-[#3B82F6]" />
                    <span>Weekly Working Hours Shifts Scheduler</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {hasValidationErrors && (
                      <div className="flex items-center space-x-1.5 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-xl animate-fadeIn">
                        <AlertCircle size={12} />
                        <span>Please resolve shift errors before saving</span>
                      </div>
                    )}
                    <button
                      onClick={handleSaveSchedule}
                      disabled={saving || hasValidationErrors}
                      className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all ${
                        hasValidationErrors 
                          ? 'bg-gray-500/20 border border-white/5 text-gray-400 cursor-not-allowed shadow-none' 
                          : 'bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:opacity-90 cursor-pointer'
                      }`}
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>Save Weekly Slots</span>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-white/5 space-y-4">
                  {weekSchedules.map((sched, dayIdx) => {
                    return (
                      <div key={sched.dayOfWeek} className="flex flex-col md:flex-row md:items-start justify-between gap-4 py-4 first:pt-0">
                        {/* Day Label & Toggle */}
                        <div className="flex items-center space-x-4 w-48 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleClosed(dayIdx)}
                            className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                              sched.isClosed ? 'bg-white/10 cursor-pointer' : 'bg-emerald-500 cursor-pointer'
                            }`}
                          >
                            <motion.div 
                              layout
                              className="bg-white w-4 h-4 rounded-full shadow-md"
                              animate={{ x: sched.isClosed ? 0 : 24 }}
                            />
                          </button>

                          <div>
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <span className="text-sm font-bold text-white">{sched.dayOfWeek}</span>
                            </div>
                            <span className={`text-[10px] font-extrabold uppercase block mt-0.5 ${sched.isClosed ? 'text-gray-500' : 'text-emerald-400'}`}>
                              {sched.isClosed ? 'Closed' : 'Active'}
                            </span>
                          </div>
                        </div>

                        {/* Shifts Configuration List */}
                        <div className="flex-1 space-y-2">
                          {sched.isClosed ? (
                            <div className="text-xs text-gray-500 font-semibold italic">No operational slots. Clinic is closed on this day.</div>
                          ) : (
                            <div className="flex flex-wrap gap-3 items-start">
                              {sched.shifts?.map((shift: any, shiftIdx: number) => {
                                const dayErrors = getDayValidationErrors(sched.shifts);
                                const currentShiftErrors = dayErrors.filter(e => e.index === shiftIdx);
                                const hasError = currentShiftErrors.length > 0;

                                return (
                                  <div key={shiftIdx} className="flex flex-col gap-1.5">
                                    <div className={`flex items-center space-x-2 bg-white/3 border p-2 rounded-xl text-xs transition-colors ${hasError ? 'border-red-500/50 bg-red-500/5' : 'border-white/5'}`}>
                                      <input
                                        type="time"
                                        value={shift.startTime || ''}
                                        onChange={(e) => handleShiftTimeChange(dayIdx, shiftIdx, 'startTime', e.target.value)}
                                        className="bg-transparent text-white focus:outline-none border-none cursor-pointer"
                                      />
                                      <span className="text-gray-500 font-bold">to</span>
                                      <input
                                        type="time"
                                        value={shift.endTime || ''}
                                        onChange={(e) => handleShiftTimeChange(dayIdx, shiftIdx, 'endTime', e.target.value)}
                                        className="bg-transparent text-white focus:outline-none border-none cursor-pointer"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteShift(dayIdx, shiftIdx)}
                                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                    {hasError && (
                                      <div className="text-[10px] text-red-400 font-semibold max-w-[200px] leading-tight mt-0.5">
                                        {currentShiftErrors.map((err, i) => (
                                          <div key={i} className="flex items-center space-x-1">
                                            <AlertCircle size={10} className="shrink-0" />
                                            <span>{err.message}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              <button
                                type="button"
                                onClick={() => handleAddShift(dayIdx)}
                                className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-xs font-bold cursor-pointer self-start"
                              >
                                <Plus size={10} />
                                <span>Add Shift</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* HOLIDAYS & LEAVES */}
            {activeTab === 'Leaves' && (
              <motion.div
                key="Leaves"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Add Leave Form */}
                <div className="space-y-6 lg:border-r lg:border-white/5 lg:pr-8">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-1">
                    <Calendar size={16} className="text-[#3B82F6]" />
                    <span>Create Leave / Vacation</span>
                  </h3>

                  <form onSubmit={handleAddLeave} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase block">Start Date *</label>
                      <CustomDatePicker
                        value={leaveForm.startDate}
                        onChange={(val) => setLeaveForm({ ...leaveForm, startDate: val })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase block">End Date *</label>
                      <CustomDatePicker
                        value={leaveForm.endDate}
                        onChange={(val) => setLeaveForm({ ...leaveForm, endDate: val })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase block">Reason *</label>
                      <input
                        type="text"
                        required
                        placeholder="Attending Dental Conference"
                        value={leaveForm.reason}
                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b76ca] hover:to-[#5ea0ff] text-white font-bold text-xs tracking-wider uppercase cursor-pointer flex justify-center items-center space-x-1 shadow-md"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      <span>Register Leave</span>
                    </button>
                  </form>
                </div>

                {/* Active Leaves List */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Active Leaves List</h3>

                  {leaves.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs border border-dashed border-white/5 rounded-2xl">
                      No holidays or leave days configured.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {leaves.map((leave) => (
                        <div key={leave._id} className="p-4 rounded-2xl bg-white/3 border border-white/5 flex justify-between items-start">
                          <div className="space-y-1 text-xs">
                            <span className="font-extrabold text-white block text-sm">{leave.reason}</span>
                            <div className="text-[10px] text-gray-500 font-semibold flex items-center space-x-1">
                              <CalendarDays size={12} className="text-[#3B82F6]" />
                              <span>{formatDateToDMY(leave.startDate)} to {formatDateToDMY(leave.endDate)}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteLeave(leave._id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                            title="Cancel Leave"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* BLOCKED SLOTS */}
            {activeTab === 'Blocked' && (
              <motion.div
                key="Blocked"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Add Block Form */}
                <div className="space-y-6 lg:border-r lg:border-white/5 lg:pr-8">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-1">
                    <Ban size={16} className="text-red-400" />
                    <span>Block Slots Range</span>
                  </h3>

                  <form onSubmit={handleAddBlockedSlot} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase block">Target Date *</label>
                      <CustomDatePicker
                        value={blockedForm.date}
                        onChange={(val) => setBlockedForm({ ...blockedForm, date: val })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase block">Start Time *</label>
                        <input
                          type="time"
                          required
                          value={blockedForm.startTime}
                          onChange={(e) => setBlockedForm({ ...blockedForm, startTime: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase block">End Time *</label>
                        <input
                          type="time"
                          required
                          value={blockedForm.endTime}
                          onChange={(e) => setBlockedForm({ ...blockedForm, endTime: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase block">Block Reason *</label>
                      <input
                        type="text"
                        required
                        placeholder="Dental Surgery"
                        value={blockedForm.reason}
                        onChange={(e) => setBlockedForm({ ...blockedForm, reason: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b76ca] hover:to-[#5ea0ff] text-white font-bold text-xs tracking-wider uppercase cursor-pointer flex justify-center items-center space-x-1 shadow-md"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      <span>Lock Timeslot</span>
                    </button>
                  </form>
                </div>

                {/* Blocked Slots List */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Blocked Ranges List</h3>

                  {blockedSlots.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs border border-dashed border-white/5 rounded-2xl">
                      No custom blocked slots configured.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {blockedSlots.map((block) => (
                        <div key={block._id} className="p-4 rounded-2xl bg-white/3 border border-white/5 flex justify-between items-start">
                          <div className="space-y-1 text-xs">
                            <span className="font-extrabold text-white block text-sm">{block.reason}</span>
                            <div className="text-[10px] text-gray-500 font-semibold flex items-center space-x-2">
                              <CalendarDays size={12} className="text-[#3B82F6]" />
                              <span>{formatDateToDMY(block.date)}</span>
                              <span>&bull;</span>
                              <span className="text-red-400">{block.startTime} to {block.endTime}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteBlockedSlot(block._id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                            title="Unblock Slot"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
