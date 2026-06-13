'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Calendar, 
  FileText, 
  ShieldAlert, 
  Plus, 
  Check, 
  Printer, 
  Info,
  DollarSign,
  PlusCircle,
  FolderMinus,
  Sparkles,
  Loader2
} from 'lucide-react';
import { apiRequest } from '../../../../utils/api';
import { formatDateToDMY } from '../../../../utils/date';
import CustomDatePicker from '../../../../components/CustomDatePicker';

interface ToothState {
  toothNumber: number;
  state: 'Healthy' | 'Caries' | 'Root Canal' | 'Crown' | 'Extraction' | 'Implant' | 'Braces';
  notes?: string;
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  
  // Odontogram Charting state
  const [teethState, setTeethState] = useState<{ [key: string]: ToothState }>({});
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [toothCondition, setToothCondition] = useState<ToothState['state']>('Healthy');
  const [toothNotes, setToothNotes] = useState('');

  // Log Treatment form state
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [treatmentFormData, setTreatmentFormData] = useState({
    title: 'Dental Implants',
    notes: '',
    teeth: [] as number[],
    cost: 0,
    discount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // Invoice creation selections
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);

  // Complete registration drawer/modal state
  const [showRegistrationDrawer, setShowRegistrationDrawer] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registrationFormData, setRegistrationFormData] = useState({
    name: '',
    gender: 'Male',
    dob: '',
    bloodGroup: '',
    address: '',
    occupation: '',
    emergencyContact: '',
    medicalHistory: [] as string[],
    allergies: '',
    notes: ''
  });

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/patients/${patientId}`);
      if (res.success) {
        setPatient(res.data.patient);
        setTreatments(res.data.treatments);
        setInvoices(res.data.invoices);
        setAppointments(res.data.appointments || []);
        setPayments(res.data.payments || []);

        // Hydrate registration form details
        setRegistrationFormData({
          name: res.data.patient.name || '',
          gender: res.data.patient.gender || 'Male',
          dob: res.data.patient.dob ? res.data.patient.dob.split('T')[0] : '',
          bloodGroup: res.data.patient.bloodGroup || '',
          address: res.data.patient.address || '',
          occupation: res.data.patient.occupation || '',
          emergencyContact: res.data.patient.emergencyContact || '',
          medicalHistory: res.data.patient.medicalHistory || [],
          allergies: res.data.patient.allergies ? res.data.patient.allergies.join(', ') : '',
          notes: res.data.patient.notes || ''
        });
        
        // Hydrate teethState map from loaded dental chart
        const chartData = res.data.dentalChart;
        if (chartData && chartData.teethState) {
          // MongoDB Maps compile to objects in JSON
          setTeethState(chartData.teethState);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationFormData.name || !registrationFormData.gender || !registrationFormData.dob) {
      alert('Name, Gender, and Date of Birth are required.');
      return;
    }

    setRegistering(true);
    try {
      const payload = {
        ...registrationFormData,
        allergies: registrationFormData.allergies
          ? registrationFormData.allergies.split(',').map(a => a.trim()).filter(a => a)
          : []
      };

      const res = await apiRequest(`/patients/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setShowRegistrationDrawer(false);
        loadPatientData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save registration details');
    } finally {
      setRegistering(false);
    }
  };

  // Teeth condition options
  const conditionColors: { [key in ToothState['state']]: { bg: string, text: string, stroke: string } } = {
    'Healthy': { bg: '#FFFFFF', text: '#0B1220', stroke: '#AECFFF' },
    'Caries': { bg: '#EF4444', text: '#FFFFFF', stroke: '#B91C1C' },
    'Root Canal': { bg: '#A855F7', text: '#FFFFFF', stroke: '#7E22CE' },
    'Crown': { bg: '#F59E0B', text: '#FFFFFF', stroke: '#D97706' },
    'Extraction': { bg: '#6B7280', text: '#FFFFFF', stroke: '#374151' },
    'Implant': { bg: '#3B82F6', text: '#FFFFFF', stroke: '#1D4ED8' },
    'Braces': { bg: '#10B981', text: '#FFFFFF', stroke: '#047857' }
  };

  const handleToothClick = (toothNum: number) => {
    setSelectedTooth(toothNum);
    const existing = teethState[String(toothNum)];
    if (existing) {
      setToothCondition(existing.state);
      setToothNotes(existing.notes || '');
    } else {
      setToothCondition('Healthy');
      setToothNotes('');
    }
  };

  const saveToothState = async () => {
    if (selectedTooth === null) return;
    
    const updatedState = {
      ...teethState,
      [String(selectedTooth)]: {
        toothNumber: selectedTooth,
        state: toothCondition,
        notes: toothNotes
      }
    };

    setTeethState(updatedState);
    setSelectedTooth(null);

    // Save directly to backend database
    try {
      await apiRequest(`/patients/${patientId}/dental-chart`, {
        method: 'PUT',
        body: JSON.stringify({ teethState: updatedState })
      });
    } catch (err) {
      console.error('Failed to save dental chart:', err);
      alert('Could not sync dental chart changes with database.');
    }
  };

  const handleLogTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (treatmentFormData.cost < 0) {
      alert('Cost cannot be negative.');
      return;
    }

    try {
      const res = await apiRequest('/billing/treatments', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          ...treatmentFormData
        })
      });

      if (res.success) {
        setShowTreatmentForm(false);
        // Reset treatment form
        setTreatmentFormData({
          title: 'Dental Implants',
          notes: '',
          teeth: [],
          cost: 0,
          discount: 0,
          date: new Date().toISOString().split('T')[0]
        });
        loadPatientData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to record treatment');
    }
  };

  const handleCreateInvoice = async () => {
    if (selectedTreatments.length === 0) {
      alert('Please check at least one treatment to bill.');
      return;
    }

    setInvoiceSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Default due date 7 days from now
      const formattedDueDate = dueDate.toISOString().split('T')[0];

      const res = await apiRequest('/billing/invoices', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          treatmentIds: selectedTreatments,
          discount: 0,
          tax: 0,
          issueDate: today,
          dueDate: formattedDueDate
        })
      });

      if (res.success) {
        setSelectedTreatments([]);
        loadPatientData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate invoice');
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const toggleTreatmentSelectForInvoice = (id: string) => {
    if (selectedTreatments.includes(id)) {
      setSelectedTreatments(selectedTreatments.filter(tId => tId !== id));
    } else {
      setSelectedTreatments([...selectedTreatments, id]);
    }
  };

  if (loading || !patient) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Split teeth row-wise: 1-16 (Upper jaw), 17-32 (Lower jaw)
  const upperTeeth = Array.from({ length: 16 }, (_, i) => i + 1);
  const lowerTeeth = Array.from({ length: 16 }, (_, i) => 32 - i); // Lower jaw left to right matching anatomical directions

  const getUpcomingAppointment = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const upcoming = appointments.filter(app => {
      const isFutureOrToday = app.date >= todayStr;
      const isActive = app.status === 'BOOKED' || app.status === 'approved' || app.status === 'rescheduled' || app.status === 'PENDING';
      return isFutureOrToday && isActive;
    });

    upcoming.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.timeSlot.localeCompare(b.timeSlot);
    });

    return upcoming[0] || null;
  };

  const getInvoiceTreatmentName = (inv: any) => {
    if (inv.treatmentIds && inv.treatmentIds.length > 0) {
      const names = inv.treatmentIds.map((tId: string) => {
        const found = treatments.find(t => t._id === tId);
        return found ? found.title : null;
      }).filter(Boolean);
      if (names.length > 0) return names.join(', ');
    }
    return 'Consultation Record';
  };

  const getTimelineEvents = () => {
    const events: any[] = [];

    // 1. Registration Event
    if (patient && patient.createdAt) {
      events.push({
        date: new Date(patient.createdAt),
        dateStr: formatDateToDMY(patient.createdAt),
        title: patient.registrationStatus === 'completed' ? 'Patient Registered' : 'Web Lead Created',
        description: patient.registrationStatus === 'completed' 
          ? 'Completed clinical onboarding profile registration.' 
          : 'Online booking request submitted via clinic website.',
        type: 'registration'
      });
    }

    // 2. Appointment Events
    appointments.forEach((app: any) => {
      let title = 'Appointment Booked';
      let desc = `Scheduled for ${formatDateToDMY(app.date)} at ${app.timeSlot} for ${app.treatmentType}.`;
      if (app.status === 'COMPLETED') {
        title = 'Clinic Visit (Completed)';
        desc = `Completed dental session for ${app.treatmentType} with chief doctor.`;
      } else if (app.status === 'CANCELLED') {
        title = 'Appointment Cancelled';
        desc = `Cancelled appointment slot for ${app.treatmentType} on ${formatDateToDMY(app.date)}.`;
      } else if (app.status === 'NO_SHOW') {
        title = 'Appointment No-Show';
        desc = `Patient failed to show up for the slot on ${formatDateToDMY(app.date)}.`;
      } else if (app.status === 'approved') {
        title = 'Appointment Approved';
        desc = `Online request approved by clinic coordinator for ${formatDateToDMY(app.date)} at ${app.timeSlot}.`;
      }

      events.push({
        date: new Date(app.date || app.createdAt),
        dateStr: formatDateToDMY(app.date),
        title,
        description: desc,
        type: 'appointment'
      });
    });

    // 3. Treatment Events
    treatments.forEach((t: any) => {
      events.push({
        date: new Date(t.date),
        dateStr: formatDateToDMY(t.date),
        title: `${t.title} Recorded`,
        description: `Procedure completed. Cost: ₹${t.totalAmount.toLocaleString('en-IN')}.${t.notes ? ` Notes: ${t.notes}` : ''}`,
        type: 'treatment'
      });
    });

    // 4. Invoices (Billing)
    invoices.forEach((inv: any) => {
      events.push({
        date: new Date(inv.issueDate),
        dateStr: formatDateToDMY(inv.issueDate),
        title: `Invoice Generated (${inv.invoiceNumber})`,
        description: `Billed amount of ₹${inv.totalAmount.toLocaleString('en-IN')} is generated. Balance due: ₹${inv.balanceDue.toLocaleString('en-IN')}.`,
        type: 'billing'
      });
    });

    // 5. Payments
    payments.forEach((pay: any) => {
      events.push({
        date: new Date(pay.paymentDate),
        dateStr: formatDateToDMY(pay.paymentDate),
        title: `Payment Received`,
        description: `Received amount of ₹${pay.amount.toLocaleString('en-IN')} via ${pay.paymentMethod}.${pay.transactionId ? ` Ref: ${pay.transactionId}` : ''}`,
        type: 'payment'
      });
    });

    events.sort((a, b) => b.date.getTime() - a.date.getTime());
    return events;
  };

  const upcomingApp = getUpcomingAppointment();
  const timelineEvents = getTimelineEvents();

  return (
    <div className="space-y-8">
      {/* Back Header */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => router.push('/dashboard/patients')}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Patient Profile</span>
          <h1 className="text-xl sm:text-2xl font-black text-white">{patient.name}</h1>
        </div>
      </div>

      {/* Warning alert banner for incomplete registrations */}
      {patient.registrationStatus === 'incomplete' && (
        <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs sm:text-sm font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert size={20} className="text-orange-400 flex-shrink-0 animate-pulse" />
            <span>Patient registration is incomplete. Complete patient information during clinic visit.</span>
          </div>
          <button
            onClick={() => setShowRegistrationDrawer(true)}
            className="px-4 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-100 border border-orange-500/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 shadow-sm"
          >
            Complete Registration
          </button>
        </div>
      )}

      <div className="space-y-8">
        {/* ROW 1: General Details & Odontogram */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            {/* Card Detail */}
            <div className="panel-card p-6 space-y-4 shadow-lg">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="font-extrabold text-base text-white">General Details</h3>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${
                  patient.registrationStatus === 'completed' 
                    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                    : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                }`}>
                  {patient.registrationStatus === 'completed' ? '✓ Registered' : 'Incomplete'}
                </span>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Patient ID</span>
                  <span className="font-bold text-white">{patient.patientId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone</span>
                  <a href={`tel:${patient.phone}`} className="font-bold text-[#3B82F6] hover:underline">{patient.phone}</a>
                </div>
                {patient.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email</span>
                    <span className="font-bold text-white">{patient.email}</span>
                  </div>
                )}

                {patient.registrationStatus === 'incomplete' && (
                  <div className="pt-3 border-t border-white/5 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lead Source</span>
                      <span className="font-semibold text-gray-300">Website Appointment</span>
                    </div>
                    {patient.requestedTreatment && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Req. Treatment</span>
                        <span className="font-bold text-white">{patient.requestedTreatment}</span>
                      </div>
                    )}
                    {patient.requestedDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Req. Date</span>
                        <span className="font-bold text-[#D4AF37]">{formatDateToDMY(patient.requestedDate)}</span>
                      </div>
                    )}
                    {patient.requestedTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Req. Time</span>
                        <span className="font-bold text-[#D4AF37]">{patient.requestedTime}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-white/5 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gender</span>
                    <span className={`font-bold ${patient.gender ? 'text-white' : 'text-gray-500 italic'}`}>
                      {patient.gender || 'Not Provided'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date of Birth</span>
                    <span className={`font-bold ${patient.dob ? 'text-white' : 'text-gray-500 italic'}`}>
                      {formatDateToDMY(patient.dob)}
                    </span>
                  </div>

                  {patient.registrationStatus === 'completed' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Blood Group</span>
                        <span className={`font-bold ${patient.bloodGroup ? 'text-white' : 'text-gray-500'}`}>
                          {patient.bloodGroup || 'Not Provided'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Address</span>
                        <span className={`font-semibold ${patient.address ? 'text-white' : 'text-gray-500'}`}>
                          {patient.address || 'Not Provided'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Occupation</span>
                        <span className={`font-semibold ${patient.occupation ? 'text-white' : 'text-gray-500'}`}>
                          {patient.occupation || 'Not Provided'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Emergency Contact</span>
                        <span className={`font-semibold ${patient.emergencyContact ? 'text-white' : 'text-gray-500'}`}>
                          {patient.emergencyContact || 'Not Provided'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {patient.notes && (
                <div className="pt-3 border-t border-white/5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Clinical Notes</span>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">{patient.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            {/* Odontogram Card */}
            <div className="panel-card p-6 space-y-6 shadow-lg h-full flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-base text-white">Interactive Dental Odontogram</h3>
                <p className="text-xs text-gray-400">Click any tooth to set caries, crowns, implants, root canals, or extraction states.</p>
              </div>

              {/* Teeth Grid */}
              <div className="space-y-6 border-y border-white/5 py-4 my-2">
                {/* Upper Jaw Row */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block text-center mb-1">Upper Jaw (1 - 16)</span>
                  <div className="flex justify-between gap-1 overflow-x-auto pb-1">
                    {upperTeeth.map((num) => {
                      const status = teethState[String(num)]?.state || 'Healthy';
                      const colors = conditionColors[status];
                      return (
                        <div 
                          key={num} 
                          onClick={() => handleToothClick(num)}
                          className="flex flex-col items-center space-y-1 cursor-pointer group"
                        >
                          <span className="text-[9px] font-bold text-gray-400 group-hover:text-white">{num}</span>
                          <svg width="18" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M10,8 C10,5 30,5 30,8 C33,18 31,30 25,35 C23,37 20,32 20,30 C20,32 17,37 15,35 C9,30 7,18 10,8 Z"
                              fill={colors.bg}
                              stroke={colors.stroke}
                              strokeWidth="3.5"
                            />
                          </svg>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lower Jaw Row */}
                <div className="space-y-1">
                  <div className="flex justify-between gap-1 overflow-x-auto pt-1">
                    {lowerTeeth.map((num) => {
                      const status = teethState[String(num)]?.state || 'Healthy';
                      const colors = conditionColors[status];
                      return (
                        <div 
                          key={num} 
                          onClick={() => handleToothClick(num)}
                          className="flex flex-col items-center space-y-1 cursor-pointer group"
                        >
                          <svg width="18" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-180">
                            <path
                              d="M10,8 C10,5 30,5 30,8 C33,18 31,30 25,35 C23,37 20,32 20,30 C20,32 17,37 15,35 C9,30 7,18 10,8 Z"
                              fill={colors.bg}
                              stroke={colors.stroke}
                              strokeWidth="3.5"
                            />
                          </svg>
                          <span className="text-[9px] font-bold text-gray-400 group-hover:text-white">{num}</span>
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block text-center mt-1">Lower Jaw (32 → 17)</span>
                </div>
              </div>

              {/* Condition Color Legends */}
              <div className="flex flex-wrap gap-3 justify-center text-[9px] font-bold uppercase tracking-wide">
                {Object.keys(conditionColors).map((cond) => {
                  const colors = conditionColors[cond as ToothState['state']];
                  return (
                    <div key={cond} className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded border" style={{ backgroundColor: colors.bg, borderColor: colors.stroke }} />
                      <span className="text-gray-300">{cond}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Medical Alerts & Upcoming Appointment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            {/* Medical Alerts (Optimized) */}
            <div className="panel-card p-6 space-y-4 shadow-lg border-[#3B82F6]/10 min-h-[160px] flex flex-col justify-between">
              <h3 className="font-extrabold text-base border-b border-white/5 pb-2 text-white flex items-center space-x-1.5">
                <ShieldAlert className="text-red-400 flex-shrink-0" size={18} />
                <span>Medical & Allergies Alerts</span>
              </h3>

              {(!patient.medicalHistory || patient.medicalHistory.length === 0) && (!patient.allergies || patient.allergies.length === 0) ? (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-white/3 p-3 rounded-xl border border-white/5 flex flex-col justify-center text-center">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Medical Alerts</span>
                    <span className="text-emerald-400 text-xs font-black mt-1">None</span>
                  </div>
                  <div className="bg-white/3 p-3 rounded-xl border border-white/5 flex flex-col justify-center text-center">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Allergies</span>
                    <span className="text-emerald-400 text-xs font-black mt-1">None</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 mt-2 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Medical Conditions</span>
                    {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {patient.medicalHistory.map((item: string, idx: number) => (
                          <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 uppercase tracking-wide">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">None</span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Allergies</span>
                    {patient.allergies && patient.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {patient.allergies.map((item: string, idx: number) => (
                          <span key={idx} className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-lg uppercase tracking-wide">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">None</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            {/* Upcoming Appointment */}
            <div className="panel-card p-6 flex flex-col justify-between shadow-lg min-h-[160px]">
              <h3 className="font-extrabold text-base border-b border-white/5 pb-2 text-white flex items-center space-x-1.5">
                <Calendar className="text-[#3B82F6] flex-shrink-0" size={18} />
                <span>Upcoming Appointment</span>
              </h3>

              {!upcomingApp ? (
                <div className="text-center py-6 text-xs text-gray-500 font-bold">
                  No upcoming appointments
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Date</span>
                    <span className="text-white font-extrabold text-sm mt-0.5 block">{formatDateToDMY(upcomingApp.date)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Time</span>
                    <span className="text-blue-400 font-extrabold text-sm mt-0.5 block">{upcomingApp.timeSlot}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Treatment</span>
                    <span className="text-white font-extrabold text-sm mt-0.5 block">{upcomingApp.treatmentType || 'General Checkup'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Status</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 mt-1 rounded-md border uppercase tracking-wider inline-block ${
                      upcomingApp.status === 'BOOKED' || upcomingApp.status === 'approved'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {upcomingApp.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 3: Patient Journey Timeline */}
        <div className="panel-card p-6 shadow-lg space-y-6">
          <div>
            <h3 className="font-extrabold text-base text-white">Patient Journey Timeline</h3>
            <p className="text-xs text-gray-400">Chronological logs of clinical visits, procedures, billing, and payments.</p>
          </div>

          <div className="relative pl-6 border-l-2 border-white/5 space-y-6">
            {timelineEvents.length === 0 ? (
              <div className="text-xs text-gray-500 italic text-center py-4">No events found.</div>
            ) : (
              timelineEvents.map((ev, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                    ev.type === 'registration' ? 'bg-amber-400 border-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]' :
                    ev.type === 'appointment' ? 'bg-blue-400 border-blue-500 shadow-[0_0_8px_rgba(96,165,250,0.5)]' :
                    ev.type === 'treatment' ? 'bg-purple-400 border-purple-500 shadow-[0_0_8px_rgba(192,132,252,0.5)]' :
                    ev.type === 'billing' ? 'bg-red-400 border-red-500 shadow-[0_0_8px_rgba(248,113,113,0.5)]' :
                    'bg-emerald-400 border-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                  }`} />
                  <div className="flex flex-col space-y-0.5 text-xs">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{ev.dateStr}</span>
                    <h4 className="font-black text-white">{ev.title}</h4>
                    <p className="text-gray-400 leading-relaxed">{ev.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ROW 4: Treatment History */}
        <div className="panel-card p-6 space-y-6 shadow-lg">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <div>
              <h3 className="font-extrabold text-base text-white">Record Dental Treatments</h3>
              <p className="text-xs text-gray-400">Completed procedures and operations log.</p>
            </div>

            <button
              onClick={() => setShowTreatmentForm(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <PlusCircle size={14} className="text-[#3B82F6]" />
              <span>Log Procedure</span>
            </button>
          </div>

          <div className="divide-y divide-white/5 space-y-3">
            {treatments.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <div className="text-xs text-gray-500 font-bold">No treatments recorded yet</div>
                <button
                  onClick={() => setShowTreatmentForm(true)}
                  className="px-4 py-2 rounded-xl bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/20 text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  Record First Treatment
                </button>
              </div>
            ) : (
              treatments.map((t) => {
                const isBilled = invoices.some(inv => inv.treatmentIds.includes(t._id));
                return (
                  <div key={t._id} className="flex justify-between items-start pt-3 first:pt-0 gap-4">
                    <div className="flex items-start space-x-3">
                      {!isBilled && (
                        <input
                          type="checkbox"
                          checked={selectedTreatments.includes(t._id)}
                          onChange={() => toggleTreatmentSelectForInvoice(t._id)}
                          className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-[#3B82F6] focus:ring-[#3B82F6] cursor-pointer"
                        />
                      )}
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-white flex items-center gap-1.5 flex-wrap">
                          <span>{t.title}</span>
                          <span className="text-[10px] text-gray-500 font-semibold">• Dentist: Dr. Manoj Kumar</span>
                          {isBilled ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded">Billed</span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-500/10 text-amber-400 rounded">Unbilled</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{t.notes || 'No notes provided.'}</p>
                        {t.teeth && t.teeth.length > 0 && (
                          <span className="text-[9px] font-bold text-[#D4AF37] uppercase block mt-0.5">Affected Teeth: {t.teeth.join(', ')}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-1 flex-shrink-0">
                      <div className="text-sm font-bold text-white">₹{t.totalAmount.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-gray-500 font-semibold uppercase">{formatDateToDMY(t.date)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selectedTreatments.length > 0 && (
            <div className="p-4 rounded-xl bg-white/3 border border-white/5 flex justify-between items-center animate-fadeIn">
              <span className="text-xs font-bold text-gray-300">
                {selectedTreatments.length} Unbilled treatment(s) selected
              </span>
              <button
                onClick={handleCreateInvoice}
                disabled={invoiceSubmitting}
                className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-gradient-to-r from-[#145DA0] to-[#3B82F6] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                {invoiceSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                <span>Generate Invoice</span>
              </button>
            </div>
          )}
        </div>

        {/* ROW 5: Billing & Invoices */}
        <div className="panel-card p-6 space-y-6 shadow-lg">
          <div>
            <h3 className="font-extrabold text-base text-white">Billing Invoices</h3>
            <p className="text-xs text-gray-400">Financial records, bills, and payments history.</p>
          </div>

          <div className="divide-y divide-white/5 space-y-3">
            {invoices.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500 font-bold">No invoices generated yet.</div>
            ) : (
              invoices.map((inv) => (
                <div key={inv._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 first:pt-0 gap-4">
                  <div className="space-y-1">
                    <div 
                      className="font-extrabold text-sm text-white hover:text-[#3B82F6] transition-colors cursor-pointer" 
                      onClick={() => router.push(`/dashboard/billing/invoice/${inv._id}`)}
                    >
                      {inv.invoiceNumber}
                    </div>
                    <div className="text-xs font-bold text-blue-400">{getInvoiceTreatmentName(inv)}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase">Issued: {formatDateToDMY(inv.issueDate)}</div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-300 self-end sm:self-auto">
                    <div>
                      <span className="text-[9px] text-gray-500 block uppercase">Total</span>
                      <span className="text-white font-extrabold">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 block uppercase">Balance</span>
                      <span className={`${inv.balanceDue > 0 ? 'text-red-400' : 'text-emerald-400'} font-extrabold`}>₹{inv.balanceDue.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block ${
                        inv.status === 'PAID' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : inv.status === 'PARTIALLY_PAID'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {inv.status === 'PARTIALLY_PAID' ? 'Partially Paid' : inv.status === 'PAID' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(`/dashboard/billing/invoice/${inv._id}`)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                    >
                      <Printer size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ROW 6: Appointment History */}
        <div className="panel-card p-6 space-y-6 shadow-lg">
          <div>
            <h3 className="font-extrabold text-base text-white">Appointment History</h3>
            <p className="text-xs text-gray-400">History of scheduling, sessions, and cancellations.</p>
          </div>

          <div className="divide-y divide-white/5 space-y-3">
            {appointments.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500 font-bold">No appointment history</div>
            ) : (
              appointments.map((app) => (
                <div key={app._id} className="flex justify-between items-center pt-3 first:pt-0 gap-4">
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-white">{app.treatmentType || 'General Checkup'}</div>
                    <div className="text-[10px] text-gray-500 font-semibold uppercase">
                      {formatDateToDMY(app.date)} &bull; {app.timeSlot}
                    </div>
                  </div>
                  
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block ${
                    app.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : app.status === 'CANCELLED'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : app.status === 'NO_SHOW'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>


      {/* Tooth Charting state-selection modal popup */}
      {selectedTooth !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl relative p-6 space-y-4">
            <h3 className="font-extrabold text-base text-white border-b border-white/5 pb-2">
              Tooth #{selectedTooth} Condition
            </h3>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Condition</label>
              <select
                value={toothCondition}
                onChange={(e) => setToothCondition(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm appearance-none cursor-pointer"
              >
                {Object.keys(conditionColors).map((cond) => (
                  <option key={cond} value={cond} className="bg-[#0B1220] text-white">
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Clinical Notes</label>
              <input
                type="text"
                placeholder="Notes for tooth condition..."
                value={toothNotes}
                onChange={(e) => setToothNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedTooth(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveToothState}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] text-white text-xs font-bold cursor-pointer shadow-md"
              >
                Save Condition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Treatment drawer form */}
      {showTreatmentForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="font-extrabold text-base text-white">Record Treatment</h3>
              <button
                onClick={() => setShowTreatmentForm(false)}
                className="p-1 rounded-lg bg-white/5 text-gray-400 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleLogTreatment} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Treatment Title</label>
                <input
                  type="text"
                  required
                  value={treatmentFormData.title}
                  onChange={(e) => setTreatmentFormData({ ...treatmentFormData, title: e.target.value })}
                  placeholder="Root Canal Treatment (RCT)"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Treatment Notes</label>
                <textarea
                  rows={2}
                  value={treatmentFormData.notes}
                  onChange={(e) => setTreatmentFormData({ ...treatmentFormData, notes: e.target.value })}
                  placeholder="Details of procedure completed..."
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Cost Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    value={treatmentFormData.cost || ''}
                    onChange={(e) => setTreatmentFormData({ ...treatmentFormData, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Discount (INR)</label>
                  <input
                    type="number"
                    value={treatmentFormData.discount || ''}
                    onChange={(e) => setTreatmentFormData({ ...treatmentFormData, discount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Treatment Date</label>
                <CustomDatePicker
                  value={treatmentFormData.date}
                  onChange={(val) => setTreatmentFormData({ ...treatmentFormData, date: val })}
                />
              </div>

              {/* Teeth numbers affected - comma separated input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Affected Teeth (e.g. 14, 15)</label>
                <input
                  type="text"
                  placeholder="14, 15"
                  onChange={(e) => {
                    const teethArr = e.target.value
                      .split(',')
                      .map(t => parseInt(t.trim()))
                      .filter(t => !isNaN(t) && t >= 1 && t <= 32);
                    setTreatmentFormData({ ...treatmentFormData, teeth: teethArr });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowTreatmentForm(false)}
                  className="px-5 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] text-white text-xs font-bold cursor-pointer shadow-md"
                >
                  Log Treatment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Registration Drawer Form */}
      {showRegistrationDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-8 sm:p-10 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-xl font-extrabold text-white tracking-tight">Complete Patient Registration</h3>
              <button
                onClick={() => setShowRegistrationDrawer(false)}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCompleteRegistration} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={registrationFormData.name}
                    onChange={(e) => setRegistrationFormData({ ...registrationFormData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] transition-all text-sm"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Gender *</label>
                  <select
                    value={registrationFormData.gender || 'Male'}
                    onChange={(e) => setRegistrationFormData({ ...registrationFormData, gender: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="Male" className="bg-[#0b1220]">Male</option>
                    <option value="Female" className="bg-[#0b1220]">Female</option>
                    <option value="Other" className="bg-[#0b1220]">Other</option>
                  </select>
                </div>

                {/* DOB */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Date of Birth *</label>
                  <CustomDatePicker
                    value={registrationFormData.dob}
                    onChange={(val) => setRegistrationFormData({ ...registrationFormData, dob: val })}
                  />
                </div>

                {/* Blood Group */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Blood Group</label>
                  <input
                    type="text"
                    value={registrationFormData.bloodGroup}
                    onChange={(e) => setRegistrationFormData({ ...registrationFormData, bloodGroup: e.target.value })}
                    placeholder="e.g. O+, B-, AB+"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] transition-all text-sm"
                  />
                </div>

                {/* Occupation */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Occupation</label>
                  <input
                    type="text"
                    value={registrationFormData.occupation}
                    onChange={(e) => setRegistrationFormData({ ...registrationFormData, occupation: e.target.value })}
                    placeholder="e.g. Student, Engineer, Business"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] transition-all text-sm"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Emergency Contact</label>
                  <input
                    type="text"
                    value={registrationFormData.emergencyContact}
                    onChange={(e) => setRegistrationFormData({ ...registrationFormData, emergencyContact: e.target.value })}
                    placeholder="Name - Phone"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] transition-all text-sm"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Address</label>
                <input
                  type="text"
                  value={registrationFormData.address}
                  onChange={(e) => setRegistrationFormData({ ...registrationFormData, address: e.target.value })}
                  placeholder="Street details, City, Patna, Bihar"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] transition-all text-sm"
                />
              </div>

              {/* Medical History */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Medical History (Select all that apply)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white/3 border border-white/5">
                  {['Diabetes', 'Hypertension', 'Heart Disease', 'Bleeding Disorders', 'Allergic to Penicillin', 'Allergic to Sulfa'].map((opt) => {
                    const isChecked = registrationFormData.medicalHistory.includes(opt);
                    return (
                      <div key={opt} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`reg-med-${opt}`}
                          checked={isChecked}
                          onChange={() => {
                            const updated = isChecked
                              ? registrationFormData.medicalHistory.filter(item => item !== opt)
                              : [...registrationFormData.medicalHistory, opt];
                            setRegistrationFormData({ ...registrationFormData, medicalHistory: updated });
                          }}
                          className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#3B82F6] focus:ring-[#3B82F6]"
                        />
                        <label htmlFor={`reg-med-${opt}`} className="ml-2 text-xs text-gray-300 select-none cursor-pointer">
                          {opt}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Allergies */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Allergies (Comma separated)</label>
                <input
                  type="text"
                  value={registrationFormData.allergies}
                  onChange={(e) => setRegistrationFormData({ ...registrationFormData, allergies: e.target.value })}
                  placeholder="e.g. Peanuts, Penicillin, Pollen"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] transition-all text-sm"
                />
              </div>

              {/* Clinical Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Clinical Notes</label>
                <textarea
                  rows={2}
                  value={registrationFormData.notes}
                  onChange={(e) => setRegistrationFormData({ ...registrationFormData, notes: e.target.value })}
                  placeholder="History of operations, tooth sensitivity alerts, anxiety levels, etc..."
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#3B82F6] transition-all text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowRegistrationDrawer(false)}
                  className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b76ca] hover:to-[#5ea0ff] text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
                >
                  {registering ? (
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
