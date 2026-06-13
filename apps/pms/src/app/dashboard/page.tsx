'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Calendar, 
  IndianRupee, 
  Bell, 
  Plus, 
  TrendingUp, 
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import CountUp from 'react-countup';
import { apiRequest } from '../../utils/api';
import { formatDateToDMY } from '../../utils/date';
import RevenueTrendChart from '../../components/RevenueTrendChart';

interface Stats {
  totalPatients: number;
  todayAppointmentsCount: number;
  monthlyRevenue: number;
  pendingPaymentsCount: number;
  recentPatients: any[];
  upcomingAppointments: any[];
  recentActivity: any[];
  occupancy: {
    totalSlots: number;
    bookedSlots: number;
    availableSlots: number;
    occupancyRate: number;
    nextAvailableSlot: string;
  };
  pendingRequestsCount: number;
  todayActivity?: {
    total: number;
    completed: number;
    booked: number;
    cancelled: number;
    noShow: number;
    available: number;
  };
  todayRevenue?: {
    amount: number;
    changePercent: number;
  };
  todayLeave?: {
    startDate: string;
    endDate: string;
    reason: string;
  } | null;
}

interface Analytics {
  revenueTrend: { label: string; value: number }[];
  patientGrowth: { label: string; value: number }[];
  treatmentDistribution: { label: string; value: number }[];
}

const parseAppointmentDateTime = (dateStr: string, timeStr: string): Date => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    let hours = 9;
    let minutes = 0;
    if (match) {
      hours = Number(match[1]);
      minutes = Number(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
    return new Date(year, month - 1, day, hours, minutes);
  } catch (e) {
    return new Date(dateStr);
  }
};

const formatDatePart = (dateStr: string): string => {
  try {
    const [year, month, day] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[parseInt(month, 10) - 1] || 'Jun';
    return `${day.padStart(2, '0')} ${monthName} ${year}`;
  } catch (e) {
    return dateStr;
  }
};

// Staggered animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const statsRes = await apiRequest('/reports/dashboard-stats');
        const analyticsRes = await apiRequest('/reports/analytics-data');
        if (statsRes.success) setStats(statsRes.data);
        if (analyticsRes.success) setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Fallbacks for safety
  const todayActivity = stats.todayActivity || { total: 0, completed: 0, booked: 0, cancelled: 0, noShow: 0, available: 0 };
  const todayRevenue = stats.todayRevenue || { amount: 0, changePercent: 0 };

  // Next Upcoming Appointment (guaranteed to be after leave, filtered by backend)
  const nextApp = stats.upcomingAppointments && stats.upcomingAppointments.length > 0
    ? stats.upcomingAppointments[0]
    : null;

  // Appointment Status style helper
  const getAppointmentStatusStyle = (status: string) => {
    const norm = status.toLowerCase();
    if (norm === 'approved' || norm === 'rescheduled' || norm === 'booked' || norm === 'pending') {
      return { label: 'BOOKED', color: 'bg-blue-500/10 text-[#3B82F6] border border-[#3B82F6]/20' };
    }
    if (norm === 'completed') {
      return { label: 'COMPLETED', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
    }
    if (norm === 'cancelled' || norm === 'rejected') {
      return { label: 'CANCELLED', color: 'bg-red-500/10 text-red-400 border border-red-500/20' };
    }
    if (norm === 'no_show') {
      return { label: 'NO SHOW', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
    }
    return { label: status.toUpperCase(), color: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' };
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Top Welcome Title & CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Overview Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-400">Real-time statistics of Raj Dental & Implant Hospital operations.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/dashboard/patients?action=add')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b76ca] hover:to-[#5ea0ff] text-white text-xs sm:text-sm font-bold shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Patient</span>
          </button>
          <button
            onClick={() => router.push('/dashboard/appointments')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-200 hover:text-white transition-all text-xs sm:text-sm font-bold cursor-pointer"
          >
            <Calendar size={16} />
            <span>Planner View</span>
          </button>
        </div>
      </div>

      {/* Top Row Metric Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
      >
        {/* Card 1: Total Patients */}
        <motion.div variants={itemVariants} className="panel-card p-6 flex flex-col justify-between shadow-lg h-full relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Patients</span>
              <div className="text-3xl font-black text-white">
                <CountUp end={stats.totalPatients} duration={1.2} separator="," />
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/15 text-[#3B82F6] group-hover:bg-[#3B82F6]/25 transition-all">
              <Users size={18} />
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold mt-4 block border-t border-white/5 pt-3">All time register</span>
        </motion.div>

        {/* Card 2: Today's Activity */}
        <motion.div variants={itemVariants} className="panel-card p-6 flex flex-col justify-between shadow-lg h-full border border-white/5 min-h-[140px]">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Today's Activity</span>
            {stats.todayLeave ? (
              <div className="flex flex-col items-center justify-center py-2 text-center space-y-1.5">
                <span className="text-2xl" role="img" aria-label="leave">🏖</span>
                <div className="text-xs font-black text-red-400 uppercase tracking-wide">Clinic Closed</div>
                <div className="text-[10px] text-gray-300 font-bold">Doctor Leave Active</div>
                <div className="text-[9px] text-gray-500 font-semibold">
                  {formatDateToDMY(stats.todayLeave.startDate)} to {formatDateToDMY(stats.todayLeave.endDate)}
                </div>
                <div className="text-[8px] text-gray-500 italic mt-0.5">No appointments available today.</div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-3xl font-black text-white">
                    <CountUp end={todayActivity.total} duration={1.0} />
                  </span>
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Appts Today</span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] font-bold border-t border-white/5 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Completed
                    </span>
                    <span className="text-emerald-400 font-black">{todayActivity.completed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" /> Booked
                    </span>
                    <span className="text-blue-400 font-black">{todayActivity.booked}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Cancelled
                    </span>
                    <span className="text-red-400 font-black">{todayActivity.cancelled}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> No Show
                    </span>
                    <span className="text-amber-400 font-black">{todayActivity.noShow}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Available
                    </span>
                    <span className="text-cyan-400 font-black">{todayActivity.available}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Card 3: Today's Revenue */}
        <motion.div variants={itemVariants} className="panel-card p-6 flex flex-col justify-between shadow-lg h-full group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Today's Revenue</span>
              <div className="text-3xl font-black text-white flex items-center">
                <span>₹</span>
                <CountUp end={todayRevenue.amount} separator="," duration={1.2} />
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500/25 transition-all">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="flex items-center space-x-1.5 border-t border-white/5 pt-3 mt-4">
            {todayRevenue.changePercent >= 0 ? (
              <>
                <TrendingUp size={12} className="text-emerald-400" />
                <span className="text-emerald-400 font-black text-xs">+{todayRevenue.changePercent}%</span>
              </>
            ) : (
              <>
                <TrendingDown size={12} className="text-red-400" />
                <span className="text-red-400 font-black text-xs">{todayRevenue.changePercent}%</span>
              </>
            )}
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">from yesterday</span>
          </div>
        </motion.div>

        {/* Card 4: Next Appointment */}
        <motion.div variants={itemVariants} className="panel-card p-6 flex flex-col justify-between shadow-lg h-full">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Next Appointment</span>
            {nextApp ? (
              <div className="space-y-1.5">
                <div className="text-sm font-black text-white truncate max-w-[140px]">{nextApp.patientName}</div>
                <div className="text-[10px] text-emerald-400 font-bold">{formatDateToDMY(nextApp.date)}</div>
                <div className="flex items-center justify-between text-[11px] gap-2">
                  <span className="text-gray-400 truncate max-w-[85px]">{nextApp.treatmentType}</span>
                  <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-500/15 shrink-0">
                    {nextApp.timeSlot}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-xs font-semibold py-1.5">No Upcoming Appointments</div>
            )}
          </div>
          <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Status</span>
            {nextApp ? (
              <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-[#3B82F6] border border-blue-500/20 uppercase tracking-widest">
                {nextApp.status}
              </span>
            ) : (
              <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/5 uppercase tracking-widest">
                None
              </span>
            )}
          </div>
        </motion.div>

        {/* Card 5: Pending website requests count */}
        <motion.div 
          variants={itemVariants}
          onClick={() => router.push('/dashboard/appointments')}
          className="panel-card p-6 flex flex-col justify-between shadow-lg cursor-pointer hover:border-[#3B82F6]/30 transition-all group h-full"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pending Requests</span>
              <div className="text-3xl font-black text-white flex items-center space-x-2">
                <span>{stats.pendingRequestsCount}</span>
                {stats.pendingRequestsCount > 0 && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                )}
              </div>
            </div>
            <div className={`p-3 rounded-xl border transition-all ${
              stats.pendingRequestsCount > 0
                ? 'bg-red-500/10 border-red-500/15 text-red-400 group-hover:bg-red-500/20'
                : 'bg-white/5 border-white/10 text-gray-500'
            }`}>
              <Bell size={18} />
            </div>
          </div>
          <span className="text-[10px] text-gray-500 font-bold mt-4 block border-t border-white/5 pt-3 group-hover:text-white flex items-center space-x-0.5 transition-colors">
            <span>Awaiting review</span>
            <ChevronRight size={10} />
          </span>
        </motion.div>
      </motion.div>

      {/* Second Row Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left: Financial Revenue Trend Chart (70%) */}
        <div className="lg:col-span-7 panel-card p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-base text-white">Financial Revenue Trend</h3>
              <p className="text-[10px] text-gray-400">Monthly breakdown of recorded payments (INR).</p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-[#D4AF37] font-bold">
              <TrendingUp size={14} />
              <span>Monthly Growth</span>
            </div>
          </div>

          <div className="w-full relative pt-4 overflow-visible">
            {analytics && (
              <RevenueTrendChart data={analytics.revenueTrend} />
            )}
          </div>
        </div>

        {/* Right: Treatment Distribution Chart (30%) */}
        <div className="lg:col-span-3 panel-card p-6 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base text-white">Treatment Distribution</h3>
            <p className="text-[10px] text-gray-400">Distribution of completed treatments.</p>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {analytics?.treatmentDistribution.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-500">No treatments recorded yet.</div>
            ) : (
              analytics?.treatmentDistribution.slice(0, 5).map((data, idx) => {
                const total = analytics.treatmentDistribution.reduce((sum, item) => sum + item.value, 0);
                const percent = Math.round((data.value / total) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-300 truncate max-w-[140px]">{data.label}</span>
                      <span className="font-semibold text-white">{percent}% ({data.value})</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${
                          idx % 2 === 0 ? 'from-[#145DA0] to-[#3B82F6]' : 'from-[#D4AF37] to-[#8a6e1a]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Third Row List: Upcoming Appointments (Expanded 100% Width) */}
      <div className="w-full">
        {/* Left: Upcoming Appointments (Future Work) */}
        <div className="panel-card p-6 space-y-5 shadow-lg">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-white">Upcoming Appointments</h3>
              <p className="text-[10px] text-gray-400">Future booked/pending clinic sessions only (nearest first).</p>
            </div>
            <button 
              onClick={() => router.push('/dashboard/appointments')}
              className="text-xs font-bold text-[#3B82F6] hover:text-[#5ea0ff] flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <span>View Planner</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-6">
            {stats.upcomingAppointments.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-500">No upcoming appointments</div>
            ) : (() => {
              const sortedUpcoming = [...stats.upcomingAppointments].sort((a, b) => {
                const dateA = parseAppointmentDateTime(a.date, a.timeSlot).getTime();
                const dateB = parseAppointmentDateTime(b.date, b.timeSlot).getTime();
                return dateA - dateB;
              });

              const todayObj = new Date();
              const todayStr = todayObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

              const tomorrowObj = new Date();
              tomorrowObj.setDate(tomorrowObj.getDate() + 1);
              const tomorrowStr = tomorrowObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

              const todayApps = sortedUpcoming.filter(app => app.date === todayStr);
              const tomorrowApps = sortedUpcoming.filter(app => app.date === tomorrowStr);
              const futureApps = sortedUpcoming.filter(app => app.date !== todayStr && app.date !== tomorrowStr);

              const groups = [
                { title: 'Today', appointments: todayApps, badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                { title: 'Tomorrow', appointments: tomorrowApps, badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                { title: 'Future Dates', appointments: futureApps, badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
              ];

              return (
                <div className="divide-y divide-white/5 space-y-6">
                  {groups.map((group) => {
                    if (group.appointments.length === 0) return null;
                    return (
                      <div key={group.title} className="space-y-4 pt-5 first:pt-0 border-none">
                        <div className="flex items-center space-x-2.5">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-widest border ${group.badgeColor}`}>
                            {group.title}
                          </span>
                          <div className="flex-1 h-[1px] bg-white/5" />
                        </div>
                        <div className="divide-y divide-white/5 space-y-3.5">
                          {group.appointments.map((app) => {
                            const style = getAppointmentStatusStyle(app.status);
                            return (
                              <div key={app._id} className="flex justify-between items-center pt-3.5 first:pt-0">
                                <div className="space-y-1.5">
                                  <div className="font-extrabold text-sm text-white tracking-wide">{app.patientName}</div>
                                  <div className="text-[11px] text-gray-400 flex items-center space-x-2">
                                    <span className="text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 shrink-0">
                                      {app.treatmentType}
                                    </span>
                                    <span>&bull;</span>
                                    <div className="flex items-center text-xs tracking-wide">
                                      <span className="text-xs font-black text-blue-400">
                                        {formatDatePart(app.date)}
                                      </span>
                                      <span className="text-gray-500 mx-1.5 font-bold">•</span>
                                      <span className="text-xs font-bold text-gray-300">
                                        {app.timeSlot}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${style.color}`}>
                                    {style.label}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
