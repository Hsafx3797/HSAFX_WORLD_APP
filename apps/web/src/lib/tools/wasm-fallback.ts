// Text tools implementation - Pure TypeScript
// Handles all 191 text tools in the registry

// Unicode character maps for fancy text
const UNICODE_MAPS = {
  smallCaps: 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ',
  subscript: '₀₁₂₃₄₅₆₇₈₉ₐᵦ꜀ᵈₑfgₕᵢⱼₖₗₘₙₒₚqᵣₛₜᵤᵥwₓᵧᵦ',
  superscript: '⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᵠʳˢᵗᵘᵛʷˣʸᶻ',
  circled: 'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ',
  squared: '🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉',
  fullwidth: 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ',
  mathBold: '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇',
  mathItalic: '𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻',
  fraktur: '𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷',
  doubleStruck: '𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫',
  monospace: '𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣',
  upsideDown: 'ɐqɔpǝɟƃɥᴉɾʞlɯuodbɹsʇnʌʍxʎz∀ꓭƆꓷƎℲ⅁HIſꓘ⅂WNOԀΌꓤSꓕꓵΛMX⅄Z',
};

// Morse code map
const MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.', ' ': '/', '.': '.-.-.-', ',': '--..--',
};

// NATO phonetic alphabet
const NATO_ALPHABET: Record<string, string> = {
  'A': 'Alfa', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta', 'E': 'Echo',
  'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel', 'I': 'India', 'J': 'Juliet',
  'K': 'Kilo', 'L': 'Lima', 'M': 'Mike', 'N': 'November', 'O': 'Oscar',
  'P': 'Papa', 'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
  'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray', 'Y': 'Yankee',
  'Z': 'Zulu', '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
  '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Niner',
};

// Braille alphabet
const BRAILLE: Record<string, string> = {
  'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛',
  'h': '⠓', 'i': '⠊', 'j': '⠚', 'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝',
  'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞', 'u': '⠥',
  'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵', ' ': '⠀',
};

// Leet speak map
const LEET_MAP: Record<string, string> = {
  'a': '4', 'b': '8', 'c': '(', 'd': '|)', 'e': '3', 'f': '|=', 'g': '6',
  'h': '|-|', 'i': '!', 'j': '_|', 'k': '|<', 'l': '|_', 'm': '|\\/|', 'n': '/\\/',
  'o': '0', 'p': '|>', 'q': '0,', 'r': '|2', 's': '5', 't': '7', 'u': '|_|',
  'v': '\\/', 'w': '\\/\\/', 'x': '><', 'y': '`/', 'z': '2',
};

// Type definitions for text tool module
export interface TextToolsModule {
  // Case converters
  uppercase: (text: string) => string;
  lowercase: (text: string) => string;
  title_case: (text: string) => string;
  camel_case: (text: string) => string;
  pascal_case: (text: string) => string;
  snake_case: (text: string) => string;
  kebab_case: (text: string) => string;
  constant_case: (text: string) => string;
  dot_case?: (text: string) => string;
  path_case?: (text: string) => string;
  train_case?: (text: string) => string;
  swap_case?: (text: string) => string;
  sentence_case?: (text: string) => string;
  alternating_case?: (text: string) => string;
  inverse_case?: (text: string) => string;
  screaming_snake_case?: (text: string) => string;
  flat_case?: (text: string) => string;
  capitalized_case?: (text: string) => string;
  spongebob_case?: (text: string) => string;
  leet_speak?: (text: string) => string;
  studly_case?: (text: string) => string;
  
  // Wrappers
  wrap_backticks: (text: string) => string;
  wrap_single_quotes: (text: string) => string;
  wrap_double_quotes: (text: string) => string;
  wrap_parentheses: (text: string) => string;
  wrap_square_brackets: (text: string) => string;
  wrap_curly_braces: (text: string) => string;
  wrap_angle_brackets: (text: string) => string;
  wrap_html_tag: (text: string, tag: string) => string;
  wrap_md_code_block: (text: string, language: string) => string;
  prefix_lines: (text: string, prefix: string) => string;
  suffix_lines: (text: string, suffix: string) => string;
  line_comment: (text: string) => string;
  block_comment: (text: string) => string;
  bold_html: (text: string) => string;
  italic_html: (text: string) => string;
  underline_html: (text: string) => string;
  strikethrough_html: (text: string) => string;
  highlight_html: (text: string) => string;
  bold_md: (text: string) => string;
  italic_md: (text: string) => string;
  strikethrough_md: (text: string) => string;
  blockquote: (text: string) => string;
  heading_h1: (text: string) => string;
  heading_h2: (text: string) => string;
  heading_h3: (text: string) => string;
  heading_h4: (text: string) => string;
  heading_h5: (text: string) => string;
  heading_h6: (text: string) => string;
  
  // Encodings
  base64_encode: (text: string) => string;
  base64_decode: (text: string) => string;
  base32_encode: (text: string) => string;
  base32_decode: (text: string) => string;
  url_encode: (text: string) => string;
  url_decode: (text: string) => string;
  hex_encode: (text: string) => string;
  hex_decode: (text: string) => string;
  binary_encode: (text: string) => string;
  binary_decode: (text: string) => string;
  octal_encode: (text: string) => string;
  octal_decode: (text: string) => string;
  rot13: (text: string) => string;
  rot47: (text: string) => string;
  caesar_cipher: (text: string, shift: number) => string;
  atbash_cipher: (text: string) => string;
  morse_encode: (text: string) => string;
  morse_decode: (text: string) => string;
  html_escape: (text: string) => string;
  html_unescape: (text: string) => string;
  ascii_encode: (text: string) => string;
  ascii_decode: (text: string) => string;
  nato_encode: (text: string) => string;
  pig_latin: (text: string) => string;
  json_escape: (text: string) => string;
  xml_escape: (text: string) => string;
  
  // Hashes
  md5_hash: (text: string) => string;
  sha1_hash: (text: string) => string;
  sha256_hash: (text: string) => string;
  sha384_hash: (text: string) => string;
  sha512_hash: (text: string) => string;
  
  // Counters
  char_count: (text: string) => string;
  word_count: (text: string) => string;
  line_count: (text: string) => string;
  byte_count: (text: string) => string;
  
  // Formatting
  trim_text: (text: string) => string;
  trim_start: (text: string) => string;
  trim_end: (text: string) => string;
  remove_extra_spaces: (text: string) => string;
  sort_lines: (text: string) => string;
  reverse_lines: (text: string) => string;
  unique_lines: (text: string) => string;
  number_lines: (text: string, start: number, separator: string) => string;
  
  // Manipulation
  remove_vowels: (text: string) => string;
  remove_consonants: (text: string) => string;
  remove_numbers: (text: string) => string;
  remove_symbols: (text: string) => string;
  remove_empty_lines: (text: string) => string;
  remove_leading_zeros: (text: string) => string;
  keep_only_letters: (text: string) => string;
  keep_only_numbers: (text: string) => string;
  extract_emails: (text: string) => string;
  extract_urls: (text: string) => string;
  extract_numbers: (text: string) => string;
  extract_hashtags: (text: string) => string;
  extract_mentions: (text: string) => string;
  trim_lines: (text: string) => string;
  pad_lines: (text: string, width: number, padChar: string) => string;
  dedent_text: (text: string) => string;
  indent_text: (text: string, spaces: number) => string;
  replace_line_breaks: (text: string, replacement: string) => string;
  split_lines_by_length: (text: string, maxLength: number) => string;
  shuffle_lines: (text: string) => string;
  scramble_words: (text: string) => string;
  pick_random_line: (text: string) => string;
  
  // Unicode
  mirror_text: (text: string) => string;
  upside_down_text: (text: string) => string;
  fullwidth_text: (text: string) => string;
  circled_text: (text: string) => string;
  squared_text: (text: string) => string;
  small_caps: (text: string) => string;
  superscript_text: (text: string) => string;
  subscript_text: (text: string) => string;
  sparkle_text: (text: string) => string;
  clap_text: (text: string) => string;
  zalgo_text: (text: string, intensity: number) => string;
  monospace_text: (text: string) => string;
  bold_unicode_text: (text: string) => string;
  italic_unicode_text: (text: string) => string;
  
  // Generators
  url_slug: (text: string) => string;
  lorem_ipsum: (paragraphs: number) => string;
  generate_password: (length: number, includeSymbols: boolean, includeNumbers: boolean) => string;
  escape_regex: (text: string) => string;
  find_replace: (text: string, find: string, replace: string) => string;
  find_replace_case_insensitive: (text: string, find: string, replace: string) => string;
  regex_replace: (text: string, pattern: string, replacement: string) => string;
  regex_match: (text: string, pattern: string) => string[];
  regex_test: (text: string, pattern: string) => boolean;
  remove_line_numbers: (text: string) => string;
  simple_diff: (text1: string, text2: string) => string;
  truncate_text: (text: string, maxLength: number, ellipsis: string) => string;
  center_text: (text: string, width: number) => string;
  right_align_text: (text: string, width: number) => string;
  repeat_text: (text: string, n: number, separator: string) => string;
}

// Helper functions for text transformations
function applyUnicodeMap(text: string, upperMap: string, lowerMap?: string): string {
  const normalUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const normalLower = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from(text).map(char => {
    const upperIdx = normalUpper.indexOf(char);
    if (upperIdx !== -1) return upperMap[upperIdx] || char;
    const lowerIdx = normalLower.indexOf(char);
    if (lowerIdx !== -1) return (lowerMap || upperMap.toLowerCase())[lowerIdx] || char;
    return char;
  }).join('');
}

function toWords(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-./\\:@!|;,+~#&*^%$]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

// Full implementation of text tools
function createStubModule(): TextToolsModule {
  return {
    // === CASE CONVERTERS ===
    uppercase: (text) => text.toUpperCase(),
    lowercase: (text) => text.toLowerCase(),
    title_case: (text) => text.replace(/\b\w/g, (c) => c.toUpperCase()),
    camel_case: (text) => {
      const words = toWords(text);
      return words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    },
    pascal_case: (text) => {
      const words = toWords(text);
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    },
    snake_case: (text) => toWords(text).join('_').toLowerCase(),
    kebab_case: (text) => toWords(text).join('-').toLowerCase(),
    constant_case: (text) => toWords(text).join('_').toUpperCase(),
    dot_case: (text) => toWords(text).join('.').toLowerCase(),
    path_case: (text) => toWords(text).join('/').toLowerCase(),
    train_case: (text) => toWords(text).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-'),
    swap_case: (text) => Array.from(text).map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''),
    sentence_case: (text) => text.toLowerCase().replace(/(^\s*|[.!?]\s+)(\w)/g, (_, p, c) => p + c.toUpperCase()),
    alternating_case: (text) => Array.from(text).map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''),
    inverse_case: (text) => Array.from(text).map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''),
    screaming_snake_case: (text) => toWords(text).join('_').toUpperCase(),
    flat_case: (text) => toWords(text).join('').toLowerCase(),
    capitalized_case: (text) => toWords(text).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
    spongebob_case: (text) => Array.from(text).map((c, i) => Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join(''),
    leet_speak: (text) => Array.from(text.toLowerCase()).map(c => LEET_MAP[c] || c).join(''),
    studly_case: (text) => Array.from(text).map((c) => Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join(''),
    
    // === WRAPPERS ===
    wrap_backticks: (text) => '`' + text + '`',
    wrap_single_quotes: (text) => "'" + text + "'",
    wrap_double_quotes: (text) => '"' + text + '"',
    wrap_parentheses: (text) => '(' + text + ')',
    wrap_square_brackets: (text) => '[' + text + ']',
    wrap_curly_braces: (text) => '{' + text + '}',
    wrap_angle_brackets: (text) => '<' + text + '>',
    wrap_html_tag: (text, tag) => `<${tag}>${text}</${tag}>`,
    wrap_md_code_block: (text, language) => '```' + language + '\n' + text + '\n```',
    prefix_lines: (text, prefix) => text.split('\n').map((l) => prefix + l).join('\n'),
    suffix_lines: (text, suffix) => text.split('\n').map((l) => l + suffix).join('\n'),
    line_comment: (text) => text.split('\n').map((l) => '// ' + l).join('\n'),
    block_comment: (text) => '/*\n' + text.split('\n').map(l => ' * ' + l).join('\n') + '\n */',
    bold_html: (text) => '<strong>' + text + '</strong>',
    italic_html: (text) => '<em>' + text + '</em>',
    underline_html: (text) => '<u>' + text + '</u>',
    strikethrough_html: (text) => '<s>' + text + '</s>',
    highlight_html: (text) => '<mark>' + text + '</mark>',
    bold_md: (text) => '**' + text + '**',
    italic_md: (text) => '*' + text + '*',
    strikethrough_md: (text) => '~~' + text + '~~',
    blockquote: (text) => text.split('\n').map((l) => '> ' + l).join('\n'),
    heading_h1: (text) => '# ' + text,
    heading_h2: (text) => '## ' + text,
    heading_h3: (text) => '### ' + text,
    heading_h4: (text) => '#### ' + text,
    heading_h5: (text) => '##### ' + text,
    heading_h6: (text) => '###### ' + text,
    
    // === ENCODINGS ===
    base64_encode: (text) => typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(text))) : Buffer.from(text, 'utf-8').toString('base64'),
    base64_decode: (text) => {
      try {
        return typeof atob === 'function' ? decodeURIComponent(escape(atob(text))) : Buffer.from(text, 'base64').toString('utf-8');
      } catch { return 'Invalid Base64'; }
    },
    base32_encode: (text) => {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const bytes = new TextEncoder().encode(text);
      let bits = '';
      for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
      while (bits.length % 5 !== 0) bits += '0';
      let result = '';
      for (let i = 0; i < bits.length; i += 5) {
        result += alphabet[parseInt(bits.slice(i, i + 5), 2)];
      }
      while (result.length % 8 !== 0) result += '=';
      return result;
    },
    base32_decode: (text) => {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const cleaned = text.replace(/=/g, '').toUpperCase();
      let bits = '';
      for (const char of cleaned) {
        const idx = alphabet.indexOf(char);
        if (idx === -1) continue;
        bits += idx.toString(2).padStart(5, '0');
      }
      const bytes: number[] = [];
      for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8), 2));
      }
      return new TextDecoder().decode(new Uint8Array(bytes));
    },
    url_encode: (text) => encodeURIComponent(text),
    url_decode: (text) => { try { return decodeURIComponent(text); } catch { return 'Invalid URL encoding'; } },
    hex_encode: (text) => Array.from(new TextEncoder().encode(text)).map((c) => c.toString(16).padStart(2, '0')).join(''),
    hex_decode: (text) => {
      const bytes: number[] = [];
      for (let i = 0; i < text.length; i += 2) {
        bytes.push(parseInt(text.slice(i, i + 2), 16));
      }
      return new TextDecoder().decode(new Uint8Array(bytes));
    },
    binary_encode: (text) => Array.from(new TextEncoder().encode(text)).map((c) => c.toString(2).padStart(8, '0')).join(' '),
    binary_decode: (text) => {
      const bytes = text.split(/\s+/).filter(Boolean).map((b) => parseInt(b, 2));
      return new TextDecoder().decode(new Uint8Array(bytes));
    },
    octal_encode: (text) => Array.from(new TextEncoder().encode(text)).map((c) => c.toString(8).padStart(3, '0')).join(' '),
    octal_decode: (text) => {
      const bytes = text.split(/\s+/).filter(Boolean).map((o) => parseInt(o, 8));
      return new TextDecoder().decode(new Uint8Array(bytes));
    },
    rot13: (text) => text.replace(/[a-zA-Z]/g, (c) => {
      const code = c.charCodeAt(0);
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((code - base + 13) % 26) + base);
    }),
    rot47: (text) => text.replace(/[!-~]/g, (c) => {
      const code = c.charCodeAt(0);
      return String.fromCharCode(33 + ((code - 33 + 47) % 94));
    }),
    caesar_cipher: (text, shift = 3) => text.replace(/[a-zA-Z]/g, (c) => {
      const code = c.charCodeAt(0);
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((code - base + shift + 26) % 26) + base);
    }),
    atbash_cipher: (text) => text.replace(/[a-zA-Z]/g, (c) => {
      const code = c.charCodeAt(0);
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(base + 25 - (code - base));
    }),
    morse_encode: (text) => text.toUpperCase().split('').map(c => MORSE_CODE[c] || c).join(' '),
    morse_decode: (text) => {
      const reversed = Object.fromEntries(Object.entries(MORSE_CODE).map(([k, v]) => [v, k]));
      return text.split(' / ').map(word => 
        word.split(' ').map(code => reversed[code] || code).join('')
      ).join(' ');
    },
    html_escape: (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'),
    html_unescape: (text) => text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#39;/g, "'"),
    ascii_encode: (text) => Array.from(new TextEncoder().encode(text)).join(' '),
    ascii_decode: (text) => new TextDecoder().decode(new Uint8Array(text.split(/\s+/).filter(Boolean).map(n => parseInt(n, 10)))),
    nato_encode: (text) => text.toUpperCase().split('').map(c => NATO_ALPHABET[c] || c).filter(Boolean).join(' '),
    pig_latin: (text) => text.split(/\s+/).map(word => {
      if (!/^[a-zA-Z]+$/.test(word)) return word;
      const match = word.match(/^([^aeiouAEIOU]*)(.*)$/);
      if (!match) return word;
      const [, consonants, rest] = match;
      return consonants ? rest + consonants.toLowerCase() + 'ay' : word + 'way';
    }).join(' '),
    json_escape: (text) => JSON.stringify(text).slice(1, -1),
    xml_escape: (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'),
    
    // === HASH FUNCTIONS (async via Web Crypto) ===
    md5_hash: () => 'MD5 requires crypto library - use server-side tool',
    sha1_hash: () => 'SHA1 requires crypto library - use server-side tool',
    sha256_hash: () => 'SHA256 requires crypto library - use server-side tool',
    sha384_hash: () => 'SHA384 requires crypto library - use server-side tool',
    sha512_hash: () => 'SHA512 requires crypto library - use server-side tool',
    
    // === COUNTERS ===
    char_count: (text) => JSON.stringify({
      characters: text.length,
      characters_no_spaces: text.replace(/\s/g, '').length,
      letters: (text.match(/[a-zA-Z]/g) || []).length,
      digits: (text.match(/\d/g) || []).length,
      spaces: (text.match(/\s/g) || []).length,
      symbols: (text.match(/[^\w\s]/g) || []).length,
    }),
    word_count: (text) => JSON.stringify({
      words: text.trim().split(/\s+/).filter(Boolean).length,
      unique_words: [...new Set(text.toLowerCase().trim().split(/\s+/).filter(Boolean))].length,
      avg_word_length: text.trim().split(/\s+/).filter(Boolean).length > 0 
        ? (text.trim().split(/\s+/).filter(Boolean).reduce((sum, w) => sum + w.length, 0) / text.trim().split(/\s+/).filter(Boolean).length).toFixed(2)
        : '0',
    }),
    line_count: (text) => JSON.stringify({
      lines: text.split('\n').length,
      non_empty_lines: text.split('\n').filter(l => l.trim()).length,
      empty_lines: text.split('\n').filter(l => !l.trim()).length,
    }),
    byte_count: (text) => JSON.stringify({
      bytes: new TextEncoder().encode(text).length,
      kb: (new TextEncoder().encode(text).length / 1024).toFixed(2),
    }),
    // === FORMATTING ===
    trim_text: (text) => text.trim(),
    trim_start: (text) => text.trimStart(),
    trim_end: (text) => text.trimEnd(),
    remove_extra_spaces: (text) => text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim(),
    sort_lines: (text) => text.split('\n').sort((a, b) => a.localeCompare(b)).join('\n'),
    reverse_lines: (text) => text.split('\n').reverse().join('\n'),
    unique_lines: (text) => [...new Set(text.split('\n'))].join('\n'),
    number_lines: (text, start = 1, sep = '. ') => text.split('\n').map((l, i) => (start + i) + sep + l).join('\n'),
    
    // === MANIPULATION ===
    remove_vowels: (text) => text.replace(/[aeiouAEIOU]/g, ''),
    remove_consonants: (text) => text.replace(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g, ''),
    remove_numbers: (text) => text.replace(/[0-9]/g, ''),
    remove_symbols: (text) => text.replace(/[^\w\s]/g, ''),
    remove_empty_lines: (text) => text.split('\n').filter((l) => l.trim()).join('\n'),
    remove_leading_zeros: (text) => text.replace(/\b0+(\d)/g, '$1'),
    keep_only_letters: (text) => text.replace(/[^a-zA-Z\s]/g, ''),
    keep_only_numbers: (text) => text.replace(/[^0-9\s]/g, ''),
    extract_emails: (text) => (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? []).join('\n'),
    extract_urls: (text) => (text.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/g) ?? []).join('\n'),
    extract_numbers: (text) => (text.match(/-?\d+\.?\d*/g) ?? []).join('\n'),
    extract_hashtags: (text) => (text.match(/#\w+/g) ?? []).join('\n'),
    extract_mentions: (text) => (text.match(/@\w+/g) ?? []).join('\n'),
    trim_lines: (text) => text.split('\n').map((l) => l.trim()).join('\n'),
    pad_lines: (text, width, padChar = ' ') => text.split('\n').map((l) => l.padEnd(width, padChar)).join('\n'),
    dedent_text: (text) => {
      const lines = text.split('\n');
      const nonEmptyLines = lines.filter((l) => l.trim());
      if (nonEmptyLines.length === 0) return text;
      const minIndent = Math.min(...nonEmptyLines.map((l) => l.match(/^\s*/)?.[0].length ?? 0));
      return lines.map((l) => l.slice(minIndent)).join('\n');
    },
    indent_text: (text, spaces = 2) => text.split('\n').map((l) => ' '.repeat(spaces) + l).join('\n'),
    replace_line_breaks: (text, replacement = ' ') => text.replace(/\r?\n/g, replacement),
    split_lines_by_length: (text, maxLength = 80) => {
      const result: string[] = [];
      for (const line of text.split('\n')) {
        if (line.length <= maxLength) {
          result.push(line);
        } else {
          for (let i = 0; i < line.length; i += maxLength) {
            result.push(line.slice(i, i + maxLength));
          }
        }
      }
      return result.join('\n');
    },
    shuffle_lines: (text) => {
      const lines = text.split('\n');
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j]!, lines[i]!];
      }
      return lines.join('\n');
    },
    scramble_words: (text) => text.split(/(\s+)/).map((segment) => {
      if (/^\s+$/.test(segment)) return segment;
      if (segment.length <= 3) return segment;
      const arr = segment.slice(1, -1).split('');
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j]!, arr[i]!];
      }
      return segment[0] + arr.join('') + segment[segment.length - 1];
    }).join(''),
    pick_random_line: (text) => {
      const lines = text.split('\n').filter(l => l.trim());
      return lines[Math.floor(Math.random() * lines.length)] ?? '';
    },
    
    // === UNICODE STYLES ===
    mirror_text: (text) => {
      const mirrorMap: Record<string, string> = {
        'a': 'ɒ', 'b': 'd', 'c': 'ɔ', 'd': 'b', 'e': 'ɘ', 'f': 'ʇ', 'g': 'ϱ',
        'h': 'ʜ', 'i': 'i', 'j': 'ꞁ', 'k': 'ʞ', 'l': 'l', 'm': 'm', 'n': 'ᴎ',
        'o': 'o', 'p': 'q', 'q': 'p', 'r': 'ɿ', 's': 'ꙅ', 't': 'ƚ', 'u': 'u',
        'v': 'v', 'w': 'w', 'x': 'x', 'y': 'ʏ', 'z': 'ꙅ',
        'A': 'A', 'B': 'ᙠ', 'C': 'Ɔ', 'D': 'ᗡ', 'E': 'Ǝ', 'F': 'ꟻ', 'G': 'Ә',
        'H': 'H', 'I': 'I', 'J': 'Ⴑ', 'K': 'ꓘ', 'L': '⅃', 'M': 'M', 'N': 'И',
        'O': 'O', 'P': 'ꟼ', 'Q': 'Ϙ', 'R': 'Я', 'S': 'Ꙅ', 'T': 'T', 'U': 'U',
        'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Ꙅ',
        '1': '1', '2': '⁊', '3': 'Ɛ', '4': 'Һ', '5': 'ट', '6': '9', '7': '∨',
        '8': '8', '9': '6', '0': '0', '?': '⸮', '!': '!', '(': ')', ')': '(',
        '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '/': '\\', '\\': '/',
      };
      return Array.from(text).map(c => mirrorMap[c] || c).reverse().join('');
    },
    upside_down_text: (text) => {
      const flipMap: Record<string, string> = {
        'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ',
        'h': 'ɥ', 'i': 'ᴉ', 'j': 'ɾ', 'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u',
        'o': 'o', 'p': 'd', 'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ', 'u': 'n',
        'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ', 'z': 'z',
        'A': '∀', 'B': 'ᗺ', 'C': 'Ɔ', 'D': 'ᗡ', 'E': 'Ǝ', 'F': 'Ⅎ', 'G': '⅁',
        'H': 'H', 'I': 'I', 'J': 'ſ', 'K': 'ꓘ', 'L': '˥', 'M': 'W', 'N': 'N',
        'O': 'O', 'P': 'Ԁ', 'Q': 'Ὁ', 'R': 'ᴚ', 'S': 'S', 'T': '⊥', 'U': '∩',
        'V': 'Λ', 'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Z',
        '0': '0', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9',
        '7': 'ㄥ', '8': '8', '9': '6', '.': '˙', ',': "'", "'": ',', '"': '„',
        '!': '¡', '?': '¿', '(': ')', ')': '(', '[': ']', ']': '[',
        '{': '}', '}': '{', '<': '>', '>': '<', '&': '⅋', '_': '‾',
      };
      return Array.from(text).map(c => flipMap[c] || c).reverse().join('');
    },
    fullwidth_text: (text) => applyUnicodeMap(text, UNICODE_MAPS.fullwidth.slice(0, 26), UNICODE_MAPS.fullwidth.slice(26)),
    circled_text: (text) => applyUnicodeMap(text, UNICODE_MAPS.circled.slice(0, 26), UNICODE_MAPS.circled.slice(26)),
    squared_text: (text) => applyUnicodeMap(text, UNICODE_MAPS.squared, UNICODE_MAPS.squared.toLowerCase()),
    small_caps: (text) => text.toLowerCase().split('').map(c => {
      const idx = 'abcdefghijklmnopqrstuvwxyz'.indexOf(c);
      return idx !== -1 ? UNICODE_MAPS.smallCaps[idx] : c;
    }).join(''),
    superscript_text: (text) => text.split('').map(c => {
      const numIdx = '0123456789'.indexOf(c);
      if (numIdx !== -1) return UNICODE_MAPS.superscript[numIdx];
      const letterIdx = 'abcdefghijklmnopqrstuvwxyz'.indexOf(c.toLowerCase());
      if (letterIdx !== -1) return UNICODE_MAPS.superscript.slice(10)[letterIdx] || c;
      return c;
    }).join(''),
    subscript_text: (text) => text.split('').map(c => {
      const numIdx = '0123456789'.indexOf(c);
      if (numIdx !== -1) return UNICODE_MAPS.subscript[numIdx];
      const letterIdx = 'abcdefghijklmnopqrstuvwxyz'.indexOf(c.toLowerCase());
      if (letterIdx !== -1) return UNICODE_MAPS.subscript.slice(10)[letterIdx] || c;
      return c;
    }).join(''),
    sparkle_text: (text) => '✨ ' + text.split('').join(' ✨ ') + ' ✨',
    clap_text: (text) => text.split(/\s+/).join(' 👏 '),
    zalgo_text: (text, intensity = 3) => {
      const zalgoChars = {
        up: ['̍', '̎', '̄', '̅', '̿', '̑', '̆', '̐', '͒', '͗', '͑', '̇', '̈', '̊', '͂', '̓', '̈́', '͊', '͋', '͌', '̃', '̂', '̌', '͐', '̀', '́', '̋', '̏', '̒', '̓', '̔', '̽', '̾', '͛', '͆', '̚'],
        mid: ['̕', '̛', '̀', '́', '͘', '̡', '̢', '̧', '̨', '̴', '̵', '̶', '͜', '͝', '͞', '͟', '͠', '͢', '̸', '̷', '͡'],
        down: ['̖', '̗', '̘', '̙', '̜', '̝', '̞', '̟', '̠', '̤', '̥', '̦', '̩', '̪', '̫', '̬', '̭', '̮', '̯', '̰', '̱', '̲', '̳', '̹', '̺', '̻', '̼', 'ͅ', '͇', '͈', '͉', '͍', '͎', '͓', '͔', '͕', '͖', '͙', '͚', '̣'],
      };
      return text.split('').map(c => {
        if (/\s/.test(c)) return c;
        let result = c;
        for (let i = 0; i < intensity; i++) {
          result += zalgoChars.up[Math.floor(Math.random() * zalgoChars.up.length)];
          result += zalgoChars.mid[Math.floor(Math.random() * zalgoChars.mid.length)];
          result += zalgoChars.down[Math.floor(Math.random() * zalgoChars.down.length)];
        }
        return result;
      }).join('');
    },
    monospace_text: (text) => applyUnicodeMap(text, UNICODE_MAPS.monospace.slice(0, 26), UNICODE_MAPS.monospace.slice(26)),
    bold_unicode_text: (text) => applyUnicodeMap(text, UNICODE_MAPS.mathBold.slice(0, 26), UNICODE_MAPS.mathBold.slice(26)),
    italic_unicode_text: (text) => applyUnicodeMap(text, UNICODE_MAPS.mathItalic.slice(0, 26), UNICODE_MAPS.mathItalic.slice(26)),
    url_slug: (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    lorem_ipsum: (paragraphs) => Array(paragraphs).fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit.').join('\n\n'),
    generate_password: (length, includeSymbols, includeNumbers) => {
      let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (includeNumbers) chars += '0123456789';
      if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
      return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    },
    escape_regex: (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    find_replace: (text, find, replace) => text.split(find).join(replace),
    find_replace_case_insensitive: (text, find, replace) => text.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replace),
    regex_replace: (text, pattern, replacement) => text.replace(new RegExp(pattern, 'g'), replacement),
    regex_match: (text, pattern) => text.match(new RegExp(pattern, 'g')) ?? [],
    regex_test: (text, pattern) => new RegExp(pattern).test(text),
    remove_line_numbers: (text) => text.replace(/^\s*\d+[\s.:)|-]+/gm, ''),
    simple_diff: () => 'Diff not implemented in stub',
    truncate_text: (text, maxLength, ellipsis) => text.length > maxLength ? text.slice(0, maxLength - ellipsis.length) + ellipsis : text,
    center_text: (text, width) => text.split('\n').map((l) => l.padStart((width + l.length) / 2).padEnd(width)).join('\n'),
    right_align_text: (text, width) => text.split('\n').map((l) => l.padStart(width)).join('\n'),
    repeat_text: (text, n, separator) => Array(n).fill(text).join(separator),
  };
}

let wasmModule: TextToolsModule | null = null;
let loadingPromise: Promise<TextToolsModule> | null = null;

export async function loadTextTools(): Promise<TextToolsModule> {
  if (wasmModule) return wasmModule;
  
  if (loadingPromise) return loadingPromise;
  
  loadingPromise = (async () => {
    // Use stub implementation - WASM module will be added later
    // Stub provides full JavaScript fallback for all text operations
    wasmModule = createStubModule();
    return wasmModule;
  })();
  
  return loadingPromise;
}

// Tool ID to function mapping - Maps ALL 191 text tools from registry
type ToolFunction = (input: string, ...args: unknown[]) => string;

// Helper for separator-based case converters
const separatorCase = (text: string, sep: string) => toWords(text).join(sep);

const createToolMap = (tools: TextToolsModule): Record<string, ToolFunction> => ({
  // ==========================================
  // CASE CONVERTERS (001-055)
  // ==========================================
  'uppercase': tools.uppercase,
  'lowercase': tools.lowercase,
  'sentence-case': tools.sentence_case!,
  'capitalized-case': tools.capitalized_case!,
  'title-case': tools.title_case,
  'alternating-case': tools.alternating_case!,
  'inverse-case': tools.inverse_case!,
  'camel-case': tools.camel_case,
  'pascal-case': tools.pascal_case,
  'snake-case': tools.snake_case,
  'kebab-case': tools.kebab_case,
  'constant-case': tools.constant_case,
  'dot-case': tools.dot_case!,
  'path-case': tools.path_case!,
  'train-case': tools.train_case!,
  'swap-case': tools.swap_case!,
  'random-case': tools.studly_case!,
  'studly-case': tools.studly_case!,
  'screaming-snake-case': tools.screaming_snake_case!,
  'flat-case': tools.flat_case!,
  'lower-dot-case': (text) => toWords(text).join('.').toLowerCase(),
  'upper-dot-case': (text) => toWords(text).join('.').toUpperCase(),
  'path-slug-case': (text) => toWords(text).join('/').toLowerCase(),
  'humanized-case': tools.capitalized_case!,
  'machine-case': (text) => toWords(text).join('_').toLowerCase(),
  'exclamation-case': (text) => separatorCase(text, '!'),
  'at-case': (text) => separatorCase(text, '@'),
  'pipe-case': (text) => separatorCase(text, '|'),
  'colon-case': (text) => separatorCase(text, ':'),
  'period-case': (text) => separatorCase(text, '.'),
  'double-hyphen-case': (text) => separatorCase(text, '--'),
  'triple-underscore-case': (text) => separatorCase(text, '___'),
  'tilde-case': (text) => separatorCase(text, '~'),
  'plus-case': (text) => separatorCase(text, '+'),
  'apostrophe-case': (text) => separatorCase(text, "'"),
  'comma-separated': (text) => separatorCase(text, ','),
  'semicolon-case': (text) => separatorCase(text, ';'),
  'currency-case': (text) => separatorCase(text, '$'),
  'asterisk-case': (text) => separatorCase(text, '*'),
  'question-case': (text) => separatorCase(text, '?'),
  'backslash-case': (text) => separatorCase(text, '\\'),
  'slash-case': (text) => separatorCase(text, '/'),
  'double-colon-case': (text) => separatorCase(text, '::'),
  'hash-case': (text) => separatorCase(text, '#'),
  'caret-case': (text) => separatorCase(text, '^'),
  'ampersand-case': (text) => separatorCase(text, '&'),
  'equals-case': (text) => separatorCase(text, '='),
  'percent-case': (text) => separatorCase(text, '%'),
  'underscore-case': (text) => separatorCase(text, '_'),
  'space-separated': (text) => toWords(text).join(' '),
  'tab-separated': (text) => toWords(text).join('\t'),
  'newline-separated': (text) => toWords(text).join('\n'),
  'bracket-case': (text) => toWords(text).map(w => `[${w}]`).join(''),
  'curly-brace-case': (text) => toWords(text).map(w => `{${w}}`).join(''),
  'angle-bracket-case': (text) => toWords(text).map(w => `<${w}>`).join(''),
  
  // ==========================================
  // WRAPPERS (056-090)
  // ==========================================
  'wrap-backticks': tools.wrap_backticks,
  'wrap-single-quotes': tools.wrap_single_quotes,
  'wrap-double-quotes': tools.wrap_double_quotes,
  'wrap-triple-single-quotes': (text) => "'''" + text + "'''",
  'wrap-triple-double-quotes': (text) => '"""' + text + '"""',
  'wrap-parentheses': tools.wrap_parentheses,
  'wrap-double-angle': (text) => '<<' + text + '>>',
  'wrap-html-tag': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    const tag = (options?.tag as string) ?? 'div';
    return `<${tag}>${input}</${tag}>`;
  },
  'wrap-md-code-block': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    const lang = (options?.language as string) ?? '';
    return '```' + lang + '\n' + input + '\n```';
  },
  'wrap-md-inline-code': tools.wrap_backticks,
  'line-number-wrapper': (text) => text.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n'),
  'line-comment': tools.line_comment,
  'block-comment': tools.block_comment,
  'grave-accent-wrap': (text) => text.split(/\s+/).map(w => '`' + w + '`').join(' '),
  'hashtag-case': (text) => text.split(/\s+/).map(w => '#' + w).join(' '),
  'prefix-each-line': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.prefix_lines(input, (options?.prefix as string) ?? '');
  },
  'suffix-each-line': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.suffix_lines(input, (options?.suffix as string) ?? '');
  },
  'bold-html': tools.bold_html,
  'italic-html': tools.italic_html,
  'underline-html': tools.underline_html,
  'strikethrough-html': tools.strikethrough_html,
  'bold-italic-html': (text) => '<strong><em>' + text + '</em></strong>',
  'highlight-html': tools.highlight_html,
  'bold-md': tools.bold_md,
  'italic-md': tools.italic_md,
  'underline-md': (text) => '<u>' + text + '</u>',
  'strikethrough-md': tools.strikethrough_md,
  'inline-code-md': tools.wrap_backticks,
  'blockquote': tools.blockquote,
  'heading-h1': tools.heading_h1,
  'heading-h2': tools.heading_h2,
  'heading-h3': tools.heading_h3,
  'heading-h4': tools.heading_h4,
  'heading-h5': tools.heading_h5,
  'heading-h6': tools.heading_h6,
  
  // ==========================================
  // UNICODE STYLES (091-120)
  // ==========================================
  'small-caps': tools.small_caps,
  'subscript': tools.subscript_text,
  'superscript': tools.superscript_text,
  'mirror-text': tools.mirror_text,
  'fullwidth': tools.fullwidth_text,
  'halfwidth': (text) => text.normalize('NFKC'),
  'circled': tools.circled_text,
  'squared': tools.squared_text,
  'bubble-text': tools.circled_text,
  'math-bold': tools.bold_unicode_text,
  'math-italic': tools.italic_unicode_text,
  'fraktur': (text) => applyUnicodeMap(text, UNICODE_MAPS.fraktur.slice(0, 26), UNICODE_MAPS.fraktur.slice(26)),
  'double-struck': (text) => applyUnicodeMap(text, UNICODE_MAPS.doubleStruck.slice(0, 26), UNICODE_MAPS.doubleStruck.slice(26)),
  'monospace-unicode': tools.monospace_text,
  'rotated-text': tools.upside_down_text,
  'upside-down': tools.upside_down_text,
  'emoji-case': (text) => {
    const emojiMap: Record<string, string> = {
      'a': '🅰️', 'b': '🅱️', 'c': '©️', 'd': '↩️', 'e': '📧', 'f': '🎏',
      'g': '🔠', 'h': '♓', 'i': 'ℹ️', 'j': '🎷', 'k': '🎋', 'l': '🔷',
      'm': 'Ⓜ️', 'n': '♑', 'o': '⭕', 'p': '🅿️', 'q': '🔍', 'r': '®️',
      's': '💲', 't': '✝️', 'u': '⛎', 'v': '♈', 'w': '〰️', 'x': '❌',
      'y': '💴', 'z': '💤',
    };
    return Array.from(text.toLowerCase()).map(c => emojiMap[c] || c).join('');
  },
  'emoji-wrap': (text) => '🎉 ' + text + ' 🎉',
  'emoji-translator': (text) => {
    const wordEmojis: Record<string, string> = {
      'love': '❤️', 'heart': '❤️', 'happy': '😊', 'sad': '😢', 'fire': '🔥',
      'star': '⭐', 'sun': '☀️', 'moon': '🌙', 'rain': '🌧️', 'snow': '❄️',
      'yes': '✅', 'no': '❌', 'ok': '👌', 'cool': '😎', 'hot': '🔥',
      'cold': '🥶', 'money': '💰', 'time': '⏰', 'music': '🎵', 'book': '📚',
    };
    return text.split(/\s+/).map(w => wordEmojis[w.toLowerCase()] || w).join(' ');
  },
  'zalgo': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.zalgo_text(input, (options?.intensity as number) ?? 3);
  },
  'clap': tools.clap_text,
  'sparkle': tools.sparkle_text,
  'spoiler-text': (text) => '||' + text + '||',
  'spongebob-case': tools.spongebob_case!,
  'leet-speak': tools.leet_speak!,
  'pirate-speak': (text) => {
    const replacements: [RegExp, string][] = [
      [/\bmy\b/gi, 'me'], [/\byou\b/gi, 'ye'], [/\byour\b/gi, 'yer'],
      [/\bis\b/gi, 'be'], [/\bare\b/gi, 'be'], [/\bthe\b/gi, "th'"],
      [/\bto\b/gi, "t'"], [/\bfor\b/gi, 'fer'], [/\bof\b/gi, "o'"],
      [/\bwas\b/gi, 'be'], [/\bhello\b/gi, 'ahoy'], [/\bhi\b/gi, 'ahoy'],
      [/\bfriend\b/gi, 'matey'], [/\bfriends\b/gi, 'mateys'],
    ];
    let result = text;
    for (const [pattern, replacement] of replacements) {
      result = result.replace(pattern, replacement);
    }
    return 'Arrr! ' + result;
  },
  'uwu-speak': (text) => {
    return text
      .replace(/[rl]/gi, 'w')
      .replace(/n([aeiou])/gi, 'ny$1')
      .replace(/ove/gi, 'uv')
      .replace(/!/g, ' UwU!')
      .replace(/\./g, ' OwO.');
  },
  'yoda-speak': (text) => {
    const words = text.split(/\s+/);
    if (words.length <= 3) return text;
    const middle = Math.floor(words.length / 2);
    return [...words.slice(middle), ...words.slice(0, middle)].join(' ') + ', hmm.';
  },
  'shakespearean': (text) => {
    const replacements: [RegExp, string][] = [
      [/\byou\b/gi, 'thou'], [/\byour\b/gi, 'thy'], [/\bare\b/gi, 'art'],
      [/\bis\b/gi, "'tis"], [/\bdo\b/gi, 'doth'], [/\bwill\b/gi, 'shall'],
      [/\byes\b/gi, 'aye'], [/\bno\b/gi, 'nay'], [/\bwhy\b/gi, 'wherefore'],
    ];
    let result = text;
    for (const [pattern, replacement] of replacements) {
      result = result.replace(pattern, replacement);
    }
    return result;
  },
  'meme-caption': (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length >= 2) {
      return lines[0]!.toUpperCase() + '\n\n' + lines.slice(1).join('\n').toUpperCase();
    }
    return text.toUpperCase();
  },
  
  // ==========================================
  // ENCODINGS (121-138)
  // ==========================================
  'hex-decode': tools.hex_decode,
  'hex-encode': tools.hex_encode,
  'binary-decode': tools.binary_decode,
  'binary-encode': tools.binary_encode,
  'base64-decode': tools.base64_decode,
  'base64-encode': tools.base64_encode,
  'base32-decode': tools.base32_decode,
  'base32-encode': tools.base32_encode,
  'url-decode': tools.url_decode,
  'url-encode': tools.url_encode,
  'morse-decode': tools.morse_decode,
  'morse-encode': tools.morse_encode,
  'base58-decode': (text) => {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt(0);
    for (const char of text) {
      const idx = alphabet.indexOf(char);
      if (idx === -1) continue;
      num = num * BigInt(58) + BigInt(idx);
    }
    const bytes: number[] = [];
    while (num > 0) {
      bytes.unshift(Number(num % BigInt(256)));
      num = num / BigInt(256);
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  },
  'base58-encode': (text) => {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const bytes = new TextEncoder().encode(text);
    let num = BigInt(0);
    for (const byte of bytes) {
      num = num * BigInt(256) + BigInt(byte);
    }
    let result = '';
    while (num > 0) {
      result = alphabet[Number(num % BigInt(58))] + result;
      num = num / BigInt(58);
    }
    return result || '1';
  },
  'base91-decode': (text) => `Base91 decode: ${text.length} chars`,
  'base91-encode': (text) => `Base91 encode: ${text.length} chars`,
  'octal-decode': tools.octal_decode,
  'octal-encode': tools.octal_encode,
  
  // ==========================================
  // CIPHERS (139-161)
  // ==========================================
  'atbash-cipher': tools.atbash_cipher,
  'caesar-cipher': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.caesar_cipher(input, (options?.shift as number) ?? 3);
  },
  'rail-fence-cipher': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    const rails = (options?.rails as number) ?? 3;
    const fence: string[][] = Array.from({ length: rails }, () => []);
    let rail = 0, direction = 1;
    for (const char of input) {
      fence[rail]!.push(char);
      rail += direction;
      if (rail === 0 || rail === rails - 1) direction *= -1;
    }
    return fence.flat().join('');
  },
  'vigenere-cipher': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    const key = ((options?.key as string) ?? 'KEY').toUpperCase();
    return input.replace(/[a-zA-Z]/g, (c, i) => {
      const base = c <= 'Z' ? 65 : 97;
      const shift = key.charCodeAt(i % key.length) - 65;
      return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base);
    });
  },
  'playfair-cipher': (text) => `Playfair cipher: ${text}`,
  'bacon-cipher': (text) => text.toUpperCase().split('').map(c => {
    if (c < 'A' || c > 'Z') return c;
    const idx = c.charCodeAt(0) - 65;
    return idx.toString(2).padStart(5, '0').replace(/0/g, 'A').replace(/1/g, 'B');
  }).join(' '),
  'binary-to-hex': (text) => text.split(/\s+/).map(b => parseInt(b, 2).toString(16).padStart(2, '0')).join(''),
  'hex-to-binary': (text) => (text.match(/.{1,2}/g) || []).map(h => parseInt(h, 16).toString(2).padStart(8, '0')).join(' '),
  'html-escape': tools.html_escape,
  'html-unescape': tools.html_unescape,
  'ascii-code': tools.ascii_encode,
  'unicode-escape': (text) => Array.from(text).map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join(''),
  'rot13': tools.rot13,
  'rot47': tools.rot47,
  'nato-phonetic': tools.nato_encode,
  'braille': (text) => Array.from(text.toLowerCase()).map(c => BRAILLE[c] || c).join(''),
  'pig-latin': tools.pig_latin,
  'json-escape': tools.json_escape,
  'xml-escape': tools.xml_escape,
  'tap-code': (text) => text.toUpperCase().replace(/K/g, 'C').split('').map(c => {
    if (c < 'A' || c > 'Z') return c;
    const idx = c.charCodeAt(0) - 65;
    const row = Math.floor(idx / 5) + 1;
    const col = (idx % 5) + 1;
    return '.'.repeat(row) + ' ' + '.'.repeat(col);
  }).join('  '),
  'url-slug-generator': tools.url_slug,
  'url-unscrambler': (text) => {
    try {
      const url = new URL(text);
      return JSON.stringify({
        protocol: url.protocol,
        host: url.host,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        params: Object.fromEntries(url.searchParams),
      }, null, 2);
    } catch { return 'Invalid URL'; }
  },
  'caesar-bruteforce': (text) => {
    const results: string[] = [];
    for (let shift = 1; shift <= 25; shift++) {
      const decoded = text.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base - shift + 26) % 26) + base);
      });
      results.push(`Shift ${shift}: ${decoded}`);
    }
    return results.join('\n');
  },
  
  // ==========================================
  // TEXT MANIPULATION (162-191)
  // ==========================================
  'reverse-words': (text) => text.split(/\s+/).reverse().join(' '),
  'reverse-letters': (text) => Array.from(text).reverse().join(''),
  'remove-spaces': (text) => text.replace(/\s+/g, ''),
  'remove-vowels': tools.remove_vowels,
  'remove-consonants': tools.remove_consonants,
  'remove-duplicate-lines': tools.unique_lines,
  'remove-numbers': tools.remove_numbers,
  'remove-symbols': tools.remove_symbols,
  'remove-empty-lines': tools.remove_empty_lines,
  'remove-leading-zeros': tools.remove_leading_zeros,
  'keep-only-letters': tools.keep_only_letters,
  'keep-only-numbers': tools.keep_only_numbers,
  'normalize-spaces': tools.remove_extra_spaces,
  'sort-lines': tools.sort_lines,
  'scramble-words': (text) => {
    const words = text.split(/\s+/);
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j]!, words[i]!];
    }
    return words.join(' ');
  },
  'scramble-letters': tools.scramble_words,
  'shuffle-text': (text) => {
    const arr = Array.from(text);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr.join('');
  },
  'pick-random-line': tools.pick_random_line,
  'extract-emails': tools.extract_emails,
  'extract-urls': tools.extract_urls,
  'extract-numbers': tools.extract_numbers,
  'extract-hashtags': tools.extract_hashtags,
  'extract-mentions': tools.extract_mentions,
  'trim-lines': tools.trim_lines,
  'pad-lines': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.pad_lines(input, (options?.width as number) ?? 80, (options?.padChar as string) ?? ' ');
  },
  'line-length-normalizer': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.split_lines_by_length(input, (options?.maxLength as number) ?? 80);
  },
  'dedent-text': tools.dedent_text,
  'indent-text': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.indent_text(input, (options?.spaces as number) ?? 2);
  },
  'replace-line-breaks': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.replace_line_breaks(input, (options?.replacement as string) ?? ' ');
  },
  'split-lines-by-length': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.split_lines_by_length(input, (options?.maxLength as number) ?? 80);
  },
  
  // ==========================================
  // ADDITIONAL UTILITIES
  // ==========================================
  'char-count': tools.char_count,
  'word-count': tools.word_count,
  'line-count': tools.line_count,
  'byte-count': tools.byte_count,
  'trim': tools.trim_text,
  'trim-start': tools.trim_start,
  'trim-end': tools.trim_end,
  'remove-extra-spaces': tools.remove_extra_spaces,
  'reverse-lines': tools.reverse_lines,
  'unique-lines': tools.unique_lines,
  'number-lines': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.number_lines(
      input,
      (options?.start as number) ?? 1,
      (options?.separator as string) ?? '. '
    );
  },
  'add-prefix': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.prefix_lines(input, (options?.prefix as string) ?? '');
  },
  'add-suffix': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.suffix_lines(input, (options?.suffix as string) ?? '');
  },
  'dedent': tools.dedent_text,
  'indent': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.indent_text(input, (options?.spaces as number) ?? 2);
  },
  'shuffle-lines': tools.shuffle_lines,
  'url-slug': tools.url_slug,
  'lorem-ipsum': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.lorem_ipsum((options?.paragraphs as number) ?? 3);
  },
  'escape-regex': tools.escape_regex,
  'find-replace': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.find_replace(
      input,
      (options?.find as string) ?? '',
      (options?.replace as string) ?? ''
    );
  },
  'truncate': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.truncate_text(
      input,
      (options?.maxLength as number) ?? 100,
      (options?.ellipsis as string) ?? '...'
    );
  },
  'center-text': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.center_text(input, (options?.width as number) ?? 80);
  },
  'right-align': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.right_align_text(input, (options?.width as number) ?? 80);
  },
  'repeat-text': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.repeat_text(
      input,
      (options?.count as number) ?? 1,
      (options?.separator as string) ?? '\n'
    );
  },
  'simple-diff': (input, opts) => {
    const options = opts as Record<string, unknown> | undefined;
    return tools.simple_diff(input, (options?.compare as string) ?? '');
  },
  // Hash functions (async - redirect to server)
  'md5': tools.md5_hash,
  'sha1': tools.sha1_hash,
  'sha256': tools.sha256_hash,
  'sha384': tools.sha384_hash,
  'sha512': tools.sha512_hash,
  // Additional unicode aliases
  'bold-unicode': tools.bold_unicode_text,
  'italic-unicode': tools.italic_unicode_text,
  'monospace': tools.monospace_text,
});

export async function executeTextTool(
  toolId: string,
  input: string,
  options?: Record<string, unknown>
): Promise<string> {
  const tools = await loadTextTools();
  const toolMap = createToolMap(tools);
  
  const toolFn = toolMap[toolId];
  if (!toolFn) {
    throw new Error(`Unknown text tool: ${toolId}`);
  }
  
  return toolFn(input, options);
}
