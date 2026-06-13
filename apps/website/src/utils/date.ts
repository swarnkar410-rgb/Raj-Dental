// Centralized date utilities for Raj Dental PMS (standardized to DD/MM/YYYY)

/**
 * Standardizes any Date object, ISO string, or YYYY-MM-DD string into Indian format DD/MM/YYYY.
 * Example Inputs: "2026-06-18T00:00:00.000Z", "2026-06-18", Date(2026, 5, 18)
 * Output: "18/06/2026"
 */
export const formatDate = (dateVal: string | Date | null | undefined): string => {
  if (!dateVal) return '';
  
  // If string, handle quick checks
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    // Already in DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
    
    // Check if YYYY-MM-DD or ISO
    if (trimmed.includes('-')) {
      const datePart = trimmed.split('T')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) {
        // parts: ["2026", "06", "18"] -> "18/06/2026"
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
  }

  try {
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return '';
  }
};

// Alias for backward compatibility with previous dashboard implementations
export const formatDateToDMY = formatDate;

/**
 * Parses user input in DD/MM/YYYY format into a valid Date object.
 * Input: "18/06/2026"
 * Output: Date object corresponding to 2026-06-18
 */
export const parseDateString = (displayStr: string | null | undefined): Date | null => {
  if (!displayStr) return null;
  const cleanStr = displayStr.trim();
  const match = cleanStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // 0-indexed
  const year = parseInt(match[3], 10);
  
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return null;
  return d;
};

/**
 * Formats a Date or ISO string to YYYY-MM-DD for internal backend storage compatibility.
 * Input: Date object or "18/06/2026"
 * Output: "2026-06-18"
 */
export const toISODateString = (dateVal: Date | string | null | undefined): string => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
    // If it's ISO format
    if (dateVal.includes('T')) return dateVal.split('T')[0];
    // If it's in DD/MM/YYYY
    const parsed = parseDateString(dateVal);
    if (parsed) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  try {
    const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return '';
  }
};

/**
 * Formats a Date or ISO string into standard Month Year headers.
 * Input: Date object or "2026-06-18"
 * Output: "June 2026"
 */
export const formatMonthYear = (dateVal: Date | string | null | undefined): string => {
  if (!dateVal) return '';
  try {
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch (e) {
    return '';
  }
};
