import { Request, Response } from 'express';
import { RecurringSchedule } from '../models/RecurringSchedule';
import { DoctorLeave } from '../models/DoctorLeave';
import { BlockedSlot } from '../models/BlockedSlot';
import { DateOverride } from '../models/DateOverride';
import { computeSlotsForDate } from '../utils/slotHelper';
import { AuditLog } from '../models/AuditLog';
import { cleanExpiredReservations } from './slotReservationController';

// Fetch all scheduling configurations
export const getAvailabilitySettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { weekStart } = req.query;
    const schedules = await RecurringSchedule.find().sort({ dayOfWeek: 1 });
    const leaves = await DoctorLeave.find({ isActive: true }).sort({ startDate: 1 });
    const blocked = await BlockedSlot.find().sort({ date: 1, startTime: 1 });

    let dateOverrides: any[] = [];
    if (weekStart && typeof weekStart === 'string') {
      const startDate = new Date(weekStart);
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
      }
      dateOverrides = await DateOverride.find({ date: { $in: dates } });
    }

    res.status(200).json({
      success: true,
      data: { schedules, leaves, blocked, dateOverrides }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create or update working schedule rules
export const saveRecurringSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schedules, dateOverrides } = req.body;
    
    const updatedSchedules = [];
    if (schedules && Array.isArray(schedules)) {
      for (const item of schedules) {
        const { dayOfWeek, isClosed, shifts } = item;
        const doc = await RecurringSchedule.findOneAndUpdate(
          { dayOfWeek },
          { isClosed, shifts: shifts || [] },
          { new: true, upsert: true }
        );
        updatedSchedules.push(doc);
      }
    }

    const updatedOverrides = [];
    if (dateOverrides && Array.isArray(dateOverrides)) {
      for (const item of dateOverrides) {
        const { date, isClosed, shifts } = item;
        if ((!shifts || shifts.length === 0) && !isClosed) {
          await DateOverride.findOneAndDelete({ date });
        } else {
          const doc = await DateOverride.findOneAndUpdate(
            { date },
            { isClosed, shifts: shifts || [] },
            { new: true, upsert: true }
          );
          updatedOverrides.push(doc);
        }
      }
    }

    await AuditLog.create({
      action: 'AVAILABILITY_SCHEDULE_SAVED',
      details: 'Updated weekly working schedule rules and date-specific overrides'
    });

    res.status(200).json({
      success: true,
      data: {
        schedules: updatedSchedules,
        dateOverrides: updatedOverrides
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add Leave Range
export const createLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      res.status(400).json({ success: false, message: 'Missing leave details' });
      return;
    }

    const leave = await DoctorLeave.create({ startDate, endDate, reason });
    
    await AuditLog.create({
      action: 'AVAILABILITY_LEAVE_CREATED',
      details: `Created doctor leave from ${startDate} to ${endDate} for: ${reason}`
    });

    res.status(201).json({ success: true, data: leave });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel/Delete Leave Range
export const deleteLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const leave = await DoctorLeave.findByIdAndDelete(req.params.id);
    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave record not found' });
      return;
    }

    await AuditLog.create({
      action: 'AVAILABILITY_LEAVE_DELETED',
      details: `Deleted doctor leave for range ${leave.startDate} to ${leave.endDate}`
    });

    res.status(200).json({ success: true, message: 'Leave deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create custom Blocked Slot range
export const createBlockedSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, startTime, endTime, reason } = req.body;

    if (!date || !startTime || !endTime || !reason) {
      res.status(400).json({ success: false, message: 'Missing blocked slot details' });
      return;
    }

    const block = await BlockedSlot.create({ date, startTime, endTime, reason });

    await AuditLog.create({
      action: 'AVAILABILITY_BLOCKED_CREATED',
      details: `Blocked slots on ${date} from ${startTime} to ${endTime} for: ${reason}`
    });

    res.status(201).json({ success: true, data: block });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Blocked Slot
export const deleteBlockedSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const block = await BlockedSlot.findByIdAndDelete(req.params.id);
    if (!block) {
      res.status(404).json({ success: false, message: 'Blocked slot not found' });
      return;
    }

    await AuditLog.create({
      action: 'AVAILABILITY_BLOCKED_DELETED',
      details: `Removed blocked slots on ${block.date} from ${block.startTime} to ${block.endTime}`
    });

    res.status(200).json({ success: true, message: 'Blocked slot removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Compute dynamic availability slots for a target date (Website & PMS consume this)
export const getSlotsForDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, view } = req.query;
    if (!date || typeof date !== 'string') {
      res.status(400).json({ success: false, message: 'Date parameter is required (format: YYYY-MM-DD)' });
      return;
    }

    // Clean expired reservations prior to computing slots
    await cleanExpiredReservations();

    const slots = await computeSlotsForDate(date, view as string);
    res.status(200).json({ success: true, data: slots });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
