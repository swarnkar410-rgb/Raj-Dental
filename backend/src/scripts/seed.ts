import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Patient } from '../models/Patient';
import { Appointment } from '../models/Appointment';
import { Treatment } from '../models/Treatment';
import { MedicalHistory } from '../models/MedicalHistory';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { Notification } from '../models/Notification';
import { RecurringSchedule } from '../models/RecurringSchedule';
import { DoctorLeave } from '../models/DoctorLeave';
import { BlockedSlot } from '../models/BlockedSlot';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { AppointmentRequest } from '../models/AppointmentRequest';

dotenv.config();

const seed = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/raj_dental';
    console.log(`Connecting to database for seeding...`);
    await mongoose.connect(connStr);
    console.log('Connected!');

    // Clear existing data
    console.log('Cleaning existing collections...');
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    await Treatment.deleteMany({});
    await MedicalHistory.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});
    await Notification.deleteMany({});
    await RecurringSchedule.deleteMany({});
    await DoctorLeave.deleteMany({});
    await BlockedSlot.deleteMany({});
    await AvailabilitySlot.deleteMany({});
    await AppointmentRequest.deleteMany({});

    console.log('Creating Admin Doctor...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    
    const doctor = await User.create({
      name: 'Dr. Manoj Kumar',
      email: 'manoj@rajdental.com',
      passwordHash,
      role: 'doctor'
    });
    console.log(`Doctor created: ${doctor.email} (password: password123)`);

    console.log('Seeding Working Hours / Weekly Recurring Schedules...');
    const defaultSchedules = [
      { dayOfWeek: 'Monday', isClosed: false, shifts: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '14:00', endTime: '18:00' }] },
      { dayOfWeek: 'Tuesday', isClosed: false, shifts: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '14:00', endTime: '18:00' }] },
      { dayOfWeek: 'Wednesday', isClosed: true, shifts: [] },
      { dayOfWeek: 'Thursday', isClosed: false, shifts: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '14:00', endTime: '18:00' }] },
      { dayOfWeek: 'Friday', isClosed: false, shifts: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '14:00', endTime: '18:00' }] },
      { dayOfWeek: 'Saturday', isClosed: false, shifts: [{ startTime: '09:00', endTime: '14:00' }] },
      { dayOfWeek: 'Sunday', isClosed: true, shifts: [] }
    ];
    await RecurringSchedule.create(defaultSchedules);

    console.log('Seeding Sample Doctor Leave...');
    // Seed leave day for June 20, 2026
    await DoctorLeave.create({
      startDate: '2026-06-20',
      endDate: '2026-06-20',
      reason: 'Medical Conference',
      isActive: true
    });

    console.log('Seeding Sample Blocked Slot...');
    // Seed custom blocked range for surgeries on June 18, 2026
    await BlockedSlot.create({
      date: '2026-06-18',
      startTime: '11:00',
      endTime: '12:00',
      reason: 'Oral Implant Surgery Block'
    });

    console.log('Creating Sample Patients...');
    const patientsData = [
      {
        patientId: 'RD-2026-0001',
        name: 'Amit Sharma',
        phone: '9876543210',
        email: 'amit.sharma@example.com',
        dob: new Date('1988-05-15'),
        gender: 'Male',
        medicalHistory: ['Diabetes', 'Allergic to Penicillin'],
        registrationStatus: 'completed',
        leadSource: 'walkin',
        notes: 'Needs gentle care due to high anxiety.'
      },
      {
        patientId: 'RD-2026-0002',
        name: 'Priya Verma',
        phone: '9123456789',
        email: 'priya.verma@example.com',
        dob: new Date('1995-10-24'),
        gender: 'Female',
        medicalHistory: ['Hypertension'],
        registrationStatus: 'completed',
        leadSource: 'walkin',
        notes: 'Regular checkup candidate.'
      },
      {
        patientId: 'RD-2026-0003',
        name: 'Rajesh Gupta',
        phone: '9988776655',
        email: 'rajesh.gupta@example.com',
        dob: new Date('1972-01-09'),
        gender: 'Male',
        medicalHistory: [],
        registrationStatus: 'completed',
        leadSource: 'walkin',
        notes: 'Heavy smoking history. Monitor gum health.'
      },
      {
        patientId: 'RD-2026-0004',
        name: 'Neha Singh',
        phone: '9888777666',
        email: 'neha.singh@example.com',
        dob: new Date('2001-12-05'),
        gender: 'Female',
        medicalHistory: [],
        registrationStatus: 'completed',
        leadSource: 'walkin',
        notes: 'Interested in teeth whitening.'
      },
      {
        patientId: 'RD-2026-0005',
        name: 'Prakash Kumar',
        phone: '7324906288',
        email: 'prakash.kumar@example.com',
        dob: null,
        gender: null,
        medicalHistory: [],
        registrationStatus: 'incomplete',
        leadSource: 'website',
        requestedTreatment: 'Dental Implants',
        requestedDate: '2026-06-25',
        requestedTime: '10:30 AM',
        notes: 'Registered automatically via website booking.'
      },
      {
        patientId: 'RD-2026-0006',
        name: 'Prakash',
        phone: '14645543',
        email: '',
        dob: null,
        gender: null,
        medicalHistory: [],
        registrationStatus: 'incomplete',
        leadSource: 'website',
        requestedTreatment: 'Crowns & Bridges',
        requestedDate: '2026-06-28',
        requestedTime: '11:30 AM',
        notes: 'Registered automatically via website booking.'
      }
    ];

    const patients = await Patient.create(patientsData);
    console.log(`${patients.length} patients seeded.`);

    console.log('Creating Dental Charts (Medical History)...');
    await MedicalHistory.create({
      patientId: patients[0]._id,
      teethState: {
        '3': { toothNumber: 3, state: 'Caries', notes: 'Distal caries' },
        '14': { toothNumber: 14, state: 'Root Canal', notes: 'Completed RCT' }
      }
    });

    await MedicalHistory.create({
      patientId: patients[1]._id,
      teethState: {
        '19': { toothNumber: 19, state: 'Implant', notes: 'Titanium implant post' },
        '20': { toothNumber: 20, state: 'Crown', notes: 'Zirconia crown' }
      }
    });

    const teethState3: any = {};
    for (let i = 5; i <= 12; i++) {
      teethState3[String(i)] = { toothNumber: i, state: 'Braces', notes: 'Orthodontic braces' };
    }
    await MedicalHistory.create({
      patientId: patients[2]._id,
      teethState: teethState3
    });

    await MedicalHistory.create({ patientId: patients[3]._id, teethState: {} });
    await MedicalHistory.create({ patientId: patients[4]._id, teethState: {} });
    await MedicalHistory.create({ patientId: patients[5]._id, teethState: {} });
    console.log('Dental charts seeded.');

    console.log('Creating Sample Approved Appointments...');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];

    const appointmentsData = [
      {
        patientId: patients[0]._id,
        patientName: patients[0].name,
        patientPhone: patients[0].phone,
        patientEmail: patients[0].email,
        treatmentType: 'Dental Implants',
        date: today,
        timeSlot: '10:00 AM',
        status: 'BOOKED',
        notes: 'Implant placement second stage.'
      },
      {
        patientId: patients[1]._id,
        patientName: patients[1].name,
        patientPhone: patients[1].phone,
        patientEmail: patients[1].email,
        treatmentType: 'Root Canal Treatment (RCT)',
        date: today,
        timeSlot: '11:30 AM',
        status: 'BOOKED',
        notes: 'Access opening and cleaning.'
      },
      {
        patientId: patients[2]._id,
        patientName: patients[2].name,
        patientPhone: patients[2].phone,
        patientEmail: patients[2].email,
        treatmentType: 'Dental Crowns',
        date: tomorrow,
        timeSlot: '02:00 PM',
        status: 'BOOKED',
        notes: 'Tooth preparation for crown.'
      },
      {
        patientId: patients[0]._id,
        patientName: patients[0].name,
        patientPhone: patients[0].phone,
        patientEmail: patients[0].email,
        treatmentType: 'Dental Implants',
        date: yesterday,
        timeSlot: '09:00 AM',
        status: 'COMPLETED',
        notes: 'Consultation & X-Ray done.'
      }
    ];

    const appointments = await Appointment.create(appointmentsData);
    console.log(`${appointments.length} appointments seeded.`);

    console.log('Seeding AvailabilitySlot overrides for appointments...');
    for (const app of appointments) {
      if (app.status === 'BOOKED') {
        await AvailabilitySlot.create({
          date: app.date,
          timeSlot: app.timeSlot,
          status: 'BOOKED',
          appointmentId: app._id
        });
      } else if (app.status === 'COMPLETED') {
        await AvailabilitySlot.create({
          date: app.date,
          timeSlot: app.timeSlot,
          status: 'COMPLETED',
          appointmentId: app._id
        });
      }
    }

    console.log('Seeding pending booking requests...');
    const request1 = await AppointmentRequest.create({
      patientName: 'Prakash Kumar',
      patientPhone: '7324906288',
      patientEmail: 'prakash.kumar@example.com',
      treatmentType: 'Dental Implants',
      date: '2026-06-25',
      timeSlot: '10:30 AM',
      notes: 'Interested in porcelain veneers.',
      status: 'pending'
    });

    const request2 = await AppointmentRequest.create({
      patientName: 'Prakash',
      patientPhone: '14645543',
      patientEmail: '',
      treatmentType: 'Crowns & Bridges',
      date: '2026-06-28',
      timeSlot: '11:30 AM',
      notes: 'Checking pricing details.',
      status: 'pending'
    });

    await AvailabilitySlot.create({
      date: '2026-06-25',
      timeSlot: '10:30 AM',
      status: 'REQUESTED',
      appointmentRequestId: request1._id
    });

    await AvailabilitySlot.create({
      date: '2026-06-28',
      timeSlot: '11:30 AM',
      status: 'REQUESTED',
      appointmentRequestId: request2._id
    });

    console.log('Creating notifications for review...');
    await Notification.create({
      type: 'appointment_request',
      title: 'New Online Booking Request',
      message: 'Prakash Kumar has requested an appointment for Dental Implants on 2026-06-25 at 10:30 AM.',
      appointmentRequestId: request1._id,
      status: 'new'
    });

    await Notification.create({
      type: 'appointment_request',
      title: 'New Online Booking Request',
      message: 'Prakash has requested an appointment for Crowns & Bridges on 2026-06-28 at 11:30 AM.',
      appointmentRequestId: request2._id,
      status: 'new'
    });

    console.log('Creating Treatments & Billing Records...');
    const t1 = await Treatment.create({
      patientId: patients[0]._id,
      title: 'Dental Implant Consultation',
      notes: 'Initial implant analysis, CBCT review',
      status: 'completed',
      teeth: [19],
      cost: 1500,
      discount: 0,
      totalAmount: 1500,
      date: yesterday
    });

    const t2 = await Treatment.create({
      patientId: patients[0]._id,
      title: 'CBCT Scan / Dental X-Ray',
      notes: '3D structural scan of lower jawbone',
      status: 'completed',
      teeth: [19, 20],
      cost: 2500,
      discount: 500,
      totalAmount: 2000,
      date: yesterday
    });

    const t3 = await Treatment.create({
      patientId: patients[1]._id,
      title: 'Root Canal Treatment (RCT)',
      notes: 'Rotary RCT with obturation',
      status: 'completed',
      teeth: [14],
      cost: 6000,
      discount: 1000,
      totalAmount: 5000,
      date: yesterday
    });

    // Seed Invoices
    const inv1 = await Invoice.create({
      invoiceNumber: 'INV-2026-0001',
      patientId: patients[0]._id,
      treatmentIds: [t1._id, t2._id],
      subtotal: 3500,
      discount: 500,
      tax: 0,
      totalAmount: 3500,
      paidAmount: 3500,
      balanceAmount: 0,
      status: 'PAID',
      issueDate: yesterday,
      dueDate: today
    });

    await Payment.create({
      invoiceId: inv1._id,
      amount: 3500,
      paymentMethod: 'UPI',
      transactionId: 'TXN-UPI-99887766',
      paymentDate: yesterday
    });

    const inv2 = await Invoice.create({
      invoiceNumber: 'INV-2026-0002',
      patientId: patients[1]._id,
      treatmentIds: [t3._id],
      subtotal: 5000,
      discount: 0,
      tax: 0,
      totalAmount: 5000,
      paidAmount: 2000,
      balanceAmount: 3000,
      status: 'PARTIALLY_PAID',
      issueDate: yesterday,
      dueDate: tomorrow
    });

    await Payment.create({
      invoiceId: inv2._id,
      amount: 2000,
      paymentMethod: 'Cash',
      paymentDate: yesterday
    });

    console.log('Seeding mock payment history for analytics charts...');
    const pastMonthsPayments = [
      { amount: 45000, method: 'Card', date: '2026-01-10' },
      { amount: 55000, method: 'UPI', date: '2026-02-15' },
      { amount: 60000, method: 'Cash', date: '2026-03-20' },
      { amount: 75000, method: 'UPI', date: '2026-04-18' },
      { amount: 82000, method: 'UPI', date: '2026-05-22' }
    ];

    for (const p of pastMonthsPayments) {
      const dummyInv = await Invoice.create({
        invoiceNumber: `INV-${p.date.replace(/-/g, '')}`,
        patientId: patients[2]._id,
        treatmentIds: [],
        subtotal: p.amount,
        discount: 0,
        tax: 0,
        totalAmount: p.amount,
        paidAmount: p.amount,
        balanceAmount: 0,
        status: 'PAID',
        issueDate: p.date,
        dueDate: p.date
      });

      await Payment.create({
        invoiceId: dummyInv._id,
        amount: p.amount,
        paymentMethod: p.method as any,
        paymentDate: p.date
      });
    }

    console.log('Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error);
    process.exit(1);
  }
};

seed();
