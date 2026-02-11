import { describe, it, expect } from 'vitest';
import {
  timezones,
  convertTimezone,
  getAllTimezones,
  timestampToDate,
  dateToTimestamp,
  getCurrentTimestamp,
  formatDate,
  getRelativeTime,
  dateDifference,
  addToDate,
  calculateAge,
  countWorkingDays,
  addWorkingDays,
  getWeekNumber,
  getISOWeek,
} from '../datetime';

// ==================== 1. timezones ====================

describe('timezones', () => {
  it('should be an array with more than 20 entries', () => {
    expect(Array.isArray(timezones)).toBe(true);
    expect(timezones.length).toBeGreaterThan(20);
  });

  it('each entry should have id, name, and offset', () => {
    for (const tz of timezones) {
      expect(tz).toHaveProperty('id');
      expect(tz).toHaveProperty('name');
      expect(tz).toHaveProperty('offset');
      expect(typeof tz.id).toBe('string');
      expect(typeof tz.name).toBe('string');
      expect(typeof tz.offset).toBe('number');
    }
  });

  it('should contain a UTC entry with offset 0', () => {
    const utc = timezones.find(tz => tz.id === 'UTC');
    expect(utc).toBeDefined();
    expect(utc!.offset).toBe(0);
  });

  it('should contain common timezone ids', () => {
    const ids = timezones.map(tz => tz.id);
    expect(ids).toContain('America/New_York');
    expect(ids).toContain('Asia/Tokyo');
    expect(ids).toContain('Europe/London');
  });
});

// ==================== 2. convertTimezone ====================

describe('convertTimezone', () => {
  const fixedDate = new Date('2024-06-15T12:00:00Z');

  it('should return an object with all required fields', () => {
    const result = convertTimezone(fixedDate, 'UTC', 'UTC');
    expect(result).toHaveProperty('timezone');
    expect(result).toHaveProperty('offset');
    expect(result).toHaveProperty('time');
    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('datetime');
    expect(result).toHaveProperty('timestamp');
  });

  it('timestamp should be the same regardless of toTimezone', () => {
    const utc = convertTimezone(fixedDate, 'UTC', 'UTC');
    const tokyo = convertTimezone(fixedDate, 'UTC', 'Asia/Tokyo');
    const ny = convertTimezone(fixedDate, 'UTC', 'America/New_York');
    expect(utc.timestamp).toBe(tokyo.timestamp);
    expect(utc.timestamp).toBe(ny.timestamp);
  });

  it('timezone field should match the toTimezone param', () => {
    const result = convertTimezone(fixedDate, 'UTC', 'Asia/Tokyo');
    expect(result.timezone).toBe('Asia/Tokyo');
  });

  it('should accept string date input', () => {
    const result = convertTimezone('2024-06-15T12:00:00Z', 'UTC', 'UTC');
    expect(result.timestamp).toBe(fixedDate.getTime());
  });

  it('should accept numeric timestamp input', () => {
    const result = convertTimezone(fixedDate.getTime(), 'UTC', 'UTC');
    expect(result.timestamp).toBe(fixedDate.getTime());
  });
});

// ==================== 3. getAllTimezones ====================

describe('getAllTimezones', () => {
  it('should return an array with length matching timezones array', () => {
    const result = getAllTimezones(new Date('2024-01-01T00:00:00Z'));
    expect(result.length).toBe(timezones.length);
  });

  it('each result should have a timezone field', () => {
    const result = getAllTimezones(new Date('2024-01-01T00:00:00Z'));
    for (const r of result) {
      expect(r).toHaveProperty('timezone');
      expect(typeof r.timezone).toBe('string');
    }
  });

  it('should default to current date when no argument provided', () => {
    const result = getAllTimezones();
    expect(result.length).toBe(timezones.length);
  });
});

// ==================== 4. timestampToDate ====================

describe('timestampToDate', () => {
  it('(0, true) should return Jan 1 1970', () => {
    const d = timestampToDate(0, true);
    expect(d.getUTCFullYear()).toBe(1970);
    expect(d.getUTCMonth()).toBe(0);
    expect(d.getUTCDate()).toBe(1);
  });

  it('(1000000000000) should return a date around Sept 2001', () => {
    const d = timestampToDate(1000000000000);
    expect(d.getUTCFullYear()).toBe(2001);
    expect(d.getUTCMonth()).toBe(8); // September
  });

  it('(1000000000, false) should equal timestampToDate(1000000000000, true)', () => {
    const fromSeconds = timestampToDate(1000000000, false);
    const fromMillis = timestampToDate(1000000000000, true);
    expect(fromSeconds.getTime()).toBe(fromMillis.getTime());
  });

  it('should return a valid Date object', () => {
    const d = timestampToDate(1700000000000);
    expect(d instanceof Date).toBe(true);
    expect(isNaN(d.getTime())).toBe(false);
  });
});

// ==================== 5. dateToTimestamp ====================

describe('dateToTimestamp', () => {
  it('should roundtrip with timestampToDate', () => {
    const original = new Date('2024-03-15T10:30:00Z');
    const ts = dateToTimestamp(original);
    const back = timestampToDate(ts);
    expect(back.getTime()).toBe(original.getTime());
  });

  it('milliseconds=false should return seconds', () => {
    const d = new Date('2024-01-01T00:00:00Z');
    const ms = dateToTimestamp(d, true);
    const sec = dateToTimestamp(d, false);
    expect(sec).toBe(Math.floor(ms / 1000));
  });

  it('should accept a string date', () => {
    const ts = dateToTimestamp('2024-06-15T00:00:00Z');
    expect(typeof ts).toBe('number');
    expect(ts).toBe(new Date('2024-06-15T00:00:00Z').getTime());
  });

  it('default should return milliseconds', () => {
    const d = new Date('2020-01-01T00:00:00Z');
    const ts = dateToTimestamp(d);
    expect(ts).toBe(d.getTime());
  });
});

// ==================== 6. getCurrentTimestamp ====================

describe('getCurrentTimestamp', () => {
  it('should return a number close to Date.now()', () => {
    const before = Date.now();
    const ts = getCurrentTimestamp();
    const after = Date.now();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('milliseconds=false should return seconds', () => {
    const ts = getCurrentTimestamp(false);
    const expected = Math.floor(Date.now() / 1000);
    expect(Math.abs(ts - expected)).toBeLessThanOrEqual(1);
  });
});

// ==================== 7. formatDate ====================

describe('formatDate', () => {
  const date = new Date('2024-07-04T15:30:00Z');

  it('ISO format should return an ISO string', () => {
    const result = formatDate(date, 'ISO');
    expect(result).toBe(date.toISOString());
  });

  it('US format should return MM/DD/YYYY', () => {
    const result = formatDate(new Date('2024-07-04T00:00:00'), 'US');
    expect(result).toMatch(/^07\/04\/2024$/);
  });

  it('EU format should return DD/MM/YYYY', () => {
    const result = formatDate(new Date('2024-07-04T00:00:00'), 'EU');
    expect(result).toMatch(/^04\/07\/2024$/);
  });

  it('UK format should return DD/MM/YYYY', () => {
    const result = formatDate(new Date('2024-07-04T00:00:00'), 'UK');
    expect(result).toMatch(/^04\/07\/2024$/);
  });

  it('relative format should return a truthy string', () => {
    const result = formatDate(new Date('2020-01-01T00:00:00Z'), 'relative');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('RFC2822 format should return a string', () => {
    const result = formatDate(date, 'RFC2822');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should accept string date input', () => {
    const result = formatDate('2024-01-15T00:00:00', 'US');
    expect(result).toMatch(/01\/15\/2024/);
  });
});

// ==================== 8. getRelativeTime ====================

describe('getRelativeTime', () => {
  it('should return "just now" for a date very close to now', () => {
    const result = getRelativeTime(new Date());
    expect(result).toBe('just now');
  });

  it('5 minutes ago should contain "minute"', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = getRelativeTime(fiveMinAgo);
    expect(result).toContain('minute');
  });

  it('2 hours ago should contain "hour"', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const result = getRelativeTime(twoHoursAgo);
    expect(result).toContain('hour');
  });

  it('future date should contain "in "', () => {
    const future = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const result = getRelativeTime(future);
    expect(result).toContain('in ');
  });

  it('1 day ago should contain "day"', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = getRelativeTime(oneDayAgo);
    expect(result).toContain('day');
  });

  it('should accept string input', () => {
    const result = getRelativeTime('2020-01-01T00:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ==================== 9. dateDifference ====================

describe('dateDifference', () => {
  it('same date should have totalDays close to 0', () => {
    const d = '2024-06-15T12:00:00Z';
    const result = dateDifference(d, d);
    expect(result.totalDays).toBeCloseTo(0, 0);
  });

  it('Jan 1 to Jan 31 should give totalDays = 30', () => {
    const result = dateDifference('2024-01-01', '2024-01-31');
    expect(result.totalDays).toBe(30);
  });

  it('should return all expected fields', () => {
    const result = dateDifference('2024-01-01', '2024-12-31');
    expect(result).toHaveProperty('years');
    expect(result).toHaveProperty('months');
    expect(result).toHaveProperty('days');
    expect(result).toHaveProperty('hours');
    expect(result).toHaveProperty('minutes');
    expect(result).toHaveProperty('seconds');
    expect(result).toHaveProperty('totalDays');
    expect(result).toHaveProperty('totalHours');
    expect(result).toHaveProperty('totalMinutes');
    expect(result).toHaveProperty('totalSeconds');
    expect(result).toHaveProperty('totalMilliseconds');
  });

  it('one full year difference', () => {
    const result = dateDifference('2023-01-01', '2024-01-01');
    expect(result.years).toBe(1);
    expect(result.months).toBe(0);
    expect(result.totalDays).toBe(365); // 2023 is not a leap year
  });

  it('totalHours should be totalDays * 24', () => {
    const result = dateDifference('2024-01-01', '2024-01-02');
    expect(result.totalHours).toBeCloseTo(result.totalDays * 24, 5);
  });
});

// ==================== 10. addToDate ====================

describe('addToDate', () => {
  it('adding 1 day to Jan 1 gives Jan 2', () => {
    const result = addToDate('2024-01-01T00:00:00', 1, 'days');
    expect(result.getDate()).toBe(2);
    expect(result.getMonth()).toBe(0);
  });

  it('adding 1 month to Jan 1 gives Feb 1', () => {
    const result = addToDate('2024-01-01T00:00:00', 1, 'months');
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(1);
  });

  it('adding 1 year to 2024-01-01 gives 2025-01-01', () => {
    const result = addToDate('2024-01-01T00:00:00', 1, 'years');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it('adding 2 weeks to Jan 1 gives Jan 15', () => {
    const result = addToDate('2024-01-01T00:00:00', 2, 'weeks');
    expect(result.getDate()).toBe(15);
    expect(result.getMonth()).toBe(0);
  });

  it('adding 3 hours to midnight gives 03:00', () => {
    const result = addToDate('2024-01-01T00:00:00', 3, 'hours');
    expect(result.getHours()).toBe(3);
  });

  it('adding 30 minutes', () => {
    const result = addToDate('2024-01-01T00:00:00', 30, 'minutes');
    expect(result.getMinutes()).toBe(30);
  });

  it('adding 45 seconds', () => {
    const result = addToDate('2024-01-01T00:00:00', 45, 'seconds');
    expect(result.getSeconds()).toBe(45);
  });

  it('should accept Date object input', () => {
    const d = new Date('2024-06-01T00:00:00');
    const result = addToDate(d, 10, 'days');
    expect(result.getDate()).toBe(11);
  });
});

// ==================== 11. calculateAge ====================

describe('calculateAge', () => {
  it('past date should give years > 0', () => {
    const result = calculateAge('1990-05-15');
    expect(result.years).toBeGreaterThan(0);
  });

  it('should return nextBirthday as a Date', () => {
    const result = calculateAge('1990-05-15');
    expect(result.nextBirthday instanceof Date).toBe(true);
  });

  it('should return daysUntilBirthday as a positive number', () => {
    const result = calculateAge('1990-05-15');
    expect(result.daysUntilBirthday).toBeGreaterThan(0);
    expect(result.daysUntilBirthday).toBeLessThanOrEqual(366);
  });

  it('should return totalDays > 0 for a past birth date', () => {
    const result = calculateAge('2000-01-01');
    expect(result.totalDays).toBeGreaterThan(0);
  });

  it('should have months between 0 and 11', () => {
    const result = calculateAge('1995-08-20');
    expect(result.months).toBeGreaterThanOrEqual(0);
    expect(result.months).toBeLessThanOrEqual(11);
  });
});

// ==================== 12. countWorkingDays ====================

describe('countWorkingDays', () => {
  // 2024-01-01 (Mon) through 2024-01-05 (Fri) → 5 weekdays
  it('Mon-Fri should return 5', () => {
    const result = countWorkingDays('2024-01-01', '2024-01-05');
    expect(result).toBe(5);
  });

  // 2024-01-01 (Mon) through 2024-01-07 (Sun) → 5 weekdays
  it('Mon-Sun (7 calendar days) should return 5', () => {
    const result = countWorkingDays('2024-01-01', '2024-01-07');
    expect(result).toBe(5);
  });

  // With holiday on Wed Jan 3
  it('with holiday on Wednesday should return 4', () => {
    const holiday = new Date('2024-01-03');
    const result = countWorkingDays('2024-01-01', '2024-01-05', [holiday]);
    expect(result).toBe(4);
  });

  // Same day (if weekday) → 1
  it('same weekday should return 1', () => {
    const result = countWorkingDays('2024-01-01', '2024-01-01'); // Monday
    expect(result).toBe(1);
  });

  // Same day on weekend → 0
  it('same day on Saturday should return 0', () => {
    const result = countWorkingDays('2024-01-06', '2024-01-06'); // Saturday
    expect(result).toBe(0);
  });

  it('two full weeks should return 10', () => {
    // Mon Jan 1 - Fri Jan 12 (2 weeks, 10 weekdays)
    const result = countWorkingDays('2024-01-01', '2024-01-12');
    expect(result).toBe(10);
  });
});

// ==================== 13. addWorkingDays ====================

describe('addWorkingDays', () => {
  // Monday + 5 working days  → next Monday
  it('Monday + 5 working days should give next Monday', () => {
    const result = addWorkingDays('2024-01-01', 5); // Mon Jan 1
    // 5 working days from Mon: Tue, Wed, Thu, Fri, Mon → Jan 8
    expect(result.getDate()).toBe(8);
    expect(result.getMonth()).toBe(0);
    expect(result.getDay()).toBe(1); // Monday
  });

  it('with holiday should skip it', () => {
    const holiday = new Date('2024-01-02'); // Tue
    const result = addWorkingDays('2024-01-01', 5, [holiday]); // Mon Jan 1 + 5
    // Working days: Wed 3, Thu 4, Fri 5, Mon 8, Tue 9 → Jan 9
    expect(result.getDate()).toBe(9);
    expect(result.getMonth()).toBe(0);
  });

  it('adding 1 working day from Friday gives Monday', () => {
    const result = addWorkingDays('2024-01-05', 1); // Fri Jan 5
    expect(result.getDate()).toBe(8); // Mon Jan 8
    expect(result.getDay()).toBe(1);
  });

  it('adding 0 working days stays on start date', () => {
    const result = addWorkingDays('2024-01-01', 0);
    expect(result.getDate()).toBe(1);
  });
});

// ==================== 14. getWeekNumber ====================

describe('getWeekNumber', () => {
  it('first ISO week of 2024 should be 1', () => {
    // Jan 4 2024 is always in ISO week 1
    const result = getWeekNumber('2024-01-04');
    expect(result).toBe(1);
  });

  it('should return a number between 1 and 53', () => {
    const result = getWeekNumber('2024-06-15');
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(53);
  });

  it('last day of year can be week 1 of next year or week 52/53', () => {
    const result = getWeekNumber('2024-12-31');
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(53);
  });

  it('should accept Date object', () => {
    const result = getWeekNumber(new Date('2024-03-01'));
    expect(typeof result).toBe('number');
  });
});

// ==================== 15. getISOWeek ====================

describe('getISOWeek', () => {
  it('should return an object with year and week', () => {
    const result = getISOWeek('2024-06-15');
    expect(result).toHaveProperty('year');
    expect(result).toHaveProperty('week');
    expect(typeof result.year).toBe('number');
    expect(typeof result.week).toBe('number');
  });

  it('Jan 4 2024 should be year 2024 week 1', () => {
    const result = getISOWeek('2024-01-04');
    expect(result.year).toBe(2024);
    expect(result.week).toBe(1);
  });

  it('week should match getWeekNumber', () => {
    const date = '2024-08-20';
    const isoWeek = getISOWeek(date);
    const weekNum = getWeekNumber(date);
    expect(isoWeek.week).toBe(weekNum);
  });

  it('should handle year boundary (last days of year)', () => {
    // Test that year-end dates return valid results
    const result = getISOWeek('2024-12-31');
    expect(result.year).toBeGreaterThanOrEqual(2024);
    expect(result.year).toBeLessThanOrEqual(2025);
    expect(result.week).toBeGreaterThanOrEqual(1);
    expect(result.week).toBeLessThanOrEqual(53);
  });
});
