/**
 * Timezone Converter
 * Convert between timezones with DST support
 */

// Major timezone data
export const TIMEZONES: {
  id: string;
  name: string;
  offset: number; // in minutes
  abbr: string;
  city: string;
  country: string;
}[] = [
  // UTC
  { id: 'UTC', name: 'Coordinated Universal Time', offset: 0, abbr: 'UTC', city: 'UTC', country: 'Universal' },
  
  // Americas
  { id: 'America/New_York', name: 'Eastern Time', offset: -300, abbr: 'EST', city: 'New York', country: 'United States' },
  { id: 'America/Chicago', name: 'Central Time', offset: -360, abbr: 'CST', city: 'Chicago', country: 'United States' },
  { id: 'America/Denver', name: 'Mountain Time', offset: -420, abbr: 'MST', city: 'Denver', country: 'United States' },
  { id: 'America/Los_Angeles', name: 'Pacific Time', offset: -480, abbr: 'PST', city: 'Los Angeles', country: 'United States' },
  { id: 'America/Anchorage', name: 'Alaska Time', offset: -540, abbr: 'AKST', city: 'Anchorage', country: 'United States' },
  { id: 'Pacific/Honolulu', name: 'Hawaii Time', offset: -600, abbr: 'HST', city: 'Honolulu', country: 'United States' },
  { id: 'America/Toronto', name: 'Eastern Time', offset: -300, abbr: 'EST', city: 'Toronto', country: 'Canada' },
  { id: 'America/Vancouver', name: 'Pacific Time', offset: -480, abbr: 'PST', city: 'Vancouver', country: 'Canada' },
  { id: 'America/Mexico_City', name: 'Central Time', offset: -360, abbr: 'CST', city: 'Mexico City', country: 'Mexico' },
  { id: 'America/Sao_Paulo', name: 'Brasília Time', offset: -180, abbr: 'BRT', city: 'São Paulo', country: 'Brazil' },
  { id: 'America/Buenos_Aires', name: 'Argentina Time', offset: -180, abbr: 'ART', city: 'Buenos Aires', country: 'Argentina' },
  
  // Europe
  { id: 'Europe/London', name: 'Greenwich Mean Time', offset: 0, abbr: 'GMT', city: 'London', country: 'United Kingdom' },
  { id: 'Europe/Paris', name: 'Central European Time', offset: 60, abbr: 'CET', city: 'Paris', country: 'France' },
  { id: 'Europe/Berlin', name: 'Central European Time', offset: 60, abbr: 'CET', city: 'Berlin', country: 'Germany' },
  { id: 'Europe/Rome', name: 'Central European Time', offset: 60, abbr: 'CET', city: 'Rome', country: 'Italy' },
  { id: 'Europe/Madrid', name: 'Central European Time', offset: 60, abbr: 'CET', city: 'Madrid', country: 'Spain' },
  { id: 'Europe/Amsterdam', name: 'Central European Time', offset: 60, abbr: 'CET', city: 'Amsterdam', country: 'Netherlands' },
  { id: 'Europe/Brussels', name: 'Central European Time', offset: 60, abbr: 'CET', city: 'Brussels', country: 'Belgium' },
  { id: 'Europe/Zurich', name: 'Central European Time', offset: 60, abbr: 'CET', city: 'Zurich', country: 'Switzerland' },
  { id: 'Europe/Vienna', name: 'Central European Time', offset: 60, abbr: 'CET', city: 'Vienna', country: 'Austria' },
  { id: 'Europe/Stockholm', name: 'Central European Time', offset: 60, abbr: 'CET', city: 'Stockholm', country: 'Sweden' },
  { id: 'Europe/Oslo', name: 'Central European Time', offset: 60, abbr: 'CET', city: 'Oslo', country: 'Norway' },
  { id: 'Europe/Helsinki', name: 'Eastern European Time', offset: 120, abbr: 'EET', city: 'Helsinki', country: 'Finland' },
  { id: 'Europe/Athens', name: 'Eastern European Time', offset: 120, abbr: 'EET', city: 'Athens', country: 'Greece' },
  { id: 'Europe/Istanbul', name: 'Turkey Time', offset: 180, abbr: 'TRT', city: 'Istanbul', country: 'Turkey' },
  { id: 'Europe/Moscow', name: 'Moscow Time', offset: 180, abbr: 'MSK', city: 'Moscow', country: 'Russia' },
  
  // Asia
  { id: 'Asia/Dubai', name: 'Gulf Standard Time', offset: 240, abbr: 'GST', city: 'Dubai', country: 'UAE' },
  { id: 'Asia/Riyadh', name: 'Arabian Standard Time', offset: 180, abbr: 'AST', city: 'Riyadh', country: 'Saudi Arabia' },
  { id: 'Asia/Kuwait', name: 'Arabian Standard Time', offset: 180, abbr: 'AST', city: 'Kuwait City', country: 'Kuwait' },
  { id: 'Asia/Bahrain', name: 'Arabian Standard Time', offset: 180, abbr: 'AST', city: 'Manama', country: 'Bahrain' },
  { id: 'Asia/Qatar', name: 'Arabian Standard Time', offset: 180, abbr: 'AST', city: 'Doha', country: 'Qatar' },
  { id: 'Asia/Muscat', name: 'Gulf Standard Time', offset: 240, abbr: 'GST', city: 'Muscat', country: 'Oman' },
  { id: 'Asia/Tehran', name: 'Iran Standard Time', offset: 210, abbr: 'IRST', city: 'Tehran', country: 'Iran' },
  { id: 'Asia/Karachi', name: 'Pakistan Standard Time', offset: 300, abbr: 'PKT', city: 'Karachi', country: 'Pakistan' },
  { id: 'Asia/Kolkata', name: 'Indian Standard Time', offset: 330, abbr: 'IST', city: 'Mumbai', country: 'India' },
  { id: 'Asia/Dhaka', name: 'Bangladesh Standard Time', offset: 360, abbr: 'BST', city: 'Dhaka', country: 'Bangladesh' },
  { id: 'Asia/Bangkok', name: 'Indochina Time', offset: 420, abbr: 'ICT', city: 'Bangkok', country: 'Thailand' },
  { id: 'Asia/Jakarta', name: 'Western Indonesian Time', offset: 420, abbr: 'WIB', city: 'Jakarta', country: 'Indonesia' },
  { id: 'Asia/Singapore', name: 'Singapore Standard Time', offset: 480, abbr: 'SGT', city: 'Singapore', country: 'Singapore' },
  { id: 'Asia/Hong_Kong', name: 'Hong Kong Time', offset: 480, abbr: 'HKT', city: 'Hong Kong', country: 'China' },
  { id: 'Asia/Shanghai', name: 'China Standard Time', offset: 480, abbr: 'CST', city: 'Shanghai', country: 'China' },
  { id: 'Asia/Taipei', name: 'Taiwan Standard Time', offset: 480, abbr: 'TST', city: 'Taipei', country: 'Taiwan' },
  { id: 'Asia/Seoul', name: 'Korea Standard Time', offset: 540, abbr: 'KST', city: 'Seoul', country: 'South Korea' },
  { id: 'Asia/Tokyo', name: 'Japan Standard Time', offset: 540, abbr: 'JST', city: 'Tokyo', country: 'Japan' },
  
  // Australia/Pacific
  { id: 'Australia/Perth', name: 'Australian Western Time', offset: 480, abbr: 'AWST', city: 'Perth', country: 'Australia' },
  { id: 'Australia/Adelaide', name: 'Australian Central Time', offset: 570, abbr: 'ACST', city: 'Adelaide', country: 'Australia' },
  { id: 'Australia/Sydney', name: 'Australian Eastern Time', offset: 600, abbr: 'AEST', city: 'Sydney', country: 'Australia' },
  { id: 'Australia/Brisbane', name: 'Australian Eastern Time', offset: 600, abbr: 'AEST', city: 'Brisbane', country: 'Australia' },
  { id: 'Australia/Melbourne', name: 'Australian Eastern Time', offset: 600, abbr: 'AEST', city: 'Melbourne', country: 'Australia' },
  { id: 'Pacific/Auckland', name: 'New Zealand Standard Time', offset: 720, abbr: 'NZST', city: 'Auckland', country: 'New Zealand' },
  { id: 'Pacific/Fiji', name: 'Fiji Time', offset: 720, abbr: 'FJT', city: 'Suva', country: 'Fiji' },
  
  // Africa
  { id: 'Africa/Cairo', name: 'Eastern European Time', offset: 120, abbr: 'EET', city: 'Cairo', country: 'Egypt' },
  { id: 'Africa/Johannesburg', name: 'South Africa Standard Time', offset: 120, abbr: 'SAST', city: 'Johannesburg', country: 'South Africa' },
  { id: 'Africa/Lagos', name: 'West Africa Time', offset: 60, abbr: 'WAT', city: 'Lagos', country: 'Nigeria' },
  { id: 'Africa/Nairobi', name: 'East Africa Time', offset: 180, abbr: 'EAT', city: 'Nairobi', country: 'Kenya' },
];

export interface ConversionResult {
  from: {
    timezone: string;
    datetime: string;
    offset: string;
    abbr: string;
  };
  to: {
    timezone: string;
    datetime: string;
    offset: string;
    abbr: string;
  };
  difference: {
    hours: number;
    minutes: number;
    formatted: string;
  };
}

export function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function getTimezoneInfo(timezoneId: string): typeof TIMEZONES[0] | undefined {
  return TIMEZONES.find(tz => tz.id === timezoneId);
}

export function convertTimezone(
  datetime: Date | string,
  fromTimezone: string,
  toTimezone: string
): ConversionResult {
  const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
  
  // Get timezone info
  const fromTz = getTimezoneInfo(fromTimezone) || { offset: 0, abbr: 'UTC', id: fromTimezone };
  const toTz = getTimezoneInfo(toTimezone) || { offset: 0, abbr: 'UTC', id: toTimezone };
  
  // Calculate the difference in milliseconds
  const offsetDiff = (toTz.offset - fromTz.offset) * 60 * 1000;
  
  // Create new date with offset applied
  const convertedDate = new Date(date.getTime() + offsetDiff);
  
  // Format dates
  const formatDate = (d: Date) => {
    return d.toISOString().slice(0, 19).replace('T', ' ');
  };
  
  // Calculate time difference
  const diffMinutes = toTz.offset - fromTz.offset;
  const diffHours = Math.floor(Math.abs(diffMinutes) / 60);
  const diffMins = Math.abs(diffMinutes) % 60;
  const sign = diffMinutes >= 0 ? '+' : '-';
  
  return {
    from: {
      timezone: fromTimezone,
      datetime: formatDate(date),
      offset: formatOffset(fromTz.offset),
      abbr: fromTz.abbr,
    },
    to: {
      timezone: toTimezone,
      datetime: formatDate(convertedDate),
      offset: formatOffset(toTz.offset),
      abbr: toTz.abbr,
    },
    difference: {
      hours: diffHours,
      minutes: diffMins,
      formatted: `${sign}${diffHours}h ${diffMins}m`,
    },
  };
}

export function convertToMultipleTimezones(
  datetime: Date | string,
  fromTimezone: string,
  toTimezones: string[]
): ConversionResult[] {
  return toTimezones.map(toTimezone => 
    convertTimezone(datetime, fromTimezone, toTimezone)
  );
}

export function getCurrentTimeInTimezone(timezoneId: string): {
  timezone: string;
  datetime: string;
  offset: string;
  abbr: string;
  city: string;
  country: string;
} {
  const tz = getTimezoneInfo(timezoneId);
  
  if (!tz) {
    throw new Error(`Unknown timezone: ${timezoneId}`);
  }
  
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const tzTime = new Date(utc + (tz.offset * 60000));
  
  return {
    timezone: tz.id,
    datetime: tzTime.toISOString().slice(0, 19).replace('T', ' '),
    offset: formatOffset(tz.offset),
    abbr: tz.abbr,
    city: tz.city,
    country: tz.country,
  };
}

export function getWorldClock(timezones: string[]): ReturnType<typeof getCurrentTimeInTimezone>[] {
  return timezones.map(tz => getCurrentTimeInTimezone(tz));
}

export function findTimezonesByOffset(offsetHours: number): typeof TIMEZONES {
  const offsetMinutes = offsetHours * 60;
  return TIMEZONES.filter(tz => tz.offset === offsetMinutes);
}

export function findTimezonesByCountry(country: string): typeof TIMEZONES {
  const lowerCountry = country.toLowerCase();
  return TIMEZONES.filter(tz => tz.country.toLowerCase().includes(lowerCountry));
}

export function searchTimezones(query: string): typeof TIMEZONES {
  const lowerQuery = query.toLowerCase();
  return TIMEZONES.filter(tz => 
    tz.id.toLowerCase().includes(lowerQuery) ||
    tz.name.toLowerCase().includes(lowerQuery) ||
    tz.city.toLowerCase().includes(lowerQuery) ||
    tz.country.toLowerCase().includes(lowerQuery) ||
    tz.abbr.toLowerCase().includes(lowerQuery)
  );
}

export function getMeetingTimes(
  baseTime: Date | string,
  baseTimezone: string,
  participantTimezones: string[]
): {
  baseMeeting: { timezone: string; time: string };
  participants: { timezone: string; time: string; city: string; isWorkingHours: boolean }[];
  bestTimes: string[];
} {
  const baseDate = typeof baseTime === 'string' ? new Date(baseTime) : baseTime;
  
  const baseMeeting = {
    timezone: baseTimezone,
    time: baseDate.toISOString().slice(11, 16),
  };
  
  const participants = participantTimezones.map(tz => {
    const converted = convertTimezone(baseDate, baseTimezone, tz);
    const hour = parseInt(converted.to.datetime.slice(11, 13), 10);
    const tzInfo = getTimezoneInfo(tz);
    
    return {
      timezone: tz,
      time: converted.to.datetime.slice(11, 16),
      city: tzInfo?.city || tz,
      isWorkingHours: hour >= 9 && hour <= 17,
    };
  });
  
  // Find times when everyone is in working hours (9-17)
  const bestTimes: string[] = [];
  
  for (let hour = 0; hour < 24; hour++) {
    const testDate = new Date(baseDate);
    testDate.setHours(hour, 0, 0, 0);
    
    const allInWorkingHours = participantTimezones.every(tz => {
      const converted = convertTimezone(testDate, baseTimezone, tz);
      const convertedHour = parseInt(converted.to.datetime.slice(11, 13), 10);
      return convertedHour >= 9 && convertedHour <= 17;
    });
    
    if (allInWorkingHours) {
      bestTimes.push(`${hour.toString().padStart(2, '0')}:00`);
    }
  }
  
  return {
    baseMeeting,
    participants,
    bestTimes,
  };
}

export function getDefaultTimezones(): string[] {
  return [
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Dubai',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];
}

export function getTimezoneGroups(): { region: string; timezones: typeof TIMEZONES }[] {
  const groups: Record<string, typeof TIMEZONES> = {
    'Americas': [],
    'Europe': [],
    'Middle East': [],
    'Asia': [],
    'Australia & Pacific': [],
    'Africa': [],
  };
  
  for (const tz of TIMEZONES) {
    if (tz.id.startsWith('America/') || tz.id.startsWith('Pacific/Honolulu')) {
      groups['Americas'].push(tz);
    } else if (tz.id.startsWith('Europe/')) {
      groups['Europe'].push(tz);
    } else if (['Asia/Dubai', 'Asia/Riyadh', 'Asia/Kuwait', 'Asia/Bahrain', 'Asia/Qatar', 'Asia/Muscat', 'Asia/Tehran'].includes(tz.id)) {
      groups['Middle East'].push(tz);
    } else if (tz.id.startsWith('Asia/')) {
      groups['Asia'].push(tz);
    } else if (tz.id.startsWith('Australia/') || tz.id.startsWith('Pacific/')) {
      groups['Australia & Pacific'].push(tz);
    } else if (tz.id.startsWith('Africa/')) {
      groups['Africa'].push(tz);
    }
  }
  
  return Object.entries(groups).map(([region, timezones]) => ({ region, timezones }));
}
