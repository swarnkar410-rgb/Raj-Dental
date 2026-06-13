'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, UserPlus, Phone, Calendar, Loader2, Users, FileText, Activity, CreditCard } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { apiRequest } from '../../../utils/api';
import { formatDateToDMY } from '../../../utils/date';
import CustomDatePicker from '../../../components/CustomDatePicker';

export default function PatientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Registered' | 'Web Leads'>('All');
  const [sortBy, setSortBy] = useState<string>('most-recent-activity');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Patient Panel state
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    dob: '',
    gender: 'Male',
    medicalHistory: [] as string[],
    notes: ''
  });

  const medicalHistoryOptions = [
    'Diabetes',
    'Hypertension',
    'Heart Disease',
    'Bleeding Disorders',
    'Allergic to Penicillin',
    'Allergic to Sulfa'
  ];

  const fetchPatients = async (query = '') => {
    setLoading(true);
    try {
      const res = await apiRequest(`/patients?search=${query}`);
      if (res.success) {
        setPatients(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPatients(search);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    // Check if redirect with active action
    if (searchParams.get('action') === 'add') {
      setShowAddForm(true);
    }
  }, [searchParams]);

  const handleCheckboxChange = (option: string) => {
    const isChecked = formData.medicalHistory.includes(option);
    if (isChecked) {
      setFormData({
        ...formData,
        medicalHistory: formData.medicalHistory.filter(item => item !== option)
      });
    } else {
      setFormData({
        ...formData,
        medicalHistory: [...formData.medicalHistory, option]
      });
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.dob) {
      alert('Please fill in Name, Phone, and Date of Birth.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/patients', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (res.success) {
        setShowAddForm(false);
        // Reset form
        setFormData({
          name: '',
          phone: '',
          email: '',
          dob: '',
          gender: 'Male',
          medicalHistory: [],
          notes: ''
        });
        // Reload patient list
        fetchPatients(search);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add patient');
    } finally {
      setSubmitting(false);
    }
  };

  // Partition and sort patients
  const webLeads = patients.filter(pat => pat.registrationStatus === 'incomplete');
  const registeredPatients = patients.filter(pat => pat.registrationStatus === 'completed');

  const parsePatientDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const getSortedWebLeads = (list: any[]) => {
    return [...list].sort((a, b) => {
      if (sortBy === 'most-recent-activity') {
        const dateA = parsePatientDate(a.requestedDate);
        const dateB = parsePatientDate(b.requestedDate);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime(); // ASC (nearest first)
      }
      if (sortBy === 'last-visit') {
        const dateA = parsePatientDate(a.requestedDate);
        const dateB = parsePatientDate(b.requestedDate);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
      }
      if (sortBy === 'newest-registration') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'name-az') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'patient-id') {
        return a.patientId.localeCompare(b.patientId);
      }
      return 0;
    });
  };

  const getSortedRegisteredPatients = (list: any[]) => {
    return [...list].sort((a, b) => {
      if (sortBy === 'most-recent-activity' || sortBy === 'last-visit') {
        const dateA = parsePatientDate(a.lastVisit);
        const dateB = parsePatientDate(b.lastVisit);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime(); // DESC (most recent first)
      }
      if (sortBy === 'newest-registration') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'name-az') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'patient-id') {
        return a.patientId.localeCompare(b.patientId);
      }
      return 0;
    });
  };

  const sortedWebLeads = getSortedWebLeads(webLeads);
  const sortedRegistered = getSortedRegisteredPatients(registeredPatients);

  // Live Counts
  const allCount = patients.length;
  const registeredCount = registeredPatients.length;
  const webLeadsCount = webLeads.length;

  // Formatting Date Helper for "05 Jun 2026"
  const formatVisitDate = (dateVal: string | null) => {
    if (!dateVal) return 'Never Visited';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      const days = String(d.getDate()).padStart(2, '0');
      const months = d.toLocaleDateString('en-US', { month: 'short' });
      const years = d.getFullYear();
      return `${days} ${months} ${years}`;
    } catch (e) {
      return dateVal;
    }
  };

  // Card Hover Animations
  const cardVariants: Variants = {
    initial: { y: 0, scale: 1, borderColor: "rgba(255,255,255,0.05)" },
    hover: { 
      y: -4, 
      scale: 1.02, 
      borderColor: "rgba(59,130,246,0.35)",
      boxShadow: "0 0 20px 2px rgba(59, 130, 246, 0.25)"
    }
  };

  const actionVariants: Variants = {
    initial: { opacity: 0, height: 0, marginTop: 0 },
    hover: { opacity: 1, height: 'auto', marginTop: 12, transition: { duration: 0.2 } }
  };

  return (
    <div className="space-y-8 relative">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Patient Directory</h1>
          <p className="text-xs sm:text-sm text-gray-400">Search and manage doctor records of Raj Dental Hospital.</p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b76ca] hover:to-[#5ea0ff] text-white text-xs sm:text-sm font-bold shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
        >
          <UserPlus size={16} />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search Input (No Search Button Required, Instant Search) */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Search by Patient Name, Phone, ID, or Treatment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6] transition-all text-sm"
        />
      </div>

      {/* Filter Tabs and Sort Dropdown Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              statusFilter === 'All'
                ? 'bg-gradient-to-r from-[#145DA0] to-[#3B82F6] text-white border-[#3B82F6]'
                : 'bg-white/3 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All ({allCount})
          </button>
          <button
            onClick={() => setStatusFilter('Registered')}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              statusFilter === 'Registered'
                ? 'bg-gradient-to-r from-[#145DA0] to-[#3B82F6] text-white border-[#3B82F6]'
                : 'bg-white/3 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Registered ({registeredCount})
          </button>
          <button
            onClick={() => setStatusFilter('Web Leads')}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              statusFilter === 'Web Leads'
                ? 'bg-gradient-to-r from-[#145DA0] to-[#3B82F6] text-white border-[#3B82F6]'
                : 'bg-white/3 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Web Leads ({webLeadsCount})
          </button>
        </div>

        {/* Sort selector dropdown */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-400 font-bold uppercase">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-white/10 bg-[#0B1220] text-white focus:outline-none focus:border-[#3B82F6] text-xs font-bold cursor-pointer pr-8 relative"
          >
            <option value="most-recent-activity">Most Recent Activity</option>
            <option value="last-visit">Last Visit</option>
            <option value="newest-registration">Newest Registration</option>
            <option value="name-az">Patient Name A-Z</option>
            <option value="patient-id">Patient ID</option>
          </select>
        </div>
      </div>

      {/* Patient Listing Grid */}
      {loading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ((statusFilter === 'All' && sortedWebLeads.length === 0 && sortedRegistered.length === 0) ||
           (statusFilter === 'Registered' && sortedRegistered.length === 0) ||
           (statusFilter === 'Web Leads' && sortedWebLeads.length === 0)) ? (
        <div className="panel-card p-12 text-center text-gray-400 space-y-4">
          <Users size={40} className="mx-auto text-gray-600" />
          <div>
            <h3 className="font-extrabold text-white text-lg">No Patients Found</h3>
            <p className="text-xs text-gray-500 mt-1">Try refining your search terms or register a new patient.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Web Leads Section */}
          {(statusFilter === 'All' || statusFilter === 'Web Leads') && sortedWebLeads.length > 0 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center space-x-2 border-l-4 border-amber-500 pl-3">
                <h2 className="text-sm sm:text-base font-black text-amber-400 tracking-wide uppercase">Web Leads ({sortedWebLeads.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedWebLeads.map((pat) => {
                  const isRegistered = pat.registrationStatus === 'completed';
                  return (
                    <motion.div
                      key={pat._id}
                      initial="initial"
                      whileHover="hover"
                      variants={cardVariants}
                      onClick={() => router.push(`/dashboard/patients/${pat._id}`)}
                      className="panel-card p-4 flex flex-col justify-between border rounded-xl bg-[#090E1A]/90 transition-all cursor-pointer shadow-md select-none group min-h-[200px]"
                    >
                      <div className="space-y-3">
                        {/* Top Header */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-500 font-bold tracking-wider">{pat.patientId}</span>
                            <h3 className="font-extrabold text-white text-sm tracking-wide group-hover:text-[#3B82F6] transition-colors">{pat.name}</h3>
                          </div>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest ${
                            isRegistered 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {isRegistered ? 'REGISTERED' : 'WEB LEAD'}
                          </span>
                        </div>

                        {/* Contact Phone */}
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Phone size={12} className="text-gray-500" />
                          <span className="font-bold">{pat.phone}</span>
                        </div>

                        {/* Custom Info List */}
                        <div className="space-y-1 text-[11px] border-t border-white/5 pt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-bold uppercase">{isRegistered ? 'Current Treatment' : 'Requested Treatment'}</span>
                            <span className="text-white font-extrabold truncate max-w-[130px]">{pat.currentTreatment || 'None'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-bold uppercase">{isRegistered ? 'Last Visit' : 'Requested Date'}</span>
                            <span className="text-blue-400 font-extrabold">
                              {isRegistered 
                                ? formatVisitDate(pat.lastVisit)
                                : formatVisitDate(pat.requestedDate || pat.lastVisit)
                              }
                            </span>
                          </div>
                        </div>

                        {/* Medical Alerts (High Visibility Red Badges) */}
                        <div className="border-t border-white/5 pt-2">
                          {pat.medicalHistory && pat.medicalHistory.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {pat.medicalHistory.map((item: string, idx: number) => (
                                <span key={idx} className="text-[8px] font-black px-1.5 py-0.5 bg-red-500/15 text-red-500 border border-red-500/30 rounded-md uppercase tracking-wider shadow-[0_0_8px_rgba(239,68,68,0.15)]">
                                  {item.toUpperCase()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-500 block font-normal">No Alerts</span>
                          )}
                        </div>
                      </div>

                      {/* Animated Quick Action Buttons container */}
                      <motion.div variants={actionVariants} className="border-t border-white/5 flex gap-2 overflow-hidden h-0 opacity-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/patients/${pat._id}`);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[9px] uppercase tracking-wider text-center cursor-pointer transition-colors"
                        >
                          Complete Registration
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/patients/${pat._id}`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-[9px] uppercase tracking-wider text-center cursor-pointer transition-colors"
                        >
                          View Lead
                        </button>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider line if both are displayed */}
          {statusFilter === 'All' && sortedWebLeads.length > 0 && sortedRegistered.length > 0 && (
            <div className="border-t border-white/5 my-6" />
          )}

          {/* Registered Patients Section */}
          {(statusFilter === 'All' || statusFilter === 'Registered') && sortedRegistered.length > 0 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center space-x-2 border-l-4 border-emerald-500 pl-3">
                <h2 className="text-sm sm:text-base font-black text-emerald-400 tracking-wide uppercase">Registered Patients ({sortedRegistered.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedRegistered.map((pat) => {
                  const isRegistered = pat.registrationStatus === 'completed';
                  return (
                    <motion.div
                      key={pat._id}
                      initial="initial"
                      whileHover="hover"
                      variants={cardVariants}
                      onClick={() => router.push(`/dashboard/patients/${pat._id}`)}
                      className="panel-card p-4 flex flex-col justify-between border rounded-xl bg-[#090E1A]/90 transition-all cursor-pointer shadow-md select-none group min-h-[200px]"
                    >
                      <div className="space-y-3">
                        {/* Top Header */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-500 font-bold tracking-wider">{pat.patientId}</span>
                            <h3 className="font-extrabold text-white text-sm tracking-wide group-hover:text-[#3B82F6] transition-colors">{pat.name}</h3>
                          </div>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest ${
                            isRegistered 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {isRegistered ? 'REGISTERED' : 'WEB LEAD'}
                          </span>
                        </div>

                        {/* Contact Phone */}
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Phone size={12} className="text-gray-500" />
                          <span className="font-bold">{pat.phone}</span>
                        </div>

                        {/* Custom Info List */}
                        <div className="space-y-1 text-[11px] border-t border-white/5 pt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-bold uppercase">{isRegistered ? 'Current Treatment' : 'Requested Treatment'}</span>
                            <span className="text-white font-extrabold truncate max-w-[130px]">{pat.currentTreatment || 'None'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-bold uppercase">{isRegistered ? 'Last Visit' : 'Requested Date'}</span>
                            <span className="text-blue-400 font-extrabold">
                              {isRegistered 
                                ? formatVisitDate(pat.lastVisit)
                                : formatVisitDate(pat.requestedDate || pat.lastVisit)
                              }
                            </span>
                          </div>
                        </div>

                        {/* Medical Alerts (High Visibility Red Badges) */}
                        <div className="border-t border-white/5 pt-2">
                          {pat.medicalHistory && pat.medicalHistory.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {pat.medicalHistory.map((item: string, idx: number) => (
                                <span key={idx} className="text-[8px] font-black px-1.5 py-0.5 bg-red-500/15 text-red-500 border border-red-500/30 rounded-md uppercase tracking-wider shadow-[0_0_8px_rgba(239,68,68,0.15)]">
                                  {item.toUpperCase()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-500 block font-normal">No Alerts</span>
                          )}
                        </div>
                      </div>

                      {/* Animated Quick Action Buttons container */}
                      <motion.div variants={actionVariants} className="border-t border-white/5 flex gap-2 overflow-hidden h-0 opacity-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/patients/${pat._id}`);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-bold text-[9px] uppercase tracking-wider text-center cursor-pointer transition-colors"
                        >
                          View Profile
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/appointments`);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-[9px] uppercase tracking-wider text-center cursor-pointer transition-colors"
                          title="Schedule Appointment"
                        >
                          Schedule Appointment
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/billing`);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-[9px] uppercase tracking-wider text-center cursor-pointer transition-colors"
                          title="Generate Invoice"
                        >
                          Generate Invoice
                        </button>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Patient Sliding Drawer / Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-8 sm:p-10 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-xl font-extrabold text-white tracking-tight">Register Patient</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Amit Sharma"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] transition-all text-sm"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] transition-all text-sm"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="amit@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] transition-all text-sm"
                  />
                </div>

                {/* DOB */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Date of Birth *</label>
                  <CustomDatePicker
                    value={formData.dob}
                    onChange={(val) => setFormData({ ...formData, dob: val })}
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="Male" className="bg-[#0b1220]">Male</option>
                    <option value="Female" className="bg-[#0b1220]">Female</option>
                    <option value="Other" className="bg-[#0b1220]">Other</option>
                  </select>
                </div>
              </div>

              {/* Medical History checklist */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Medical History (Select all that apply)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white/3 border border-white/5">
                  {medicalHistoryOptions.map((opt) => (
                    <div key={opt} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`med-${opt}`}
                        checked={formData.medicalHistory.includes(opt)}
                        onChange={() => handleCheckboxChange(opt)}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#3B82F6] focus:ring-[#3B82F6]"
                      />
                      <label htmlFor={`med-${opt}`} className="ml-2 text-xs text-gray-300 select-none cursor-pointer">
                        {opt}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinical Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Clinical Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="History of dental operations, tooth sensitivity alerts, anxiety levels, etc..."
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] transition-all text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b76ca] hover:to-[#5ea0ff] text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving Patient...</span>
                    </>
                  ) : (
                    <span>Register Patient</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
