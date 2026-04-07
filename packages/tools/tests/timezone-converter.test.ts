import { describe, it, expect } from 'vitest';
import { writeOutput } from './helpers';
import {
  formatOffset,
  getTimezoneInfo,
  convertTimezone,
  convertToMultipleTimezones,
  getCurrentTimeInTimezone,
  getWorldClock,
  findTimezonesByOffset,
  findTimezonesByCountry,
  searchTimezones,
  getMeetingTimes,
  getDefaultTimezones,
  getTimezoneGroups,
} from '../src/specialized/timezone-converter';

// ==================== formatOffset ====================

describe('formatOffset', () => {
  it('formats positive offset', () => {
    const result = formatOffset(330); // +5:30 (India)
    writeOutput('timezone', 'format-offset-positive.txt', result);
    expect(result).toContain('+');
    expect(result).toContain('5');
    expect(result).toContain('30');
  });

  it('formats negative offset', () => {
    const result = formatOffset(-300); // -5:00 (EST)
    writeOutput('timezone', 'format-offset-negative.txt', result);
    expect(result).toContain('-');
  });

  it('formats zero offset', () => {
    const result = formatOffset(0); // UTC
    expect(result).toContain('0');
  });
});

// ==================== getTimezoneInfo ====================

describe('getTimezoneInfo', () => {
  it('returns info for valid timezone', () => {
    const info = getTimezoneInfo('America/New_York');
    writeOutput('timezone', 'timezone-info-nyc.json', JSON.stringify(info, null, 2));
    expect(info).toBeDefined();
    expect(info!.city).toBeDefined();
    expect(info!.country).toBeDefined();
  });

  it('returns undefined for invalid timezone', () => {
    const info = getTimezoneInfo('Invalid/Timezone');
    expect(info).toBeUndefined();
  });

  it('returns info for UTC', () => {
    const info = getTimezoneInfo('UTC');
    if (info) {
      expect(info.offset).toBe(0);
    }
  });
});

// ==================== convertTimezone ====================

describe('convertTimezone', () => {
  it('converts between two timezones', () => {
    const result = convertTimezone(
      '2024-06-15T12:00:00',
      'America/New_York',
      'Europe/London',
    );
    writeOutput('timezone', 'convert-nyc-to-london.json', JSON.stringify(result, null, 2));
    expect(result).toHaveProperty('from');
    expect(result).toHaveProperty('to');
    expect(result).toHaveProperty('difference');
    expect(result.from.timezone).toBe('America/New_York');
    expect(result.to.timezone).toBe('Europe/London');
  });

  it('includes formatted time difference', () => {
    const result = convertTimezone(
      '2024-01-15T09:00:00',
      'Asia/Tokyo',
      'America/Los_Angeles',
    );
    writeOutput('timezone', 'convert-tokyo-to-la.json', JSON.stringify(result, null, 2));
    expect(result.difference).toHaveProperty('hours');
    expect(result.difference).toHaveProperty('minutes');
    expect(result.difference).toHaveProperty('formatted');
  });

  it('accepts Date object', () => {
    const result = convertTimezone(
      new Date('2024-06-15T12:00:00Z'),
      'UTC',
      'Asia/Dubai',
    );
    expect(result.from.timezone).toBe('UTC');
    expect(result.to.timezone).toBe('Asia/Dubai');
  });
});

// ==================== convertToMultipleTimezones ====================

describe('convertToMultipleTimezones', () => {
  it('converts to multiple timezones at once', () => {
    const results = convertToMultipleTimezones(
      '2024-06-15T10:00:00',
      'UTC',
      ['America/New_York', 'Europe/London', 'Asia/Tokyo'],
    );
    writeOutput('timezone', 'convert-multiple.json', JSON.stringify(results, null, 2));
    expect(results).toHaveLength(3);
    results.forEach((r) => {
      expect(r).toHaveProperty('from');
      expect(r).toHaveProperty('to');
    });
  });
});

// ==================== getCurrentTimeInTimezone ====================

describe('getCurrentTimeInTimezone', () => {
  it('returns current time for a timezone', () => {
    const result = getCurrentTimeInTimezone('America/New_York');
    writeOutput('timezone', 'current-time-nyc.json', JSON.stringify(result, null, 2));
    expect(result).toHaveProperty('timezone', 'America/New_York');
    expect(result).toHaveProperty('datetime');
    expect(result).toHaveProperty('offset');
    expect(result).toHaveProperty('city');
    expect(result).toHaveProperty('country');
  });
});

// ==================== getWorldClock ====================

describe('getWorldClock', () => {
  it('returns current time for multiple timezones', () => {
    const results = getWorldClock(['UTC', 'America/New_York', 'Asia/Dubai']);
    writeOutput('timezone', 'world-clock.json', JSON.stringify(results, null, 2));
    expect(results).toHaveLength(3);
    results.forEach((r) => {
      expect(r).toHaveProperty('timezone');
      expect(r).toHaveProperty('datetime');
    });
  });
});

// ==================== findTimezonesByOffset ====================

describe('findTimezonesByOffset', () => {
  it('finds timezones with +5:30 offset', () => {
    const results = findTimezonesByOffset(5.5);
    writeOutput('timezone', 'find-by-offset-5.5.json', JSON.stringify(results, null, 2));
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds timezones with UTC offset', () => {
    const results = findTimezonesByOffset(0);
    expect(results.length).toBeGreaterThan(0);
  });
});

// ==================== findTimezonesByCountry ====================

describe('findTimezonesByCountry', () => {
  it('finds timezones for United States', () => {
    const results = findTimezonesByCountry('United States');
    writeOutput('timezone', 'find-by-country-us.json', JSON.stringify(results, null, 2));
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty for non-existent country', () => {
    const results = findTimezonesByCountry('Narnia');
    expect(results).toHaveLength(0);
  });
});

// ==================== searchTimezones ====================

describe('searchTimezones', () => {
  it('searches by city name', () => {
    const results = searchTimezones('London');
    writeOutput('timezone', 'search-london.json', JSON.stringify(results, null, 2));
    expect(results.length).toBeGreaterThan(0);
  });

  it('searches by timezone ID', () => {
    const results = searchTimezones('America');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty for no match', () => {
    const results = searchTimezones('xyznonexistent');
    expect(results).toHaveLength(0);
  });
});

// ==================== getMeetingTimes ====================

describe('getMeetingTimes', () => {
  it('calculates meeting times across timezones', () => {
    const result = getMeetingTimes(
      '2024-06-15T14:00:00',
      'America/New_York',
      ['Europe/London', 'Asia/Tokyo', 'Asia/Dubai'],
    );
    writeOutput('timezone', 'meeting-times.json', JSON.stringify(result, null, 2));
    expect(result).toHaveProperty('baseMeeting');
    expect(result).toHaveProperty('participants');
    expect(result.participants).toHaveLength(3);
    result.participants.forEach((p) => {
      expect(p).toHaveProperty('timezone');
      expect(p).toHaveProperty('time');
      expect(p).toHaveProperty('isWorkingHours');
    });
  });
});

// ==================== getDefaultTimezones ====================

describe('getDefaultTimezones', () => {
  it('returns a list of default timezone IDs', () => {
    const defaults = getDefaultTimezones();
    writeOutput('timezone', 'default-timezones.json', JSON.stringify(defaults, null, 2));
    expect(defaults.length).toBeGreaterThan(0);
    defaults.forEach((tz) => {
      expect(typeof tz).toBe('string');
    });
  });
});

// ==================== getTimezoneGroups ====================

describe('getTimezoneGroups', () => {
  it('returns timezone groups organized by region', () => {
    const groups = getTimezoneGroups();
    writeOutput('timezone', 'timezone-groups.json', JSON.stringify(groups, null, 2));
    expect(groups.length).toBeGreaterThan(0);
    groups.forEach((g) => {
      expect(g).toHaveProperty('region');
      expect(g).toHaveProperty('timezones');
      expect(g.timezones.length).toBeGreaterThan(0);
    });
  });
});
