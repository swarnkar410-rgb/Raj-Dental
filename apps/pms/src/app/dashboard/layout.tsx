'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Receipt, 
  BarChart3, 
  Settings, 
  LogOut, 
  Bell, 
  UserCheck,
  Check,
  X,
  Clock,
  Inbox,
  Menu
} from 'lucide-react';
import { getTokens, clearTokens, apiRequest } from '../../utils/api';
import { AnimatePresence, motion } from 'framer-motion';
import AppointmentReviewDrawer from '../../components/AppointmentReviewDrawer';

import logoLight from '../../../../../assets/pms/logo.jpeg';

// ─────────────────────────────────────────────────────────────────────────────
// Shared notification context helpers
// The layout owns the notification state; child pages dispatch events to
// trigger a re-fetch without prop-drilling through next.js layouts.
// ─────────────────────────────────────────────────────────────────────────────
export const NOTIFICATION_REFRESH_EVENT = 'raj_dental_notification_refresh';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer when route pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // ── Notification state ───────────────────────────────────────────────────
  // Only holds PENDING (actionable) requests — processed ones are excluded.
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // ── Review Drawer ────────────────────────────────────────────────────────
  const [reviewAppointmentId, setReviewAppointmentId] = useState<string | null>(null);
  const [reviewNotificationId, setReviewNotificationId] = useState<string | null>(null);
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Click-outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // fetchPendingRequests
  // Source of truth for notification badge:
  //   COUNT(*) FROM appointment_requests WHERE status = 'pending'
  // Only pending (unprocessed) requests are shown in the dropdown.
  // ─────────────────────────────────────────────────────────────────────────
  const fetchPendingRequests = useCallback(async () => {
    try {
      const res = await apiRequest('/appointments/requests?status=pending');
      if (res.success) {
        setPendingRequests(res.data);
        setPendingCount(res.data.length);
      }
    } catch (err) {
      console.error('Failed to load pending requests:', err);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const tokens = getTokens();
    if (!tokens.access) {
      router.replace('/login');
      return;
    }

    fetchPendingRequests();

    // Poll every 30 seconds for new website bookings
    const interval = setInterval(fetchPendingRequests, 30000);

    // Also listen for manual refresh events dispatched by child pages
    // (e.g., appointments page after approving from the requests tab)
    const handleRefreshEvent = () => fetchPendingRequests();
    window.addEventListener(NOTIFICATION_REFRESH_EVENT, handleRefreshEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIFICATION_REFRESH_EVENT, handleRefreshEvent);
    };
  }, [router, fetchPendingRequests]);

  const handleLogout = () => {
    clearTokens();
    router.replace('/login');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // handleNotificationClick
  // Optimistic update: immediately remove from pending list + decrement badge.
  // Opens the review drawer. If API action fails, fetchPendingRequests()
  // will restore the item on the next poll or explicit refresh.
  // ─────────────────────────────────────────────────────────────────────────
  const handleNotificationClick = (request: any) => {
    setShowNotifications(false);

    // Optimistic: move this item out of pending visually
    // (it will be fully removed after the doctor takes action)
    setReviewAppointmentId(request._id);
    setReviewNotificationId(request._id); // same ID for the request
    setIsReviewDrawerOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // handleDrawerActionSuccess
  // Called by the review drawer after approve / reject / reschedule succeeds.
  // Optimistically removes the processed request from the badge + dropdown.
  // ─────────────────────────────────────────────────────────────────────────
  const handleDrawerActionSuccess = (processedRequestId: string, toastMessage: string) => {
    if (processedRequestId) {
      // Real action (approve/reject/reschedule) — optimistically remove from pending list
      setPendingRequests(prev => prev.filter(r => r._id !== processedRequestId));
      setPendingCount(prev => Math.max(0, prev - 1));

      setIsReviewDrawerOpen(false);
      setReviewAppointmentId(null);
      setReviewNotificationId(null);

      // Also fire a full re-fetch to ensure server-side consistency
      fetchPendingRequests();
    }
    // Always show the toast
    setSuccessToast(toastMessage);
  };

  if (!mounted) return null;

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Patients', path: '/dashboard/patients', icon: <Users size={18} /> },
    { label: 'Appointments', path: '/dashboard/appointments', icon: <Calendar size={18} /> },
    { label: 'Availability', path: '/dashboard/availability', icon: <Clock size={18} /> },
    { label: 'Billing & Invoices', path: '/dashboard/billing', icon: <Receipt size={18} /> },
    { label: 'Reports', path: '/dashboard/reports', icon: <BarChart3 size={18} /> },
    { label: 'Settings', path: '/dashboard/settings', icon: <Settings size={18} /> }
  ];

  return (
    <div className="flex h-screen bg-[#070C16] text-white overflow-hidden">
      {/* Desktop Sidebar Panel */}
      <aside className="hidden lg:flex w-64 bg-[#0B1220] border-r border-white/5 flex-col justify-between h-full no-print">
        {/* Top brand header */}
        <div>
          <div className="p-6 border-b border-white/5 flex items-center space-x-3">
            <div className="relative w-9 h-9 flex-shrink-0 bg-white/5 border border-white/10 rounded-xl p-1.5 shadow-sm">
              <img 
                src={typeof logoLight === 'object' ? logoLight.src : logoLight} 
                alt="Raj Dental Logo" 
                className="w-full h-full object-contain" 
              />
              <div className="absolute -bottom-0.5 left-1 right-1 h-[2px] bg-[#D4AF37] rounded-full z-10"></div>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-white tracking-wide text-sm leading-tight">RAJ DENTAL</span>
              <span className="text-[9px] text-gray-500 tracking-wider font-semibold uppercase">PMS Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#145DA0]/20 to-[#3B82F6]/20 border-l-4 border-[#3B82F6] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={isActive ? 'text-[#3B82F6]' : 'text-gray-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom doctor details & logout */}
        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-white/3 border border-white/5">
            <div className="p-2 bg-gradient-to-tr from-[#145DA0] to-[#3B82F6] rounded-lg text-white">
              <UserCheck size={16} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-none">Dr. Manoj Kumar</span>
              <span className="text-[9px] text-gray-500 font-semibold tracking-wider uppercase mt-1">Lead Surgeon</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl border border-red-500/10 hover:border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-300 hover:text-red-200 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden no-print"
            />
            
            {/* Drawer Content */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-64 bg-[#0B1220] border-r border-white/5 flex flex-col justify-between h-full z-50 lg:hidden no-print shadow-2xl"
            >
              <div>
                {/* Brand header with close button */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-9 h-9 flex-shrink-0 bg-white/5 border border-white/10 rounded-xl p-1.5 shadow-sm">
                      <img 
                        src={typeof logoLight === 'object' ? logoLight.src : logoLight} 
                        alt="Raj Dental Logo" 
                        className="w-full h-full object-contain" 
                      />
                      <div className="absolute -bottom-0.5 left-1 right-1 h-[2px] bg-[#D4AF37] rounded-full z-10"></div>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-white tracking-wide text-sm leading-tight">RAJ DENTAL</span>
                      <span className="text-[9px] text-gray-500 tracking-wider font-semibold uppercase">PMS Portal</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="p-4 space-y-1.5">
                  {navItems.map((item) => {
                    const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          router.push(item.path);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-[#145DA0]/20 to-[#3B82F6]/20 border-l-4 border-[#3B82F6] text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className={isActive ? 'text-[#3B82F6]' : 'text-gray-400'}>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom doctor details & logout */}
              <div className="p-4 border-t border-white/5 space-y-4">
                <div className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-white/3 border border-white/5">
                  <div className="p-2 bg-gradient-to-tr from-[#145DA0] to-[#3B82F6] rounded-lg text-white">
                    <UserCheck size={16} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-none">Dr. Manoj Kumar</span>
                    <span className="text-[9px] text-gray-500 font-semibold tracking-wider uppercase mt-1">Lead Surgeon</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl border border-red-500/10 hover:border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-300 hover:text-red-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content right pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header navbar */}
        <header className="h-16 bg-[#0B1220] border-b border-white/5 px-4 sm:px-8 flex items-center justify-between no-print z-40">
          <div className="flex items-center">
            {/* Hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2.5 mr-3 bg-white/3 hover:bg-white/6 border border-white/5 rounded-xl text-gray-300 hover:text-white transition-all cursor-pointer lg:hidden"
            >
              <Menu size={18} />
            </button>
            <div className="flex flex-col text-left">
              <h2 className="text-xs sm:text-sm font-bold text-gray-400 leading-tight">Welcome back, Dr. Manoj</h2>
              <p className="text-[9px] sm:text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                <span className="inline sm:hidden">Raj Dental &amp; Hospital</span>
                <span className="hidden sm:inline">Raj Dental &amp; Implant Hospital</span>
              </p>
            </div>
          </div>

          {/* Notification Bell */}
          <div ref={notificationRef} className="flex items-center space-x-4 relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 text-gray-300 hover:text-white transition-all relative cursor-pointer"
            >
              <Bell size={18} />
              {/* Badge: only shown when there are PENDING (unprocessed) requests */}
              <AnimatePresence>
                {pendingCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[8px] font-black text-white rounded-full flex items-center justify-center"
                  >
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[#0B1220] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-4 space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h4 className="font-extrabold text-sm text-white">Online Booking Requests</h4>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-[#3B82F6]">
                      {pendingCount} Pending
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {pendingRequests.length === 0 ? (
                      /* Empty state when all requests have been processed */
                      <div className="flex flex-col items-center justify-center py-8 space-y-2 text-center">
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <Inbox size={20} className="text-emerald-400" />
                        </div>
                        <p className="text-xs font-bold text-white">All caught up!</p>
                        <p className="text-[10px] text-gray-500">No pending appointment requests.</p>
                      </div>
                    ) : (
                      pendingRequests.map((request) => (
                        <motion.div
                          key={request._id}
                          layout
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10, height: 0 }}
                          onClick={() => handleNotificationClick(request)}
                          className="p-3 rounded-xl border bg-[#3B82F6]/5 border-[#3B82F6]/20 hover:bg-[#3B82F6]/10 shadow-sm transition-all text-left cursor-pointer space-y-1.5"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border bg-blue-500/10 text-[#3B82F6] border-blue-500/20">
                              {request.status === 'PENDING_REVIEW' ? 'PENDING REVIEW' : request.status.replace('_', ' ')}
                            </span>
                            <span className="text-[9px] text-gray-500">
                              {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="font-bold text-xs text-white leading-tight">
                            {request.patientName}
                          </div>
                          <p className="text-[10px] text-gray-400 leading-normal">
                            {request.treatmentType} &bull; {request.timeSlot}
                          </p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Dynamic Inner views */}
        <main className="flex-1 overflow-y-auto bg-[#070C16] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Review Drawer — opened when doctor clicks a pending request notification */}
      <AnimatePresence>
        {isReviewDrawerOpen && reviewAppointmentId && (
          <AppointmentReviewDrawer
            isOpen={true}
            appointmentId={reviewAppointmentId}
            notificationId={reviewNotificationId}
            onClose={() => {
              setIsReviewDrawerOpen(false);
              setReviewAppointmentId(null);
              setReviewNotificationId(null);
            }}
            onActionSuccess={handleDrawerActionSuccess}
          />
        )}
      </AnimatePresence>

      {/* Floating Success Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[200] p-4 bg-[#0F172A] border border-[#10B981]/30 rounded-2xl shadow-2xl flex items-center space-x-3 text-white max-w-none sm:max-w-sm"
          >
            <div className="p-2 bg-[#10B981]/15 text-[#10B981] rounded-xl flex-shrink-0">
              <Check size={18} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest leading-none">Success</p>
              <p className="text-xs text-gray-300 mt-1.5 font-medium leading-relaxed">{successToast}</p>
            </div>
            <button 
              onClick={() => setSuccessToast(null)}
              className="p-1 text-gray-500 hover:text-white cursor-pointer flex-shrink-0"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
