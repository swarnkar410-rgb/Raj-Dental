// Shared TypeScript Interfaces for Raj Dental & Implant Hospital

export interface User {
  _id?: string;
  email: string;
  role: 'doctor';
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Patient {
  _id?: string;
  patientId: string; // e.g. "RD-2026-0001"
  name: string;
  phone: string;
  email: string;
  dob?: string | null;
  gender?: 'Male' | 'Female' | 'Other' | null;
  bloodGroup?: string | null;
  address?: string | null;
  occupation?: string | null;
  
  requestedTreatment?: string | null;
  requestedDate?: string | null;
  requestedTime?: string | null;

  medicalHistory?: string[];
  allergies?: string[];
  emergencyContact?: string | null;

  registrationStatus: 'incomplete' | 'completed';
  leadSource: 'website' | 'walkin' | 'phone' | 'referral';

  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ToothCondition = 'Healthy' | 'Caries' | 'Root Canal' | 'Crown' | 'Extraction' | 'Implant' | 'Braces';

export interface ToothState {
  toothNumber: number; // 1-32
  state: ToothCondition;
  notes?: string;
}

export interface MedicalHistory {
  _id?: string;
  patientId: string;
  teethState: { [toothNumber: string]: ToothState };
  updatedAt?: string;
}

export interface Appointment {
  _id?: string;
  patientId?: string; // empty if public new patient request
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  treatmentType: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "10:00 AM"
  endTimeSlot?: string;
  duration?: number;
  status: 'pending' | 'approved' | 'rescheduled' | 'completed' | 'cancelled' | 'rejected';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Treatment {
  _id?: string;
  patientId: string;
  appointmentId?: string;
  title: string;
  notes?: string;
  status: 'planned' | 'in-progress' | 'completed';
  teeth: number[]; // 1-32
  cost: number;
  discount: number;
  totalAmount: number;
  date: string;
}

export interface Invoice {
  _id?: string;
  invoiceNumber: string; // e.g. "INV-2026-0001"
  patientId: string;
  patientName?: string; // joined or cached
  treatmentIds: string[];
  treatmentsDetails?: Treatment[]; // hydrated
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: 'unpaid' | 'partially-paid' | 'paid';
  issueDate: string;
  dueDate: string;
  createdAt?: string;
}

export interface Payment {
  _id?: string;
  invoiceId: string;
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  transactionId?: string;
  paymentDate: string;
}

export interface DashboardStats {
  totalPatients: number;
  todayAppointmentsCount: number;
  monthlyRevenue: number;
  pendingPaymentsCount: number;
  recentPatients: Patient[];
  upcomingAppointments: Appointment[];
}

export interface ChartDataPoint {
  label: string; // e.g. Month or Day
  value: number;
}

export interface ClinicSettings {
  clinicName: string;
  location: string;
  phone: string;
  workingHours: {
    start: string; // e.g., "09:00 AM"
    end: string;   // e.g., "07:00 PM"
    closedDays: string[]; // e.g., ["Sunday"]
  };
  whatsappNumber: string;
}

export interface Shift {
  startTime: string; // "HH:MM" 24h
  endTime: string;   // "HH:MM" 24h
}

export interface RecurringSchedule {
  _id?: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isClosed: boolean;
  shifts: Shift[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorLeave {
  _id?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlockedSlot {
  _id?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  reason: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailabilitySlot {
  _id?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:30 AM" or "10:30"
  status: 'AVAILABLE' | 'RESERVED' | 'REQUESTED' | 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'BLOCKED';
  reservedAt?: string | null;
  reservedBySession?: string | null;
  appointmentRequestId?: string | null;
  appointmentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppointmentRequest {
  _id?: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  treatmentType: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:30 AM"
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'rescheduled';
  createdAt?: string;
  updatedAt?: string;
}
