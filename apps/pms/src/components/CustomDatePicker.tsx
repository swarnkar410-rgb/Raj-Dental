'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDate, parseDateString, toISODateString, formatMonthYear } from '../utils/date';

interface CustomDatePickerProps {
  value: string; // Internal state in YYYY-MM-DD
  onChange: (value: string) => void; // Emits YYYY-MM-DD
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function CustomDatePicker({ value, onChange, placeholder = 'dd/mm/yyyy', className = '', disabled = false }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal value (YYYY-MM-DD) to text input (DD/MM/YYYY)
  useEffect(() => {
    if (value) {
      setDisplayText(formatDate(value));
      const parsed = parseDateString(formatDate(value));
      if (parsed) {
        setCurrentMonthDate(parsed);
      }
    } else {
      setDisplayText('');
    }
  }, [value]);

  // Click outside detector to close calendar dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Format keystrokes into DD/MM/YYYY
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    
    // Extract only digits
    const digits = inputVal.replace(/\D/g, '');
    let masked = '';
    
    if (digits.length > 0) {
      masked = digits.substring(0, 2);
      if (digits.length > 2) {
        masked += '/' + digits.substring(2, 4);
      }
      if (digits.length > 4) {
        masked += '/' + digits.substring(4, 8);
      }
    }
    
    setDisplayText(masked);

    // If fully entered, trigger onChange
    if (masked.length === 10) {
      const parsedDate = parseDateString(masked);
      if (parsedDate) {
        const isoStr = toISODateString(parsedDate);
        const todayStr = toISODateString(new Date());
        if (isoStr >= todayStr) {
          onChange(isoStr);
          setCurrentMonthDate(parsedDate);
        }
      }
    } else if (masked.length === 0) {
      onChange('');
    }
  };

  // Trigger when input loses focus
  const handleBlur = () => {
    // Validate current text, fallback if invalid
    if (displayText.length > 0 && displayText.length < 10) {
      // Revert to original
      setDisplayText(value ? formatDate(value) : '');
    } else if (displayText.length === 10) {
      const parsed = parseDateString(displayText);
      const todayStr = toISODateString(new Date());
      if (!parsed || toISODateString(parsed) < todayStr) {
        setDisplayText(value ? formatDate(value) : '');
      }
    }
  };

  // Generate calendar days
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonthIndex = (year: number, month: number) => {
    // 0 = Sunday, 1 = Monday, etc. Adjust so Monday is 0
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const totalDays = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonthIndex(year, month);

  const prevMonthTotalDays = getDaysInMonth(year, month - 1);

  const days: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

  // Previous Month Padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayVal = prevMonthTotalDays - i;
    const dateObj = new Date(year, month - 1, dayVal);
    days.push({ date: dateObj, isCurrentMonth: false, key: `prev-${dayVal}` });
  }

  // Current Month Days
  for (let i = 1; i <= totalDays; i++) {
    const dateObj = new Date(year, month, i);
    days.push({ date: dateObj, isCurrentMonth: true, key: `curr-${i}` });
  }

  // Next Month Padding
  const remainingCells = 42 - days.length; // 6 rows of 7 days
  for (let i = 1; i <= remainingCells; i++) {
    const dateObj = new Date(year, month + 1, i);
    days.push({ date: dateObj, isCurrentMonth: false, key: `next-${i}` });
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const offset = direction === 'prev' ? -1 : 1;
    setCurrentMonthDate(new Date(year, month + offset, 1));
  };

  const handleDaySelect = (dayDate: Date) => {
    const isoStr = toISODateString(dayDate);
    onChange(isoStr);
    setDisplayText(formatDate(isoStr));
    setIsOpen(false);
  };

  const selectedDateStr = value ? toISODateString(new Date(value)) : '';
  const todayStr = toISODateString(new Date());

  const handleShortcut = (preset: 'today' | 'tomorrow' | 'next-week') => {
    const target = new Date();
    if (preset === 'tomorrow') {
      target.setDate(target.getDate() + 1);
    } else if (preset === 'next-week') {
      target.setDate(target.getDate() + 7);
    }
    handleDaySelect(target);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Date input box */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={displayText}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          onClick={() => { if (!disabled) setIsOpen(true); }}
          className={`w-full bg-[#020817] border border-white/10 focus:border-[#3B82F6] rounded-xl py-3 pl-4 pr-11 text-sm text-white placeholder-gray-500 outline-none transition-colors ${className} ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        />
        <button
          type="button"
          onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
          disabled={disabled}
          className="absolute right-3 p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <CalendarIcon size={16} />
        </button>
      </div>

      {/* Calendar Popup */}
      {isOpen && (
        <div className="fixed sm:absolute top-1/2 sm:top-full left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 -translate-y-1/2 sm:translate-y-2 z-[100] w-[310px] sm:w-[320px] bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col space-y-4 text-white animate-scaleUp">
          
          {/* Header Month / Year Navigation */}
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-gray-100 uppercase tracking-widest">
              {formatMonthYear(currentMonthDate)}
            </span>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map(day => (
              <span key={day} className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {day}
              </span>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map(({ date: dayDate, isCurrentMonth, key }) => {
              const formattedDayStr = toISODateString(dayDate);
              const isSelected = selectedDateStr === formattedDayStr;
              const isToday = todayStr === formattedDayStr;
              const isSunday = dayDate.getDay() === 0;
              const isPast = formattedDayStr < todayStr;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDaySelect(dayDate)}
                  disabled={isPast}
                  className={`py-1.5 text-center text-xs font-semibold rounded-lg transition-all ${
                    isPast
                      ? 'text-gray-600 opacity-25 cursor-not-allowed'
                      : `cursor-pointer ${
                          isSelected
                            ? 'bg-[#3B82F6] text-white font-extrabold shadow-md shadow-[#3B82F6]/30'
                            : isToday
                            ? 'bg-white/5 border border-[#F59E0B] text-white'
                            : isCurrentMonth
                            ? isSunday
                              ? 'text-red-400 hover:bg-white/5'
                              : 'text-gray-200 hover:bg-white/5'
                            : 'text-gray-600 hover:bg-white/3'
                        }`
                  }`}
                >
                  {dayDate.getDate()}
                </button>
              );
            })}
          </div>

          {/* Preset Shortcuts Panel */}
          <div className="flex justify-between items-center border-t border-white/5 pt-3 text-[10px] text-gray-400">
            <button
              type="button"
              onClick={() => handleShortcut('today')}
              className="hover:text-white transition-colors cursor-pointer px-2 py-1 bg-white/5 rounded hover:bg-white/10"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('tomorrow')}
              className="hover:text-white transition-colors cursor-pointer px-2 py-1 bg-white/5 rounded hover:bg-white/10"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('next-week')}
              className="hover:text-white transition-colors cursor-pointer px-2 py-1 bg-white/5 rounded hover:bg-white/10"
            >
              Next Week
            </button>
          </div>

          {/* Mobile close support */}
          <div className="flex sm:hidden justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-center rounded-xl text-xs font-bold text-gray-300 transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
