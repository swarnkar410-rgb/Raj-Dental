'use client';

import React, { useState } from 'react';
import { Settings, ShieldAlert, CheckCircle2, Lock, Loader2, Clock, Phone } from 'lucide-react';
import { apiRequest } from '../../../utils/api';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const [clinicData, setClinicData] = useState({
    clinicName: 'Raj Dental & Implant Hospital',
    location: 'Raj Sadan, Jahaji Kothi Rd, Dariyapur Gola, Patna, Bihar 800004',
    phone: '+91 91994 19594',
    whatsappNumber: '919199419594',
    startHours: '09:30 AM',
    endHours: '07:30 PM'
  });

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (newPassword !== confirmPassword) {
      setMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/auth/update-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (res.success) {
        setMsg({ text: 'Password changed successfully!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to update password.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClinicUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Clinic settings updated locally (demonstration mode).');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">System Settings</h1>
        <p className="text-xs sm:text-sm text-gray-400">Configure clinic schedules, hotline numbers, and change access passwords.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Clinic profile and schedules */}
        <div className="panel-card p-6 space-y-6 shadow-lg">
          <h3 className="font-extrabold text-base text-white border-b border-white/5 pb-2 flex items-center space-x-2">
            <Clock size={18} className="text-[#3B82F6]" />
            <span>Clinic Configuration</span>
          </h3>

          <form onSubmit={handleClinicUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 uppercase block">Clinic Name</label>
              <input
                type="text"
                value={clinicData.clinicName}
                onChange={(e) => setClinicData({ ...clinicData, clinicName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 uppercase block">Clinic Location</label>
              <input
                type="text"
                value={clinicData.location}
                onChange={(e) => setClinicData({ ...clinicData, location: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase block">Clinic Hotline</label>
                <input
                  type="text"
                  value={clinicData.phone}
                  onChange={(e) => setClinicData({ ...clinicData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase block">WhatsApp No.</label>
                <input
                  type="text"
                  value={clinicData.whatsappNumber}
                  onChange={(e) => setClinicData({ ...clinicData, whatsappNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase block">Opening Hour</label>
                <input
                  type="text"
                  value={clinicData.startHours}
                  onChange={(e) => setClinicData({ ...clinicData, startHours: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase block">Closing Hour</label>
                <input
                  type="text"
                  value={clinicData.endHours}
                  onChange={(e) => setClinicData({ ...clinicData, endHours: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Update Clinic profile
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="panel-card p-6 space-y-6 shadow-lg">
          <h3 className="font-extrabold text-base text-white border-b border-white/5 pb-2 flex items-center space-x-2">
            <Lock size={18} className="text-[#3B82F6]" />
            <span>Update Password</span>
          </h3>

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            {msg.text && (
              <div className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 border ${
                msg.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                  : 'bg-red-500/10 border-red-500/30 text-red-200'
              }`}>
                {msg.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                <span>{msg.text}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 uppercase block">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 uppercase block">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 uppercase block">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b76ca] hover:to-[#5ea0ff] text-white text-xs font-bold shadow-md transition-all cursor-pointer flex justify-center items-center space-x-1"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
