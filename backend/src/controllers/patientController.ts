import { Request, Response } from 'express';
import { Patient } from '../models/Patient';
import { MedicalHistory } from '../models/MedicalHistory';
import { Treatment } from '../models/Treatment';
import { Invoice } from '../models/Invoice';
import { AuditLog } from '../models/AuditLog';
import { Appointment } from '../models/Appointment';
import { Payment } from '../models/Payment';

export const listPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query: any = {};

    if (search) {
      // Find matching patient IDs from Treatment title
      const matchingTreatments = await Treatment.find({
        title: { $regex: search, $options: 'i' }
      }).select('patientId');
      const matchingPatientIds = matchingTreatments.map(t => t.patientId).filter(Boolean);

      // Find matching patient IDs from Appointment treatmentType
      const matchingAppointments = await Appointment.find({
        treatmentType: { $regex: search, $options: 'i' }
      }).select('patientId');
      const matchingAppPatientIds = matchingAppointments.map(a => a.patientId).filter(Boolean);

      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { requestedTreatment: { $regex: search, $options: 'i' } },
        { _id: { $in: [...matchingPatientIds, ...matchingAppPatientIds] } }
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Hydrate each patient with lastVisit date and current/latest treatment details
    const hydratedPatients = await Promise.all(patients.map(async (pat) => {
      // Find latest completed treatment
      const latestTreatment = await Treatment.findOne({ patientId: pat._id, status: 'completed' })
        .sort({ date: -1 });
      
      // If no treatment, find latest appointment
      const latestApp = await Appointment.findOne({ patientId: pat._id })
        .sort({ date: -1 });

      const lastVisitDate = latestTreatment?.date || latestApp?.date || null;
      const curTreatment = latestTreatment?.title || pat.requestedTreatment || latestApp?.treatmentType || 'None';

      return {
        ...pat.toObject(),
        lastVisit: lastVisitDate,
        currentTreatment: curTreatment
      };
    }));

    const total = await Patient.countDocuments(query);

    res.status(200).json({
      success: true,
      data: hydratedPatients,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, phone, email, dob, gender, bloodGroup, address, 
      occupation, medicalHistory, allergies, emergencyContact, notes, leadSource 
    } = req.body;

    if (!name || !phone) {
      res.status(400).json({ success: false, message: 'Required fields: name, phone' });
      return;
    }

    // Generate unique patientId
    const count = await Patient.countDocuments();
    const nextNum = String(count + 1).padStart(4, '0');
    const patientId = `RD-${new Date().getFullYear()}-${nextNum}`;

    // Determine status
    const isComplete = gender && dob;
    const registrationStatus = isComplete ? 'completed' : 'incomplete';

    const newPatient = await Patient.create({
      patientId,
      name,
      phone,
      email: email || '',
      dob: dob || null,
      gender: gender || null,
      bloodGroup: bloodGroup || null,
      address: address || null,
      occupation: occupation || null,
      medicalHistory: medicalHistory || [],
      allergies: allergies || [],
      emergencyContact: emergencyContact || null,
      registrationStatus,
      leadSource: leadSource || 'walkin',
      notes: notes || ''
    });

    // Create empty dental chart
    await MedicalHistory.create({
      patientId: newPatient._id,
      teethState: {}
    });

    // Audit log
    await AuditLog.create({
      action: 'PATIENT_CREATED',
      details: `Created patient ${newPatient.name} (${newPatient.patientId})`
    });

    res.status(201).json({ success: true, data: newPatient });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    // Hydrate treatments and dental chart
    const treatments = await Treatment.find({ patientId: patient._id }).sort({ date: -1 });
    const invoices = await Invoice.find({ patientId: patient._id }).sort({ createdAt: -1 });
    const appointments = await Appointment.find({ patientId: patient._id }).sort({ date: -1 });
    
    // Fetch payments for the invoices of the patient
    const invoiceIds = invoices.map(inv => inv._id);
    const payments = await Payment.find({ invoiceId: { $in: invoiceIds } }).sort({ paymentDate: -1 });
    
    let dentalChart = await MedicalHistory.findOne({ patientId: patient._id });
    if (!dentalChart) {
      dentalChart = await MedicalHistory.create({
        patientId: patient._id,
        teethState: {}
      });
    }

    res.status(200).json({
      success: true,
      data: {
        patient,
        treatments,
        invoices,
        dentalChart,
        appointments,
        payments
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData = { ...req.body };

    // Auto-promote status to completed if both required fields are provided
    if (updateData.gender && updateData.dob) {
      updateData.registrationStatus = 'completed';
    }

    const updatedPatient = await Patient.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!updatedPatient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    await AuditLog.create({
      action: 'PATIENT_UPDATED',
      details: `Updated patient details for ${updatedPatient.name} (${updatedPatient.patientId})`
    });

    res.status(200).json({ success: true, data: updatedPatient });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    await Patient.findByIdAndDelete(req.params.id);
    // Delete associated dental chart and records optionally (we keep invoices for financial audit, or delete them if preferred)
    await MedicalHistory.findOneAndDelete({ patientId: req.params.id });

    await AuditLog.create({
      action: 'PATIENT_DELETED',
      details: `Deleted patient ${patient.name} (${patient.patientId})`
    });

    res.status(200).json({ success: true, message: 'Patient deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDentalChart = async (req: Request, res: Response): Promise<void> => {
  try {
    let dentalChart = await MedicalHistory.findOne({ patientId: req.params.id });
    if (!dentalChart) {
      dentalChart = await MedicalHistory.create({
        patientId: req.params.id,
        teethState: {}
      });
    }
    res.status(200).json({ success: true, data: dentalChart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDentalChart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teethState } = req.body;
    // teethState is expected to be a map like: { "1": { toothNumber: 1, state: "Caries", notes: "Cavity detected" } }
    
    let dentalChart = await MedicalHistory.findOne({ patientId: req.params.id });
    if (!dentalChart) {
      dentalChart = new MedicalHistory({ patientId: req.params.id, teethState: {} });
    }

    dentalChart.teethState = teethState;
    await dentalChart.save();

    res.status(200).json({ success: true, data: dentalChart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
