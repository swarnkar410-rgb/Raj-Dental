'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Phone, Mail, User, ShieldAlert, Sparkles, Check, Loader2, Lock, Clock } from 'lucide-react';
import { formatDateToDMY } from '../utils/date';
import CustomDatePicker from './CustomDatePicker';

// ─── WhatsApp Deep Link Helper ───────────────────────────────────────────────
// Builds a wa.me URL that opens WhatsApp with the appointment details
// pre-filled for the doctor — zero API or Twilio needed.
const DOCTOR_WHATSAPP = '919199419594'; // Doctor's number with country code (no +)

const buildWhatsAppLink = (data: {
  name: string;
  phone: string;
  treatment: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
}): string => {
  const notes = data.message?.trim() || 'None';
  const text =
    `🦷 New Appointment Request — Raj Dental & Implant Hospital\n\n` +
    `👤 Patient Name  : ${data.name}\n` +
    `📞 Phone         : ${data.phone}\n` +
    `🩺 Treatment     : ${data.treatment}\n` +
    `📅 Date          : ${formatDateToDMY(data.preferredDate)}\n` +
    `🕒 Time Slot     : ${data.preferredTime}\n` +
    `📝 Notes         : ${notes}\n\n` +
    `Please review and approve in the PMS dashboard.`;
  return `https://wa.me/${DOCTOR_WHATSAPP}?text=${encodeURIComponent(text)}`;
};

export default function BookingForm() {
  const treatments = [
    'Dental Implants',
    'Root Canal Treatment (RCT)',
    'Smile Designing',
    'Braces Treatment',
    'Dental Crowns',
    'Teeth Whitening',
    'Tooth Extraction',
    'Laser Dental Treatment',
    'Clear Aligners'
  ];

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    treatment: '',
    preferredDate: '',
    preferredTime: '',
    message: ''
  });

  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reservingSlot, setReservingSlot] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Slot reservation details
  const [reservedSlot, setReservedSlot] = useState<{ date: string; time: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [duplicateCooldown, setDuplicateCooldown] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0); // seconds remaining for duplicate lock
  const [pendingRequest, setPendingRequest] = useState<{ date: string; timeSlot: string } | null>(null);
  // New UX states for slot expiry handling
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotModalMessage, setSlotModalMessage] = useState('');
  const [highlightSlots, setHighlightSlots] = useState(false);

  // Reservation recovery system states
  const [deviceId, setDeviceId] = useState<string>('');
  const [showRecoveryScreen, setShowRecoveryScreen] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{ id: string; date: string; timeSlot: string; timeLeft: number; phone?: string; deviceId?: string } | null>(null);
  const [recoveryTimeLeft, setRecoveryTimeLeft] = useState(0);

  // Form validation & Micro-animations state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const triggerShake = (fieldName: string) => {
    setShakeFields(prev => ({ ...prev, [fieldName]: true }));
    setTimeout(() => {
      setShakeFields(prev => ({ ...prev, [fieldName]: false }));
    }, 250);
  };

  const shakeVariants = {
    shake: {
      x: [0, -5, 5, -5, 5, 0],
      transition: { duration: 0.25, ease: 'easeInOut' as const }
    },
    idle: { x: 0 }
  };

  const validateField = (fieldName: string, value: string): string => {
    if (fieldName === 'name') {
      if (!value) return 'Full name is required.';
      const cleanName = value.trim().replace(/\s+/g, ' ');
      if (cleanName.length < 2 || cleanName.length > 60) {
        return 'Full name must be between 2 and 60 characters.';
      }
      if (!/^[a-zA-Z\s'-]+$/.test(cleanName)) {
        return 'Full name can only contain letters, spaces, apostrophes, and hyphens.';
      }
      const alphaCount = (cleanName.match(/[a-zA-Z]/g) || []).length;
      if (alphaCount < 2) {
        return 'Full name must contain at least 2 letters.';
      }
      const placeholderWords = ['test', 'asdf', 'placeholder', 'admin', 'qwerty', 'guest', 'user', 'patient', 'doctor', 'clinic', 'dentist', 'first name', 'last name', 'none', 'unknown', 'null', 'undefined', 'anonymous', 'no name', 'nothing', 'dummy'];
      const nameWords = cleanName.toLowerCase().split(/[\s'-]+/);
      if (nameWords.some(w => placeholderWords.includes(w))) {
        return 'Please enter a valid, real full name.';
      }
      if (/(.)\1\1/.test(cleanName.toLowerCase())) {
        return 'Full name cannot contain repeating character sequences.';
      }
    }

    if (fieldName === 'phone') {
      if (!value) return 'Phone number is required.';
      let cleanPhone = value.replace(/\D/g, '');
      if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
        cleanPhone = cleanPhone.slice(2);
      } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.slice(1);
      }
      if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        return 'Must be a valid 10-digit Indian phone starting with 6-9.';
      }
      if (/^(\d)\1{9}$/.test(cleanPhone)) {
        return 'Please enter a valid mobile number.';
      }
      const sequentialPhones = ['1234567890', '0123456789', '9876543210', '0987654321'];
      if (sequentialPhones.includes(cleanPhone)) {
        return 'Please enter a valid, active mobile number.';
      }
    }

    if (fieldName === 'email') {
      if (value) {
        const email = value.trim();
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
          return 'Please enter a valid email address.';
        }
        if (email.includes('..')) {
          return 'Email cannot contain consecutive dots.';
        }
        const [localPart, domainPart] = email.split('@');
        if (localPart.startsWith('.') || localPart.endsWith('.')) {
          return 'Local part cannot start or end with a dot.';
        }
        if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
          return 'Domain cannot start or end with a dot.';
        }
        const tld = domainPart.split('.').pop()?.toLowerCase();
        const commonTLDs = ['com', 'net', 'org', 'edu', 'gov', 'in', 'co', 'io', 'me', 'biz', 'info'];
        if (tld && !commonTLDs.includes(tld)) {
          return 'Please use a standard email domain provider.';
        }
      }
    }

    if (fieldName === 'treatment') {
      if (!value) return 'Treatment selection is required.';
      const allowedTreatments = [
        'Dental Implants',
        'Root Canal Treatment (RCT)',
        'Smile Designing',
        'Braces Treatment',
        'Dental Crowns',
        'Teeth Whitening',
        'Tooth Extraction',
        'Laser Dental Treatment',
        'Clear Aligners'
      ];
      if (!allowedTreatments.includes(value)) {
        return 'Please select a valid treatment catalog option.';
      }
    }

    if (fieldName === 'preferredDate') {
      if (!value) return 'Preferred appointment date is required.';
      const getKolkataTodayString = (): string => {
        const now = new Date();
        const kolkataTime = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000);
        const year = kolkataTime.getFullYear();
        const month = String(kolkataTime.getMonth() + 1).padStart(2, '0');
        const day = String(kolkataTime.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const todayStr = getKolkataTodayString();
      if (value < todayStr) {
        return 'Preferred date cannot be in the past.';
      }
    }

    if (fieldName === 'preferredTime') {
      if (!value) return 'Time slot selection is required.';
    }

    if (fieldName === 'message') {
      if (value && value.trim().length > 500) {
        return 'Message cannot exceed 500 characters.';
      }
    }

    return '';
  };

  const handleFocus = (fieldName: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, formData[fieldName as keyof typeof formData]);
    const prevError = errors[fieldName];
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    if (error && !prevError) {
      triggerShake(fieldName);
    }
    if (fieldName === 'phone' && !error) {
      checkPhoneStatus(formData.phone);
    }
  };

  const emailDebounceRef = useRef<number | null>(null);
  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    // Hide validation messages immediately when user starts correcting/typing input
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
    // Reset touched state so success indicator only appears after blur or debounce
    setTouched(prev => ({ ...prev, [fieldName]: false }));
    if (fieldName === 'phone') {
      setPendingRequest(null);
      setCooldownLeft(0);
    }
    // Debounce email validation (800 ms after user stops typing)
    if (fieldName === 'email') {
      if (emailDebounceRef.current) {
        clearTimeout(emailDebounceRef.current);
      }
      emailDebounceRef.current = window.setTimeout(() => {
        const err = validateField('email', value);
        setErrors(prev => ({ ...prev, email: err }));
        setTouched(prev => ({ ...prev, email: true }));
        if (err) {
          triggerShake('email');
        }
      }, 800);
    }
  };

  const inputClass = (fieldName: string, isSelect = false) => {
    const isInvalid = touched[fieldName] && errors[fieldName];
    const value = formData[fieldName as keyof typeof formData];
    const isSuccess = touched[fieldName] && value && !errors[fieldName];

    // If success, add right padding to make room for the checkmark icon
    const rightPadding = isSelect ? 'pr-10' : (isSuccess ? 'pr-10' : 'pr-4');

    return `w-full pl-11 py-3.5 rounded-xl border bg-white/5 text-white placeholder-gray-500 focus:outline-none transition-all duration-200 text-sm ${rightPadding} ${
      isInvalid
        ? 'border-red-500/50 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)] focus:shadow-[0_0_12px_rgba(239,68,68,0.25)]'
        : isSuccess
        ? 'border-emerald-500/50 focus:border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.15)] focus:shadow-[0_0_12px_rgba(16,185,129,0.25)]'
        : 'border-white/10 focus:border-[#3B82F6] focus:shadow-[0_0_10px_rgba(59,130,246,0.15)]'
    }`;
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  // On mount: call GET /session so the server issues the HttpOnly sid cookie.
  // This must happen before any slot reservation or booking request.
  // credentials: 'include' ensures the cookie is sent and received cross-origin.
  useEffect(() => {
    let storedId = localStorage.getItem('rd_booking_device_id');
    if (!storedId) {
      storedId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('rd_booking_device_id', storedId);
    }
    setDeviceId(storedId);

    const checkActiveReservation = async (id: string) => {
      try {
        const res = await fetch(`${apiUrl}/public/slots/active-reservation?deviceId=${id}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success && data.data) {
          setRecoveryData(data.data);
          setShowRecoveryScreen(true);
        }
      } catch (err) {
        console.warn('Error checking active reservation:', err);
      }
    };

    fetch(`${apiUrl}/public/session`, {
      method: 'GET',
      credentials: 'include'
    }).then(() => {
      if (storedId) {
        checkActiveReservation(storedId);
      }
    }).catch(() => {
      console.warn('Could not initialise booking session.');
      if (storedId) {
        checkActiveReservation(storedId);
      }
    });
  }, [apiUrl]);

  // Timer countdown for active reservation
  useEffect(() => {
    if (!reservedSlot) return;

    if (timeLeft <= 0) {
      // Release reservation and inform user via modal
      handleReleaseSlot(reservedSlot.date, reservedSlot.time);
      setReservedSlot(null);
      setFormData(prev => ({ ...prev, preferredTime: '' }));
      setShowSlotModal(true);
      setSlotModalMessage('Your reserved slot has been released.');
      setStatus('idle');
      // Refresh slots and highlight them
      fetchAvailableSlots(reservedSlot.date, false);
      setHighlightSlots(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [reservedSlot, timeLeft]);

  // Fetch available slots when preferred date changes
  const fetchAvailableSlots = async (date: string, clearError = true) => {
    if (!date) return;
    setLoadingSlots(true);
    setAvailableSlots([]);
    if (clearError) {
      setErrorMessage('');
      setStatus('idle');
    }
    
    try {
      const res = await fetch(`${apiUrl}/public/available-slots?date=${date}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setAvailableSlots(data.data || []);
      } else {
        setErrorMessage(data.message || 'Failed to fetch slots.');
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to connect to the scheduling system.');
      setStatus('error');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setFormData(prev => ({ ...prev, preferredDate: newDate, preferredTime: '' }));
    
    // Release any previous slot reservation first
    if (reservedSlot) {
      handleReleaseSlot(reservedSlot.date, reservedSlot.time);
      setReservedSlot(null);
    }

    fetchAvailableSlots(newDate);
    // Scroll to slot grid after date change
    setTimeout(() => {
      const el = document.getElementById('slot-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  };

  // Lock a slot with the server
  const handleReserveSlot = async (timeSlot: string) => {
    if (!formData.preferredDate) return;
    
    // Optimistically set the selected time
    setFormData(prev => ({ ...prev, preferredTime: timeSlot }));
    setErrorMessage('');
    setStatus('idle');
    setReservingSlot(true);
    
    // Release any existing reservation first
    if (reservedSlot) {
      await handleReleaseSlot(reservedSlot.date, reservedSlot.time);
    }
    
    try {
      const res = await fetch(`${apiUrl}/public/slots/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date: formData.preferredDate,
          timeSlot,
          deviceId,
          phone: formData.phone
        })
      });
      const data = await res.json();

      if (data.success) {
        // Successful lock
        setReservedSlot({ date: formData.preferredDate, time: timeSlot });
        setTimeLeft(600);
      } else {
        // Rejection – clear the selected time and inform user
        setFormData(prev => ({ ...prev, preferredTime: '' }));
        setReservedSlot(null);
        const isBookedMessage = data.message?.toLowerCase().includes('booked');
        const userMsg = isBookedMessage
          ? 'This slot was just booked. Please choose another available time.'
          : 'The selected time slot is no longer available. Please choose another available slot below.';
        setErrorMessage(userMsg);
        setStatus('error');
        // Refresh slots and highlight them
        fetchAvailableSlots(formData.preferredDate, false);
        setHighlightSlots(true);
        // Scroll to slot section
        setTimeout(() => {
          const el = document.getElementById('slot-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    } catch (err) {
      console.warn('Slot reservation request failed (network):', err);
    } finally {
      setReservingSlot(false);
    }
  };

  // Release a slot lock
  const handleReleaseSlot = async (date: string, time: string) => {
    try {
      await fetch(`${apiUrl}/public/slots/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date,
          timeSlot: time,
          deviceId,
          phone: formData.phone
        })
      });
    } catch (err) {
      console.error('Failed to release slot:', err);
    }
  };

  // Sync recoveryTimeLeft when recoveryData changes
  useEffect(() => {
    if (recoveryData) {
      setRecoveryTimeLeft(recoveryData.timeLeft);
    }
  }, [recoveryData]);

  // Countdown timer for recovery screen
  useEffect(() => {
    if (!showRecoveryScreen || recoveryTimeLeft <= 0 || !recoveryData) return;

    const interval = setInterval(() => {
      setRecoveryTimeLeft(prev => {
        if (prev <= 1) {
          handleReleaseSlot(recoveryData.date, recoveryData.timeSlot);
          setShowRecoveryScreen(false);
          setRecoveryData(null);
          setFormData(prevForm => ({ ...prevForm, preferredTime: '' }));
          setReservedSlot(null);
          setShowSlotModal(true);
          setSlotModalMessage('Your reserved slot has been released.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showRecoveryScreen, recoveryTimeLeft, recoveryData]);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const interval = setInterval(() => {
      setCooldownLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownLeft]);

  const checkPhoneStatus = async (phoneVal: string) => {
    let cleanPhone = phoneVal.replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) return;

    try {
      const res = await fetch(`${apiUrl}/public/patients/check-status?phone=${cleanPhone}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        if (data.pendingRequest) {
          setPendingRequest(data.pendingRequest);
          if (reservedSlot) {
            await handleReleaseSlot(reservedSlot.date, reservedSlot.time);
            setReservedSlot(null);
          }
          return;
        } else {
          setPendingRequest(null);
        }

        if (data.cooldownLeft) {
          setCooldownLeft(data.cooldownLeft);
          if (reservedSlot) {
            await handleReleaseSlot(reservedSlot.date, reservedSlot.time);
            setReservedSlot(null);
          }
          return;
        } else {
          setCooldownLeft(0);
        }
      }
    } catch (err) {
      console.warn('Error checking patient status:', err);
    }

    await handlePhoneValidation(phoneVal);
  };

  const handlePhoneValidation = async (phoneVal: string) => {
    let cleanPhone = phoneVal.replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) return;

    try {
      const res = await fetch(`${apiUrl}/public/slots/active-reservation?phone=${cleanPhone}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.deviceId !== deviceId) {
          setRecoveryData(data.data);
          setShowRecoveryScreen(true);
        } else {
          setReservedSlot({ date: data.data.date, time: data.data.timeSlot });
          setTimeLeft(data.data.timeLeft);
        }
      } else {
        if (reservedSlot) {
          await fetch(`${apiUrl}/public/slots/associate-phone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              date: reservedSlot.date,
              timeSlot: reservedSlot.time,
              deviceId,
              phone: cleanPhone
            })
          });
        }
      }
    } catch (err) {
      console.warn('Error checking/associating phone reservation:', err);
    }
  };

  const handleContinueBooking = async () => {
    if (!recoveryData) return;
    
    setFormData(prev => ({
      ...prev,
      preferredDate: recoveryData.date,
      preferredTime: recoveryData.timeSlot,
      phone: recoveryData.phone || prev.phone
    }));
    
    setReservedSlot({ date: recoveryData.date, time: recoveryData.timeSlot });
    setTimeLeft(recoveryData.timeLeft);
    
    if (recoveryData.deviceId !== deviceId) {
      try {
        await fetch(`${apiUrl}/public/slots/associate-phone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            date: recoveryData.date,
            timeSlot: recoveryData.timeSlot,
            deviceId,
            phone: recoveryData.phone || formData.phone || 'associated'
          })
        });
      } catch (e) {
        console.warn('Failed to associate device to recovered slot:', e);
      }
    }
    
    setShowRecoveryScreen(false);
  };

  const handleChangeSlot = async () => {
    if (!recoveryData) return;
    await handleReleaseSlot(recoveryData.date, recoveryData.timeSlot);
    
    setFormData(prev => ({ ...prev, preferredTime: '' }));
    setReservedSlot(null);
    setShowRecoveryScreen(false);
    setRecoveryData(null);
    
    if (formData.preferredDate) {
      fetchAvailableSlots(formData.preferredDate, false);
    }
    
    setTimeout(() => {
      const el = document.getElementById('slot-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  };

  const handleReleaseSlotAction = async () => {
    if (!recoveryData) return;
    await handleReleaseSlot(recoveryData.date, recoveryData.timeSlot);
    
    setFormData(prev => ({ ...prev, preferredDate: '', preferredTime: '', phone: '' }));
    setReservedSlot(null);
    setShowRecoveryScreen(false);
    setRecoveryData(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset status & errors
    setStatus('idle');
    setErrorMessage('');
    
    const newErrors: Record<string, string> = {};
    const touchedAll: Record<string, boolean> = {};
    let firstFailedField = '';

    // Run validation across all fields
    const fieldsToValidate = ['name', 'phone', 'email', 'treatment', 'preferredDate', 'preferredTime'];
    fieldsToValidate.forEach(key => {
      touchedAll[key] = true;
      const err = validateField(key, formData[key as keyof typeof formData]);
      if (err) {
        newErrors[key] = err;
        if (!firstFailedField) {
          firstFailedField = key;
        }
      }
    });

    setTouched(touchedAll);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (firstFailedField) {
        triggerShake(firstFailedField);
        // Scroll to first invalid element
        const el = document.getElementsByName(firstFailedField)[0] || document.getElementById(firstFailedField);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      setErrorMessage('Please fill in all required fields and correct the validation errors.');
      setStatus('error');
      return;
    }

    setStatus('loading');

    // 1. Sanitize values
    const cleanName = formData.name.trim().replace(/\s+/g, ' ');
    const capitalizeName = (str: string): string => {
      return str
        .toLowerCase()
        .split(' ')
        .map(word => {
          return word
            .split('-')
            .map(subWord => {
              return subWord
                .split("'")
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join("'");
            })
            .join('-');
        })
        .join(' ');
    };
    const capitalizedName = capitalizeName(cleanName);

    let cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    const cleanEmail = formData.email ? formData.email.trim().toLowerCase() : '';
    const cleanMessage = formData.message.trim().replace(/<[^>]*>/g, '');

    const finalizedData = {
      ...formData,
      name: capitalizedName,
      phone: cleanPhone,
      email: cleanEmail,
      message: cleanMessage,
      deviceId
    };

    setFormData(finalizedData);

    try {
      const res = await fetch(`${apiUrl}/public/book-appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(finalizedData)
      });

      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setReservedSlot(null); // Clear lock locally since it transitioned to REQUESTED
      } else {
        setErrorMessage(data.message || 'Something went wrong. Please select another slot.');
        setStatus('error');
        // Refresh slot lists
        fetchAvailableSlots(formData.preferredDate, false);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Unable to connect to the server. Please check your connection.');
      setStatus('error');
    }
  };

  const formatTimeLeft = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const formatRecoveryTimeLeft = () => {
    const mins = Math.floor(recoveryTimeLeft / 60);
    const secs = recoveryTimeLeft % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Reset highlight after 3 seconds
  useEffect(() => {
    if (highlightSlots) {
      const timer = setTimeout(() => setHighlightSlots(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightSlots]);

  // Get today's date formatted as YYYY-MM-DD for min date value
  const todayDate = new Date().toISOString().split('T')[0];

  return (
    <section id="book-appointment" className="py-24 bg-[#0B1220] relative overflow-hidden border-t border-white/5 z-20">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#145DA0]/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <span className="text-xs text-[#D4AF37] font-semibold uppercase tracking-widest">Schedule Visit</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Book an Appointment</h2>
          <div className="w-12 h-1 bg-[#D4AF37] mx-auto rounded-full" />
        </div>

        <div className="glass-panel p-8 sm:p-12 rounded-3xl shadow-2xl border-white/10 relative overflow-hidden">
          {/* Header glowing outline */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6]/30 to-transparent" />

          {/* Reserved Lock countdown banner */}
          {/* Booking status banner */}
          <AnimatePresence mode="wait">
            {pendingRequest ? (
              <motion.div
                key="pending-banner"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-6 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold overflow-hidden w-full"
              >
                <div className="flex items-center space-x-2">
                  <ShieldAlert size={16} className="text-red-400 shrink-0" />
                  <span>You already have a pending appointment request under review ({formatDateToDMY(pendingRequest.date)} at {pendingRequest.timeSlot}).</span>
                </div>
              </motion.div>
            ) : cooldownLeft > 0 ? (
              <motion.div
                key="cooldown-banner"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-6 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold overflow-hidden w-full"
              >
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-amber-400 shrink-0" />
                  <span>Please wait {Math.ceil(cooldownLeft / 60)} minutes before submitting another request.</span>
                </div>
              </motion.div>
            ) : reservedSlot ? (
              <motion.div
                key="reservation-banner"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-6 bg-blue-500/10 border border-blue-500/20 text-blue-300 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold overflow-hidden w-full"
              >
                <div className="flex items-center space-x-2">
                  <span>🔒 {formData.preferredTime} slot temporarily reserved for you. Complete your booking before the timer expires.</span>
                </div>
                <div className="flex items-center space-x-1 font-mono text-[#D4AF37]">
                  <Clock size={12} />
                  <span>{formatTimeLeft()}</span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {showRecoveryScreen && recoveryData ? (
              <motion.div
                key="recovery"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-6 text-center space-y-6 animate-fadeIn"
              >
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1.15, opacity: 0.3 }}
                    transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
                    className="absolute inset-0 bg-[#3B82F6] rounded-full blur-lg"
                  />
                  <div className="w-14 h-14 bg-gradient-to-tr from-[#145DA0] to-[#3B82F6] rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] z-10">
                    <Lock className="text-white" size={24} />
                  </div>
                </div>

                <div className="space-y-2 max-w-md">
                  <h3 className="text-xl font-bold text-white tracking-tight">Active Reservation Found</h3>
                  <p className="text-gray-300 text-sm">
                    We found a temporary lock reserved for your device or phone number.
                  </p>
                  
                  <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 max-w-xs mx-auto w-72">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Reserved Slot:</span>
                      <span className="text-white font-bold">{formatDateToDMY(recoveryData.date)} at {recoveryData.timeSlot}</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-gray-400">Time Remaining:</span>
                      <span className="text-[#D4AF37] font-mono font-bold flex items-center space-x-1">
                        <Clock size={12} className="inline mr-1" />
                        {formatRecoveryTimeLeft()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
                  <button
                    type="button"
                    onClick={handleContinueBooking}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b76ca] hover:to-[#5ea0ff] text-white font-bold text-xs tracking-wider shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  >
                    Continue Booking
                  </button>
                  <button
                    type="button"
                    onClick={handleChangeSlot}
                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:border-white/25 text-gray-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Change Slot
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={handleReleaseSlotAction}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold transition-all pt-1 cursor-pointer"
                >
                  Release Slot
                </button>
              </motion.div>
            ) : status !== 'success' ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {status === 'error' && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs sm:text-sm font-semibold flex items-center space-x-2">
                    <ShieldAlert size={16} className="text-red-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Full Name *</label>
                    <motion.div
                      animate={shakeFields.name && !prefersReducedMotion ? 'shake' : 'idle'}
                      variants={shakeVariants}
                      className="relative"
                    >
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Enter your full name"
                        value={formData.name}
                        onFocus={() => handleFocus('name')}
                        onBlur={() => handleBlur('name')}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className={inputClass('name')}
                      />
                      {touched.name && formData.name && !errors.name && (
                        <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-emerald-400 pointer-events-none animate-fadeIn">
                          <Check size={16} className="stroke-[3]" />
                        </span>
                      )}
                    </motion.div>
                    <AnimatePresence>
                      {touched.name && errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="text-xs text-red-400 font-semibold mt-1 flex items-center space-x-1"
                        >
                          <ShieldAlert size={12} className="shrink-0" />
                          <span>{errors.name}</span>
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Phone Number *</label>
                    <motion.div
                      animate={shakeFields.phone && !prefersReducedMotion ? 'shake' : 'idle'}
                      variants={shakeVariants}
                      className="relative"
                    >
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                        <Phone size={16} />
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="Enter your mobile number"
                        value={formData.phone}
                        onFocus={() => handleFocus('phone')}
                        onBlur={() => handleBlur('phone')}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        className={inputClass('phone')}
                      />
                      {touched.phone && formData.phone && !errors.phone && (
                        <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-emerald-400 pointer-events-none animate-fadeIn">
                          <Check size={16} className="stroke-[3]" />
                        </span>
                      )}
                    </motion.div>
                    <div className="relative min-h-[16px]">
                      <AnimatePresence mode="wait">
                        {touched.phone && errors.phone ? (
                          <motion.p
                            key="error"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="text-xs text-red-400 font-semibold flex items-center space-x-1"
                          >
                            <ShieldAlert size={12} className="shrink-0" />
                            <span>{errors.phone}</span>
                          </motion.p>
                        ) : (
                          <motion.p
                            key="helper"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] text-gray-500"
                          >
                            We'll use this number for appointment updates.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Email Address (Optional)</label>
                    <motion.div
                      animate={shakeFields.email && !prefersReducedMotion ? 'shake' : 'idle'}
                      variants={shakeVariants}
                      className="relative"
                    >
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter your email address"
                        value={formData.email}
                        onFocus={() => handleFocus('email')}
                        onBlur={() => handleBlur('email')}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        className={inputClass('email')}
                      />
                      {touched.email && formData.email && !errors.email && (
                        <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-emerald-400 pointer-events-none animate-fadeIn">
                          <Check size={16} className="stroke-[3]" />
                        </span>
                      )}
                    </motion.div>
                    <div className="relative min-h-[16px]">
                      <AnimatePresence mode="wait">
                        {touched.email && errors.email ? (
                          <motion.p
                            key="error"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="text-xs text-red-400 font-semibold flex items-center space-x-1"
                          >
                            <ShieldAlert size={12} className="shrink-0" />
                            <span>{errors.email}</span>
                          </motion.p>
                        ) : (
                          <motion.p
                            key="helper"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] text-gray-500"
                          >
                            Optional. Used for invoices and treatment records.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Treatment */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Select Treatment</label>
                    <motion.div
                      animate={shakeFields.treatment && !prefersReducedMotion ? 'shake' : 'idle'}
                      variants={shakeVariants}
                      className="relative"
                    >
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                        <Sparkles size={16} />
                      </span>
                      <select
                        name="treatment"
                        required
                        value={formData.treatment}
                        onFocus={() => handleFocus('treatment')}
                        onBlur={() => handleBlur('treatment')}
                        onChange={(e) => handleFieldChange('treatment', e.target.value)}
                        className={inputClass('treatment', true)}
                      >
                        <option value="" disabled className="bg-[#0B1220] text-gray-500">
                          Select a treatment
                        </option>
                        {treatments.map((t) => (
                          <option key={t} value={t} className="bg-[#0B1220] text-white">
                            {t}
                          </option>
                        ))}
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">&darr;</span>
                    </motion.div>
                    <AnimatePresence>
                      {touched.treatment && errors.treatment && (
                        <motion.p
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="text-xs text-red-400 font-semibold mt-1 flex items-center space-x-1"
                        >
                          <ShieldAlert size={12} className="shrink-0" />
                          <span>{errors.treatment}</span>
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Date Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Preferred Date *</label>
                    <motion.div
                      animate={shakeFields.preferredDate && !prefersReducedMotion ? 'shake' : 'idle'}
                      variants={shakeVariants}
                    >
                      <CustomDatePicker
                        value={formData.preferredDate}
                        placeholder="Select appointment date"
                        isInvalid={!!(touched.preferredDate && errors.preferredDate)}
                        onFocus={() => handleFocus('preferredDate')}
                        onChange={(val) => {
                          handleFieldChange('preferredDate', val);
                          if (reservedSlot) {
                            handleReleaseSlot(reservedSlot.date, reservedSlot.time);
                            setReservedSlot(null);
                          }
                          fetchAvailableSlots(val);
                        }}
                      />
                    </motion.div>
                    <AnimatePresence>
                      {touched.preferredDate && errors.preferredDate && (
                        <motion.p
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="text-xs text-red-400 font-semibold mt-1 flex items-center space-x-1"
                        >
                          <ShieldAlert size={12} className="shrink-0" />
                          <span>{errors.preferredDate}</span>
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Available Slots Grid */}
                {formData.preferredDate && (
                  <div id="slot-section" className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                      Select Time Slot *
                    </label>

                    {loadingSlots ? (
                      <div className="flex items-center space-x-2 text-xs text-gray-500 py-3">
                        <Loader2 size={16} className="animate-spin text-[#3B82F6]" />
                        <span>Querying clinic schedules...</span>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-xs text-gray-500 italic py-3 bg-white/3 border border-white/5 p-4 rounded-xl">
                        The clinic is closed or fully booked on this date. Please select another date.
                      </div>
                    ) : (
                      <div className={`grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 ${highlightSlots ? 'animate-pulse' : ''}`}>
                        {availableSlots.map((slot) => {
                          const isSelected = formData.preferredTime === slot.timeSlot;
                          const isFree = slot.status === 'AVAILABLE';
                          // RESERVED + currently selected = this session's own lock (shown as selected)
                          const isOwnReservation = slot.status === 'RESERVED' && isSelected;
                          const isBookable = isFree || isOwnReservation;

                          return (
                            <button
                              key={slot.timeSlot}
                              type="button"
                              disabled={!isBookable || reservingSlot || !!pendingRequest || cooldownLeft > 0}
                              onClick={() => handleReserveSlot(slot.timeSlot)}
                              className={`py-3 rounded-xl border font-bold text-xs transition-all uppercase cursor-pointer flex flex-col items-center justify-center ${
                                isSelected || isOwnReservation
                                  ? 'bg-[#3B82F6] border-[#3B82F6] text-white shadow-lg'
                                  : isBookable
                                  ? 'bg-[#0B1220] border-white/10 text-gray-300 hover:border-[#3B82F6] hover:text-white'
                                  : 'bg-white/2 border-transparent text-gray-600 cursor-not-allowed opacity-40 line-through'
                              }`}
                            >
                              <span>{slot.timeSlot}</span>
                              {!isBookable && <span className="text-[8px] opacity-75 font-semibold mt-0.5">{slot.status}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Message (Brief History / Symptoms)</label>
                  <textarea
                    name="message"
                    rows={4}
                    placeholder="Describe your dental concern or symptoms"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6] transition-all text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading' || !formData.preferredTime || !!pendingRequest || cooldownLeft > 0}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b76ca] hover:to-[#5ea0ff] text-white font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.5)] transition-all cursor-pointer flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Submitting Slot Reservation...</span>
                    </>
                  ) : (
                    <span>Request Appointment</span>
                  )}
                </button>
              </motion.form>
            ) : (
              /* Success Screen featuring the interactive Tooth Morph to Checkmark */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center py-12 text-center space-y-6"
              >
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 0.4 }}
                    transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
                    className="absolute inset-0 bg-gradient-to-tr from-[#145DA0] to-[#3B82F6] rounded-full blur-xl"
                  />

                  <motion.div
                    initial={{ rotate: 180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 12, delay: 0.2 }}
                    className="w-20 h-20 bg-gradient-to-tr from-[#D4AF37] to-[#3B82F6] rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)] z-10"
                  >
                    <motion.div
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                    >
                      <Check size={36} className="text-white stroke-[3.5]" />
                    </motion.div>
                  </motion.div>
                </div>

                <div className="space-y-2 max-w-sm">
                  <h3 className="text-2xl font-extrabold text-white">Booking Request Confirmed!</h3>
                  <p className="text-gray-300 text-sm">
                    Thank you, <span className="font-semibold text-white">{formData.name}</span>. Your slot request for <span className="font-semibold text-white">{formData.treatment}</span> on {formatDateToDMY(formData.preferredDate)} at {formData.preferredTime} has been submitted.
                  </p>
                  <p className="text-[#D4AF37] text-xs font-semibold">
                    Dr. Manoj Kumar will review your request in the PMS and notify you shortly.
                  </p>
                </div>

                {/* ── WhatsApp Notify Doctor Button ── */}
                <div className="w-full max-w-sm">
                  <div className="p-4 rounded-2xl bg-[#25D366]/8 border border-[#25D366]/20">
                    <p className="text-xs text-gray-400 text-center mb-3">
                      Speed up your confirmation — tap below to send your details directly to Dr. Manoj Kumar on WhatsApp.
                    </p>
                    <a
                      href={buildWhatsAppLink(formData)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white transition-all duration-200 shadow-lg hover:shadow-[0_4px_24px_rgba(37,211,102,0.35)] active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #1da851 0%, #25D366 60%, #128C7E 100%)'
                      }}
                    >
                      {/* WhatsApp SVG icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="white" width="20" height="20" aria-hidden="true">
                        <path d="M16.002 2.667C8.636 2.667 2.667 8.636 2.667 16c0 2.36.632 4.67 1.833 6.69L2.667 29.333l6.822-1.79A13.29 13.29 0 0 0 16.002 29.333C23.367 29.333 29.333 23.364 29.333 16S23.367 2.667 16.002 2.667Zm0 24.267a11.0 11.0 0 0 1-5.62-1.548l-.401-.238-4.048 1.062 1.08-3.942-.261-.412A10.96 10.96 0 0 1 5.067 16c0-6.03 4.906-10.933 10.935-10.933S26.933 9.97 26.933 16 22.031 26.934 16.002 26.934Zm5.994-8.188c-.329-.165-1.942-.959-2.242-1.069-.3-.11-.518-.165-.736.165s-.845 1.069-1.036 1.288c-.19.22-.382.247-.71.082-.33-.165-1.39-.513-2.648-1.635-.978-.873-1.638-1.95-1.83-2.28-.19-.33-.02-.508.144-.672.148-.148.33-.385.494-.577.165-.192.22-.33.33-.549.11-.22.055-.41-.027-.577-.082-.165-.736-1.776-1.01-2.432-.266-.638-.537-.551-.736-.561l-.627-.011c-.22 0-.577.082-.879.41-.3.33-1.15 1.124-1.15 2.74s1.178 3.18 1.342 3.398c.165.22 2.318 3.538 5.617 4.962.785.34 1.397.543 1.875.694.787.25 1.503.214 2.069.13.631-.094 1.942-.794 2.215-1.561.274-.768.274-1.427.192-1.56-.082-.138-.3-.22-.63-.385Z"/>
                      </svg>
                      <span>Notify Doctor on WhatsApp</span>
                    </a>
                    <p className="text-[10px] text-gray-500 text-center mt-2">
                      Opens WhatsApp with your details pre-filled. Just hit Send.
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 mt-2 space-y-4 max-w-md">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Thank you for choosing Raj Dental.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
                      }}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#145DA0] to-[#3B82F6] hover:from-[#1b76ca] hover:to-[#5ea0ff] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      Back to Top
                    </button>
                    <button
                      onClick={() => {
                        setFormData({
                          name: '',
                          phone: '',
                          email: '',
                          treatment: 'Dental Implants',
                          preferredDate: '',
                          preferredTime: '',
                          message: ''
                        });
                        setStatus('idle');
                      }}
                      className="px-6 py-2.5 rounded-xl border border-white/10 hover:border-white/25 text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Book Another Visit
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slot Expiry Modal */}
          {showSlotModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="bg-[#0B1220] border border-[#3B82F6] rounded-xl p-6 max-w-sm w-full text-center">
                <h3 className="text-lg font-bold text-white mb-2">{slotModalMessage}</h3>
                <p className="text-gray-300 mb-4">Your reservation has been cleared. Please select a new time slot.</p>
                <button
                  onClick={() => {
                    setShowSlotModal(false);
                    // Refresh slots & highlight
                    if (formData.preferredDate) {
                      fetchAvailableSlots(formData.preferredDate, false);
                      setHighlightSlots(true);
                    }
                    // Scroll to slots
                    setTimeout(() => {
                      const el = document.getElementById('slot-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 200);
                  }}
                  className="mt-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#5ea0ff] text-white rounded"
                >
                  Choose New Time Slot
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
