/**
 * Tests for packages/tools/src/text
 * Text analysis (word count, reading time, etc.)
 */
import { describe, it, expect } from 'vitest';
import { analyzeText, type TextStats } from '../index.ts';

describe('analyzeText', () => {
  it('should return zeros for empty string', () => {
    const result = analyzeText('');
    expect(result.characters).toBe(0);
    expect(result.words).toBe(0);
    expect(result.sentences).toBe(0);
    expect(result.paragraphs).toBe(0);
    expect(result.readingTime).toBe(0);
  });

  it('should return zeros for whitespace-only string', () => {
    const result = analyzeText('   \n\n   ');
    expect(result.characters).toBe(0);
    expect(result.words).toBe(0);
  });

  it('should count characters', () => {
    const result = analyzeText('Hello World');
    expect(result.characters).toBe(11);
    expect(result.charactersNoSpaces).toBe(10);
  });

  it('should count words', () => {
    const result = analyzeText('The quick brown fox jumps');
    expect(result.words).toBe(5);
  });

  it('should count sentences', () => {
    const result = analyzeText('First sentence. Second sentence! Third?');
    expect(result.sentences).toBe(3);
  });

  it('should count paragraphs', () => {
    const result = analyzeText('Paragraph one.\n\nParagraph two.\n\nParagraph three.');
    expect(result.paragraphs).toBe(3);
  });

  it('should count lines', () => {
    const result = analyzeText('Line 1\nLine 2\nLine 3');
    expect(result.lines).toBe(3);
  });

  it('should calculate average word length', () => {
    const result = analyzeText('The fox run');
    // (3 + 3 + 3) / 3 = 3
    expect(result.averageWordLength).toBe(3);
  });

  it('should calculate reading time (200 wpm)', () => {
    // 200 words should take 1 minute
    const words = Array(200).fill('word').join(' ');
    const result = analyzeText(words);
    expect(result.readingTime).toBe(1);
  });

  it('should calculate speaking time (150 wpm)', () => {
    const words = Array(150).fill('word').join(' ');
    const result = analyzeText(words);
    expect(result.speakingTime).toBe(1);
  });
});
