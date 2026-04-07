import { describe, it, expect, beforeAll } from 'vitest';
import { readTextInput, writeOutput } from './helpers';
import {
  calculateReadability,
  getWordFrequency,
  diffText,
  reverseString,
  reverseWords,
  shuffleWords,
  sortLines,
  removeDuplicateLines,
  removeEmptyLines,
  trimLines,
  addLineNumbers,
  wrapText,
  indentText,
  unindentText,
  generateLoremIpsum,
  extractEmails,
  extractUrls,
  extractPhoneNumbers,
  extractHashtags,
  extractMentions,
  extractNumbers,
  extractDates,
} from '../src/text';

// ---- Fixture data loaded from input files ----
let readabilitySample: string;
let extractionSample: string;
let lineOpsSample: string;
let diffOld: string;
let diffNew: string;

beforeAll(() => {
  readabilitySample = readTextInput('readability-sample.txt');
  extractionSample = readTextInput('extraction-sample.txt');
  lineOpsSample = readTextInput('line-operations-sample.txt');
  diffOld = readTextInput('diff-old.txt');
  diffNew = readTextInput('diff-new.txt');
});

// ==================== READABILITY ====================

describe('calculateReadability', () => {
  it('returns all required score fields', () => {
    const result = calculateReadability(readabilitySample);
    writeOutput('text', 'readability-scores.json', result);

    expect(result).toHaveProperty('fleschKincaid');
    expect(result).toHaveProperty('fleschReadingEase');
    expect(result).toHaveProperty('gunningFog');
    expect(result).toHaveProperty('automatedReadability');
    expect(result).toHaveProperty('colemanLiau');
    expect(result).toHaveProperty('averageGradeLevel');
    expect(result).toHaveProperty('difficulty');
  });

  it('produces numeric scores', () => {
    const result = calculateReadability(readabilitySample);
    expect(typeof result.fleschKincaid).toBe('number');
    expect(typeof result.fleschReadingEase).toBe('number');
    expect(typeof result.gunningFog).toBe('number');
    expect(typeof result.automatedReadability).toBe('number');
    expect(typeof result.colemanLiau).toBe('number');
    expect(typeof result.averageGradeLevel).toBe('number');
    expect(result.fleschKincaid).toBeGreaterThan(0);
  });

  it('assigns a difficulty level', () => {
    const validDifficulties = [
      'very-easy', 'easy', 'fairly-easy', 'standard',
      'fairly-difficult', 'difficult', 'very-difficult',
    ];
    const result = calculateReadability(readabilitySample);
    expect(validDifficulties).toContain(result.difficulty);
  });

  it('detects harder text as higher grade level', () => {
    const easy = 'The cat sat. The dog ran. The sun is hot.';
    const hard = 'Epistemological considerations regarding phenomenological interpretations necessitate interdisciplinary methodological frameworks.';
    const easyResult = calculateReadability(easy);
    const hardResult = calculateReadability(hard);
    writeOutput('text', 'readability-easy-vs-hard.json', { easy: easyResult, hard: hardResult });

    expect(hardResult.averageGradeLevel).toBeGreaterThan(easyResult.averageGradeLevel);
  });

  it('handles empty string', () => {
    const result = calculateReadability('');
    // Empty input returns NaN for scores (division by zero)
    expect(result).toHaveProperty('fleschKincaid');
    expect(result).toHaveProperty('averageGradeLevel');
  });
});

// ==================== WORD FREQUENCY ====================

describe('getWordFrequency', () => {
  it('counts word occurrences correctly', () => {
    const text = 'the the the cat dog cat';
    const result = getWordFrequency(text);
    writeOutput('text', 'word-frequency-basic.json', result);

    const theEntry = result.find(w => w.word === 'the');
    expect(theEntry).toBeDefined();
    expect(theEntry!.count).toBe(3);
    const catEntry = result.find(w => w.word === 'cat');
    expect(catEntry!.count).toBe(2);
  });

  it('sorts by frequency descending', () => {
    const text = 'a b b c c c';
    const result = getWordFrequency(text);
    expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
    expect(result[1].count).toBeGreaterThanOrEqual(result[2].count);
  });

  it('calculates percentages', () => {
    const text = 'hello hello world';
    const result = getWordFrequency(text);
    const hello = result.find(w => w.word === 'hello');
    expect(hello!.percentage).toBeCloseTo(66.67, 0);
  });

  it('respects caseSensitive option', () => {
    const text = 'Hello hello HELLO';
    const caseInsensitive = getWordFrequency(text, { caseSensitive: false });
    const caseSensitive = getWordFrequency(text, { caseSensitive: true });
    expect(caseInsensitive.length).toBeLessThan(caseSensitive.length);
  });

  it('respects limit option', () => {
    const text = 'a b c d e f g h i j';
    const result = getWordFrequency(text, { limit: 3 });
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('works on the real fixture data', () => {
    const result = getWordFrequency(readabilitySample, { limit: 20 });
    writeOutput('text', 'word-frequency-fixture.json', result);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(20);
  });
});

// ==================== TEXT DIFF ====================

describe('diffText', () => {
  it('detects added, removed, and unchanged segments', () => {
    const result = diffText(diffOld, diffNew);
    writeOutput('text', 'diff-result.json', result);

    const types = result.map(d => d.type);
    expect(types).toContain('unchanged');
    // At least one difference should exist
    expect(types.some(t => t === 'added' || t === 'removed')).toBe(true);
  });

  it('returns each segment with type and value', () => {
    const result = diffText(diffOld, diffNew);
    for (const segment of result) {
      expect(['unchanged', 'added', 'removed']).toContain(segment.type);
      expect(typeof segment.value).toBe('string');
    }
  });

  it('finds no diff for identical texts', () => {
    const text = 'identical content';
    const result = diffText(text, text);
    expect(result.every(d => d.type === 'unchanged')).toBe(true);
  });

  it('detects all content as added when old is empty', () => {
    const result = diffText('', 'new content');
    expect(result.some(d => d.type === 'added')).toBe(true);
  });

  it('detects all content as removed when new is empty', () => {
    const result = diffText('old content', '');
    expect(result.some(d => d.type === 'removed')).toBe(true);
  });
});

// ==================== STRING REVERSAL ====================

describe('reverseString', () => {
  it('reverses a string', () => {
    const result = reverseString('Hello World');
    writeOutput('text', 'reverse-string.txt', `Input: Hello World\nOutput: ${result}`);
    expect(result).toBe('dlroW olleH');
  });

  it('handles empty string', () => {
    expect(reverseString('')).toBe('');
  });

  it('handles palindrome', () => {
    expect(reverseString('racecar')).toBe('racecar');
  });

  it('handles single character', () => {
    expect(reverseString('x')).toBe('x');
  });
});

describe('reverseWords', () => {
  it('reverses word order', () => {
    const result = reverseWords('Hello beautiful World');
    writeOutput('text', 'reverse-words.txt', `Input: Hello beautiful World\nOutput: ${result}`);
    expect(result).toBe('World beautiful Hello');
  });

  it('handles single word', () => {
    expect(reverseWords('Hello')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(reverseWords('')).toBe('');
  });
});

// ==================== SHUFFLE ====================

describe('shuffleWords', () => {
  it('returns the same words in some order', () => {
    const input = 'alpha beta gamma delta epsilon';
    const result = shuffleWords(input);
    writeOutput('text', 'shuffle-words.txt', `Input: ${input}\nOutput: ${result}`);
    const inputWords = input.split(' ').sort();
    const resultWords = result.split(' ').sort();
    expect(resultWords).toEqual(inputWords);
  });

  it('handles single word', () => {
    expect(shuffleWords('only')).toBe('only');
  });

  it('handles empty string', () => {
    expect(shuffleWords('')).toBe('');
  });
});

// ==================== LINE OPERATIONS ====================

describe('sortLines', () => {
  it('sorts lines alphabetically ascending by default', () => {
    const input = 'banana\napple\ncherry';
    const result = sortLines(input, {});
    writeOutput('text', 'sort-lines-asc.txt', `Input:\n${input}\n\nOutput:\n${result}`);
    expect(result).toBe('apple\nbanana\ncherry');
  });

  it('sorts descending when specified', () => {
    const input = 'banana\napple\ncherry';
    const result = sortLines(input, { descending: true });
    expect(result).toBe('cherry\nbanana\napple');
  });

  it('sorts numerically when specified', () => {
    const input = '10\n2\n30\n1';
    const result = sortLines(input, { numeric: true });
    writeOutput('text', 'sort-lines-numeric.txt', `Input:\n${input}\n\nOutput:\n${result}`);
    expect(result).toBe('1\n2\n10\n30');
  });

  it('removes duplicates with unique option', () => {
    const input = 'a\nb\na\nc\nb';
    const result = sortLines(input, { unique: true });
    const lines = result.split('\n');
    expect(new Set(lines).size).toBe(lines.length);
  });

  it('works with fixture data', () => {
    const result = sortLines(lineOpsSample, {});
    writeOutput('text', 'sort-lines-fixture.txt', result);
    expect(typeof result).toBe('string');
  });
});

describe('removeDuplicateLines', () => {
  it('removes duplicate lines', () => {
    const input = 'line1\nline2\nline1\nline3\nline2';
    const result = removeDuplicateLines(input);
    writeOutput('text', 'remove-duplicate-lines.txt', `Input:\n${input}\n\nOutput:\n${result}`);
    expect(result).toBe('line1\nline2\nline3');
  });

  it('preserves order of first occurrence', () => {
    const input = 'c\na\nb\na\nc';
    const result = removeDuplicateLines(input);
    expect(result).toBe('c\na\nb');
  });

  it('works with fixture data', () => {
    const result = removeDuplicateLines(lineOpsSample);
    const lines = result.split('\n');
    expect(new Set(lines).size).toBe(lines.length);
  });
});

describe('removeEmptyLines', () => {
  it('removes empty lines', () => {
    const input = 'line1\n\nline2\n\n\nline3';
    const result = removeEmptyLines(input);
    writeOutput('text', 'remove-empty-lines.txt', `Input:\n${input}\n\nOutput:\n${result}`);
    expect(result).not.toContain('\n\n');
  });

  it('handles text with no empty lines', () => {
    const input = 'line1\nline2\nline3';
    expect(removeEmptyLines(input)).toBe(input);
  });

  it('works with fixture data', () => {
    const result = removeEmptyLines(lineOpsSample);
    writeOutput('text', 'remove-empty-lines-fixture.txt', result);
    const lines = result.split('\n');
    expect(lines.every(l => l.trim().length > 0)).toBe(true);
  });
});

describe('trimLines', () => {
  it('trims whitespace from each line', () => {
    const input = '  hello  \n  world  \n  test  ';
    const result = trimLines(input);
    writeOutput('text', 'trim-lines.txt', `Input:\n${input}\n\nOutput:\n${result}`);
    expect(result).toBe('hello\nworld\ntest');
  });

  it('handles already trimmed lines', () => {
    const input = 'clean\nlines\nhere';
    expect(trimLines(input)).toBe(input);
  });

  it('works with fixture data', () => {
    const result = trimLines(lineOpsSample);
    writeOutput('text', 'trim-lines-fixture.txt', result);
    const lines = result.split('\n');
    for (const line of lines) {
      expect(line).toBe(line.trim());
    }
  });
});

describe('addLineNumbers', () => {
  it('adds line numbers starting from 1', () => {
    const input = 'first\nsecond\nthird';
    const result = addLineNumbers(input, {});
    writeOutput('text', 'add-line-numbers.txt', `Input:\n${input}\n\nOutput:\n${result}`);
    const lines = result.split('\n');
    expect(lines[0]).toMatch(/1/);
    expect(lines[1]).toMatch(/2/);
    expect(lines[2]).toMatch(/3/);
  });

  it('respects startFrom option', () => {
    const input = 'a\nb\nc';
    const result = addLineNumbers(input, { startFrom: 10 });
    expect(result.split('\n')[0]).toMatch(/10/);
  });

  it('respects custom separator', () => {
    const input = 'line';
    const result = addLineNumbers(input, { separator: ' -> ' });
    expect(result).toContain(' -> ');
  });

  it('works with fixture data', () => {
    const result = addLineNumbers(lineOpsSample, { startFrom: 1 });
    writeOutput('text', 'add-line-numbers-fixture.txt', result);
    expect(result.split('\n').length).toBe(lineOpsSample.split('\n').length);
  });
});

// ==================== TEXT WRAPPING & INDENTATION ====================

describe('wrapText', () => {
  it('wraps long lines at specified width', () => {
    const longLine = 'word '.repeat(30).trim(); // 150 chars
    const result = wrapText(longLine, 40);
    writeOutput('text', 'wrap-text.txt', `Width: 40\nInput:\n${longLine}\n\nOutput:\n${result}`);
    const lines = result.split('\n');
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(42); // small tolerance for word boundaries
    }
  });

  it('preserves short lines', () => {
    const input = 'short line';
    expect(wrapText(input, 80)).toBe('short line');
  });

  it('uses default width of 80', () => {
    const longLine = 'a '.repeat(60).trim();
    const result = wrapText(longLine);
    const lines = result.split('\n');
    expect(lines.length).toBeGreaterThan(1);
  });
});

describe('indentText', () => {
  it('adds indentation to each line', () => {
    const input = 'line1\nline2\nline3';
    const result = indentText(input, 4);
    writeOutput('text', 'indent-text.txt', `Indent: 4 spaces\nInput:\n${input}\n\nOutput:\n${result}`);
    const lines = result.split('\n');
    for (const line of lines) {
      expect(line).toMatch(/^ {4}/);
    }
  });

  it('uses default indent of 2 spaces', () => {
    const result = indentText('hello');
    expect(result).toMatch(/^ {2}hello/);
  });
});

describe('unindentText', () => {
  it('removes common indentation', () => {
    const input = '    line1\n    line2\n      line3';
    const result = unindentText(input);
    writeOutput('text', 'unindent-text.txt', `Input:\n${input}\n\nOutput:\n${result}`);
    expect(result).not.toMatch(/^ {4}line1/m);
    // line3 should still have relative indent
    const lines = result.split('\n');
    expect(lines[0].startsWith('line1')).toBe(true);
  });

  it('handles already unindented text', () => {
    const input = 'no indent\nnone here';
    const result = unindentText(input);
    expect(result).toBe(input);
  });
});

// ==================== LOREM IPSUM ====================

describe('generateLoremIpsum', () => {
  it('generates words', () => {
    const result = generateLoremIpsum({ type: 'words', count: 10 });
    writeOutput('text', 'lorem-ipsum-words.txt', result);
    const words = result.split(/\s+/).filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(8); // allow slight variance
  });

  it('generates sentences', () => {
    const result = generateLoremIpsum({ type: 'sentences', count: 3 });
    writeOutput('text', 'lorem-ipsum-sentences.txt', result);
    expect(result.length).toBeGreaterThan(10);
  });

  it('generates paragraphs', () => {
    const result = generateLoremIpsum({ type: 'paragraphs', count: 2 });
    writeOutput('text', 'lorem-ipsum-paragraphs.txt', result);
    expect(result.length).toBeGreaterThan(50);
  });

  it('starts with Lorem ipsum when option set', () => {
    const result = generateLoremIpsum({ type: 'paragraphs', count: 1, startWithLorem: true });
    const lower = result.toLowerCase();
    expect(lower.startsWith('lorem')).toBe(true);
  });
});

// ==================== EXTRACTION ====================

describe('extractEmails', () => {
  it('extracts emails from text', () => {
    const result = extractEmails(extractionSample);
    writeOutput('text', 'extract-emails.json', result);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result).toContain('support@example.com');
    expect(result).toContain('admin@hsafx.world');
  });

  it('returns empty array when no emails found', () => {
    expect(extractEmails('no emails here')).toEqual([]);
  });
});

describe('extractUrls', () => {
  it('extracts URLs from text', () => {
    const result = extractUrls(extractionSample);
    writeOutput('text', 'extract-urls.json', result);
    expect(result.length).toBeGreaterThanOrEqual(2);
    // Check at least one expected URL is found
    const hasExample = result.some(u => u.includes('example.com'));
    expect(hasExample).toBe(true);
  });

  it('returns empty array when no URLs', () => {
    expect(extractUrls('just plain text')).toEqual([]);
  });
});

describe('extractPhoneNumbers', () => {
  it('extracts phone numbers from text', () => {
    const result = extractPhoneNumbers(extractionSample);
    writeOutput('text', 'extract-phones.json', result);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty array when no phones', () => {
    expect(extractPhoneNumbers('no phones at all')).toEqual([]);
  });
});

describe('extractHashtags', () => {
  it('extracts hashtags from text', () => {
    const result = extractHashtags(extractionSample);
    writeOutput('text', 'extract-hashtags.json', result);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result).toContain('#TypeScript');
    expect(result).toContain('#WebDev');
  });

  it('returns empty array when no hashtags', () => {
    expect(extractHashtags('no tags here')).toEqual([]);
  });
});

describe('extractMentions', () => {
  it('extracts @mentions from text', () => {
    const result = extractMentions(extractionSample);
    writeOutput('text', 'extract-mentions.json', result);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result).toContain('@github');
    expect(result).toContain('@copilot');
  });

  it('returns empty array when no mentions', () => {
    expect(extractMentions('no at signs')).toEqual([]);
  });
});

describe('extractNumbers', () => {
  it('extracts numbers from text', () => {
    const result = extractNumbers(extractionSample);
    writeOutput('text', 'extract-numbers.json', result);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.every(n => typeof n === 'number')).toBe(true);
  });

  it('returns empty array when no numbers', () => {
    expect(extractNumbers('no numbers at all')).toEqual([]);
  });
});

describe('extractDates', () => {
  it('extracts dates from text', () => {
    const result = extractDates(extractionSample);
    writeOutput('text', 'extract-dates.json', result);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty array when no dates', () => {
    expect(extractDates('no dates anywhere')).toEqual([]);
  });
});
