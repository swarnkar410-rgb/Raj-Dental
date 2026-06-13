import { Request, Response } from 'express';
import { Appointment } from '../models/Appointment';
import { Patient } from '../models/Patient';
import { AuditLog } from '../models/AuditLog';
import { Notification } from '../models/Notification';
import { Treatment } from '../models/Treatment';
import { Invoice } from '../models/Invoice';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { AppointmentRequest } from '../models/AppointmentRequest';
import { Payment } from '../models/Payment';
import { MedicalHistory } from '../models/MedicalHistory';
import { getKolkataDate } from '../utils/slotHelper';
import { sendWhatsAppNotification } from '../utils/whatsappHelper';

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


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/appointments/requests
// Returns all appointment requests sorted by date descending.
// Optional query param: ?status=pending (filters by status)
// ─────────────────────────────────────────────────────────────────────────────
export const listAppointmentRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) {
      if (status === 'pending') {
        filter.status = { $in: ['pending', 'PENDING_REVIEW'] };
      } else {
        filter.status = status;
      }
    }

    const requests = await AppointmentRequest.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/appointments/requests/pending-count
// Returns the count of pending appointment requests only.
// Used by the notification badge — count = actionable requests only.
// ─────────────────────────────────────────────────────────────────────────────
export const getPendingRequestsCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await AppointmentRequest.countDocuments({ status: { $in: ['pending', 'PENDING_REVIEW'] } });
    res.status(200).json({ success: true, data: { count } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// List appointments in a date range
export const listAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, status } = req.query;
    const query: any = {};

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = startDate;
    }

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId')
      .sort({ date: 1, timeSlot: 1 });

    res.status(200).json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a manual appointment from the PMS
export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, patientName, patientPhone, patientEmail, treatmentType, date, timeSlot, notes, duration, doctorId } = req.body;

    if (!patientName || !patientPhone || !treatmentType || !date || !timeSlot) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
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

    // Double booking prevention check for manual bookings
    const targetDoctorId = doctorId || 'default-doctor';
    const conflictingApp = await Appointment.findOne({
      doctorId: targetDoctorId,
      date,
      timeSlot,
      status: { $in: ['BOOKED', 'approved', 'rescheduled', 'pending'] }
    });

    if (conflictingApp) {
      res.status(409).json({ success: false, message: 'This appointment slot is already booked.' });
      return;
    }

    let resolvedPatientId = patientId || null;

    if (!resolvedPatientId) {
      const existingPatient = await Patient.findOne({ phone: patientPhone });
      if (existingPatient) {
        resolvedPatientId = existingPatient._id;
      }
    }

    // Default duration is 30 mins
    const appDuration = duration || 30;

    // Calculate End Time Slot (e.g. 10:30 AM + 30 mins = 11:00 AM)
    // For simplicity, we can store it directly or generate it
    const appointment = await Appointment.create({
      patientId: resolvedPatientId,
      patientName,
      patientPhone,
      patientEmail: patientEmail || '',
      treatmentType,
      date,
      timeSlot,
      doctorId: targetDoctorId,
      duration: appDuration,
      status: 'BOOKED', // Manual bookings are created in BOOKED status
      notes: notes || ''
    });

    // Update AvailabilitySlot to BOOKED
    await AvailabilitySlot.findOneAndUpdate(
      { date, timeSlot },
      { status: 'BOOKED', appointmentId: appointment._id, appointmentRequestId: null },
      { new: true, upsert: true }
    );

    await AuditLog.create({
      action: 'APPOINTMENT_CREATED',
      details: `Scheduled ${treatmentType} appointment for ${patientName} on ${date} at ${timeSlot}`
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Update status (e.g. mark Completed or Cancelled)
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, amountPaid, paymentMethod, transactionId, notes } = req.body;
    
    if (!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid target status. Status transitions must be to COMPLETED, CANCELLED, or NO_SHOW.' });
      return;
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    // Current status must be BOOKED or active legacy status
    if (!['BOOKED', 'approved', 'rescheduled', 'pending'].includes(appointment.status)) {
      res.status(400).json({ success: false, message: `Cannot transition from terminal status: ${appointment.status}` });
      return;
    }

    // Sync status to AvailabilitySlot & execute side-effects
    // Enforce backend validation: Prevent marking future appointments as COMPLETED or NO_SHOW
    const appointmentDateTime = getKolkataDate(appointment.date, appointment.timeSlot);
    const now = new Date();
    if (['COMPLETED', 'NO_SHOW'].includes(status)) {
      if (appointmentDateTime.getTime() > now.getTime()) {
        res.status(400).json({ success: false, message: 'Cannot mark appointment as COMPLETED or NO_SHOW before its scheduled time.' });
        return;
      }
    }

    // Enforce backend validation: Prevent cancelling past date appointments
    if (status === 'CANCELLED') {
      const kolkataFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const parts = kolkataFormatter.formatToParts(now);
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;
      const todayKolkataStr = `${year}-${month}-${day}`;
      
      if (appointment.date < todayKolkataStr) {
        res.status(400).json({ success: false, message: 'Cannot cancel an appointment from a past date.' });
        return;
      }
    }
    if (status === 'COMPLETED') {
      await AvailabilitySlot.findOneAndUpdate(
        { date: appointment.date, timeSlot: appointment.timeSlot },
        { status: 'COMPLETED' },
        { upsert: true }
      );

      // Get or create patient to reference on Treatment / Invoice
      let patientId = appointment.patientId;
      if (!patientId) {
        let patient = await Patient.findOne({ phone: appointment.patientPhone });
        if (!patient) {
          const count = await Patient.countDocuments();
          const nextNum = String(count + 1).padStart(4, '0');
          const pId = `RD-${new Date().getFullYear()}-${nextNum}`;
          patient = await Patient.create({
            patientId: pId,
            name: appointment.patientName,
            phone: appointment.patientPhone,
            email: appointment.patientEmail || '',
            registrationStatus: 'incomplete',
            leadSource: 'walkin'
          });
          await MedicalHistory.create({
            patientId: patient._id,
            teethState: {}
          });
        }
        patientId = patient._id;
        appointment.patientId = patient._id;
      }

      // Create Treatment record
      const cost = getTreatmentCost(appointment.treatmentType);
      const totalAmount = cost;
      const treatment = await Treatment.create({
        patientId,
        appointmentId: appointment._id,
        title: appointment.treatmentType,
        notes: notes || appointment.notes || '',
        status: 'completed',
        teeth: [],
        cost,
        discount: 0,
        totalAmount,
        date: appointment.date
      });

      // Calculate partial payment details
      const paidVal = typeof amountPaid === 'number' ? amountPaid : totalAmount;
      const dueVal = Math.max(0, totalAmount - paidVal);
      const invoiceStatus = paidVal >= totalAmount ? 'PAID' : paidVal > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

      // Create Invoice
      const invoiceCount = await Invoice.countDocuments();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;
      const invoice = await Invoice.create({
        invoiceNumber,
        patientId,
        treatmentIds: [treatment._id],
        subtotal: totalAmount,
        discount: 0,
        tax: 0,
        totalAmount,
        paidAmount: paidVal,
        balanceAmount: dueVal,
        status: invoiceStatus,
        issueDate: appointment.date,
        dueDate: appointment.date
      });

      // Create Payment record only if paidVal > 0
      if (paidVal > 0) {
        await Payment.create({
          invoiceId: invoice._id,
          amount: paidVal,
          paymentMethod: paymentMethod || 'Cash',
          transactionId: transactionId || '',
          paymentDate: appointment.date
        });
      }

    } else if (status === 'CANCELLED') {
      // Free the slot
      await AvailabilitySlot.findOneAndDelete({
        date: appointment.date,
        timeSlot: appointment.timeSlot
      });

    } else if (status === 'NO_SHOW') {
      await AvailabilitySlot.findOneAndUpdate(
        { date: appointment.date, timeSlot: appointment.timeSlot },
        { status: 'NO_SHOW' },
        { upsert: true }
      );

      // Increment patient's noShowCount
      let patient = await Patient.findOne({ phone: appointment.patientPhone });
      if (patient) {
        patient.noShowCount = (patient.noShowCount || 0) + 1;
        await patient.save();
      } else {
        const count = await Patient.countDocuments();
        const nextNum = String(count + 1).padStart(4, '0');
        const pId = `RD-${new Date().getFullYear()}-${nextNum}`;
        patient = await Patient.create({
          patientId: pId,
          name: appointment.patientName,
          phone: appointment.patientPhone,
          email: appointment.patientEmail || '',
          registrationStatus: 'incomplete',
          leadSource: 'walkin',
          noShowCount: 1
        });
        await MedicalHistory.create({
          patientId: patient._id,
          teethState: {}
        });
      }
      if (!appointment.patientId && patient) {
        appointment.patientId = patient._id;
      }
    }

    appointment.status = status;
    await appointment.save();

    await AuditLog.create({
      action: 'APPOINTMENT_STATUS_UPDATED',
      details: `Updated appointment status to ${status} for ${appointment.patientName}`
    });

    res.status(200).json({ success: true, data: appointment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Reschedule booking
export const rescheduleAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
      res.status(400).json({ success: false, message: 'Date and time slot are required' });
      return;
    }

    // Backend validation: Reject if target appointment datetime is earlier than or equal to current server time
    const appTime = getKolkataDate(date, timeSlot);
    const now = new Date();
    if (appTime.getTime() <= now.getTime()) {
      res.status(400).json({ success: false, message: 'Cannot reschedule appointments to a past date or time.' });
      return;
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    // Enforce backend validation: Prevent rescheduling past date appointments
    const kolkataFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = kolkataFormatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const todayKolkataStr = `${year}-${month}-${day}`;
    
    if (appointment.date < todayKolkataStr) {
      res.status(400).json({ success: false, message: 'Cannot reschedule an appointment from a past date.' });
      return;
    }

    // Verify target slot is unoccupied
    const targetDoctorId = appointment.doctorId || 'default-doctor';
    const conflict = await Appointment.findOne({
      doctorId: targetDoctorId,
      date,
      timeSlot,
      status: { $in: ['BOOKED', 'approved', 'rescheduled', 'pending'] },
      _id: { $ne: appointment._id }
    });

    if (conflict) {
      res.status(409).json({ success: false, message: 'This appointment slot is already booked.' });
      return;
    }

    const oldDate = appointment.date;
    const oldTime = appointment.timeSlot;

    appointment.date = date;
    appointment.timeSlot = timeSlot;
    appointment.status = 'BOOKED'; 
    await appointment.save();

    // Release old slot
    await AvailabilitySlot.findOneAndDelete({ date: oldDate, timeSlot: oldTime });

    // Lock new slot
    await AvailabilitySlot.findOneAndUpdate(
      { date, timeSlot },
      { status: 'BOOKED', appointmentId: appointment._id, appointmentRequestId: null },
      { new: true, upsert: true }
    );

    await AuditLog.create({
      action: 'APPOINTMENT_RESCHEDULED',
      details: `Rescheduled ${appointment.patientName} from ${oldDate} ${oldTime} to ${date} ${timeSlot}`
    });

    res.status(200).json({ success: true, data: appointment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete appointment record
export const deleteAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    // Free slot
    await AvailabilitySlot.findOneAndDelete({ date: appointment.date, timeSlot: appointment.timeSlot });

    await Appointment.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      action: 'APPOINTMENT_DELETED',
      details: `Deleted appointment for ${appointment.patientName} on ${appointment.date}`
    });

    res.status(200).json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Retrieve booking request details for Review Drawer
export const getAppointmentReview = async (req: Request, res: Response): Promise<void> => {
  try {
    let requestObj = await AppointmentRequest.findById(req.params.id);
    let isLegacy = false;
    let fallbackApp = null;

    if (!requestObj) {
      // Fallback to Appointment model for legacy records
      fallbackApp = await Appointment.findById(req.params.id);
      if (!fallbackApp) {
        res.status(404).json({ success: false, message: 'Booking request not found' });
        return;
      }
      isLegacy = true;
    }

    const requestData = isLegacy ? fallbackApp : requestObj;
    if (!requestData) {
      res.status(404).json({ success: false, message: 'Booking request data missing' });
      return;
    }

    let patient = await Patient.findOne({ phone: requestData.patientPhone });
    let patientHistory = null;
    let patientStatus = 'New Patient';

    if (patient) {
      const totalVisits = await Appointment.countDocuments({ 
        patientId: patient._id, 
        status: 'completed' 
      });

      let age = null;
      if (patient.dob) {
        const today = new Date();
        const birthDate = new Date(patient.dob);
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      const lastApp = await Appointment.findOne({ 
        patientId: patient._id, 
        status: 'completed' 
      }).sort({ date: -1 });

      const ongoingTreatments = await Treatment.find({ 
        patientId: patient._id, 
        status: { $in: ['in-progress', 'planned'] } 
      });

      const invoices = await Invoice.find({ patientId: patient._id });
      const outstandingBalance = invoices.reduce((sum, inv) => sum + ((inv as any).balanceAmount || 0), 0);

      patientStatus = totalVisits > 0 || invoices.length > 0 || ongoingTreatments.length > 0
        ? 'Existing Patient'
        : 'New Patient';

      patientHistory = {
        patientId: patient._id,
        patientIdString: patient.patientId,
        gender: patient.gender,
        age: age,
        dob: patient.dob,
        lastVisitDate: lastApp ? lastApp.date : null,
        totalVisits: totalVisits,
        ongoingTreatments: ongoingTreatments.map(t => t.title),
        outstandingBalance: outstandingBalance
      };
    }

    const notification = await Notification.findOne({ appointmentRequestId: requestData._id }) 
      || await Notification.findOne({ appointmentId: requestData._id });

    if (notification && (notification.status === 'new' || !notification.isRead)) {
      notification.status = 'viewed';
      notification.isRead = true;
      await notification.save();
    }

    res.status(200).json({
      success: true,
      data: {
        appointment: requestData,
        patientStatus,
        patientHistory,
        notificationStatus: notification ? notification.status : 'viewed'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve booking request
export const approveAppointmentReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestId = req.params.id;
    let requestObj = await AppointmentRequest.findById(requestId);
    
    if (!requestObj) {
      // Legacy fallback
      const appointment = await Appointment.findById(requestId);
      if (appointment) {
        const targetDoctorId = appointment.doctorId || 'default-doctor';
        const conflict = await Appointment.findOne({
          doctorId: targetDoctorId,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          status: { $in: ['BOOKED', 'approved', 'rescheduled', 'pending'] },
          _id: { $ne: appointment._id }
        });
        if (conflict) {
          res.status(409).json({ success: false, message: 'This appointment slot is already booked.' });
          return;
        }

        appointment.status = 'BOOKED';
        await appointment.save();

        await AvailabilitySlot.findOneAndUpdate(
          { date: appointment.date, timeSlot: appointment.timeSlot },
          { status: 'BOOKED', appointmentId: appointment._id, appointmentRequestId: null },
          { upsert: true }
        );

        const notification = await Notification.findOne({ appointmentId: appointment._id });
        if (notification) {
          notification.status = 'approved';
          notification.isRead = true;
          await notification.save();
        }

        res.status(200).json({ success: true, data: appointment });
        return;
      }
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    // Validate status transition: must be PENDING_REVIEW or legacy pending
    if (!['PENDING_REVIEW', 'pending'].includes(requestObj.status)) {
      res.status(400).json({ success: false, message: 'Invalid status transition. Request is not in PENDING_REVIEW status.' });
      return;
    }

    // Double Booking check prior to approval
    const targetDoctorId = 'default-doctor';
    const conflict = await Appointment.findOne({
      doctorId: targetDoctorId,
      date: requestObj.date,
      timeSlot: requestObj.timeSlot,
      status: { $in: ['BOOKED', 'approved', 'rescheduled', 'pending'] }
    });

    if (conflict) {
      res.status(409).json({ success: false, message: 'This appointment slot is already booked.' });
      return;
    }

    // Approve the request
    requestObj.status = 'APPROVED';
    await requestObj.save();

    // Send WhatsApp Notification
    await sendWhatsAppNotification(requestObj, 'approved');

    // Locate or link patient lead
    let patient = await Patient.findOne({ phone: requestObj.patientPhone });
    
    // Create the final clinic Appointment record
    const appointment = await Appointment.create({
      patientId: patient ? patient._id : null,
      patientName: requestObj.patientName,
      patientPhone: requestObj.patientPhone,
      patientEmail: requestObj.patientEmail || '',
      treatmentType: requestObj.treatmentType,
      date: requestObj.date,
      timeSlot: requestObj.timeSlot,
      doctorId: targetDoctorId,
      status: 'BOOKED',
      notes: requestObj.notes || ''
    });

    // Link the patient ID on the appointment request as well
    if (patient && !appointment.patientId) {
      appointment.patientId = patient._id;
      await appointment.save();
    }

    // Lock availability slot as BOOKED
    await AvailabilitySlot.findOneAndUpdate(
      { date: requestObj.date, timeSlot: requestObj.timeSlot },
      { status: 'BOOKED', appointmentId: appointment._id, appointmentRequestId: null },
      { upsert: true }
    );

    // Update notification state
    const notification = await Notification.findOne({ appointmentRequestId: requestObj._id });
    if (notification) {
      notification.status = 'approved';
      notification.isRead = true;
      await notification.save();
    }

    await AuditLog.create({
      action: 'APPOINTMENT_APPROVED_REVIEW',
      details: `Approved online request for ${requestObj.patientName} on ${requestObj.date} at ${requestObj.timeSlot}`
    });

    res.status(200).json({ success: true, data: appointment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reschedule booking request (doctor suggests new slot)
export const rescheduleAppointmentReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, timeSlot } = req.body;
    if (!date || !timeSlot) {
      res.status(400).json({ success: false, message: 'Date and time slot are required' });
      return;
    }

    // Backend validation: Reject if target appointment datetime is earlier than or equal to current server time
    const appTime = getKolkataDate(date, timeSlot);
    const now = new Date();
    if (appTime.getTime() <= now.getTime()) {
      res.status(400).json({ success: false, message: 'Cannot reschedule appointments to a past date or time.' });
      return;
    }

    const requestObj = await AppointmentRequest.findById(req.params.id);
    if (!requestObj) {
      // Legacy fallback
      const appointment = await Appointment.findById(req.params.id);
      if (appointment) {
        const oldDate = appointment.date;
        const oldTime = appointment.timeSlot;

        // Double Booking check prior to rescheduling
        const targetDoctorId = appointment.doctorId || 'default-doctor';
        const conflict = await Appointment.findOne({
          doctorId: targetDoctorId,
          date,
          timeSlot,
          status: { $in: ['BOOKED', 'approved', 'rescheduled', 'pending'] },
          _id: { $ne: appointment._id }
        });

        if (conflict) {
          res.status(409).json({ success: false, message: 'This appointment slot is already booked.' });
          return;
        }

        appointment.date = date;
        appointment.timeSlot = timeSlot;
        appointment.status = 'BOOKED';
        await appointment.save();

        await AvailabilitySlot.findOneAndDelete({ date: oldDate, timeSlot: oldTime });
        await AvailabilitySlot.findOneAndUpdate(
          { date, timeSlot },
          { status: 'BOOKED', appointmentId: appointment._id },
          { upsert: true }
        );

        // Send WhatsApp Notification (legacy mock request object)
        const mockRequest = {
          patientName: appointment.patientName,
          patientPhone: appointment.patientPhone,
          patientEmail: appointment.patientEmail,
          treatmentType: appointment.treatmentType,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          save: async () => {}
        };
        await sendWhatsAppNotification(mockRequest, 'reschedule', { newDate: date, newTime: timeSlot });

        await AuditLog.create({
          action: 'APPOINTMENT_RESCHEDULED',
          details: `Appointment rescheduled from ${oldDate} ${oldTime} to ${date} ${timeSlot} by Dr. Manoj Kumar`
        });

        res.status(200).json({ success: true, data: appointment });
        return;
      }
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    // Validate status transition: must be PENDING_REVIEW or legacy pending
    if (!['PENDING_REVIEW', 'pending'].includes(requestObj.status)) {
      res.status(400).json({ success: false, message: 'Invalid status transition. Request is not in PENDING_REVIEW status.' });
      return;
    }

    // Double Booking check prior to rescheduling
    const targetDoctorId = 'default-doctor';
    const conflict = await Appointment.findOne({
      doctorId: targetDoctorId,
      date,
      timeSlot,
      status: { $in: ['BOOKED', 'approved', 'rescheduled', 'pending'] }
    });

    if (conflict) {
      res.status(409).json({ success: false, message: 'This appointment slot is already booked.' });
      return;
    }

    const oldDate = requestObj.date;
    const oldTime = requestObj.timeSlot;

    requestObj.date = date;
    requestObj.timeSlot = timeSlot;
    requestObj.status = 'APPROVED';
    await requestObj.save();

    // Send WhatsApp Notification
    await sendWhatsAppNotification(requestObj, 'reschedule', { newDate: date, newTime: timeSlot });

    // Locate or link patient lead
    let patient = await Patient.findOne({ phone: requestObj.patientPhone });

    // Create the final clinic Appointment record
    const appointment = await Appointment.create({
      patientId: patient ? patient._id : null,
      patientName: requestObj.patientName,
      patientPhone: requestObj.patientPhone,
      patientEmail: requestObj.patientEmail || '',
      treatmentType: requestObj.treatmentType,
      date,
      timeSlot,
      doctorId: targetDoctorId,
      status: 'BOOKED',
      notes: requestObj.notes || ''
    });

    // Link the patient ID on the appointment request as well
    if (patient && !appointment.patientId) {
      appointment.patientId = patient._id;
      await appointment.save();
    }

    // Free old slot
    await AvailabilitySlot.findOneAndDelete({ date: oldDate, timeSlot: oldTime });

    // Lock new slot
    await AvailabilitySlot.findOneAndUpdate(
      { date, timeSlot },
      { status: 'BOOKED', appointmentId: appointment._id, appointmentRequestId: null },
      { upsert: true }
    );

    const notification = await Notification.findOne({ appointmentRequestId: requestObj._id });
    if (notification) {
      notification.status = 'approved';
      notification.isRead = true;
      await notification.save();
    }

    await AuditLog.create({
      action: 'APPOINTMENT_RESCHEDULED_REVIEW',
      details: `Appointment rescheduled from ${oldDate} ${oldTime} to ${date} ${timeSlot} by Dr. Manoj Kumar`
    });

    res.status(200).json({ success: true, data: appointment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject booking request
export const rejectAppointmentReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    if (!reason) {
      res.status(400).json({ success: false, message: 'Rejection reason is required' });
      return;
    }

    const requestObj = await AppointmentRequest.findById(req.params.id);
    if (!requestObj) {
      // Legacy fallback
      const appointment = await Appointment.findById(req.params.id);
      if (appointment) {
        appointment.status = 'CANCELLED';
        appointment.cancellationReason = reason;
        await appointment.save();

        await AvailabilitySlot.findOneAndDelete({ date: appointment.date, timeSlot: appointment.timeSlot });

        const notification = await Notification.findOne({ appointmentId: appointment._id });
        if (notification) {
          notification.status = 'rejected';
          notification.isRead = true;
          await notification.save();
        }
        res.status(200).json({ success: true, data: appointment });
        return;
      }
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    // Validate status transition: must be PENDING_REVIEW or legacy pending
    if (!['PENDING_REVIEW', 'pending'].includes(requestObj.status)) {
      res.status(400).json({ success: false, message: 'Invalid status transition. Request is not in PENDING_REVIEW status.' });
      return;
    }

    requestObj.status = 'REJECTED';
    await requestObj.save();

    // Send WhatsApp Notification
    await sendWhatsAppNotification(requestObj, 'rejected');

    // Free slot
    await AvailabilitySlot.findOneAndDelete({ date: requestObj.date, timeSlot: requestObj.timeSlot });

    const notification = await Notification.findOne({ appointmentRequestId: requestObj._id });
    if (notification) {
      notification.status = 'rejected';
      notification.isRead = true;
      await notification.save();
    }

    await AuditLog.create({
      action: 'APPOINTMENT_REJECTED_REVIEW',
      details: `Rejected online request for ${requestObj.patientName} on ${requestObj.date} for reason: ${reason}`
    });

    res.status(200).json({ success: true, data: requestObj });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resendNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestObj = await AppointmentRequest.findById(req.params.id);
    if (!requestObj) {
      res.status(404).json({ success: false, message: 'Appointment request not found' });
      return;
    }

    let templateType: 'approved' | 'rejected' | 'reschedule' | null = null;
    const statusNorm = requestObj.status.toUpperCase();

    if (['APPROVED', 'APPROVED_REVIEW'].includes(statusNorm) || requestObj.status === 'approved') {
      templateType = 'approved';
    } else if (statusNorm === 'REJECTED' || requestObj.status === 'rejected') {
      templateType = 'rejected';
    } else if (['RESCHEDULE_REQUESTED', 'RESCHEDULED'].includes(statusNorm) || requestObj.status === 'rescheduled') {
      templateType = 'reschedule';
    }

    if (!templateType) {
      res.status(400).json({ success: false, message: 'No notification template available for current request status.' });
      return;
    }

    const success = await sendWhatsAppNotification(requestObj, templateType, {
      newDate: requestObj.date,
      newTime: requestObj.timeSlot
    });

    if (success) {
      res.status(200).json({ success: true, message: 'WhatsApp notification resent successfully.', data: requestObj });
    } else {
      res.status(500).json({ success: false, message: 'Failed to resend WhatsApp notification.', data: requestObj });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
