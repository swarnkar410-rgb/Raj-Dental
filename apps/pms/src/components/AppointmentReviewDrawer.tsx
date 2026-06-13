'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, User, Calendar, ShieldCheck, Clock, FileText, AlertTriangle, ArrowRight, UserPlus, MessageSquare } from 'lucide-react';
import { apiRequest } from '../utils/api';
import ConfirmModal from './ConfirmModal';
import RescheduleModal from './RescheduleModal';
import RejectModal from './RejectModal';
import { useRouter } from 'next/navigation';
import { formatDate } from '../utils/date';

interface AppointmentReviewDrawerProps {
  isOpen: boolean;
  appointmentId: string | null;
  notificationId: string | null;
  onClose: () => void;
  // processedRequestId: the _id of the AppointmentRequest that was processed.
  // Layout uses this for optimistic badge decrement.
  onActionSuccess: (processedRequestId: string, msg: string) => void;
}

export default function AppointmentReviewDrawer({ isOpen, appointmentId, notificationId, onClose, onActionSuccess }: AppointmentReviewDrawerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  
  // Modals state
  const [activeModal, setActiveModal] = useState<'approve' | 'reschedule' | 'reject' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (isOpen && appointmentId) {
      const fetchReviewDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await apiRequest(`/appointments/${appointmentId}/review`);
          if (res.success) {
            setData(res.data);
          } else {
            setError(res.message || 'Failed to fetch details');
          }
        } catch (err: any) {
          setError(err.message || 'Failed to fetch review details');
        } finally {
          setLoading(false);
        }
      };

      fetchReviewDetails();
    }
  }, [isOpen, appointmentId, notificationId]);

  if (!isOpen) return null;

  // Handle Approve Action
  const handleApprove = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiRequest(`/appointments/${appointmentId}/approve`, {
        method: 'PUT'
      });
      if (res.success) {
        onActionSuccess(appointmentId!, 'Appointment has been approved and added to the calendar successfully!');
        setActiveModal(null);
      } else {
        setError(res.message || 'Failed to approve appointment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reschedule Action
  const handleReschedule = async (newDate: string, newTimeSlot: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiRequest(`/appointments/${appointmentId}/review-reschedule`, {
        method: 'PUT',
        body: JSON.stringify({ date: newDate, timeSlot: newTimeSlot })
      });
      if (res.success) {
        onActionSuccess(appointmentId!, `Appointment rescheduled to ${newDate} at ${newTimeSlot}.`);
        setActiveModal(null);
      } else {
        setError(res.message || 'Failed to reschedule appointment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reject Action
  const handleReject = async (reason: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiRequest(`/appointments/${appointmentId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });
      if (res.success) {
        onActionSuccess(appointmentId!, `Appointment request rejected. Reason: "${reason}".`);
        setActiveModal(null);
      } else {
        setError(res.message || 'Failed to reject appointment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle manual resend of WhatsApp notification
  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const res = await apiRequest(`/appointments/${appointmentId}/resend-notification`, {
        method: 'POST'
      });
      if (res.success) {
        // Refresh the review details to show the updated sent time and status
        const refreshRes = await apiRequest(`/appointments/${appointmentId}/review`);
        if (refreshRes.success) {
          setData(refreshRes.data);
        }
        onActionSuccess('', 'WhatsApp notification resent successfully!');
      } else {
        setError(res.message || 'Failed to resend notification');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend notification');
    } finally {
      setResending(false);
    }
  };

  const statusColors: any = {
    new: 'bg-blue-500/10 text-[#3B82F6] border-blue-500/20',
    viewed: 'bg-white/5 text-gray-400 border-white/10',
    approved: 'bg-emerald-500/10 text-[#10B981] border-emerald-500/20',
    rescheduled: 'bg-amber-500/10 text-[#F59E0B] border-amber-500/20',
    rejected: 'bg-red-500/10 text-[#EF4444] border-red-500/20'
  };

  return (
    <>
      {/* Background Dim Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] no-print"
        onClick={onClose}
      />

      {/* Right Drawer Slide-over */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-[#020817] border-l border-white/5 shadow-2xl z-[90] flex flex-col overflow-hidden text-white no-print"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0B1220]">
          <div>
            <h3 className="font-extrabold text-lg text-white leading-tight">Appointment Request</h3>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5 block">Review Drawer Panel</span>
          </div>

          <div className="flex items-center space-x-3">
            {data && (
              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                ['PENDING_REVIEW', 'pending'].includes(data.appointment.status)
                  ? 'bg-blue-500/10 text-[#3B82F6] border-blue-500/20'
                  : ['APPROVED', 'approved'].includes(data.appointment.status)
                  ? 'bg-emerald-500/10 text-[#10B981] border-emerald-500/20'
                  : ['REJECTED', 'rejected'].includes(data.appointment.status)
                  ? 'bg-red-500/10 text-[#EF4444] border-red-500/20'
                  : 'bg-amber-500/10 text-[#F59E0B] border-amber-500/20'
              }`}>
                {data.appointment.status === 'PENDING_REVIEW' ? 'PENDING REVIEW' : data.appointment.status.replace('_', ' ')}
              </span>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center space-x-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            /* Custom skeleton loader */
            <div className="space-y-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-3 bg-white/5 rounded-full w-1/3" />
                <div className="h-20 bg-white/5 rounded-xl w-full" />
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-white/5 rounded-full w-1/3" />
                <div className="h-28 bg-white/5 rounded-xl w-full" />
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-white/5 rounded-full w-1/3" />
                <div className="h-24 bg-white/5 rounded-xl w-full" />
              </div>
            </div>
          ) : (
            data && (
              <>
                {/* Patient Information Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
                    <User size={14} className="text-[#3B82F6]" />
                    <span>Patient Information</span>
                  </div>
                  
                  <div className="p-4 bg-[#0F172A] border border-white/5 rounded-2xl space-y-3 shadow-md">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-xs text-gray-400">Name</span>
                      <span className="text-sm text-white font-extrabold">{data.appointment.patientName}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-xs text-gray-400">Phone</span>
                      <span className="text-sm text-white font-semibold">{data.appointment.patientPhone}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2 text-wrap break-all">
                      <span className="text-xs text-gray-400">Email</span>
                      <span className="text-sm text-white font-semibold">{data.appointment.patientEmail || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Gender / Age</span>
                      <span className="text-sm text-white font-bold">
                        {data.patientHistory?.gender || 'Other'} &bull; {data.patientHistory?.age ? `${data.patientHistory.age} yrs` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Appointment Info Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
                    <Calendar size={14} className="text-[#D4AF37]" />
                    <span>Appointment Details</span>
                  </div>
                  
                  <div className="p-4 bg-[#0F172A] border border-white/5 rounded-2xl space-y-3 shadow-md">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-xs text-gray-400">Treatment</span>
                      <span className="text-sm text-white font-bold">{data.appointment.treatmentType}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-xs text-gray-400">Proposed Slot</span>
                      <span className="text-sm text-emerald-400 font-bold">
                        {formatDate(data.appointment.date)} &bull; {data.appointment.timeSlot}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-400 block">Notes &amp; Symptoms</span>
                      <div className="text-xs text-gray-300 bg-[#020817] border border-white/5 p-3 rounded-xl leading-relaxed italic">
                        {data.appointment.notes || 'No notes submitted.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Notification Tracking Section */}
                {!['PENDING_REVIEW', 'pending'].includes(data.appointment.status) && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
                      <MessageSquare size={14} className="text-[#25D366]" />
                      <span>WhatsApp Notification</span>
                    </div>
                    
                    <div className="p-4 bg-[#0F172A] border border-white/5 rounded-2xl space-y-3 shadow-md">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-xs text-gray-400">Delivery Status</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                          data.appointment.notificationStatus === 'SENT'
                            ? 'bg-emerald-500/10 text-[#10B981] border-emerald-500/20'
                            : data.appointment.notificationStatus === 'FAILED'
                            ? 'bg-red-500/10 text-[#EF4444] border-red-500/20'
                            : 'bg-white/5 text-gray-400 border-white/10'
                        }`}>
                          {data.appointment.notificationStatus || 'PENDING'}
                        </span>
                      </div>
                      
                      {data.appointment.sentAt && (
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-xs text-gray-400">Last Sent At</span>
                          <span className="text-xs text-white font-semibold">
                            {new Date(data.appointment.sentAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      )}

                      {data.appointment.deliveryStatus && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-400 block">Gateway Response</span>
                          <div className="text-xs text-gray-300 bg-[#020817] border border-white/5 p-3 rounded-xl leading-relaxed">
                            {data.appointment.deliveryStatus}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleResend}
                        disabled={resending}
                        className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white transition-all text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        {resending ? 'Resending...' : 'Resend WhatsApp'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Patient History / Status Info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">
                    <ShieldCheck size={14} className="text-[#10B981]" />
                    <span>Registration History</span>
                  </div>

                  {data.patientStatus === 'New Patient' ? (
                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <span className="font-extrabold text-xs text-[#3B82F6] flex items-center space-x-1.5">
                          <UserPlus size={14} />
                          <span>NEW PATIENT PROFILE</span>
                        </span>
                        <p className="text-[10px] text-gray-400 leading-normal">
                          This phone number isn't linked to an existing chart. A profile will be fully activated upon approval.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#0F172A] border border-white/5 rounded-2xl space-y-3.5 shadow-md">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-xs text-emerald-400 font-black tracking-wide uppercase">EXISTING CHART RECORD</span>
                        <span className="text-[10px] text-gray-400 font-bold">{data.patientHistory.patientIdString}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Total Visits</span>
                          <span className="text-lg font-black text-white">{data.patientHistory.totalVisits}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Last Completed Visit</span>
                          <span className="text-xs font-bold text-gray-200">{data.patientHistory.lastVisitDate ? formatDate(data.patientHistory.lastVisitDate) : 'Never'}</span>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Pending Amount</span>
                          <span className={`text-sm font-extrabold ${data.patientHistory.outstandingBalance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            ₹{data.patientHistory.outstandingBalance.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Active Care Plans</span>
                          <span className="text-[10px] font-semibold text-gray-300 block truncate">
                            {data.patientHistory.ongoingTreatments.join(', ') || 'None'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-6 border-t border-white/5 bg-[#0B1220] flex flex-col space-y-3 no-print">
          {data && !loading && (
            <>
              {/* Call and view profile row */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${data.appointment.patientPhone}`}
                  className="flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white transition-all text-xs font-bold cursor-pointer"
                >
                  <Phone size={14} className="text-[#3B82F6]" />
                  <span>Call Patient</span>
                </a>
                
                <button
                  onClick={() => {
                    if (data.patientHistory?.patientId) {
                      router.push(`/dashboard/patients/${data.patientHistory.patientId}`);
                      onClose();
                    } else {
                      // Pass empty string for processedRequestId — this is info-only, not an action
                      onActionSuccess('', 'No profile created yet. Profile is generated upon request approval.');
                    }
                  }}
                  className="flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white transition-all text-xs font-bold cursor-pointer"
                >
                  <User size={14} className="text-[#D4AF37]" />
                  <span>View Profile</span>
                </button>
              </div>

              {/* Action buttons (only active if status is pending/new) */}
              {['PENDING_REVIEW', 'pending'].includes(data.appointment.status) && (
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <button
                    onClick={() => setActiveModal('reject')}
                    className="py-3 rounded-xl border border-red-500/10 hover:border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all cursor-pointer"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => setActiveModal('reschedule')}
                    className="py-3 rounded-xl border border-amber-500/10 hover:border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 text-xs font-bold transition-all cursor-pointer"
                  >
                    Reschedule
                  </button>

                  <button
                    onClick={() => setActiveModal('approve')}
                    className="py-3 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b77ca] hover:to-[#5fa0ff] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              )}
              
              {!['PENDING_REVIEW', 'pending'].includes(data.appointment.status) && (
                <div className="p-3 bg-white/3 border border-white/5 rounded-xl text-center text-xs text-gray-400 font-semibold leading-relaxed">
                  This appointment request has already been processed with status:{' '}
                  <span className="text-white uppercase font-black">{data.appointment.status.replace('_', ' ')}</span>.
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Action Modals */}
      <AnimatePresence>
        {activeModal === 'approve' && data && (
          <ConfirmModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            onConfirm={handleApprove}
            submitting={submitting}
            data={{
              patientName: data.appointment.patientName,
              treatmentType: data.appointment.treatmentType,
              date: data.appointment.date,
              timeSlot: data.appointment.timeSlot
            }}
          />
        )}

        {activeModal === 'reschedule' && data && (
          <RescheduleModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            onReschedule={handleReschedule}
            submitting={submitting}
            currentDate={data.appointment.date}
            currentTimeSlot={data.appointment.timeSlot}
          />
        )}

        {activeModal === 'reject' && data && (
          <RejectModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            onReject={handleReject}
            submitting={submitting}
          />
        )}
      </AnimatePresence>
    </>
  );
}
