/**
 * Date/Time Converter and Calculator Library
 */

// ==================== TIMEZONE CONVERSION ====================

export interface TimezoneResult {
  timezone: string;
  offset: string;
  time: string;
  date: string;
  datetime: string;
  timestamp: number;
}

export const timezones = [
  { id: 'UTC', name: 'UTC', offset: 0 },
  { id: 'America/New_York', name: 'New York (EST/EDT)', offset: -5 },
  { id: 'America/Los_Angeles', name: 'Los Angeles (PST/PDT)', offset: -8 },
  { id: 'America/Chicago', name: 'Chicago (CST/CDT)', offset: -6 },
  { id: 'America/Denver', name: 'Denver (MST/MDT)', offset: -7 },
  { id: 'America/Toronto', name: 'Toronto (EST/EDT)', offset: -5 },
  { id: 'America/Vancouver', name: 'Vancouver (PST/PDT)', offset: -8 },
  { id: 'America/Sao_Paulo', name: 'São Paulo (BRT)', offset: -3 },
  { id: 'Europe/London', name: 'London (GMT/BST)', offset: 0 },
  { id: 'Europe/Paris', name: 'Paris (CET/CEST)', offset: 1 },
  { id: 'Europe/Berlin', name: 'Berlin (CET/CEST)', offset: 1 },
  { id: 'Europe/Moscow', name: 'Moscow (MSK)', offset: 3 },
  { id: 'Europe/Istanbul', name: 'Istanbul (TRT)', offset: 3 },
  { id: 'Asia/Dubai', name: 'Dubai (GST)', offset: 4 },
  { id: 'Asia/Kolkata', name: 'India (IST)', offset: 5.5 },
  { id: 'Asia/Singapore', name: 'Singapore (SGT)', offset: 8 },
  { id: 'Asia/Hong_Kong', name: 'Hong Kong (HKT)', offset: 8 },
  { id: 'Asia/Tokyo', name: 'Tokyo (JST)', offset: 9 },
  { id: 'Asia/Seoul', name: 'Seoul (KST)', offset: 9 },
  { id: 'Asia/Shanghai', name: 'Shanghai (CST)', offset: 8 },
  { id: 'Australia/Sydney', name: 'Sydney (AEST/AEDT)', offset: 10 },
  { id: 'Australia/Perth', name: 'Perth (AWST)', offset: 8 },
  { id: 'Pacific/Auckland', name: 'Auckland (NZST/NZDT)', offset: 12 },
  { id: 'Africa/Cairo', name: 'Cairo (EET)', offset: 2 },
  { id: 'Africa/Johannesburg', name: 'Johannesburg (SAST)', offset: 2 },
];

export function convertTimezone(
  date: Date | string | number,
  _fromTimezone: string,
  toTimezone: string
): TimezoneResult {
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  // Use Intl API for accurate timezone conversion
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: toTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');
  
  // Get timezone offset
  const offsetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: toTimezone,
    timeZoneName: 'shortOffset',
  });
  const offsetStr = offsetFormatter.format(d).split(' ').pop() || '';
  
  return {
    timezone: toTimezone,
    offset: offsetStr,
    time: `${hour}:${minute}:${second}`,
    date: `${year}-${month}-${day}`,
    datetime: `${year}-${month}-${day}T${hour}:${minute}:${second}`,
    timestamp: d.getTime(),
  };
}

export function getAllTimezones(date: Date = new Date()): TimezoneResult[] {
  return timezones.map(tz => convertTimezone(date, 'UTC', tz.id));
}

// ==================== UNIX TIMESTAMP CONVERSION ====================

export function timestampToDate(timestamp: number, isMilliseconds = true): Date {
  return new Date(isMilliseconds ? timestamp : timestamp * 1000);
}

export function dateToTimestamp(date: Date | string, milliseconds = true): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return milliseconds ? d.getTime() : Math.floor(d.getTime() / 1000);
}

export function getCurrentTimestamp(milliseconds = true): number {
  return milliseconds ? Date.now() : Math.floor(Date.now() / 1000);
}

// ==================== DATE FORMATTING ====================

export type DateFormat = 
  | 'ISO'
  | 'US'
  | 'EU'
  | 'UK'
  | 'RFC2822'
  | 'relative';

export function formatDate(date: Date | string | number, format: DateFormat = 'ISO'): string {
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  
  switch (format) {
    case 'ISO':
      return d.toISOString();
    case 'US':
      return `${month}/${day}/${year}`;
    case 'EU':
      return `${day}/${month}/${year}`;
    case 'UK':
      return `${day}/${month}/${year}`;
    case 'RFC2822':
      return d.toUTCString();
    case 'relative':
      return getRelativeTime(d);
    default:
      return d.toISOString();
  }
}

export function getRelativeTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.abs(diffMs / 1000);
  const diffMin = diffSec / 60;
  const diffHour = diffMin / 60;
  const diffDay = diffHour / 24;
  const diffWeek = diffDay / 7;
  const diffMonth = diffDay / 30;
  const diffYear = diffDay / 365;
  
  const isFuture = diffMs < 0;
  const prefix = isFuture ? 'in ' : '';
  const suffix = isFuture ? '' : ' ago';
  
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${prefix}${Math.floor(diffMin)} minute${Math.floor(diffMin) > 1 ? 's' : ''}${suffix}`;
  if (diffHour < 24) return `${prefix}${Math.floor(diffHour)} hour${Math.floor(diffHour) > 1 ? 's' : ''}${suffix}`;
  if (diffDay < 7) return `${prefix}${Math.floor(diffDay)} day${Math.floor(diffDay) > 1 ? 's' : ''}${suffix}`;
  if (diffWeek < 4) return `${prefix}${Math.floor(diffWeek)} week${Math.floor(diffWeek) > 1 ? 's' : ''}${suffix}`;
  if (diffMonth < 12) return `${prefix}${Math.floor(diffMonth)} month${Math.floor(diffMonth) > 1 ? 's' : ''}${suffix}`;
  return `${prefix}${Math.floor(diffYear)} year${Math.floor(diffYear) > 1 ? 's' : ''}${suffix}`;
}

// ==================== DATE CALCULATIONS ====================

export interface DateDifference {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  totalMilliseconds: number;
}

export function dateDifference(date1: Date | string, date2: Date | string): DateDifference {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  const totalSeconds = diffMs / 1000;
  const totalMinutes = totalSeconds / 60;
  const totalHours = totalMinutes / 60;
  const totalDays = totalHours / 24;
  
  // Calculate component differences
  let years = d2.getFullYear() - d1.getFullYear();
  let months = d2.getMonth() - d1.getMonth();
  let days = d2.getDate() - d1.getDate();
  let hours = d2.getHours() - d1.getHours();
  let minutes = d2.getMinutes() - d1.getMinutes();
  let seconds = d2.getSeconds() - d1.getSeconds();
  
  // Normalize negative values
  if (seconds < 0) { seconds += 60; minutes--; }
  if (minutes < 0) { minutes += 60; hours--; }
  if (hours < 0) { hours += 24; days--; }
  if (days < 0) {
    const prevMonth = new Date(d2.getFullYear(), d2.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  if (months < 0) { months += 12; years--; }
  
  return {
    years: Math.abs(years),
    months: Math.abs(months),
    days: Math.abs(days),
    hours: Math.abs(hours),
    minutes: Math.abs(minutes),
    seconds: Math.abs(seconds),
    totalDays,
    totalHours,
    totalMinutes,
    totalSeconds,
    totalMilliseconds: diffMs,
  };
}

export function addToDate(
  date: Date | string,
  amount: number,
  unit: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds'
): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  
  switch (unit) {
    case 'years':
      d.setFullYear(d.getFullYear() + amount);
      break;
    case 'months':
      d.setMonth(d.getMonth() + amount);
      break;
    case 'weeks':
      d.setDate(d.getDate() + (amount * 7));
      break;
    case 'days':
      d.setDate(d.getDate() + amount);
      break;
    case 'hours':
      d.setHours(d.getHours() + amount);
      break;
    case 'minutes':
      d.setMinutes(d.getMinutes() + amount);
      break;
    case 'seconds':
      d.setSeconds(d.getSeconds() + amount);
      break;
  }
  
  return d;
}

// ==================== AGE CALCULATOR ====================

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  nextBirthday: Date;
  daysUntilBirthday: number;
}

export function calculateAge(birthDate: Date | string): AgeResult {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  
  const diff = dateDifference(birth, today);
  
  // Calculate next birthday
  const nextBirthday = new Date(
    today.getFullYear(),
    birth.getMonth(),
    birth.getDate()
  );
  
  if (nextBirthday <= today) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
  }
  
  const daysUntilBirthday = Math.ceil(
    (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return {
    years: diff.years,
    months: diff.months,
    days: diff.days,
    totalDays: Math.floor(diff.totalDays),
    nextBirthday,
    daysUntilBirthday,
  };
}

// ==================== WORKING DAYS CALCULATOR ====================

export function countWorkingDays(
  startDate: Date | string,
  endDate: Date | string,
  excludeHolidays: Date[] = []
): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate);
  const end = typeof endDate === 'string' ? new Date(endDate) : new Date(endDate);
  
  let count = 0;
  const current = new Date(start);
  
  const holidaySet = new Set(
    excludeHolidays.map(d => d.toDateString())
  );
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Exclude weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Check if it's not a holiday
      if (!holidaySet.has(current.toDateString())) {
        count++;
      }
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

export function addWorkingDays(
  startDate: Date | string,
  days: number,
  excludeHolidays: Date[] = []
): Date {
  const result = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate);
  
  const holidaySet = new Set(
    excludeHolidays.map(d => d.toDateString())
  );
  
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(result.toDateString())) {
      addedDays++;
    }
  }
  
  return result;
}

// ==================== WEEK NUMBER ====================

export function getWeekNumber(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7
  );
}

export function getISOWeek(date: Date | string): { year: number; week: number } {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const week = getWeekNumber(d);
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const year = d.getTime() < jan4.getTime() && week > 50 
    ? d.getFullYear() - 1 
    : d.getFullYear();
  return { year, week };
}
