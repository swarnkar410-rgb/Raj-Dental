import { Request, Response } from 'express';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { computeSlotsForDate, getKolkataDate } from '../utils/slotHelper';
import { getSessionId } from '../middleware/sessionCookie';

// Lock duration: 10 minutes
const LOCK_DURATION_MS = 10 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/public/slots/reserve
// ─────────────────────────────────────────────────────────────────────────────
// Implements all 4 abuse-prevention layers:
//
//  Layer 1 — Session cookie: one active LOCKED slot per server-issued session
//  Layer 2 — IP abuse: max 3 active locks per IP (family-booking friendly)
//  Layer 3 — Rate limit: applied at the route level (10 req/min/IP)
//  Layer 4 — Atomic DB write: findOneAndUpdate prevents race conditions;
//             TTL index on expiresAt auto-expires locks after 10 minutes
// ─────────────────────────────────────────────────────────────────────────────
export const reserveSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, timeSlot, deviceId, phone } = req.body;

    if (!date || !timeSlot) {
      res.status(400).json({ success: false, message: 'Missing reservation parameters: date and timeSlot are required.' });
      return;
    }

    // Backend validation for booking buffer (60 minutes)
    const appTime = getKolkataDate(date, timeSlot);
    const now = new Date();
    const bufferMs = 60 * 60 * 1000;
    if (appTime.getTime() <= now.getTime() + bufferMs) {
      res.status(400).json({ success: false, message: 'Selected appointment time has already passed.' });
      return;
    }

    // ── Read session from HttpOnly cookie ─────────────────────────────────
    const sid = getSessionId(req);
    if (!sid) {
      res.status(400).json({
        success: false,
        message: 'No booking session found. Please refresh the page and try again.'
      });
      return;
    }

    // ── Resolve client IP (respects X-Forwarded-For when trust proxy is on) ─
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    // ── Check if this session, deviceId, or phone already has an active reservation ──
    const existingLocks = await AvailabilitySlot.find({
      status: 'RESERVED',
      expiresAt: { $gt: new Date() },
      $or: [
        { reservedBySession: sid },
        ...(deviceId ? [{ deviceId }] : []),
        ...(phone ? [{ phone }] : [])
      ]
    });

    if (existingLocks.length > 0) {
      const matchingLock = existingLocks.find(lock => lock.date === date && lock.timeSlot === timeSlot);
      if (matchingLock) {
        // Idempotent: update deviceId and phone if they are new, then return success
        let updated = false;
        if (deviceId && matchingLock.deviceId !== deviceId) {
          matchingLock.deviceId = deviceId;
          updated = true;
        }
        if (phone && matchingLock.phone !== phone) {
          matchingLock.phone = phone;
          updated = true;
        }
        if (updated) {
          await matchingLock.save();
        }
        res.status(200).json({
          success: true,
          message: 'Slot already reserved for your session/device.',
          data: matchingLock
        });
        return;
      }

      // Auto-release any reservation belonging to the same session or deviceId
      for (const lock of existingLocks) {
        const isOwnLock = lock.reservedBySession === sid || (deviceId && lock.deviceId === deviceId);
        if (isOwnLock) {
          if (!lock.appointmentRequestId && !lock.appointmentId) {
            await AvailabilitySlot.findByIdAndDelete(lock._id);
          } else {
            lock.status = 'AVAILABLE';
            lock.reservedAt = null;
            lock.expiresAt = null;
            lock.reservedBySession = null;
            lock.deviceId = null;
            lock.phone = null;
            lock.ipAddress = null;
            await lock.save();
          }
        } else {
          // This lock belongs to the phone number but a different device/session
          res.status(409).json({
            success: false,
            code: 'PHONE_RESERVATION_CONFLICT',
            message: 'This phone number already has an active reservation on another device.'
          });
          return;
        }
      }
    }

    // ── LAYER 2: Max 3 active locks per IP ───────────────────────────────
    const ipLockCount = await AvailabilitySlot.countDocuments({
      ipAddress: clientIp,
      status: 'RESERVED'
    });

    if (ipLockCount >= 3) {
      res.status(429).json({
        success: false,
        message: 'You have reached the maximum temporary reservations for this network. Please complete an existing booking or wait for a reservation to expire.'
      });
      return;
    }

    // ── LAYER 4: Atomic DB lock ───────────────────────────────────────────
    // Compute expiry timestamp
    const expiresAt = new Date(Date.now() + LOCK_DURATION_MS);

    // Check if a slot record already exists for (date, timeSlot)
    const existingSlot = await AvailabilitySlot.findOne({ date, timeSlot });

    if (!existingSlot) {
      // No record yet — verify the slot is scheduleable per clinic hours
      const generated = await computeSlotsForDate(date);
      const isFree = generated.some(s => s.timeSlot === timeSlot && s.status === 'AVAILABLE');

      if (!isFree) {
        res.status(409).json({ success: false, message: 'This slot is not available. Please select another time.' });
        return;
      }

      try {
        // Create-and-lock in one write
        const slot = await AvailabilitySlot.create({
          date,
          timeSlot,
          status: 'RESERVED',
          reservedAt: new Date(),
          expiresAt,
          reservedBySession: sid,
          ipAddress: clientIp,
          deviceId: deviceId || null,
          phone: phone || null
        });

        res.status(200).json({ success: true, message: 'Slot reserved successfully.', data: slot });
        return;
      } catch (err: any) {
        // Duplicate key — another request created the record at the same instant
        if (err.code === 11000) {
          res.status(409).json({ success: false, message: 'This slot was just taken. Please select another time.' });
          return;
        }
        throw err;
      }
    }

    // Record exists — attempt atomic upgrade to RESERVED.
    // Only succeeds if slot is currently AVAILABLE (or the lock has expired in DB
    // before TTL cleanup runs, which the $or handles).
    const locked = await AvailabilitySlot.findOneAndUpdate(
      {
        date,
        timeSlot,
        $or: [
          { status: 'AVAILABLE' },
          // Catch edge case: status still shows RESERVED but expiresAt has passed
          // (TTL cleanup runs every ~60s, so there's a small window)
          { status: 'RESERVED', expiresAt: { $lt: new Date() } }
        ]
      },
      {
        $set: {
          status: 'RESERVED',
          reservedAt: new Date(),
          expiresAt,
          reservedBySession: sid,
          ipAddress: clientIp,
          deviceId: deviceId || null,
          phone: phone || null
        }
      },
      { new: true }
    );

    if (!locked) {
      res.status(409).json({
        success: false,
        message: 'This slot has already been booked. Please choose a different time.'
      });
      return;
    }

    res.status(200).json({ success: true, message: 'Slot reserved successfully.', data: locked });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/public/slots/active-reservation
// ─────────────────────────────────────────────────────────────────────────────
export const getActiveReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId, phone } = req.query;

    if (!deviceId && !phone) {
      res.status(200).json({ success: true, data: null });
      return;
    }

    const query: any = {
      status: 'RESERVED',
      expiresAt: { $gt: new Date() }
    };

    if (deviceId && phone) {
      query.$or = [{ deviceId }, { phone }];
    } else if (deviceId) {
      query.deviceId = deviceId;
    } else if (phone) {
      query.phone = phone;
    }

    const slot = await AvailabilitySlot.findOne(query);

    if (!slot) {
      res.status(200).json({ success: true, data: null });
      return;
    }

    const timeLeft = Math.max(0, Math.floor((slot.expiresAt!.getTime() - Date.now()) / 1000));

    res.status(200).json({
      success: true,
      data: {
        id: slot._id,
        date: slot.date,
        timeSlot: slot.timeSlot,
        deviceId: slot.deviceId,
        phone: slot.phone,
        expiresAt: slot.expiresAt,
        timeLeft
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/public/slots/associate-phone
// ─────────────────────────────────────────────────────────────────────────────
export const associatePhoneToReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, timeSlot, deviceId, phone } = req.body;

    if (!date || !timeSlot || !deviceId || !phone) {
      res.status(400).json({ success: false, message: 'Missing parameters: date, timeSlot, deviceId, and phone are required.' });
      return;
    }

    // Check if the phone number already has an active reservation on a DIFFERENT slot
    const phoneConflict = await AvailabilitySlot.findOne({
      phone,
      status: 'RESERVED',
      expiresAt: { $gt: new Date() },
      $or: [
        { date: { $ne: date } },
        { timeSlot: { $ne: timeSlot } }
      ]
    });

    if (phoneConflict) {
      res.status(409).json({
        success: false,
        code: 'PHONE_RESERVATION_CONFLICT',
        message: 'This phone number already has an active reservation on another slot.'
      });
      return;
    }

    // Find the slot reserved by the device/session
    const sid = getSessionId(req);
    const slot = await AvailabilitySlot.findOne({
      date,
      timeSlot,
      status: 'RESERVED',
      $or: [
        { deviceId },
        ...(sid ? [{ reservedBySession: sid }] : [])
      ]
    });

    if (!slot) {
      res.status(404).json({ success: false, message: 'No active reservation found for this slot and device.' });
      return;
    }

    // Associate the phone
    slot.phone = phone;
    if (deviceId) slot.deviceId = deviceId;
    if (sid) slot.reservedBySession = sid;
    await slot.save();

    res.status(200).json({ success: true, message: 'Phone associated successfully.', data: slot });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/public/slots/release
// ─────────────────────────────────────────────────────────────────────────────
export const releaseSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, timeSlot, deviceId, phone } = req.body;
    const sid = getSessionId(req);

    if (!date || !timeSlot) {
      res.status(200).json({ success: true, message: 'No active reservation to release.' });
      return;
    }

    const slot = await AvailabilitySlot.findOne({
      date,
      timeSlot,
      status: 'RESERVED',
      $or: [
        ...(sid ? [{ reservedBySession: sid }] : []),
        ...(deviceId ? [{ deviceId }] : []),
        ...(phone ? [{ phone }] : [])
      ]
    });

    if (slot) {
      if (!slot.appointmentRequestId && !slot.appointmentId) {
        // No downstream references — remove the document entirely
        await AvailabilitySlot.findByIdAndDelete(slot._id);
      } else {
        // Has references — reset to AVAILABLE, clear lock fields
        slot.status = 'AVAILABLE';
        slot.reservedAt = null;
        slot.expiresAt = null;
        slot.reservedBySession = null;
        slot.ipAddress = null;
        slot.deviceId = null;
        slot.phone = null;
        await slot.save();
      }
    }

    res.status(200).json({ success: true, message: 'Slot released successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility: clean expired reservations
// ─────────────────────────────────────────────────────────────────────────────
export const cleanExpiredReservations = async (): Promise<void> => {
  const now = new Date();

  // Delete ephemeral RESERVED docs with no references whose TTL has passed
  await AvailabilitySlot.deleteMany({
    status: 'RESERVED',
    expiresAt: { $lt: now },
    appointmentRequestId: null,
    appointmentId: null
  });

  // Reset any that somehow still exist with references
  await AvailabilitySlot.updateMany(
    { status: 'RESERVED', expiresAt: { $lt: now } },
    {
      $set: {
        status: 'AVAILABLE',
        reservedAt: null,
        expiresAt: null,
        reservedBySession: null,
        ipAddress: null,
        deviceId: null,
        phone: null
      }
    }
  );
};
