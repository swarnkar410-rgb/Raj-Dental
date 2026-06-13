import { RecurringSchedule } from '../models/RecurringSchedule';
import { DoctorLeave } from '../models/DoctorLeave';
import { BlockedSlot } from '../models/BlockedSlot';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { Appointment } from '../models/Appointment';
import { DateOverride } from '../models/DateOverride';

// Time conversion utilities
export const timeToMinutes = (time24: string): number => {
  const [hours, minutes] = time24.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime24 = (mins: number): string => {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const time24ToAMPM = (time24: string): string => {
  let [hours, minutes] = time24.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minStr = String(minutes).padStart(2, '0');
  const hrStr = String(hours).padStart(2, '0');
  return `${hrStr}:${minStr} ${ampm}`;
};

export const timeAMPMTo24 = (ampmStr: string): string => {
  const match = ampmStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "09:00";
  let [_, hr, min, ampm] = match;
  let hours = parseInt(hr);
  const minutes = parseInt(min);
  
  if (ampm.toUpperCase() === 'PM' && hours < 12) {
    hours += 12;
  }
  if (ampm.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export interface ComputedSlot {
  timeSlot: string; // "10:30 AM" format
  time24: string;   // "10:30" format
  status: 'AVAILABLE' | 'RESERVED' | 'REQUESTED' | 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'BLOCKED' | 'UNAVAILABLE' | 'UNUSED_SLOT' | 'NO_SHOW';
  reservedAt?: Date | null;
  reservedBySession?: string | null;
  details?: any;
}

export const getKolkataDate = (dateStr: string, timeSlotStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const time24 = timeAMPMTo24(timeSlotStr);
  const [hours, minutes] = time24.split(':').map(Number);
  
  // Construct UTC timestamp matching Asia/Kolkata timezone offset (UTC+5:30)
  const localUTC = Date.UTC(year, month - 1, day, hours, minutes, 0);
  return new Date(localUTC - 330 * 60 * 1000);
};

/**
 * Computes all calendar slots for a given date by reading weekly shifts,
 * removing leaves/blocked intervals, and merging database slot overrides.
 */
export const computeSlotsForDate = async (dateStr: string, view?: string): Promise<ComputedSlot[]> => {
  // 1. Check for Active leaves/holidays
  const activeLeave = await DoctorLeave.findOne({
    startDate: { $lte: dateStr },
    endDate: { $gte: dateStr },
    isActive: true
  });
  if (activeLeave) {
    return []; // Leave day has no slots at all
  }

  // 2. Determine Day of Week and fetch Recurring Schedule & Date Overrides
  const dateObj = new Date(dateStr);
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = weekdays[dateObj.getDay()];

  const schedule = await RecurringSchedule.findOne({ dayOfWeek: dayName });
  const recurringShifts = (schedule && !schedule.isClosed) ? (schedule.shifts || []) : [];

  const dateOverride = await DateOverride.findOne({ date: dateStr });
  const overrideShifts = dateOverride ? (dateOverride.shifts || []) : [];

  const combinedShifts = [...recurringShifts, ...overrideShifts];
  if (combinedShifts.length === 0) {
    return []; // Closed day with no overrides
  }

  // 3. Generate base 30-minute slots from combined shifts
  const baseSlots: { time24: string; timeSlot: string }[] = [];
  const addedTimes = new Set<string>();

  for (const shift of combinedShifts) {
    const startMins = timeToMinutes(shift.startTime);
    const endMins = timeToMinutes(shift.endTime);
    
    for (let mins = startMins; mins < endMins; mins += 30) {
      const t24 = minutesToTime24(mins);
      if (!addedTimes.has(t24)) {
        addedTimes.add(t24);
        baseSlots.push({
          time24: t24,
          timeSlot: time24ToAMPM(t24)
        });
      }
    }
  }

  baseSlots.sort((a, b) => timeToMinutes(a.time24) - timeToMinutes(b.time24));

  // 4. Retrieve Blocked Slots for this date
  const blockedEntries = await BlockedSlot.find({ date: dateStr });
  
  // 5. Retrieve existing Database slot statuses
  const dbSlots = await AvailabilitySlot.find({ date: dateStr })
    .populate('appointmentRequestId')
    .populate('appointmentId');

  const dbSlotsMap = new Map<string, any>();
  dbSlots.forEach(slot => {
    // Standardize key by normalizing time slot representation
    dbSlotsMap.set(slot.timeSlot, slot);
  });

  const appointmentsMap = new Map<string, any[]>();
  if (view === 'doctor') {
    const appointmentsForDate = await Appointment.find({ date: dateStr });
    appointmentsForDate.forEach(app => {
      const list = appointmentsMap.get(app.timeSlot) || [];
      list.push(app);
      appointmentsMap.set(app.timeSlot, list);
    });
  }

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const now = new Date();
  const bookingBufferMs = 60 * 60 * 1000; // 60 minutes notice buffer

  // 6. Map and filter base slots to compute their statuses
  const computed: ComputedSlot[] = baseSlots.map(base => {
    let status: ComputedSlot['status'] = 'AVAILABLE';
    let reservedAt: Date | null = null;
    let reservedBySession: string | null = null;
    let details: any = null;

    // A. Check if blocked by doctor custom block rules
    const baseMins = timeToMinutes(base.time24);
    const isBlocked = blockedEntries.some(block => {
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      return baseMins >= blockStart && baseMins < blockEnd;
    });

    if (isBlocked) {
      status = 'BLOCKED';
    }

    // B. Check if database has override records
    // Check both 24h key and AM/PM key to be safe
    const dbOverride = dbSlotsMap.get(base.timeSlot) || dbSlotsMap.get(base.time24);

    if (dbOverride) {
      let overrideStatus: string = dbOverride.status;

      // Handle lock timeout expiration for RESERVED slots
      if (overrideStatus === 'RESERVED' && dbOverride.reservedAt) {
        const resTime = new Date(dbOverride.reservedAt);
        if (resTime < tenMinutesAgo) {
          overrideStatus = 'AVAILABLE';
        } else {
          reservedAt = dbOverride.reservedAt;
          reservedBySession = dbOverride.reservedBySession;
        }
      }

      // If it is blocked in db or has a booked status, override
      if (overrideStatus !== 'AVAILABLE' && status !== 'BLOCKED') {
        status = (overrideStatus === 'CONFIRMED' ? 'REQUESTED' : overrideStatus) as ComputedSlot['status'];
        details = dbOverride.appointmentId || dbOverride.appointmentRequestId || null;
      }
    }

    if (view === 'doctor') {
      const slotApps = appointmentsMap.get(base.timeSlot) || appointmentsMap.get(base.time24) || [];
      const activeApp = slotApps.find(app => ['BOOKED', 'COMPLETED'].includes(app.status));
      const terminalApp = activeApp || slotApps.find(app => ['NO_SHOW', 'CANCELLED'].includes(app.status));

      if (terminalApp) {
        if (status !== 'BLOCKED') {
          status = terminalApp.status as ComputedSlot['status'];
          details = terminalApp;
        }
      }

      // If the slot is in the past and still AVAILABLE, mark as UNUSED_SLOT
      if (status === 'AVAILABLE') {
        const slotDate = getKolkataDate(dateStr, base.timeSlot);
        if (slotDate.getTime() <= now.getTime()) {
          status = 'UNUSED_SLOT';
        }
      }
    } else {
      // C. Past Date and Booking Buffer check (60 mins notice buffer)
      const slotDate = getKolkataDate(dateStr, base.timeSlot);
      if (slotDate.getTime() <= now.getTime() + bookingBufferMs) {
        if (status !== 'BOOKED' && status !== 'RESERVED' && status !== 'REQUESTED' && status !== 'COMPLETED' && status !== 'BLOCKED') {
          status = 'UNAVAILABLE';
        }
      }
    }

    return {
      timeSlot: base.timeSlot,
      time24: base.time24,
      status,
      reservedAt,
      reservedBySession,
      details
    };
  });

  return computed;
};
