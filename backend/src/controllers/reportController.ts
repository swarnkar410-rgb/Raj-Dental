import { Request, Response } from 'express';
import { Patient } from '../models/Patient';
import { Appointment } from '../models/Appointment';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { Treatment } from '../models/Treatment';
import { AppointmentRequest } from '../models/AppointmentRequest';
import { computeSlotsForDate, getKolkataDate } from '../utils/slotHelper';
import { DoctorLeave } from '../models/DoctorLeave';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const currentMonthPrefix = today.substring(0, 7); // "YYYY-MM"

    // 1. Total Patients
    const totalPatients = await Patient.countDocuments();

    // 2. Today's Appointments Count (Approved/Scheduled)
    const todayAppointmentsCount = await Appointment.countDocuments({ 
      date: today,
      status: { $in: ['BOOKED', 'approved', 'rescheduled', 'pending'] }
    });

    // 3. Monthly Revenue (sum of payments in this month)
    const monthlyPayments = await Payment.find({
      paymentDate: { $regex: `^${currentMonthPrefix}` }
    });
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    // 4. Pending Collections Invoice Count
    const pendingPaymentsCount = await Invoice.countDocuments({
      status: { $in: ['UNPAID', 'PARTIALLY_PAID'] }
    });

    // 5. Recent Patients
    const recentPatients = await Patient.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Fetch all active doctor leaves
    const activeLeaves = await DoctorLeave.find({ isActive: true });
    const isDateOnLeave = (dateStr: string, leaves: any[]) => {
      return leaves.some(l => dateStr >= l.startDate && dateStr <= l.endDate);
    };

    // Detect if today is an active leave period
    const todayLeave = activeLeaves.find((l: any) => today >= l.startDate && today <= l.endDate);

    // 6. Upcoming Appointments (BOOKED/pending/approved/rescheduled, excluding leave periods, past datetimes, completed/cancelled/no-show status)
    const now = new Date();
    const allUpcoming = await Appointment.find({
      date: { $gte: today },
      status: { $nin: ['COMPLETED', 'completed', 'CANCELLED', 'cancelled', 'NO_SHOW', 'no_show', 'no-show', 'rejected'] }
    });

    const upcomingAppointments = allUpcoming
      .filter(app => {
        if (isDateOnLeave(app.date, activeLeaves)) return false;
        const appDatetime = getKolkataDate(app.date, app.timeSlot);
        return appDatetime.getTime() > now.getTime();
      })
      .sort((a, b) => {
        const datetimeA = getKolkataDate(a.date, a.timeSlot).getTime();
        const datetimeB = getKolkataDate(b.date, b.timeSlot).getTime();
        return datetimeA - datetimeB;
      })
      .slice(0, 5);

    // 6.5. Recent Activity (Historical completed/cancelled/rejected/no_show/COMPLETED/CANCELLED/NO_SHOW)
    const recentActivity = await Appointment.find({
      status: { $in: ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'completed', 'cancelled', 'rejected', 'no_show'] }
    })
      .sort({ date: -1, timeSlot: -1 })
      .limit(5);

    // 7. Dynamic occupancy stats & next available slot for Today
    const todaySlots = todayLeave ? [] : await computeSlotsForDate(today);
    let totalSlots = 0;
    let bookedSlots = 0;
    let availableSlots = 0;
    let occupancyRate = 0;
    let nextAvailableSlot = 'Closed';

    if (todaySlots.length > 0) {
      totalSlots = todaySlots.length;
      bookedSlots = todaySlots.filter(s => ['BOOKED', 'COMPLETED', 'REQUESTED', 'RESERVED'].includes(s.status)).length;
      availableSlots = todaySlots.filter(s => s.status === 'AVAILABLE').length;
      occupancyRate = Math.round((bookedSlots / totalSlots) * 100);
      
      const nextFree = todaySlots.find(s => s.status === 'AVAILABLE');
      nextAvailableSlot = nextFree ? nextFree.timeSlot : 'None';
    }

    // 8. Pending website booking requests count
    const pendingRequestsCount = await AppointmentRequest.countDocuments({ status: { $in: ['pending', 'PENDING_REVIEW'] } });

    // 9. Today's Activity Stats (force 0 if on leave)
    let completedCount = 0;
    let bookedCount = 0;
    let cancelledCount = 0;
    let noShowCount = 0;
    let todayApptsLength = 0;

    if (!todayLeave) {
      const todayAppointments = await Appointment.find({ date: today });
      completedCount = todayAppointments.filter(a => a.status === 'COMPLETED' || (a.status as string) === 'completed').length;
      bookedCount = todayAppointments.filter(a => ['BOOKED', 'approved', 'rescheduled', 'pending'].includes(a.status as string)).length;
      cancelledCount = todayAppointments.filter(a => ['CANCELLED', 'cancelled', 'rejected'].includes(a.status as string)).length;
      noShowCount = todayAppointments.filter(a => a.status === 'NO_SHOW' || (a.status as string) === 'no_show').length;
      todayApptsLength = todayAppointments.length;
    }

    // 10. Today's Revenue & Yesterday's Revenue
    const todayPayments = todayLeave ? [] : await Payment.find({ paymentDate: today });
    const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);

    const yesterdayPayments = await Payment.find({ paymentDate: yesterday });
    const yesterdayRevenue = yesterdayPayments.reduce((sum, p) => sum + p.amount, 0);

    let revenueChangePercent = 0;
    if (yesterdayRevenue > 0) {
      revenueChangePercent = Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
    } else if (todayRevenue > 0) {
      revenueChangePercent = 100;
    }

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        todayAppointmentsCount: todayLeave ? 0 : todayAppointmentsCount,
        monthlyRevenue,
        pendingPaymentsCount,
        recentPatients,
        upcomingAppointments,
        recentActivity,
        occupancy: {
          totalSlots,
          bookedSlots,
          availableSlots,
          occupancyRate,
          nextAvailableSlot
        },
        pendingRequestsCount,
        todayActivity: {
          total: todayApptsLength,
          completed: completedCount,
          booked: bookedCount,
          cancelled: cancelledCount,
          noShow: noShowCount,
          available: todayLeave ? 0 : availableSlots
        },
        todayRevenue: {
          amount: todayRevenue,
          changePercent: revenueChangePercent
        },
        todayLeave: todayLeave ? {
          startDate: todayLeave.startDate,
          endDate: todayLeave.endDate,
          reason: todayLeave.reason
        } : null
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReportsData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportType } = req.query; // 'financial' | 'patients' | 'treatments'

    // We generate data points for dashboard charts
    
    // Revenue Trend (last 6 months)
    const last6Months: string[] = [];
    const date = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      last6Months.push(d.toISOString().substring(0, 7)); // "YYYY-MM"
    }

    const revenueTrend = await Promise.all(
      last6Months.map(async (month) => {
        const payments = await Payment.find({ paymentDate: { $regex: `^${month}` } });
        const total = payments.reduce((sum, p) => sum + p.amount, 0);
        
        // Month label formatted (e.g. "Jun 2026")
        const [year, m] = month.split('-');
        const monthName = new Date(parseInt(year), parseInt(m) - 1, 1).toLocaleString('default', { month: 'short' });
        return { label: `${monthName} ${year}`, value: total };
      })
    );

    // Patient Growth Trend (last 6 months count)
    const patientGrowth = await Promise.all(
      last6Months.map(async (month) => {
        // Patients created up to the end of that month
        const [year, m] = month.split('-');
        const endOfMonthDate = new Date(parseInt(year), parseInt(m), 0, 23, 59, 59);
        const count = await Patient.countDocuments({ createdAt: { $lte: endOfMonthDate } });

        const monthName = new Date(parseInt(year), parseInt(m) - 1, 1).toLocaleString('default', { month: 'short' });
        return { label: `${monthName} ${year}`, value: count };
      })
    );

    // Treatment Type Distribution
    const treatments = await Treatment.find();
    const distributionMap: { [key: string]: number } = {};
    treatments.forEach((t) => {
      distributionMap[t.title] = (distributionMap[t.title] || 0) + 1;
    });

    const treatmentDistribution = Object.keys(distributionMap).map((key) => ({
      label: key,
      value: distributionMap[key]
    }));

    res.status(200).json({
      success: true,
      data: {
        revenueTrend,
        patientGrowth,
        treatmentDistribution
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
