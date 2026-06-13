import { Request, Response } from 'express';
import { Appointment } from '../models/Appointment';
import { Patient } from '../models/Patient';
import { Notification } from '../models/Notification';
import { MedicalHistory } from '../models/MedicalHistory';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { AppointmentRequest } from '../models/AppointmentRequest';
import { DoctorLeave } from '../models/DoctorLeave';
import { getKolkataDate } from '../utils/slotHelper';
import { getSessionId, issueSessionCookie } from '../middleware/sessionCookie';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/public/session
// ─────────────────────────────────────────────────────────────────────────────
// Call on page load to ensure the patient has a server-issued session cookie.
// Idempotent — returns the existing sid if already set, issues a new one if not.
// ─────────────────────────────────────────────────────────────────────────────
export const initSession = (req: Request, res: Response): void => {
  const sid = issueSessionCookie(req, res);
  res.status(200).json({ success: true, message: 'Session ready.', sessionReady: true, sessionId: sid });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/public/book-appointment
// ─────────────────────────────────────────────────────────────────────────────
// Confirms an appointment request.
// Reads session from HttpOnly cookie — no sessionId in request body.
// Verifies the chosen slot is RESERVED by this session, then transitions
// it to CONFIRMED (sets expiresAt = null to prevent TTL auto-deletion).
// ─────────────────────────────────────────────────────────────────────────────
export const bookAppointmentPublic = async (req: Request, res: Response): Promise<void> => {
  try {
    let name = req.body.name;
    let phone = req.body.phone;
    let email = req.body.email;
    let message = req.body.message;
    const { treatment, preferredDate, preferredTime, deviceId } = req.body;

    if (!name || !phone || !treatment || !preferredDate || !preferredTime) {
      res.status(400).json({ success: false, message: 'Missing required appointment fields.' });
      return;
    }

    // 1. Validate & Sanitize Name
    let cleanName = (name || '').trim().replace(/\s+/g, ' ');
    if (cleanName.length < 2 || cleanName.length > 60) {
      res.status(400).json({ success: false, message: 'Full name must be between 2 and 60 characters.' });
      return;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(cleanName)) {
      res.status(400).json({ success: false, message: 'Full name can only contain letters, spaces, apostrophes, and hyphens.' });
      return;
    }
    const alphaCount = (cleanName.match(/[a-zA-Z]/g) || []).length;
    if (alphaCount < 2) {
      res.status(400).json({ success: false, message: 'Full name must contain at least 2 letters.' });
      return;
    }
    const placeholderWords = ['test', 'asdf', 'placeholder', 'admin', 'qwerty', 'guest', 'user', 'patient', 'doctor', 'clinic', 'dentist', 'first name', 'last name', 'none', 'unknown', 'null', 'undefined', 'anonymous', 'no name', 'nothing', 'dummy'];
    const nameWords = cleanName.toLowerCase().split(/[\s'-]+/);
    if (nameWords.some((w: string) => placeholderWords.includes(w))) {
      res.status(400).json({ success: false, message: 'Please enter a valid, real full name.' });
      return;
    }
    if (/(.)\1\1/.test(cleanName.toLowerCase())) {
      res.status(400).json({ success: false, message: 'Please enter a valid full name. Repeating character sequences are not allowed.' });
      return;
    }
    // Auto-capitalize name
    const capitalizeName = (str: string): string => {
      return str
        .toLowerCase()
        .split(' ')
        .map(word => {
          return word
            .split('-')
            .map(subWord => {
              return subWord
                .split("'")
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join("'");
            })
            .join('-');
        })
        .join(' ');
    };
    name = capitalizeName(cleanName);

    // 2. Validate & Sanitize Phone Number
    let cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      res.status(400).json({ success: false, message: 'Phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.' });
      return;
    }
    if (/^(\d)\1{9}$/.test(cleanPhone)) {
      res.status(400).json({ success: false, message: 'Please enter a valid mobile number. Identical digit sequences are not allowed.' });
      return;
    }
    const sequentialPhones = ['1234567890', '0123456789', '9876543210', '0987654321'];
    if (sequentialPhones.includes(cleanPhone)) {
      res.status(400).json({ success: false, message: 'Please enter a valid, active mobile number.' });
      return;
    }
    phone = cleanPhone;

    // 3. Validate & Sanitize Email (Optional)
    let cleanEmail = '';
    if (email) {
      cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
        return;
      }
    }
    email = cleanEmail;

    // 4. Validate Treatment
    const allowedTreatments = [
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
    if (!allowedTreatments.includes(treatment)) {
      res.status(400).json({ success: false, message: 'Please select a valid treatment from the clinic catalog.' });
      return;
    }

    // 5. Validate Preferred Date & Time Slot
    const getKolkataTodayString = (): string => {
      const now = new Date();
      const kolkataTime = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000);
      const year = kolkataTime.getFullYear();
      const month = String(kolkataTime.getMonth() + 1).padStart(2, '0');
      const day = String(kolkataTime.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const todayStr = getKolkataTodayString();
    if (preferredDate < todayStr) {
      res.status(400).json({ success: false, message: 'Appointments cannot be booked for past dates.' });
      return;
    }

    const activeLeave = await DoctorLeave.findOne({
      startDate: { $lte: preferredDate },
      endDate: { $gte: preferredDate },
      isActive: true
    });
    if (activeLeave) {
      res.status(400).json({ success: false, message: `The clinic is closed on this date: ${activeLeave.reason}` });
      return;
    }

    if (preferredDate === todayStr) {
      const slotDate = getKolkataDate(preferredDate, preferredTime);
      const now = new Date();
      const bookingBufferMs = 60 * 60 * 1000; // 60 minutes notice buffer
      if (slotDate.getTime() <= now.getTime() + bookingBufferMs) {
        res.status(400).json({
          success: false,
          message: 'This slot has expired or is no longer bookable. Public bookings require 1 hour lead time.'
        });
        return;
      }
    }

    // 6. Validate Message (Optional)
    let cleanMessage = (message || '').trim().replace(/<[^>]*>/g, '');
    if (cleanMessage.length > 500) {
      res.status(400).json({ success: false, message: 'Message cannot exceed 500 characters.' });
      return;
    }
    message = cleanMessage;

    // 7. Spam Protection Cooldown check (5 minutes per phone number)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentRequest = await AppointmentRequest.findOne({
      patientPhone: phone,
      createdAt: { $gte: fiveMinsAgo }
    });
    if (recentRequest) {
      res.status(429).json({
        success: false,
        message: 'You have recently requested an appointment. Please wait 5 minutes before submitting another request.'
      });
      return;
    }

    // 8. Prevent duplicate active bookings for the same phone/date/slot
    const existingRequest = await AppointmentRequest.findOne({
      patientPhone: phone,
      date: preferredDate,
      timeSlot: preferredTime,
      status: { $in: ['pending', 'approved', 'rescheduled', 'PENDING_REVIEW', 'APPROVED', 'RESCHEDULE_REQUESTED'] }
    });
    if (existingRequest) {
      res.status(409).json({
        success: false,
        message: 'You already have an active appointment request for this date and time slot.'
      });
      return;
    }

    const existingAppointment = await Appointment.findOne({
      patientPhone: phone,
      date: preferredDate,
      timeSlot: preferredTime,
      status: { $in: ['BOOKED', 'approved', 'rescheduled', 'pending'] }
    });
    if (existingAppointment) {
      res.status(409).json({
        success: false,
        message: 'You already have a booked appointment for this date and time slot.'
      });
      return;
    }

    // Read session from HttpOnly cookie
    const sid = getSessionId(req);
    if (!sid) {
      res.status(400).json({
        success: false,
        message: 'No booking session found. Please refresh the page and try again.'
      });
      return;
    }

    // Verify a RESERVED slot exists for this session, deviceId, or phone
    const lockedSlot = await AvailabilitySlot.findOne({
      date: preferredDate,
      timeSlot: preferredTime,
      status: 'RESERVED',
      $or: [
        { reservedBySession: sid },
        ...(deviceId ? [{ deviceId }] : []),
        { phone }
      ]
    });

    if (!lockedSlot) {
      res.status(400).json({
        success: false,
        message: 'Your slot reservation has expired or is invalid. Please select a time slot again.'
      });
      return;
    }

    // Double Booking check prior to booking request creation
    const targetDoctorId = 'default-doctor';
    const conflict = await Appointment.findOne({
      doctorId: targetDoctorId,
      date: preferredDate,
      timeSlot: preferredTime,
      status: { $in: ['BOOKED', 'approved', 'rescheduled', 'pending'] }
    });

    if (conflict) {
      res.status(409).json({ success: false, message: 'This appointment slot is already booked.' });
      return;
    }

    // Create the official appointment request record
    const request = await AppointmentRequest.create({
      patientName: name,
      patientPhone: phone,
      patientEmail: email || '',
      treatmentType: treatment,
      date: preferredDate,
      timeSlot: preferredTime,
      notes: message || '',
      status: 'PENDING_REVIEW'
    });

    // Transition slot: RESERVED → CONFIRMED
    // Crucially: set expiresAt = null so MongoDB TTL does NOT auto-delete this document.
    lockedSlot.status = 'CONFIRMED';
    lockedSlot.expiresAt = null;
    lockedSlot.appointmentRequestId = request._id as any;
    await lockedSlot.save();

    // Find or create patient lead record
    let patient = await Patient.findOne({ phone });
    if (!patient) {
      const count = await Patient.countDocuments();
      const nextNum = String(count + 1).padStart(4, '0');
      const patientId = `RD-${new Date().getFullYear()}-${nextNum}`;

      patient = await Patient.create({
        patientId,
        name,
        phone,
        email: email || '',
        dob: null,
        gender: null,
        medicalHistory: [],
        allergies: [],
        registrationStatus: 'incomplete',
        leadSource: 'website',
        requestedTreatment: treatment,
        requestedDate: preferredDate,
        requestedTime: preferredTime,
        notes: 'Registered automatically via website booking request.'
      });

      await MedicalHistory.create({
        patientId: patient._id,
        teethState: {}
      });
    }

    // Create doctor notification
    await Notification.create({
      type: 'appointment_request',
      title: 'New Online Booking Request',
      message: `${name} has requested an appointment for ${treatment} on ${preferredDate} at ${preferredTime}.`,
      appointmentRequestId: request._id,
      status: 'new'
    });

    res.status(201).json({
      success: true,
      message: 'Appointment request received successfully.',
      data: request
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/public/notifications    (doctor-facing, protected)
// ─────────────────────────────────────────────────────────────────────────────
export const listNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(30);
    res.status(200).json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/public/notifications/:id/read    (doctor-facing, protected)
// ─────────────────────────────────────────────────────────────────────────────
export const markNotificationRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }
    res.status(200).json({ success: true, data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/public/patients/check-status
// ─────────────────────────────────────────────────────────────────────────────
export const checkPatientStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.query;
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required.' });
      return;
    }

    let cleanPhone = (phone as string).replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    // 1. Check for pending request under review
    const pendingRequest = await AppointmentRequest.findOne({
      patientPhone: cleanPhone,
      status: { $in: ['PENDING_REVIEW', 'pending'] }
    });

    // 2. Check for recent appointment submission cooldown (5 minutes)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentRequest = await AppointmentRequest.findOne({
      patientPhone: cleanPhone,
      createdAt: { $gte: fiveMinsAgo }
    }).sort({ createdAt: -1 });

    let cooldownLeft = 0;
    if (recentRequest) {
      const elapsedMs = Date.now() - recentRequest.createdAt.getTime();
      cooldownLeft = Math.max(0, Math.ceil((5 * 60 * 1000 - elapsedMs) / 1000));
    }

    res.status(200).json({
      success: true,
      pendingRequest: pendingRequest ? {
        date: pendingRequest.date,
        timeSlot: pendingRequest.timeSlot
      } : null,
      cooldownLeft: cooldownLeft > 0 ? cooldownLeft : null
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
