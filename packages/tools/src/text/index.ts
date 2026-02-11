/**
 * Text Processing Library
 * Text analysis and manipulation utilities
 */

// ==================== TEXT ANALYSIS ====================

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  averageWordLength: number;
  averageSentenceLength: number;
  readingTime: number; // in minutes
  speakingTime: number; // in minutes
}

export function analyzeText(text: string): TextStats {
  const trimmed = text.trim();
  
  if (!trimmed) {
    return {
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      averageWordLength: 0,
      averageSentenceLength: 0,
      readingTime: 0,
      speakingTime: 0,
    };
  }
  
  const characters = trimmed.length;
  const charactersNoSpaces = trimmed.replace(/\s/g, '').length;
  
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  
  const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim()).length;
  const paragraphs = trimmed.split(/\n\s*\n/).filter(p => p.trim()).length;
  const lines = trimmed.split('\n').length;
  
  const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
  const averageWordLength = wordCount > 0 ? totalWordLength / wordCount : 0;
  const averageSentenceLength = sentences > 0 ? wordCount / sentences : 0;
  
  const readingTime = wordCount / 200; // Average reading speed: 200 wpm
  const speakingTime = wordCount / 150; // Average speaking speed: 150 wpm
  
  return {
    characters,
    charactersNoSpaces,
    words: wordCount,
    sentences,
    paragraphs,
    lines,
    averageWordLength: Math.round(averageWordLength * 10) / 10,
    averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
    readingTime: Math.round(readingTime * 10) / 10,
    speakingTime: Math.round(speakingTime * 10) / 10,
  };
}

export interface ReadabilityScores {
  fleschKincaid: number;
  fleschReadingEase: number;
  gunningFog: number;
  automatedReadability: number;
  colemanLiau: number;
  averageGradeLevel: number;
  difficulty: 'very-easy' | 'easy' | 'fairly-easy' | 'standard' | 'fairly-difficult' | 'difficult' | 'very-difficult';
}

function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function calculateReadability(text: string): ReadabilityScores {
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const wordCount = words.length;
  const sentenceCount = Math.max(sentences, 1);
  
  const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const complexWords = words.filter(word => countSyllables(word) >= 3).length;
  const characterCount = words.join('').length;
  
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  const avgCharsPerWord = characterCount / wordCount;
  
  // Flesch-Kincaid Grade Level
  const fleschKincaid = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  
  // Flesch Reading Ease (0-100, higher is easier)
  const fleschReadingEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  
  // Gunning Fog Index
  const gunningFog = 0.4 * (avgWordsPerSentence + 100 * (complexWords / wordCount));
  
  // Automated Readability Index
  const automatedReadability = 4.71 * avgCharsPerWord + 0.5 * avgWordsPerSentence - 21.43;
  
  // Coleman-Liau Index
  const L = (characterCount / wordCount) * 100;
  const S = (sentenceCount / wordCount) * 100;
  const colemanLiau = 0.0588 * L - 0.296 * S - 15.8;
  
  // Average grade level
  const averageGradeLevel = (fleschKincaid + gunningFog + automatedReadability + colemanLiau) / 4;
  
  // Determine difficulty
  let difficulty: ReadabilityScores['difficulty'];
  if (fleschReadingEase >= 90) difficulty = 'very-easy';
  else if (fleschReadingEase >= 80) difficulty = 'easy';
  else if (fleschReadingEase >= 70) difficulty = 'fairly-easy';
  else if (fleschReadingEase >= 60) difficulty = 'standard';
  else if (fleschReadingEase >= 50) difficulty = 'fairly-difficult';
  else if (fleschReadingEase >= 30) difficulty = 'difficult';
  else difficulty = 'very-difficult';
  
  return {
    fleschKincaid: Math.round(fleschKincaid * 10) / 10,
    fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
    gunningFog: Math.round(gunningFog * 10) / 10,
    automatedReadability: Math.round(automatedReadability * 10) / 10,
    colemanLiau: Math.round(colemanLiau * 10) / 10,
    averageGradeLevel: Math.round(averageGradeLevel * 10) / 10,
    difficulty,
  };
}

// ==================== WORD FREQUENCY ====================

export interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

export function getWordFrequency(
  text: string,
  options: {
    caseSensitive?: boolean;
    minLength?: number;
    excludeStopWords?: boolean;
    limit?: number;
  } = {}
): WordFrequency[] {
  const {
    caseSensitive = false,
    minLength = 1,
    excludeStopWords = false,
    limit,
  } = options;
  
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
    'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where',
    'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'also',
  ]);
  
  const matches = text.match(/\b\w+\b/g);
  let words: string[] = matches ? [...matches] : [];
  
  if (!caseSensitive) {
    words = words.map(w => w.toLowerCase());
  }
  
  words = words.filter(w => w.length >= minLength);
  
  if (excludeStopWords) {
    words = words.filter(w => !stopWords.has(w.toLowerCase()));
  }
  
  const frequency: Record<string, number> = {};
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }
  
  const totalWords = words.length;
  
  let result = Object.entries(frequency)
    .map(([word, count]) => ({
      word,
      count,
      percentage: Math.round((count / totalWords) * 10000) / 100,
    }))
    .sort((a, b) => b.count - a.count);
  
  if (limit) {
    result = result.slice(0, limit);
  }
  
  return result;
}

// ==================== TEXT DIFF ====================

export interface DiffResult {
  type: 'unchanged' | 'added' | 'removed';
  value: string;
}

export function diffText(oldText: string, newText: string): DiffResult[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  const results: DiffResult[] = [];
  
  // Simple line-by-line diff
  let oldIndex = 0;
  let newIndex = 0;
  
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldIndex >= oldLines.length) {
      // Remaining lines are additions
      results.push({ type: 'added', value: newLines[newIndex] });
      newIndex++;
    } else if (newIndex >= newLines.length) {
      // Remaining lines are removals
      results.push({ type: 'removed', value: oldLines[oldIndex] });
      oldIndex++;
    } else if (oldLines[oldIndex] === newLines[newIndex]) {
      // Lines match
      results.push({ type: 'unchanged', value: oldLines[oldIndex] });
      oldIndex++;
      newIndex++;
    } else {
      // Look ahead for match
      let foundInNew = newLines.indexOf(oldLines[oldIndex], newIndex);
      let foundInOld = oldLines.indexOf(newLines[newIndex], oldIndex);
      
      if (foundInNew !== -1 && (foundInOld === -1 || foundInNew - newIndex <= foundInOld - oldIndex)) {
        // Add new lines until we find the old line
        while (newIndex < foundInNew) {
          results.push({ type: 'added', value: newLines[newIndex] });
          newIndex++;
        }
      } else if (foundInOld !== -1) {
        // Remove old lines until we find the new line
        while (oldIndex < foundInOld) {
          results.push({ type: 'removed', value: oldLines[oldIndex] });
          oldIndex++;
        }
      } else {
        // No match found, treat as replacement
        results.push({ type: 'removed', value: oldLines[oldIndex] });
        results.push({ type: 'added', value: newLines[newIndex] });
        oldIndex++;
        newIndex++;
      }
    }
  }
  
  return results;
}

// ==================== TEXT TRANSFORMATIONS ====================

export function reverseString(str: string): string {
  return [...str].reverse().join('');
}

export function reverseWords(str: string): string {
  return str.split(/(\s+)/).reverse().join('');
}

export function shuffleWords(str: string): string {
  const words = str.split(/(\s+)/);
  const textWords = words.filter((_, i) => i % 2 === 0);
  const spaces = words.filter((_, i) => i % 2 !== 0);
  
  // Fisher-Yates shuffle
  for (let i = textWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [textWords[i], textWords[j]] = [textWords[j], textWords[i]];
  }
  
  const result: string[] = [];
  for (let i = 0; i < textWords.length; i++) {
    result.push(textWords[i]);
    if (i < spaces.length) {
      result.push(spaces[i]);
    }
  }
  
  return result.join('');
}

export function sortLines(text: string, options: {
  descending?: boolean;
  caseSensitive?: boolean;
  numeric?: boolean;
  unique?: boolean;
} = {}): string {
  const {
    descending = false,
    caseSensitive = true,
    numeric = false,
    unique = false,
  } = options;
  
  let lines = text.split('\n');
  
  if (unique) {
    lines = [...new Set(lines)];
  }
  
  lines.sort((a, b) => {
    let compareA = caseSensitive ? a : a.toLowerCase();
    let compareB = caseSensitive ? b : b.toLowerCase();
    
    if (numeric) {
      const numA = parseFloat(compareA) || 0;
      const numB = parseFloat(compareB) || 0;
      return descending ? numB - numA : numA - numB;
    }
    
    const result = compareA.localeCompare(compareB);
    return descending ? -result : result;
  });
  
  return lines.join('\n');
}

export function removeDuplicateLines(text: string): string {
  const lines = text.split('\n');
  return [...new Set(lines)].join('\n');
}

export function removeEmptyLines(text: string): string {
  return text.split('\n').filter(line => line.trim()).join('\n');
}

export function trimLines(text: string): string {
  return text.split('\n').map(line => line.trim()).join('\n');
}

export function addLineNumbers(text: string, options: {
  startFrom?: number;
  padding?: number;
  separator?: string;
} = {}): string {
  const {
    startFrom = 1,
    separator = ': ',
  } = options;
  
  const lines = text.split('\n');
  const maxDigits = String(startFrom + lines.length - 1).length;
  const padding = options.padding ?? maxDigits;
  
  return lines.map((line, index) => {
    const lineNum = String(startFrom + index).padStart(padding, ' ');
    return `${lineNum}${separator}${line}`;
  }).join('\n');
}

export function wrapText(text: string, width: number = 80): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  
  return lines.join('\n');
}

export function indentText(text: string, spaces: number = 2): string {
  const indent = ' '.repeat(spaces);
  return text.split('\n').map(line => indent + line).join('\n');
}

export function unindentText(text: string): string {
  const lines = text.split('\n');
  
  // Find minimum indentation
  const minIndent = lines
    .filter(line => line.trim())
    .reduce((min, line) => {
      const match = line.match(/^(\s*)/);
      const indent = match ? match[1].length : 0;
      return Math.min(min, indent);
    }, Infinity);
  
  if (minIndent === Infinity || minIndent === 0) {
    return text;
  }
  
  return lines.map(line => line.slice(minIndent)).join('\n');
}

// ==================== LOREM IPSUM ====================

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
];

export function generateLoremIpsum(options: {
  type?: 'words' | 'sentences' | 'paragraphs';
  count?: number;
  startWithLorem?: boolean;
} = {}): string {
  const {
    type = 'paragraphs',
    count = 1,
    startWithLorem = true,
  } = options;
  
  const randomWord = () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
  
  const generateSentence = (wordCount: number, capitalize: boolean = true): string => {
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(randomWord());
    }
    if (capitalize) {
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }
    return words.join(' ') + '.';
  };
  
  const generateParagraph = (sentenceCount: number): string => {
    const sentences: string[] = [];
    for (let i = 0; i < sentenceCount; i++) {
      const wordCount = Math.floor(Math.random() * 10) + 5;
      sentences.push(generateSentence(wordCount));
    }
    return sentences.join(' ');
  };
  
  if (type === 'words') {
    const words: string[] = [];
    for (let i = 0; i < count; i++) {
      words.push(randomWord());
    }
    if (startWithLorem && words.length >= 2) {
      words[0] = 'lorem';
      words[1] = 'ipsum';
    }
    return words.join(' ');
  }
  
  if (type === 'sentences') {
    const sentences: string[] = [];
    for (let i = 0; i < count; i++) {
      const wordCount = Math.floor(Math.random() * 10) + 5;
      sentences.push(generateSentence(wordCount, i === 0));
    }
    if (startWithLorem) {
      sentences[0] = 'Lorem ipsum dolor sit amet.';
    }
    return sentences.join(' ');
  }
  
  // Paragraphs
  const paragraphs: string[] = [];
  for (let i = 0; i < count; i++) {
    const sentenceCount = Math.floor(Math.random() * 5) + 3;
    paragraphs.push(generateParagraph(sentenceCount));
  }
  if (startWithLorem) {
    paragraphs[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + paragraphs[0];
  }
  return paragraphs.join('\n\n');
}

// ==================== EXTRACT DATA ====================

export function extractEmails(text: string): string[] {
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return [...new Set(text.match(regex) || [])];
}

export function extractUrls(text: string): string[] {
  const regex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
  return [...new Set(text.match(regex) || [])];
}

export function extractPhoneNumbers(text: string): string[] {
  const regex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;
  return [...new Set(text.match(regex) || [])];
}

export function extractHashtags(text: string): string[] {
  const regex = /#[a-zA-Z0-9_]+/g;
  return [...new Set(text.match(regex) || [])];
}

export function extractMentions(text: string): string[] {
  const regex = /@[a-zA-Z0-9_]+/g;
  return [...new Set(text.match(regex) || [])];
}

export function extractNumbers(text: string): number[] {
  const regex = /-?\d+\.?\d*/g;
  const matches = text.match(regex) || [];
  return matches.map(m => parseFloat(m));
}

export function extractDates(text: string): string[] {
  const patterns = [
    /\d{4}-\d{2}-\d{2}/g, // ISO format
    /\d{2}\/\d{2}\/\d{4}/g, // US format
    /\d{2}-\d{2}-\d{4}/g, // EU format
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}/gi, // Written format
  ];
  
  const results: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern) || [];
    results.push(...matches);
  }
  
  return [...new Set(results)];
}
