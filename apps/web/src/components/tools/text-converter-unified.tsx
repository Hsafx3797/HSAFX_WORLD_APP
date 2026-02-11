'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCopyToClipboard } from '@/hooks/use-utils';

// ============== ICONS ==============
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const ResetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

// Category Icons
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
);

const SymbolIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16"/>
    <path d="M4 12h8"/>
    <path d="M4 20h16"/>
    <circle cx="18" cy="12" r="3"/>
  </svg>
);

const SwapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3l4 4-4 4"/>
    <path d="M20 7H4"/>
    <path d="M8 21l-4-4 4-4"/>
    <path d="M4 17h16"/>
  </svg>
);

const FunTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" x2="9.01" y1="9" y2="9"/>
    <line x1="15" x2="15.01" y1="9" y2="9"/>
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const WrapperIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
    <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
    <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
    <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
  </svg>
);

const UnicodeFontIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7"/>
    <line x1="9" x2="15" y1="20" y2="20"/>
    <line x1="12" x2="12" y1="4" y2="20"/>
  </svg>
);

const ManipulationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 6H3"/>
    <path d="M17 12H3"/>
    <path d="M21 18H3"/>
    <path d="M21 12h-4"/>
  </svg>
);

const ExtractIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

// ============== TOOL OPTIONS TYPES ==============
interface ToolOptionBase {
  id: string;
  label: string;
}

interface SelectOption extends ToolOptionBase {
  type: 'select';
  values: { value: string; label: string }[];
  default: string;
}

interface IntegerOption extends ToolOptionBase {
  type: 'integer';
  min: number;
  max: number;
  default: number;
}

interface TextOption extends ToolOptionBase {
  type: 'text';
  placeholder?: string;
  default: string;
  required?: boolean;
}

interface ToggleOption extends ToolOptionBase {
  type: 'toggle';
  default: boolean;
}

interface SliderOption extends ToolOptionBase {
  type: 'slider';
  min: number;
  max: number;
  step?: number;
  default: number;
  labels?: { min: string; max: string };
}

interface CharOption extends ToolOptionBase {
  type: 'char';
  default: string;
}

type ToolOption = SelectOption | IntegerOption | TextOption | ToggleOption | SliderOption | CharOption;

interface ToolOptions {
  [toolId: string]: ToolOption[];
}

// ============== TOOL OPTIONS DEFINITIONS ==============
const toolOptionsConfig: ToolOptions = {
  // Caesar Cipher - configurable shift
  'caesar-cipher': [
    { id: 'shift', label: 'Shift', type: 'integer', min: -25, max: 25, default: 3 },
  ],
  // Caesar Bruteforce
  'caesar-bruteforce': [
    { id: 'multiOutput', label: 'Multi-output (show all shifts)', type: 'toggle', default: true },
  ],
  // Vigenère Cipher
  'vigenere-encrypt': [
    { id: 'key', label: 'Key', type: 'text', placeholder: 'Enter key...', default: 'secret', required: true },
  ],
  'vigenere-decrypt': [
    { id: 'key', label: 'Key', type: 'text', placeholder: 'Enter key...', default: 'secret', required: true },
  ],
  // Rail Fence Cipher
  'rail-fence-cipher': [
    { id: 'rails', label: 'Rails', type: 'integer', min: 2, max: 20, default: 3 },
  ],
  // Playfair Cipher
  'playfair-cipher': [
    { id: 'key', label: 'Key', type: 'text', placeholder: 'Enter key...', default: 'keyword', required: true },
    { id: 'ijMerge', label: 'I/J merge', type: 'toggle', default: true },
  ],
  // Bacon Cipher
  'bacon-cipher': [
    { id: 'variant', label: 'Encoding Variant', type: 'select', values: [{ value: 'ab', label: 'A/B' }, { value: '01', label: '0/1' }], default: 'ab' },
  ],
  // Base64 Encode/Decode
  'base64-encode': [
    { id: 'variant', label: 'Variant', type: 'select', values: [{ value: 'standard', label: 'Standard' }, { value: 'urlsafe', label: 'URL-safe' }], default: 'standard' },
    { id: 'lineWrap', label: 'Line wrapping (76 chars)', type: 'toggle', default: false },
  ],
  'base64-decode': [
    { id: 'variant', label: 'Variant', type: 'select', values: [{ value: 'standard', label: 'Standard' }, { value: 'urlsafe', label: 'URL-safe' }], default: 'standard' },
  ],
  // Base32 Encode/Decode
  'base32-encode': [
    { id: 'alphabet', label: 'Alphabet', type: 'select', values: [{ value: 'rfc4648', label: 'RFC 4648' }, { value: 'crockford', label: 'Crockford' }], default: 'rfc4648' },
  ],
  'base32-decode': [
    { id: 'alphabet', label: 'Alphabet', type: 'select', values: [{ value: 'rfc4648', label: 'RFC 4648' }, { value: 'crockford', label: 'Crockford' }], default: 'rfc4648' },
  ],
  // Base58 Encode/Decode
  'base58-encode': [
    { id: 'alphabet', label: 'Alphabet', type: 'select', values: [{ value: 'bitcoin', label: 'Bitcoin' }, { value: 'ripple', label: 'Ripple' }, { value: 'flickr', label: 'Flickr' }], default: 'bitcoin' },
  ],
  'base58-decode': [
    { id: 'alphabet', label: 'Alphabet', type: 'select', values: [{ value: 'bitcoin', label: 'Bitcoin' }, { value: 'ripple', label: 'Ripple' }, { value: 'flickr', label: 'Flickr' }], default: 'bitcoin' },
  ],
  // Binary Encode
  'binary-encode': [
    { id: 'grouping', label: 'Bit Grouping', type: 'select', values: [{ value: '8', label: '8-bit' }, { value: '16', label: '16-bit' }], default: '8' },
    { id: 'spaced', label: 'Space-separated', type: 'toggle', default: true },
  ],
  // Hex Encode
  'hex-encode': [
    { id: 'letterCase', label: 'Letter Case', type: 'select', values: [{ value: 'lower', label: 'Lower' }, { value: 'upper', label: 'Upper' }], default: 'lower' },
  ],
  // Octal Encode
  'octal-encode': [
    { id: 'padding', label: 'Pad to 3 digits', type: 'toggle', default: true },
  ],
  // ASCII Code
  'ascii-code': [
    { id: 'format', label: 'Output Format', type: 'select', values: [{ value: 'decimal', label: 'Decimal' }, { value: 'hex', label: 'Hex' }, { value: 'binary', label: 'Binary' }], default: 'decimal' },
  ],
  // URL Encode
  'url-encode': [
    { id: 'mode', label: 'Encoding Mode', type: 'select', values: [{ value: 'rfc3986', label: 'RFC 3986' }, { value: 'form', label: 'Form encoding (+)' }], default: 'rfc3986' },
  ],
  // URL Decode
  'url-decode': [
    { id: 'decodePlus', label: 'Decode + as space', type: 'toggle', default: false },
  ],
  // HTML Escape
  'html-entities-encode': [
    { id: 'mode', label: 'Escape Mode', type: 'select', values: [{ value: 'minimal', label: 'Minimal' }, { value: 'full', label: 'Full entities' }], default: 'minimal' },
  ],
  // Unicode Escape
  'unicode-escape': [
    { id: 'format', label: 'Format', type: 'select', values: [{ value: 'u4', label: '\\uXXXX' }, { value: 'u8', label: '\\UXXXXXXXX' }], default: 'u4' },
  ],
  // JSON String Escape
  'json-escape': [
    { id: 'strict', label: 'Strict Mode', type: 'toggle', default: false },
  ],
  // Random Case
  'random-case': [
    { id: 'level', label: 'Randomness Level', type: 'select', values: [{ value: 'char', label: 'Per-character' }, { value: 'word', label: 'Per-word' }], default: 'char' },
  ],
  // Studly Case
  'studly-caps': [
    { id: 'pattern', label: 'Pattern', type: 'select', values: [{ value: 'random', label: 'Random' }, { value: 'alternating', label: 'Alternating' }], default: 'random' },
  ],
  // Mocking SpongeBob Case
  'spongebob-case': [
    { id: 'intensity', label: 'Intensity', type: 'slider', min: 1, max: 5, default: 3, labels: { min: 'Low', max: 'Extreme' } },
  ],
  // Emoji Case
  'emoji-case': [
    { id: 'emojiSet', label: 'Emoji Set', type: 'select', values: [{ value: 'faces', label: 'Faces' }, { value: 'objects', label: 'Objects' }, { value: 'mixed', label: 'Mixed' }], default: 'mixed' },
  ],
  // UwU Speak
  'uwu-speak': [
    { id: 'cuteness', label: 'Cuteness Level', type: 'slider', min: 1, max: 5, default: 3, labels: { min: 'Subtle', max: 'Maximum' } },
    { id: 'emojis', label: 'Add Emojis', type: 'toggle', default: true },
  ],
  // Pirate Speak
  'pirate-speak': [
    { id: 'dialect', label: 'Dialect', type: 'select', values: [{ value: 'classic', label: 'Classic' }, { value: 'comic', label: 'Comic' }], default: 'classic' },
  ],
  // Circled Letters
  'circled-letters': [
    { id: 'style', label: 'Style', type: 'select', values: [{ value: 'black', label: 'Black' }, { value: 'white', label: 'White' }], default: 'white' },
  ],
  // Squared Letters
  'squared-letters': [
    { id: 'fill', label: 'Fill', type: 'select', values: [{ value: 'outlined', label: 'Outlined' }, { value: 'filled', label: 'Filled' }], default: 'outlined' },
  ],
  // Bubble Text
  'bubble-text': [
    { id: 'style', label: 'Style', type: 'select', values: [{ value: 'white', label: 'White' }, { value: 'black', label: 'Black' }], default: 'white' },
  ],
  // Rotated Text
  'rotated-text': [
    { id: 'angle', label: 'Rotation Angle', type: 'select', values: [{ value: '90', label: '90°' }, { value: '180', label: '180°' }, { value: '270', label: '270°' }], default: '180' },
  ],
  // Shuffle Text
  'shuffle-chars': [
    { id: 'unit', label: 'Unit', type: 'select', values: [{ value: 'chars', label: 'Characters' }, { value: 'words', label: 'Words' }, { value: 'lines', label: 'Lines' }], default: 'chars' },
  ],
  // Scramble Words
  'scramble-letters': [
    { id: 'preserveEnds', label: 'Preserve First/Last', type: 'toggle', default: true },
  ],
  // Pick Random Line
  'pick-random-line': [
    { id: 'count', label: 'Count', type: 'integer', min: 1, max: 100, default: 1 },
  ],
  // Pad Lines
  'pad-lines': [
    { id: 'targetLength', label: 'Target Length', type: 'integer', min: 1, max: 200, default: 40 },
    { id: 'padChar', label: 'Padding Character', type: 'char', default: ' ' },
    { id: 'alignment', label: 'Alignment', type: 'select', values: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }, { value: 'center', label: 'Center' }], default: 'left' },
  ],
  // Indent Text
  'indent-text': [
    { id: 'size', label: 'Indent Size', type: 'integer', min: 1, max: 16, default: 2 },
    { id: 'char', label: 'Indent Character', type: 'select', values: [{ value: 'space', label: 'Space' }, { value: 'tab', label: 'Tab' }], default: 'space' },
  ],
  // Split Lines by Length
  'split-by-length': [
    { id: 'maxLength', label: 'Max Line Length', type: 'integer', min: 10, max: 200, default: 80 },
  ],
  // Line Length Normalizer
  'line-length-normalizer': [
    { id: 'targetLength', label: 'Target Length', type: 'integer', min: 10, max: 200, default: 80 },
  ],
  // Wrap with HTML Tag
  'wrap-html-tag': [
    { id: 'tag', label: 'Tag Name', type: 'text', placeholder: 'div', default: 'div' },
    { id: 'attributes', label: 'Attributes', type: 'text', placeholder: 'class="wrapper"', default: '' },
  ],
  // Wrap with Markdown Code Block
  'code-block-md': [
    { id: 'language', label: 'Language', type: 'text', placeholder: 'javascript', default: '' },
  ],
  // Line Number Wrapper
  'number-lines': [
    { id: 'startNumber', label: 'Start Number', type: 'integer', min: 0, max: 1000, default: 1 },
    { id: 'separator', label: 'Separator', type: 'text', placeholder: '. ', default: '. ' },
  ],
  // Prefix Each Line
  'prefix-each-line': [
    { id: 'prefix', label: 'Prefix Text', type: 'text', placeholder: '> ', default: '> ' },
  ],
  // Suffix Each Line
  'suffix-each-line': [
    { id: 'suffix', label: 'Suffix Text', type: 'text', placeholder: ' <', default: ' <' },
  ],
  // Zalgo Text
  'zalgo-text': [
    { id: 'intensity', label: 'Intensity', type: 'slider', min: 1, max: 5, default: 3, labels: { min: 'Light', max: 'Heavy' } },
    { id: 'up', label: 'Up Marks', type: 'toggle', default: true },
    { id: 'mid', label: 'Mid Marks', type: 'toggle', default: true },
    { id: 'down', label: 'Down Marks', type: 'toggle', default: true },
  ],
  // Clap Text
  'clap-text': [
    { id: 'separator', label: 'Separator', type: 'select', values: [{ value: '👏', label: '👏' }, { value: '✨', label: '✨' }, { value: '🔥', label: '🔥' }, { value: 'custom', label: 'Custom' }], default: '👏' },
    { id: 'customSeparator', label: 'Custom Separator', type: 'text', placeholder: 'Enter separator...', default: '' },
  ],
  // Sparkle Text
  'sparkle-text': [
    { id: 'emoji', label: 'Emoji', type: 'select', values: [{ value: '✨', label: '✨' }, { value: '⭐', label: '⭐' }, { value: '💫', label: '💫' }, { value: '🌟', label: '🌟' }], default: '✨' },
  ],
};

// ============== CONVERTER CATEGORIES ==============
interface ConverterTool {
  id: string;
  name: string;
  transform: (text: string, options?: Record<string, unknown>) => string;
  hasOptions?: boolean;
}

interface ConverterCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  tools: ConverterTool[];
}

// ============== ALL 192 TEXT TRANSFORMATIONS ==============
// Unicode character maps
const UNICODE_MAPS = {
  upsideDown: {a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z',A:'∀',B:'q',C:'Ɔ',D:'p',E:'Ǝ',F:'Ⅎ',G:'פ',H:'H',I:'I',J:'ſ',K:'ʞ',L:'˥',M:'W',N:'N',O:'O',P:'Ԁ',Q:'Q',R:'ɹ',S:'S',T:'┴',U:'∩',V:'Λ',W:'M',X:'X',Y:'⅄',Z:'Z','1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'ㄥ','8':'8','9':'6','0':'0','!':'¡','?':'¿','.':'˙',',':'\'','\'':',','"':'„','&':'⅋','_':'‾',';':'؛','[':']',']':'[','(':')',')':'(','{':'}','}':'{'},
  smallCaps: {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'ꜱ',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'},
  superscript: {a:'ᵃ',b:'ᵇ',c:'ᶜ',d:'ᵈ',e:'ᵉ',f:'ᶠ',g:'ᵍ',h:'ʰ',i:'ⁱ',j:'ʲ',k:'ᵏ',l:'ˡ',m:'ᵐ',n:'ⁿ',o:'ᵒ',p:'ᵖ',r:'ʳ',s:'ˢ',t:'ᵗ',u:'ᵘ',v:'ᵛ',w:'ʷ',x:'ˣ',y:'ʸ',z:'ᶻ','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾'},
  subscript: {a:'ₐ',e:'ₑ',h:'ₕ',i:'ᵢ',j:'ⱼ',k:'ₖ',l:'ₗ',m:'ₘ',n:'ₙ',o:'ₒ',p:'ₚ',r:'ᵣ',s:'ₛ',t:'ₜ',u:'ᵤ',v:'ᵥ',x:'ₓ','0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','+':'₊','-':'₋','=':'₌','(':'₍',')':'₎'},
  circledUpper: 'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ',
  circledLower: 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ',
  squared: '🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉',
  filledSquared: '🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉',
  mathBold: {a:'𝐚',b:'𝐛',c:'𝐜',d:'𝐝',e:'𝐞',f:'𝐟',g:'𝐠',h:'𝐡',i:'𝐢',j:'𝐣',k:'𝐤',l:'𝐥',m:'𝐦',n:'𝐧',o:'𝐨',p:'𝐩',q:'𝐪',r:'𝐫',s:'𝐬',t:'𝐭',u:'𝐮',v:'𝐯',w:'𝐰',x:'𝐱',y:'𝐲',z:'𝐳',A:'𝐀',B:'𝐁',C:'𝐂',D:'𝐃',E:'𝐄',F:'𝐅',G:'𝐆',H:'𝐇',I:'𝐈',J:'𝐉',K:'𝐊',L:'𝐋',M:'𝐌',N:'𝐍',O:'𝐎',P:'𝐏',Q:'𝐐',R:'𝐑',S:'𝐒',T:'𝐓',U:'𝐔',V:'𝐕',W:'𝐖',X:'𝐗',Y:'𝐘',Z:'𝐙'},
  mathItalic: {a:'𝑎',b:'𝑏',c:'𝑐',d:'𝑑',e:'𝑒',f:'𝑓',g:'𝑔',h:'ℎ',i:'𝑖',j:'𝑗',k:'𝑘',l:'𝑙',m:'𝑚',n:'𝑛',o:'𝑜',p:'𝑝',q:'𝑞',r:'𝑟',s:'𝑠',t:'𝑡',u:'𝑢',v:'𝑣',w:'𝑤',x:'𝑥',y:'𝑦',z:'𝑧',A:'𝐴',B:'𝐵',C:'𝐶',D:'𝐷',E:'𝐸',F:'𝐹',G:'𝐺',H:'𝐻',I:'𝐼',J:'𝐽',K:'𝐾',L:'𝐿',M:'𝑀',N:'𝑁',O:'𝑂',P:'𝑃',Q:'𝑄',R:'𝑅',S:'𝑆',T:'𝑇',U:'𝑈',V:'𝑉',W:'𝑊',X:'𝑋',Y:'𝑌',Z:'𝑍'},
  mathBoldItalic: {a:'𝒂',b:'𝒃',c:'𝒄',d:'𝒅',e:'𝒆',f:'𝒇',g:'𝒈',h:'𝒉',i:'𝒊',j:'𝒋',k:'𝒌',l:'𝒍',m:'𝒎',n:'𝒏',o:'𝒐',p:'𝒑',q:'𝒒',r:'𝒓',s:'𝒔',t:'𝒕',u:'𝒖',v:'𝒗',w:'𝒘',x:'𝒙',y:'𝒚',z:'𝒛',A:'𝑨',B:'𝑩',C:'𝑪',D:'𝑫',E:'𝑬',F:'𝑭',G:'𝑮',H:'𝑯',I:'𝑰',J:'𝑱',K:'𝑲',L:'𝑳',M:'𝑴',N:'𝑵',O:'𝑶',P:'𝑷',Q:'𝑸',R:'𝑹',S:'𝑺',T:'𝑻',U:'𝑼',V:'𝑽',W:'𝑾',X:'𝑿',Y:'𝒀',Z:'𝒁'},
  mathSans: {a:'𝖺',b:'𝖻',c:'𝖼',d:'𝖽',e:'𝖾',f:'𝖿',g:'𝗀',h:'𝗁',i:'𝗂',j:'𝗃',k:'𝗄',l:'𝗅',m:'𝗆',n:'𝗇',o:'𝗈',p:'𝗉',q:'𝗊',r:'𝗋',s:'𝗌',t:'𝗍',u:'𝗎',v:'𝗏',w:'𝗐',x:'𝗑',y:'𝗒',z:'𝗓',A:'𝖠',B:'𝖡',C:'𝖢',D:'𝖣',E:'𝖤',F:'𝖥',G:'𝖦',H:'𝖧',I:'𝖨',J:'𝖩',K:'𝖪',L:'𝖫',M:'𝖬',N:'𝖭',O:'𝖮',P:'𝖯',Q:'𝖰',R:'𝖱',S:'𝖲',T:'𝖳',U:'𝖴',V:'𝖵',W:'𝖶',X:'𝖷',Y:'𝖸',Z:'𝖹'},
  mathSansBold: {a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇',A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',M:'𝗠',N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',Y:'𝗬',Z:'𝗭'},
  mathMono: {a:'𝚊',b:'𝚋',c:'𝚌',d:'𝚍',e:'𝚎',f:'𝚏',g:'𝚐',h:'𝚑',i:'𝚒',j:'𝚓',k:'𝚔',l:'𝚕',m:'𝚖',n:'𝚗',o:'𝚘',p:'𝚙',q:'𝚚',r:'𝚛',s:'𝚜',t:'𝚝',u:'𝚞',v:'𝚟',w:'𝚠',x:'𝚡',y:'𝚢',z:'𝚣',A:'𝙰',B:'𝙱',C:'𝙲',D:'𝙳',E:'𝙴',F:'𝙵',G:'𝙶',H:'𝙷',I:'𝙸',J:'𝙹',K:'𝙺',L:'𝙻',M:'𝙼',N:'𝙽',O:'𝙾',P:'𝙿',Q:'𝚀',R:'𝚁',S:'𝚂',T:'𝚃',U:'𝚄',V:'𝚅',W:'𝚆',X:'𝚇',Y:'𝚈',Z:'𝚉'},
  mathScript: {a:'𝒶',b:'𝒷',c:'𝒸',d:'𝒹',e:'ℯ',f:'𝒻',g:'ℊ',h:'𝒽',i:'𝒾',j:'𝒿',k:'𝓀',l:'𝓁',m:'𝓂',n:'𝓃',o:'ℴ',p:'𝓅',q:'𝓆',r:'𝓇',s:'𝓈',t:'𝓉',u:'𝓊',v:'𝓋',w:'𝓌',x:'𝓍',y:'𝓎',z:'𝓏',A:'𝒜',B:'ℬ',C:'𝒞',D:'𝒟',E:'ℰ',F:'ℱ',G:'𝒢',H:'ℋ',I:'ℐ',J:'𝒥',K:'𝒦',L:'ℒ',M:'ℳ',N:'𝒩',O:'𝒪',P:'𝒫',Q:'𝒬',R:'ℛ',S:'𝒮',T:'𝒯',U:'𝒰',V:'𝒱',W:'𝒲',X:'𝒳',Y:'𝒴',Z:'𝒵'},
  mathScriptBold: {a:'𝓪',b:'𝓫',c:'𝓬',d:'𝓭',e:'𝓮',f:'𝓯',g:'𝓰',h:'𝓱',i:'𝓲',j:'𝓳',k:'𝓴',l:'𝓵',m:'𝓶',n:'𝓷',o:'𝓸',p:'𝓹',q:'𝓺',r:'𝓻',s:'𝓼',t:'𝓽',u:'𝓾',v:'𝓿',w:'𝔀',x:'𝔁',y:'𝔂',z:'𝔃',A:'𝓐',B:'𝓑',C:'𝓒',D:'𝓓',E:'𝓔',F:'𝓕',G:'𝓖',H:'𝓗',I:'𝓘',J:'𝓙',K:'𝓚',L:'𝓛',M:'𝓜',N:'𝓝',O:'𝓞',P:'𝓟',Q:'𝓠',R:'𝓡',S:'𝓢',T:'𝓣',U:'𝓤',V:'𝓥',W:'𝓦',X:'𝓧',Y:'𝓨',Z:'𝓩'},
  mathFraktur: {a:'𝔞',b:'𝔟',c:'𝔠',d:'𝔡',e:'𝔢',f:'𝔣',g:'𝔤',h:'𝔥',i:'𝔦',j:'𝔧',k:'𝔨',l:'𝔩',m:'𝔪',n:'𝔫',o:'𝔬',p:'𝔭',q:'𝔮',r:'𝔯',s:'𝔰',t:'𝔱',u:'𝔲',v:'𝔳',w:'𝔴',x:'𝔵',y:'𝔶',z:'𝔷',A:'𝔄',B:'𝔅',C:'ℭ',D:'𝔇',E:'𝔈',F:'𝔉',G:'𝔊',H:'ℌ',I:'ℑ',J:'𝔍',K:'𝔎',L:'𝔏',M:'𝔐',N:'𝔑',O:'𝔒',P:'𝔓',Q:'𝔔',R:'ℜ',S:'𝔖',T:'𝔗',U:'𝔘',V:'𝔙',W:'𝔚',X:'𝔛',Y:'𝔜',Z:'ℨ'},
  mathFrakturBold: {a:'𝖆',b:'𝖇',c:'𝖈',d:'𝖉',e:'𝖊',f:'𝖋',g:'𝖌',h:'𝖍',i:'𝖎',j:'𝖏',k:'𝖐',l:'𝖑',m:'𝖒',n:'𝖓',o:'𝖔',p:'𝖕',q:'𝖖',r:'𝖗',s:'𝖘',t:'𝖙',u:'𝖚',v:'𝖛',w:'𝖜',x:'𝖝',y:'𝖞',z:'𝖟',A:'𝕬',B:'𝕭',C:'𝕮',D:'𝕯',E:'𝕰',F:'𝕱',G:'𝕲',H:'𝕳',I:'𝕴',J:'𝕵',K:'𝕶',L:'𝕷',M:'𝕸',N:'𝕹',O:'𝕺',P:'𝕻',Q:'𝕼',R:'𝕽',S:'𝕾',T:'𝕿',U:'𝖀',V:'𝖁',W:'𝖂',X:'𝖃',Y:'𝖄',Z:'𝖅'},
  mathDoubleStruck: {a:'𝕒',b:'𝕓',c:'𝕔',d:'𝕕',e:'𝕖',f:'𝕗',g:'𝕘',h:'𝕙',i:'𝕚',j:'𝕛',k:'𝕜',l:'𝕝',m:'𝕞',n:'𝕟',o:'𝕠',p:'𝕡',q:'𝕢',r:'𝕣',s:'𝕤',t:'𝕥',u:'𝕦',v:'𝕧',w:'𝕨',x:'𝕩',y:'𝕪',z:'𝕫',A:'𝔸',B:'𝔹',C:'ℂ',D:'𝔻',E:'𝔼',F:'𝔽',G:'𝔾',H:'ℍ',I:'𝕀',J:'𝕁',K:'𝕂',L:'𝕃',M:'𝕄',N:'ℕ',O:'𝕆',P:'ℙ',Q:'ℚ',R:'ℝ',S:'𝕊',T:'𝕋',U:'𝕌',V:'𝕍',W:'𝕎',X:'𝕏',Y:'𝕐',Z:'ℤ'},
  parenthesized: {a:'⒜',b:'⒝',c:'⒞',d:'⒟',e:'⒠',f:'⒡',g:'⒢',h:'⒣',i:'⒤',j:'⒥',k:'⒦',l:'⒧',m:'⒨',n:'⒩',o:'⒪',p:'⒫',q:'⒬',r:'⒭',s:'⒮',t:'⒯',u:'⒰',v:'⒱',w:'⒲',x:'⒳',y:'⒴',z:'⒵'},
  morse: {a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.',' ':'/','?':'..--..','!':'-.-.--','.':'.-.-.-',',':'--..--'} as Record<string, string>,
};

// Helper for unicode map application
const applyUnicodeMap = (text: string, map: Record<string, string>) =>
  text.split('').map(c => map[c] ?? map[c.toLowerCase()] ?? c).join('');

// Helper for indexed unicode (circled, squared, etc.)
const applyIndexedUnicode = (text: string, upperStr: string, lowerStr: string | null = null) =>
  text.split('').map(c => {
    if (c >= 'A' && c <= 'Z') return upperStr[c.charCodeAt(0) - 65];
    if (lowerStr && c >= 'a' && c <= 'z') return lowerStr[c.charCodeAt(0) - 97];
    return c;
  }).join('');

// Caesar cipher helper
const caesarCipher = (text: string, shift: number) =>
  text.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
  });

// Vigenere cipher helper
const vigenereCipher = (text: string, key: string, decrypt = false) => {
  const k = key.toLowerCase().replace(/[^a-z]/g, '') || 'key';
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    const shift = k.charCodeAt(ki % k.length) - 97;
    ki++;
    return String.fromCharCode(((c.charCodeAt(0) - base + (decrypt ? 26 - shift : shift)) % 26) + base);
  });
};

// All text transformations matching registry IDs
const textTransforms: Record<string, (t: string, opts?: Record<string, unknown>) => string> = {
  // === CASE CONVERSIONS ===
  'uppercase': (t: string) => t.toUpperCase(),
  'lowercase': t => t.toLowerCase(),
  'sentence-case': t => t.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()),
  'capitalized-case': t => t.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
  'title-case': t => {
    const minor = ['a','an','the','and','but','or','for','nor','on','at','to','by','of','in'];
    return t.toLowerCase().split(' ').map((w, i) => i === 0 || !minor.includes(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ');
  },
  'camelCase': t => t.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()),
  'PascalCase': t => t.toLowerCase().replace(/(?:^|[^a-zA-Z0-9]+)(.)/g, (_, c) => c.toUpperCase()),
  'snake_case': t => t.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, ''),
  'kebab-case': t => t.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, ''),
  'CONSTANT_CASE': t => t.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, ''),
  'path/case': t => t.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '/').replace(/^\/|\/$/g, ''),
  'Train-Case': t => t.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/[^a-zA-Z0-9]+/g, '-'),
  'alternating-case': t => t.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''),
  'inverse-case': t => t.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join(''),
  'swap-case': t => t.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''),
  'random-case': (t, opts) => {
    const level = opts?.level as string || 'char';
    if (level === 'word') {
      return t.split(/\s+/).map(w => Math.random() > 0.5 ? w.toUpperCase() : w.toLowerCase()).join(' ');
    }
    return t.split('').map(c => Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join('');
  },
  'first-letter-uppercase': t => t.charAt(0).toUpperCase() + t.slice(1),
  'first-letter-lowercase': t => t.charAt(0).toLowerCase() + t.slice(1),
  'capitalize-words': t => t.replace(/\b\w/g, c => c.toUpperCase()),
  'decapitalize-words': t => t.replace(/\b\w/g, c => c.toLowerCase()),
  'capitalize-sentences': t => t.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()),
  'spongebob-case': (t, opts) => {
    const intensity = (opts?.intensity as number) || 3;
    const threshold = 0.3 + (intensity * 0.1);
    return t.split('').map((c, i) => {
      if (intensity >= 4) return i % 2 === 0 ? c.toLowerCase() : c.toUpperCase();
      return Math.random() > threshold ? c.toLowerCase() : c.toUpperCase();
    }).join('');
  },
  'studly-caps': (t, opts) => {
    const pattern = opts?.pattern as string || 'random';
    if (pattern === 'alternating') {
      return t.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('');
    }
    return t.split('').map(c => Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join('');
  },
  'flat-case': t => t.toLowerCase().replace(/[^a-z0-9]/g, ''),
  'cobol-case': t => t.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, ''),
  'ada-case': t => t.split(/[^a-zA-Z0-9]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('_'),
  'header-case': t => t.split(/[^a-zA-Z0-9]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-'),
  'macro-case': t => t.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
  // Missing Case tools
  'screaming-snake-case': t => t.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, ''),
  'lower-dot-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, ''),
  'upper-dot-case': t => t.toUpperCase().replace(/[^A-Z0-9]+/g, '.').replace(/^\.|\.$/g, ''),
  'path-slug-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '/').replace(/^\/|\/$/g, ''),
  'humanized-case': t => {
    const words = t.replace(/([A-Z])/g, ' $1').replace(/[_-]+/g, ' ').trim().split(/\s+/);
    return words.map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()).join(' ');
  },
  'machine-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
  
  // === WRAPPERS (056-090) ===
  'wrap-backticks': t => t.split('\n').map(l => `\`${l}\``).join('\n'),
  'wrap-single-quotes': t => t.split('\n').map(l => `'${l}'`).join('\n'),
  'wrap-double-quotes': t => t.split('\n').map(l => `"${l}"`).join('\n'),
  'wrap-curly-braces': t => t.split('\n').map(l => `{${l}}`).join('\n'),
  'wrap-square-brackets': t => t.split('\n').map(l => `[${l}]`).join('\n'),
  'wrap-parentheses': t => t.split('\n').map(l => `(${l})`).join('\n'),
  'wrap-angle-brackets': t => t.split('\n').map(l => `<${l}>`).join('\n'),
  'wrap-guillemets': t => t.split('\n').map(l => `«${l}»`).join('\n'),
  'wrap-html-tag': t => t.split('\n').map(l => `<div>${l}</div>`).join('\n'),
  'wrap-code-tag': t => `<code>${t}</code>`,
  'wrap-pre-tag': t => `<pre>${t}</pre>`,
  'wrap-span-tag': t => `<span>${t}</span>`,
  'wrap-p-tag': t => t.split('\n').map(l => `<p>${l}</p>`).join('\n'),
  'wrap-li-tag': t => t.split('\n').map(l => `<li>${l}</li>`).join('\n'),
  'wrap-ul-list': t => `<ul>\n${t.split('\n').map(l => `  <li>${l}</li>`).join('\n')}\n</ul>`,
  'wrap-ol-list': t => `<ol>\n${t.split('\n').map(l => `  <li>${l}</li>`).join('\n')}\n</ol>`,
  'prefix-each-line': t => t.split('\n').map(l => `> ${l}`).join('\n'),
  'suffix-each-line': t => t.split('\n').map(l => `${l} <`).join('\n'),
  'number-lines': t => t.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n'),
  'bullet-list': t => t.split('\n').map(l => `• ${l}`).join('\n'),
  'checkbox-list': t => t.split('\n').map(l => `☐ ${l}`).join('\n'),
  'checked-list': t => t.split('\n').map(l => `☑ ${l}`).join('\n'),
  'arrow-list': t => t.split('\n').map(l => `→ ${l}`).join('\n'),
  'dash-list': t => t.split('\n').map(l => `- ${l}`).join('\n'),
  'asterisk-list': t => t.split('\n').map(l => `* ${l}`).join('\n'),
  'bold-html': t => `<b>${t}</b>`,
  'italic-html': t => `<i>${t}</i>`,
  'underline-html': t => `<u>${t}</u>`,
  'strike-html': t => `<s>${t}</s>`,
  'bold-md': t => `**${t}**`,
  'italic-md': t => `*${t}*`,
  'strikethrough-md': t => `~~${t}~~`,
  'inline-code-md': t => `\`${t}\``,
  'code-block-md': t => `\`\`\`\n${t}\n\`\`\``,
  'blockquote-md': t => t.split('\n').map(l => `> ${l}`).join('\n'),
  'heading-md-1': t => `# ${t}`,
  'heading-md-2': t => `## ${t}`,
  'heading-md-3': t => `### ${t}`,
  
  // === UNICODE STYLES (091-120) ===
  'small-caps': t => applyUnicodeMap(t.toLowerCase(), UNICODE_MAPS.smallCaps),
  'superscript': t => applyUnicodeMap(t.toLowerCase(), UNICODE_MAPS.superscript),
  'subscript': t => applyUnicodeMap(t.toLowerCase(), UNICODE_MAPS.subscript),
  'fullwidth': t => t.split('').map(c => {
    const code = c.charCodeAt(0);
    if (code >= 33 && code <= 126) return String.fromCharCode(code + 65248);
    if (c === ' ') return '　';
    return c;
  }).join(''),
  'circled-letters': t => applyIndexedUnicode(t, UNICODE_MAPS.circledUpper, UNICODE_MAPS.circledLower),
  'squared-letters': t => applyIndexedUnicode(t.toUpperCase(), UNICODE_MAPS.squared),
  'squared-filled': t => applyIndexedUnicode(t.toUpperCase(), UNICODE_MAPS.filledSquared),
  'parenthesized': t => applyUnicodeMap(t.toLowerCase(), UNICODE_MAPS.parenthesized),
  'upside-down': t => applyUnicodeMap(t, UNICODE_MAPS.upsideDown).split('').reverse().join(''),
  'math-bold': t => applyUnicodeMap(t, UNICODE_MAPS.mathBold),
  'math-italic': t => applyUnicodeMap(t, UNICODE_MAPS.mathItalic),
  'math-bold-italic': t => applyUnicodeMap(t, UNICODE_MAPS.mathBoldItalic),
  'math-sans': t => applyUnicodeMap(t, UNICODE_MAPS.mathSans),
  'math-sans-bold': t => applyUnicodeMap(t, UNICODE_MAPS.mathSansBold),
  'math-monospace': t => applyUnicodeMap(t, UNICODE_MAPS.mathMono),
  'math-script': t => applyUnicodeMap(t, UNICODE_MAPS.mathScript),
  'math-script-bold': t => applyUnicodeMap(t, UNICODE_MAPS.mathScriptBold),
  'math-fraktur': t => applyUnicodeMap(t, UNICODE_MAPS.mathFraktur),
  'math-fraktur-bold': t => applyUnicodeMap(t, UNICODE_MAPS.mathFrakturBold),
  'math-double-struck': t => applyUnicodeMap(t, UNICODE_MAPS.mathDoubleStruck),
  'strikethrough-unicode': t => t.split('').map(c => c + '\u0336').join(''),
  'underline-unicode': t => t.split('').map(c => c + '\u0332').join(''),
  'overline-unicode': t => t.split('').map(c => c + '\u0305').join(''),
  'double-underline': t => t.split('').map(c => c + '\u0333').join(''),
  'zalgo-light': t => t.split('').map(c => c + '\u0300\u0301').join(''),
  'zalgo-medium': t => t.split('').map(c => c + '\u0300\u0301\u0302\u0303').join(''),
  'zalgo-heavy': t => t.split('').map(c => {
    const marks = ['\u0300','\u0301','\u0302','\u0303','\u0304','\u0305','\u0306','\u0307','\u0308','\u0309','\u030A','\u030B','\u030C','\u030D','\u030E','\u030F'];
    return c + marks.slice(0, 5 + Math.floor(Math.random() * 5)).join('');
  }).join(''),
  'emoji-text': t => t.split('').map(c => {
    if (c >= 'a' && c <= 'z') return String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 97);
    if (c >= 'A' && c <= 'Z') return String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65);
    return c;
  }).join(''),
  'spaced-out': t => t.split('').join(' '),
  
  // === ENCODING/DECODING (121-145) ===
  'base64-encode': t => { try { return btoa(unescape(encodeURIComponent(t))); } catch { return 'Error encoding'; }},
  'base64-decode': t => { try { return decodeURIComponent(escape(atob(t))); } catch { return 'Invalid Base64'; }},
  'url-encode': t => encodeURIComponent(t),
  'url-decode': t => { try { return decodeURIComponent(t); } catch { return 'Invalid URL encoding'; }},
  'url-encode-full': t => encodeURI(t),
  'url-decode-full': t => { try { return decodeURI(t); } catch { return 'Invalid URI'; }},
  'hex-encode': t => t.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' '),
  'hex-decode': t => { try { return t.split(/\s+/).filter(Boolean).map(h => String.fromCharCode(parseInt(h, 16))).join(''); } catch { return 'Invalid Hex'; }},
  'binary-encode': t => t.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' '),
  'binary-decode': t => { try { return t.split(/\s+/).filter(Boolean).map(b => String.fromCharCode(parseInt(b, 2))).join(''); } catch { return 'Invalid Binary'; }},
  'octal-encode': t => t.split('').map(c => c.charCodeAt(0).toString(8).padStart(3, '0')).join(' '),
  'octal-decode': t => { try { return t.split(/\s+/).filter(Boolean).map(o => String.fromCharCode(parseInt(o, 8))).join(''); } catch { return 'Invalid Octal'; }},
  'decimal-encode': t => t.split('').map(c => c.charCodeAt(0).toString()).join(' '),
  'decimal-decode': t => { try { return t.split(/\s+/).filter(Boolean).map(d => String.fromCharCode(parseInt(d))).join(''); } catch { return 'Invalid Decimal'; }},
  'morse-encode': t => t.toLowerCase().split('').map(c => UNICODE_MAPS.morse[c] || c).join(' '),
  'morse-decode': t => {
    const rev = Object.fromEntries(Object.entries(UNICODE_MAPS.morse).map(([k, v]) => [v, k]));
    return t.split(' ').map(m => rev[m] || m).join('');
  },
  'html-entities-encode': t => t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'),
  'html-entities-decode': t => t.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n))),
  'unicode-escape': t => t.split('').map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join(''),
  'unicode-unescape': t => t.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  'json-stringify': t => JSON.stringify(t),
  'json-parse': t => { try { return JSON.parse(t); } catch { return 'Invalid JSON string'; }},
  'punycode-encode': t => { try { return t.split('.').map(p => /[^\x00-\x7F]/.test(p) ? 'xn--' + p : p).join('.'); } catch { return t; }},
  'base32-encode': t => { 
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '', result = '';
    for (const c of t) bits += c.charCodeAt(0).toString(2).padStart(8, '0');
    while (bits.length % 5) bits += '0';
    for (let i = 0; i < bits.length; i += 5) result += alphabet[parseInt(bits.slice(i, i + 5), 2)];
    while (result.length % 8) result += '=';
    return result;
  },
  'ascii-to-text': t => t.split(/[\s,]+/).filter(Boolean).map(n => String.fromCharCode(parseInt(n))).join(''),
  
  // === CIPHERS (146-160) ===
  'rot13': t => caesarCipher(t, 13),
  'rot5': t => t.replace(/[0-9]/g, c => String.fromCharCode(((c.charCodeAt(0) - 48 + 5) % 10) + 48)),
  'rot47': t => t.replace(/[!-~]/g, c => String.fromCharCode(33 + ((c.charCodeAt(0) - 33 + 47) % 94))),
  'caesar-cipher-1': t => caesarCipher(t, 1),
  'caesar-cipher-3': t => caesarCipher(t, 3),
  'caesar-cipher-5': t => caesarCipher(t, 5),
  'caesar-cipher-7': t => caesarCipher(t, 7),
  'caesar-cipher-decrypt-1': t => caesarCipher(t, -1),
  'caesar-cipher-decrypt-3': t => caesarCipher(t, -3),
  'atbash-cipher': t => t.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(base + (25 - (c.charCodeAt(0) - base)));
  }),
  'vigenere-encrypt': t => vigenereCipher(t, 'secret'),
  'vigenere-decrypt': t => vigenereCipher(t, 'secret', true),
  'reverse-cipher': t => t.split('').reverse().join(''),
  'rail-fence-2': t => {
    const rails = ['', ''];
    t.split('').forEach((c, i) => rails[i % 2] += c);
    return rails.join('');
  },
  'pigpen-substitute': t => t.toLowerCase().replace(/[a-z]/g, c => {
    const pigpen = ['⊓','⊔','⊏','⊐','⊟','⊞','⊡','⊠','⊘','⋅⊓','⋅⊔','⋅⊏','⋅⊐','⋅⊟','⋅⊞','⋅⊡','⋅⊠','⋅⊘','△','▽','◁','▷','◇','⋅△','⋅▽','⋅◁'];
    return pigpen[c.charCodeAt(0) - 97] || c;
  }),
  
  // === MANIPULATION (161-180) ===
  'reverse-text': t => t.split('').reverse().join(''),
  'reverse-words': t => t.split(' ').reverse().join(' '),
  'reverse-lines': t => t.split('\n').reverse().join('\n'),
  'reverse-each-word': t => t.split(' ').map(w => w.split('').reverse().join('')).join(' '),
  'sort-lines-asc': t => t.split('\n').sort((a, b) => a.localeCompare(b)).join('\n'),
  'sort-lines-desc': t => t.split('\n').sort((a, b) => b.localeCompare(a)).join('\n'),
  'sort-words-asc': t => t.split(/\s+/).sort((a, b) => a.localeCompare(b)).join(' '),
  'sort-words-desc': t => t.split(/\s+/).sort((a, b) => b.localeCompare(a)).join(' '),
  'shuffle-lines': t => t.split('\n').sort(() => Math.random() - 0.5).join('\n'),
  'shuffle-words': t => t.split(/\s+/).sort(() => Math.random() - 0.5).join(' '),
  'shuffle-chars': t => t.split('').sort(() => Math.random() - 0.5).join(''),
  'remove-whitespace': t => t.replace(/\s+/g, ''),
  'normalize-whitespace': t => t.replace(/\s+/g, ' ').trim(),
  'remove-empty-lines': t => t.split('\n').filter(l => l.trim()).join('\n'),
  'remove-duplicate-lines': t => [...new Set(t.split('\n'))].join('\n'),
  'remove-duplicate-words': t => [...new Set(t.split(/\s+/))].join(' '),
  'trim-lines': t => t.split('\n').map(l => l.trim()).join('\n'),
  'remove-numbers': t => t.replace(/[0-9]/g, ''),
  'remove-letters': t => t.replace(/[a-zA-Z]/g, ''),
  'remove-punctuation': t => t.replace(/[^\w\s]/g, ''),
  
  // === EXTRACTION (181-192) ===
  'extract-emails': t => (t.match(/[\w.-]+@[\w.-]+\.\w+/g) || []).join('\n'),
  'extract-urls': t => (t.match(/https?:\/\/[^\s<>"]+/g) || []).join('\n'),
  'extract-numbers': t => (t.match(/-?\d+\.?\d*/g) || []).join('\n'),
  'extract-words': t => (t.match(/\b\w+\b/g) || []).join('\n'),
  'extract-sentences': t => (t.match(/[^.!?]+[.!?]+/g) || []).map(s => s.trim()).join('\n'),
  'extract-hashtags': t => (t.match(/#\w+/g) || []).join('\n'),
  'extract-mentions': t => (t.match(/@\w+/g) || []).join('\n'),
  'extract-phone-numbers': t => (t.match(/[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3,6}/g) || []).join('\n'),
  'extract-ip-addresses': t => (t.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || []).join('\n'),
  'extract-dates': t => (t.match(/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/g) || []).join('\n'),
  'word-frequency': t => {
    const words = t.toLowerCase().match(/\b\w+\b/g) || [];
    const freq: Record<string, number> = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([w, c]) => `${w}: ${c}`).join('\n');
  },
  'char-frequency': t => {
    const freq: Record<string, number> = {};
    t.split('').forEach(c => { if (c.trim()) freq[c] = (freq[c] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([c, n]) => `'${c}': ${n}`).join('\n');
  },

  // === SYMBOL SEPARATORS ===
  'exclamation-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '!').replace(/^!|!$/g, ''),
  'at-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '@').replace(/^@|@$/g, ''),
  'pipe-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '|').replace(/^\|||\$/g, ''),
  'colon-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, ':').replace(/^:|:$/g, ''),
  'period-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, ''),
  'double-hyphen': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '--').replace(/^--|--$/g, ''),
  'triple-underscore': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '___').replace(/^___|___$/g, ''),
  'tilde-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '~').replace(/^~|~$/g, ''),
  'plus-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '+').replace(/^\+|\+$/g, ''),
  'apostrophe-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, "'").replace(/^'|'$/g, ''),
  'comma-separated': t => t.split(/\s+/).join(', '),
  'semicolon-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, ';').replace(/^;|;$/g, ''),
  'currency-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '$').replace(/^\$|\$$/g, ''),
  'asterisk-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '*').replace(/^\*|\*$/g, ''),
  'question-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '?').replace(/^\?|\?$/g, ''),
  'backslash-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '\\').replace(/^\\|\\$/g, ''),
  'slash-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '/').replace(/^\/|\/$/g, ''),
  'double-colon': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '::').replace(/^::|::$/g, ''),
  'hash-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '#').replace(/^#|#$/g, ''),
  'caret-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '^').replace(/^\^|\^$/g, ''),
  'ampersand-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '&').replace(/^&|&$/g, ''),
  'equals-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '=').replace(/^=|=$/g, ''),
  'percent-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '%').replace(/^%|%$/g, ''),
  'underscore-case': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
  'space-separated': t => t.replace(/[^a-zA-Z0-9]+/g, ' ').trim(),
  'tab-separated': t => t.split(/\s+/).join('\t'),
  'newline-separated': t => t.split(/\s+/).join('\n'),

  // === ADDITIONAL WRAPPERS ===
  'triple-single-quotes': t => `'''${t}'''`,
  'triple-double-quotes': t => `"""${t}"""`,
  'double-angle-brackets': t => t.split('\n').map(l => `<<${l}>>`).join('\n'),
  'line-comment': t => t.split('\n').map(l => `// ${l}`).join('\n'),
  'block-comment': t => `/*\n${t}\n*/`,
  'grave-accent': t => t.split('\n').map(l => `\`${l}\``).join('\n'),
  'hashtag-wrap': t => t.split(/\s+/).map(w => `#${w}`).join(' '),
  'heading-md-4': t => `#### ${t}`,
  'heading-md-5': t => `##### ${t}`,
  'heading-md-6': t => `###### ${t}`,
  'bold-italic-md': t => `***${t}***`,
  'highlight-mark': t => `<mark>${t}</mark>`,

  // === FUN TEXT ===
  'mirror-text': t => t.split('').map(c => {
    const mirror: Record<string, string> = {a:'ɒ',b:'d',c:'ɔ',d:'b',e:'ɘ',f:'ꟻ',g:'ǫ',h:'ʜ',i:'i',j:'ꞁ',k:'ʞ',l:'l',m:'m',n:'ᴎ',o:'o',p:'q',q:'p',r:'ɿ',s:'ꙅ',t:'ƚ',u:'u',v:'v',w:'w',x:'x',y:'ʏ',z:'ꙃ'};
    return mirror[c.toLowerCase()] || c;
  }).reverse().join(''),
  'halfwidth': t => t.split('').map(c => {
    const code = c.charCodeAt(0);
    if (code >= 0xFF01 && code <= 0xFF5E) return String.fromCharCode(code - 0xFEE0);
    if (code === 0x3000) return ' ';
    return c;
  }).join(''),
  'bubble-text': (t, opts) => {
    const style = (opts?.style as string) || 'white';
    const map = style === 'black' 
      ? 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ'
      : '🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩';
    return t.split('').map(c => {
      if (c >= 'a' && c <= 'z') return map[c.charCodeAt(0) - 97];
      if (c >= 'A' && c <= 'Z') return map[c.charCodeAt(0) - 65];
      return c;
    }).join('');
  },
  'rotated-text': (t, opts) => {
    const angle = (opts?.angle as string) || '180';
    if (angle === '180') return applyUnicodeMap(t, UNICODE_MAPS.upsideDown).split('').reverse().join('');
    return t; // Basic implementation for 90/270
  },
  'emoji-case': (t, opts) => {
    const emojiSet = (opts?.emojiSet as string) || 'mixed';
    const faces = ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊'];
    const objects = ['⭐','🔥','💯','✨','🎉','🎊','💎','🌟','🎯','🚀'];
    const emojis = emojiSet === 'faces' ? faces : emojiSet === 'objects' ? objects : [...faces, ...objects];
    return t.split(' ').map(w => w + ' ' + emojis[Math.floor(Math.random() * emojis.length)]).join(' ');
  },
  'emoji-wrap': t => `✨ ${t} ✨`,
  'emoji-translator': t => t.replace(/love/gi, '❤️').replace(/happy/gi, '😊').replace(/sad/gi, '😢').replace(/yes/gi, '✅').replace(/no/gi, '❌').replace(/fire/gi, '🔥').replace(/cool/gi, '😎').replace(/star/gi, '⭐'),
  'clap-text': (t, opts) => {
    const sep = (opts?.separator as string) || '👏';
    const custom = (opts?.customSeparator as string) || '';
    const actual = sep === 'custom' && custom ? custom : sep;
    return t.split(/\s+/).join(` ${actual} `);
  },
  'sparkle-text': (t, opts) => {
    const emoji = (opts?.emoji as string) || '✨';
    return `${emoji} ${t.split(' ').join(` ${emoji} `)} ${emoji}`;
  },
  'spoiler-text': t => t.split('').map(() => '█').join(''),
  'leet-speak': t => t.replace(/a/gi, '4').replace(/e/gi, '3').replace(/i/gi, '1').replace(/o/gi, '0').replace(/s/gi, '5').replace(/t/gi, '7'),
  'pirate-speak': (t, opts) => {
    const dialect = (opts?.dialect as string) || 'classic';
    let result = t
      .replace(/\bmy\b/gi, 'me')
      .replace(/\byou\b/gi, 'ye')
      .replace(/\byour\b/gi, 'yer')
      .replace(/\bis\b/gi, 'be')
      .replace(/\bare\b/gi, 'be')
      .replace(/\bto\b/gi, "t'")
      .replace(/\bthe\b/gi, "th'")
      .replace(/\bfor\b/gi, 'fer')
      .replace(/\bhello\b/gi, 'ahoy')
      .replace(/\bfriend\b/gi, 'matey');
    if (dialect === 'comic') result += ' Arrr!';
    return result;
  },
  'uwu-speak': (t, opts) => {
    const cuteness = (opts?.cuteness as number) || 3;
    const addEmojis = opts?.emojis !== false;
    let result = t
      .replace(/r/g, 'w').replace(/R/g, 'W')
      .replace(/l/g, 'w').replace(/L/g, 'W')
      .replace(/th/g, 'd').replace(/Th/g, 'D')
      .replace(/ove/g, 'uv');
    if (cuteness >= 3) result = result.replace(/n([aeiou])/gi, 'ny$1');
    if (cuteness >= 4) result = result.replace(/[.!]$/g, '~');
    if (addEmojis && cuteness >= 2) result += ' uwu';
    if (addEmojis && cuteness >= 4) result += ' >w<';
    return result;
  },
  'yoda-speak': t => {
    const words = t.split(' ');
    if (words.length >= 3) {
      const last = words.pop();
      words.unshift(last!);
    }
    return words.join(' ') + ', hmm.';
  },
  'shakespearean': t => t
    .replace(/\byou\b/gi, 'thou')
    .replace(/\byour\b/gi, 'thy')
    .replace(/\byours\b/gi, 'thine')
    .replace(/\bare\b/gi, 'art')
    .replace(/\bis\b/gi, 'doth be')
    .replace(/\bdo\b/gi, 'dost')
    .replace(/\bhave\b/gi, 'hast')
    .replace(/\bwill\b/gi, 'shall'),
  'meme-caption': t => t.toUpperCase(),

  // === ADDITIONAL ENCODING ===
  'base32-decode': t => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    try {
      let bits = '';
      for (const c of t.replace(/=/g, '').toUpperCase()) {
        const idx = alphabet.indexOf(c);
        if (idx >= 0) bits += idx.toString(2).padStart(5, '0');
      }
      let result = '';
      for (let i = 0; i + 8 <= bits.length; i += 8) {
        result += String.fromCharCode(parseInt(bits.slice(i, i + 8), 2));
      }
      return result;
    } catch { return 'Invalid Base32'; }
  },
  'base58-encode': t => {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt(0);
    for (const c of t) num = num * BigInt(256) + BigInt(c.charCodeAt(0));
    let result = '';
    while (num > 0) { result = alphabet[Number(num % BigInt(58))] + result; num = num / BigInt(58); }
    return result || '1';
  },
  'base58-decode': t => {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    try {
      let num = BigInt(0);
      for (const c of t) { const idx = alphabet.indexOf(c); if (idx < 0) throw new Error(); num = num * BigInt(58) + BigInt(idx); }
      let result = '';
      while (num > 0) { result = String.fromCharCode(Number(num % BigInt(256))) + result; num = num / BigInt(256); }
      return result;
    } catch { return 'Invalid Base58'; }
  },
  'ascii-code': (t, opts) => {
    const format = (opts?.format as string) || 'decimal';
    return t.split('').map(c => {
      const code = c.charCodeAt(0);
      if (format === 'hex') return code.toString(16).padStart(2, '0');
      if (format === 'binary') return code.toString(2).padStart(8, '0');
      return code.toString();
    }).join(' ');
  },
  'nato-phonetic': t => {
    const nato: Record<string, string> = {a:'Alpha',b:'Bravo',c:'Charlie',d:'Delta',e:'Echo',f:'Foxtrot',g:'Golf',h:'Hotel',i:'India',j:'Juliet',k:'Kilo',l:'Lima',m:'Mike',n:'November',o:'Oscar',p:'Papa',q:'Quebec',r:'Romeo',s:'Sierra',t:'Tango',u:'Uniform',v:'Victor',w:'Whiskey',x:'Xray',y:'Yankee',z:'Zulu','0':'Zero','1':'One','2':'Two','3':'Three','4':'Four','5':'Five','6':'Six','7':'Seven','8':'Eight','9':'Nine'};
    return t.toLowerCase().split('').map(c => nato[c] || c).join(' ');
  },
  'braille': t => {
    const braille: Record<string, string> = {a:'⠁',b:'⠃',c:'⠉',d:'⠙',e:'⠑',f:'⠋',g:'⠛',h:'⠓',i:'⠊',j:'⠚',k:'⠅',l:'⠇',m:'⠍',n:'⠝',o:'⠕',p:'⠏',q:'⠟',r:'⠗',s:'⠎',t:'⠞',u:'⠥',v:'⠧',w:'⠺',x:'⠭',y:'⠽',z:'⠵',' ':'⠀'};
    return t.toLowerCase().split('').map(c => braille[c] || c).join('');
  },
  'pig-latin': t => t.split(/\s+/).map(word => {
    const lower = word.toLowerCase();
    const match = lower.match(/^([^aeiou]*)(.+)/);
    if (!match || !match[1] || !match[2]) return word + 'ay';
    return match[2] + match[1] + 'ay';
  }).join(' '),
  'json-escape': (t, opts) => {
    const strict = opts?.strict as boolean;
    let result = t.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
    if (strict) result = result.replace(/[\x00-\x1f]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
    return result;
  },
  'xml-escape': t => t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'),
  'tap-code': t => {
    const grid = 'abcdefghiklmnopqrstuvwxyz'; // no j
    return t.toLowerCase().replace(/j/g, 'i').split('').map(c => {
      const idx = grid.indexOf(c);
      if (idx < 0) return c;
      const row = Math.floor(idx / 5) + 1;
      const col = (idx % 5) + 1;
      return '.'.repeat(row) + ' ' + '.'.repeat(col);
    }).join('  ');
  },
  'url-slug': t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  'caesar-cipher': (t, opts) => {
    const shift = (opts?.shift as number) ?? 3;
    return caesarCipher(t, shift);
  },
  'caesar-bruteforce': (t, opts) => {
    const multi = opts?.multiOutput !== false;
    if (multi) {
      return Array.from({length: 26}, (_, i) => `Shift ${i}: ${caesarCipher(t, i)}`).join('\n');
    }
    return caesarCipher(t, 0);
  },

  // === ADDITIONAL CIPHERS ===
  'playfair-cipher': (t, opts) => {
    const key = ((opts?.key as string) || 'keyword').toLowerCase().replace(/[^a-z]/g, '');
    // Simplified Playfair - just return placeholder for complex cipher
    return `[Playfair cipher with key "${key}"] ${t}`;
  },
  'bacon-cipher': (t, opts) => {
    const variant = (opts?.variant as string) || 'ab';
    const a = variant === '01' ? '0' : 'a';
    const b = variant === '01' ? '1' : 'b';
    const bacon: Record<string, string> = {a:'aaaaa',b:'aaaab',c:'aaaba',d:'aaabb',e:'aabaa',f:'aabab',g:'aabba',h:'aabbb',i:'abaaa',j:'abaab',k:'ababa',l:'ababb',m:'abbaa',n:'abbab',o:'abbba',p:'abbbb',q:'baaaa',r:'baaab',s:'baaba',t:'baabb',u:'babaa',v:'babab',w:'babba',x:'babbb',y:'bbaaa',z:'bbaab'};
    return t.toLowerCase().split('').map(c => {
      const code = bacon[c];
      if (!code) return c;
      return code.replace(/a/g, a).replace(/b/g, b);
    }).join(' ');
  },
  'binary-to-hex': t => {
    try {
      return t.split(/\s+/).map(b => parseInt(b, 2).toString(16).padStart(2, '0')).join(' ');
    } catch { return 'Invalid Binary'; }
  },
  'hex-to-binary': t => {
    try {
      return t.split(/\s+/).map(h => parseInt(h, 16).toString(2).padStart(8, '0')).join(' ');
    } catch { return 'Invalid Hex'; }
  },
  'rail-fence-cipher': (t, opts) => {
    const rails = (opts?.rails as number) || 3;
    const fence: string[][] = Array.from({length: rails}, () => []);
    let rail = 0, direction = 1;
    for (const c of t) {
      const row = fence[rail];
      if (row) row.push(c);
      rail += direction;
      if (rail === 0 || rail === rails - 1) direction *= -1;
    }
    return fence.flat().join('');
  },

  // === ADDITIONAL MANIPULATION ===
  'remove-vowels': t => t.replace(/[aeiouAEIOU]/g, ''),
  'remove-consonants': t => t.replace(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g, ''),
  'remove-symbols': t => t.replace(/[^\w\s]/g, ''),
  'remove-leading-zeros': t => t.replace(/\b0+(\d)/g, '$1'),
  'keep-only-letters': t => t.replace(/[^a-zA-Z]/g, ''),
  'keep-only-numbers': t => t.replace(/[^0-9]/g, ''),
  'scramble-letters': (t, opts) => {
    const preserveEnds = opts?.preserveEnds !== false;
    return t.split(/\s+/).map(word => {
      if (word.length <= 3) return word;
      const chars = word.split('');
      if (preserveEnds) {
        const middle = chars.slice(1, -1).sort(() => Math.random() - 0.5);
        return chars[0] + middle.join('') + chars[chars.length - 1];
      }
      return chars.sort(() => Math.random() - 0.5).join('');
    }).join(' ');
  },
  'pick-random-line': (t, opts) => {
    const count = (opts?.count as number) || 1;
    const lines = t.split('\n').filter(l => l.trim());
    const picked: string[] = [];
    for (let i = 0; i < Math.min(count, lines.length); i++) {
      const idx = Math.floor(Math.random() * lines.length);
      const item = lines.splice(idx, 1)[0];
      if (item) picked.push(item);
    }
    return picked.join('\n');
  },
  'pad-lines': (t, opts) => {
    const target = (opts?.targetLength as number) || 40;
    const char = (opts?.padChar as string) || ' ';
    const align = (opts?.alignment as string) || 'left';
    return t.split('\n').map(line => {
      const pad = Math.max(0, target - line.length);
      if (align === 'right') return char.repeat(pad) + line;
      if (align === 'center') return char.repeat(Math.floor(pad / 2)) + line + char.repeat(Math.ceil(pad / 2));
      return line + char.repeat(pad);
    }).join('\n');
  },
  'line-length-normalizer': (t, opts) => {
    const target = (opts?.targetLength as number) || 80;
    const words = t.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      if (current.length + word.length + 1 <= target) {
        current = current ? current + ' ' + word : word;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines.join('\n');
  },
  'dedent-text': t => {
    const lines = t.split('\n');
    const minIndent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^\s*/)?.[0].length || 0));
    return lines.map(l => l.slice(minIndent)).join('\n');
  },
  'indent-text': (t, opts) => {
    const size = (opts?.size as number) || 2;
    const char = (opts?.char as string) === 'tab' ? '\t' : ' ';
    const indent = char.repeat(size);
    return t.split('\n').map(l => indent + l).join('\n');
  },
  'replace-line-breaks': t => t.replace(/\n/g, ' '),
  'split-by-length': (t, opts) => {
    const maxLen = (opts?.maxLength as number) || 80;
    const result: string[] = [];
    for (let i = 0; i < t.length; i += maxLen) {
      result.push(t.slice(i, i + maxLen));
    }
    return result.join('\n');
  },
  'zalgo-text': (t, opts) => {
    const intensity = (opts?.intensity as number) || 3;
    const up = opts?.up !== false;
    const mid = opts?.mid !== false;
    const down = opts?.down !== false;
    const upMarks = ['\u0300','\u0301','\u0302','\u0303','\u0304','\u0305','\u0306','\u0307','\u0308','\u0309','\u030A','\u030B','\u030C','\u030D','\u030E','\u030F'];
    const midMarks = ['\u0315','\u0316','\u0317','\u0318','\u0319','\u031A','\u031B','\u031C','\u031D','\u031E'];
    const downMarks = ['\u0316','\u0317','\u0318','\u0319','\u031C','\u031D','\u031E','\u031F','\u0320','\u0321','\u0322','\u0323','\u0324','\u0325','\u0326','\u0327'];
    return t.split('').map(c => {
      let result = c;
      const count = intensity * 2;
      if (up) for (let i = 0; i < count; i++) result += upMarks[Math.floor(Math.random() * upMarks.length)];
      if (mid) for (let i = 0; i < Math.floor(count / 2); i++) result += midMarks[Math.floor(Math.random() * midMarks.length)];
      if (down) for (let i = 0; i < count; i++) result += downMarks[Math.floor(Math.random() * downMarks.length)];
      return result;
    }).join('');
  },
};

// Helper to get transform with proper typing (supports options)
const getTransform = (id: string): ((t: string, opts?: Record<string, unknown>) => string) => {
  return textTransforms[id] || ((t: string) => t);
};

// ============== CATEGORY DEFINITIONS (260+ TOOLS) ==============
const converterCategories: ConverterCategory[] = [
  {
    id: 'case-converters',
    name: 'Case Converters',
    icon: <EditIcon />,
    color: 'text-yellow-500',
    tools: [
      { id: 'uppercase', name: 'UPPERCASE', transform: getTransform('uppercase') },
      { id: 'lowercase', name: 'lowercase', transform: getTransform('lowercase') },
      { id: 'sentence-case', name: 'Sentence case', transform: getTransform('sentence-case') },
      { id: 'capitalized-case', name: 'Capitalized Case', transform: getTransform('capitalized-case') },
      { id: 'title-case', name: 'Title Case', transform: getTransform('title-case') },
      { id: 'camelCase', name: 'camelCase', transform: getTransform('camelCase') },
      { id: 'PascalCase', name: 'PascalCase', transform: getTransform('PascalCase') },
      { id: 'snake_case', name: 'snake_case', transform: getTransform('snake_case') },
      { id: 'kebab-case', name: 'kebab-case', transform: getTransform('kebab-case') },
      { id: 'CONSTANT_CASE', name: 'CONSTANT_CASE', transform: getTransform('CONSTANT_CASE') },
      { id: 'screaming-snake-case', name: 'SCREAMING_SNAKE', transform: getTransform('screaming-snake-case') },
      { id: 'lower-dot-case', name: 'lower.dot.case', transform: getTransform('lower-dot-case') },
      { id: 'upper-dot-case', name: 'UPPER.DOT.CASE', transform: getTransform('upper-dot-case') },
      { id: 'path/case', name: 'path/case', transform: getTransform('path/case') },
      { id: 'path-slug-case', name: 'path/slug/case', transform: getTransform('path-slug-case') },
      { id: 'Train-Case', name: 'Train-Case', transform: getTransform('Train-Case') },
      { id: 'alternating-case', name: 'aLtErNaTiNg', transform: getTransform('alternating-case') },
      { id: 'inverse-case', name: 'AlTeRnAtInG', transform: getTransform('inverse-case') },
      { id: 'swap-case', name: 'Swap CASE', transform: getTransform('swap-case') },
      { id: 'random-case', name: 'RaNdOm CaSe', transform: getTransform('random-case'), hasOptions: true },
      { id: 'first-letter-uppercase', name: 'First Letter Upper', transform: getTransform('first-letter-uppercase') },
      { id: 'first-letter-lowercase', name: 'first Letter Lower', transform: getTransform('first-letter-lowercase') },
      { id: 'capitalize-words', name: 'Capitalize Words', transform: getTransform('capitalize-words') },
      { id: 'decapitalize-words', name: 'decapitalize words', transform: getTransform('decapitalize-words') },
      { id: 'capitalize-sentences', name: 'Capitalize Sentences', transform: getTransform('capitalize-sentences') },
      { id: 'spongebob-case', name: 'SpOnGeBoB cAsE', transform: getTransform('spongebob-case'), hasOptions: true },
      { id: 'studly-caps', name: 'StUdLy CaPs', transform: getTransform('studly-caps'), hasOptions: true },
      { id: 'flat-case', name: 'flatcase', transform: getTransform('flat-case') },
      { id: 'cobol-case', name: 'COBOL-CASE', transform: getTransform('cobol-case') },
      { id: 'ada-case', name: 'Ada_Case', transform: getTransform('ada-case') },
      { id: 'header-case', name: 'Header-Case', transform: getTransform('header-case') },
      { id: 'macro-case', name: 'MACRO_CASE', transform: getTransform('macro-case') },
      { id: 'humanized-case', name: 'Humanized case', transform: getTransform('humanized-case') },
      { id: 'machine-case', name: 'machine_case', transform: getTransform('machine-case') },
    ],
  },
  {
    id: 'symbol-separators',
    name: 'Symbol Separators',
    icon: <SymbolIcon />,
    color: 'text-cyan-400',
    tools: [
      { id: 'exclamation-case', name: 'exclamation!case', transform: getTransform('exclamation-case') },
      { id: 'at-case', name: 'at@case', transform: getTransform('at-case') },
      { id: 'pipe-case', name: 'pipe|case', transform: getTransform('pipe-case') },
      { id: 'colon-case', name: 'colon:case', transform: getTransform('colon-case') },
      { id: 'period-case', name: 'period.case', transform: getTransform('period-case') },
      { id: 'double-hyphen', name: 'double--hyphen', transform: getTransform('double-hyphen') },
      { id: 'triple-underscore', name: 'triple___underscore', transform: getTransform('triple-underscore') },
      { id: 'tilde-case', name: 'tilde~case', transform: getTransform('tilde-case') },
      { id: 'plus-case', name: 'plus+case', transform: getTransform('plus-case') },
      { id: 'apostrophe-case', name: "apostrophe'case", transform: getTransform('apostrophe-case') },
      { id: 'comma-separated', name: 'comma, separated', transform: getTransform('comma-separated') },
      { id: 'semicolon-case', name: 'semicolon;case', transform: getTransform('semicolon-case') },
      { id: 'currency-case', name: 'currency$case', transform: getTransform('currency-case') },
      { id: 'asterisk-case', name: 'asterisk*case', transform: getTransform('asterisk-case') },
      { id: 'question-case', name: 'question?case', transform: getTransform('question-case') },
      { id: 'backslash-case', name: 'backslash\\case', transform: getTransform('backslash-case') },
      { id: 'slash-case', name: 'slash/case', transform: getTransform('slash-case') },
      { id: 'double-colon', name: 'double::colon', transform: getTransform('double-colon') },
      { id: 'hash-case', name: 'hash#case', transform: getTransform('hash-case') },
      { id: 'caret-case', name: 'caret^case', transform: getTransform('caret-case') },
      { id: 'ampersand-case', name: 'ampersand&case', transform: getTransform('ampersand-case') },
      { id: 'equals-case', name: 'equals=case', transform: getTransform('equals-case') },
      { id: 'percent-case', name: 'percent%case', transform: getTransform('percent-case') },
      { id: 'underscore-case', name: 'underscore_case', transform: getTransform('underscore-case') },
      { id: 'space-separated', name: 'space separated', transform: getTransform('space-separated') },
      { id: 'tab-separated', name: 'tab\tseparated', transform: getTransform('tab-separated') },
      { id: 'newline-separated', name: 'newline\\nseparated', transform: getTransform('newline-separated') },
    ],
  },
  {
    id: 'wrappers',
    name: 'Wrappers & Formatters',
    icon: <WrapperIcon />,
    color: 'text-green-500',
    tools: [
      { id: 'wrap-backticks', name: '`Backticks`', transform: getTransform('wrap-backticks') },
      { id: 'wrap-single-quotes', name: "'Single Quotes'", transform: getTransform('wrap-single-quotes') },
      { id: 'wrap-double-quotes', name: '"Double Quotes"', transform: getTransform('wrap-double-quotes') },
      { id: 'triple-single-quotes', name: "'''Triple Single'''", transform: getTransform('triple-single-quotes') },
      { id: 'triple-double-quotes', name: '"""Triple Double"""', transform: getTransform('triple-double-quotes') },
      { id: 'wrap-curly-braces', name: '{Curly Braces}', transform: getTransform('wrap-curly-braces') },
      { id: 'wrap-square-brackets', name: '[Square Brackets]', transform: getTransform('wrap-square-brackets') },
      { id: 'wrap-parentheses', name: '(Parentheses)', transform: getTransform('wrap-parentheses') },
      { id: 'wrap-angle-brackets', name: '<Angle Brackets>', transform: getTransform('wrap-angle-brackets') },
      { id: 'double-angle-brackets', name: '<<Double Angle>>', transform: getTransform('double-angle-brackets') },
      { id: 'wrap-guillemets', name: '«Guillemets»', transform: getTransform('wrap-guillemets') },
      { id: 'wrap-html-tag', name: '<div>Tag</div>', transform: getTransform('wrap-html-tag'), hasOptions: true },
      { id: 'wrap-code-tag', name: '<code></code>', transform: getTransform('wrap-code-tag') },
      { id: 'wrap-pre-tag', name: '<pre></pre>', transform: getTransform('wrap-pre-tag') },
      { id: 'wrap-span-tag', name: '<span></span>', transform: getTransform('wrap-span-tag') },
      { id: 'wrap-p-tag', name: '<p></p>', transform: getTransform('wrap-p-tag') },
      { id: 'wrap-li-tag', name: '<li></li>', transform: getTransform('wrap-li-tag') },
      { id: 'wrap-ul-list', name: '<ul> List', transform: getTransform('wrap-ul-list') },
      { id: 'wrap-ol-list', name: '<ol> List', transform: getTransform('wrap-ol-list') },
      { id: 'line-comment', name: '// Line Comment', transform: getTransform('line-comment') },
      { id: 'block-comment', name: '/* Block Comment */', transform: getTransform('block-comment') },
      { id: 'prefix-each-line', name: '> Prefix Lines', transform: getTransform('prefix-each-line'), hasOptions: true },
      { id: 'suffix-each-line', name: 'Suffix Lines <', transform: getTransform('suffix-each-line'), hasOptions: true },
      { id: 'number-lines', name: '1. Number Lines', transform: getTransform('number-lines'), hasOptions: true },
      { id: 'bullet-list', name: '• Bullet List', transform: getTransform('bullet-list') },
      { id: 'checkbox-list', name: '☐ Checkbox List', transform: getTransform('checkbox-list') },
      { id: 'checked-list', name: '☑ Checked List', transform: getTransform('checked-list') },
      { id: 'arrow-list', name: '→ Arrow List', transform: getTransform('arrow-list') },
      { id: 'dash-list', name: '- Dash List', transform: getTransform('dash-list') },
      { id: 'asterisk-list', name: '* Asterisk List', transform: getTransform('asterisk-list') },
      { id: 'hashtag-wrap', name: '#Hashtag Wrap', transform: getTransform('hashtag-wrap') },
      { id: 'bold-html', name: '<b>Bold</b>', transform: getTransform('bold-html') },
      { id: 'italic-html', name: '<i>Italic</i>', transform: getTransform('italic-html') },
      { id: 'underline-html', name: '<u>Underline</u>', transform: getTransform('underline-html') },
      { id: 'strike-html', name: '<s>Strike</s>', transform: getTransform('strike-html') },
      { id: 'highlight-mark', name: '<mark>Highlight</mark>', transform: getTransform('highlight-mark') },
      { id: 'bold-md', name: '**Bold MD**', transform: getTransform('bold-md') },
      { id: 'italic-md', name: '*Italic MD*', transform: getTransform('italic-md') },
      { id: 'bold-italic-md', name: '***Bold Italic***', transform: getTransform('bold-italic-md') },
      { id: 'strikethrough-md', name: '~~Strike MD~~', transform: getTransform('strikethrough-md') },
      { id: 'inline-code-md', name: '`Inline Code`', transform: getTransform('inline-code-md') },
      { id: 'code-block-md', name: '```Code Block```', transform: getTransform('code-block-md'), hasOptions: true },
      { id: 'blockquote-md', name: '> Blockquote', transform: getTransform('blockquote-md') },
      { id: 'heading-md-1', name: '# Heading 1', transform: getTransform('heading-md-1') },
      { id: 'heading-md-2', name: '## Heading 2', transform: getTransform('heading-md-2') },
      { id: 'heading-md-3', name: '### Heading 3', transform: getTransform('heading-md-3') },
      { id: 'heading-md-4', name: '#### Heading 4', transform: getTransform('heading-md-4') },
      { id: 'heading-md-5', name: '##### Heading 5', transform: getTransform('heading-md-5') },
      { id: 'heading-md-6', name: '###### Heading 6', transform: getTransform('heading-md-6') },
    ],
  },
  {
    id: 'unicode-styles',
    name: 'Unicode Styles',
    icon: <UnicodeFontIcon />,
    color: 'text-purple-400',
    tools: [
      { id: 'small-caps', name: 'ꜱᴍᴀʟʟ ᴄᴀᴘꜱ', transform: getTransform('small-caps') },
      { id: 'superscript', name: 'ˢᵘᵖᵉʳˢᶜʳⁱᵖᵗ', transform: getTransform('superscript') },
      { id: 'subscript', name: 'ₛᵤᵦₛ꜀ᵣᵢₚₜ', transform: getTransform('subscript') },
      { id: 'fullwidth', name: 'Ｆｕｌｌｗｉｄｔｈ', transform: getTransform('fullwidth') },
      { id: 'halfwidth', name: 'Halfwidth', transform: getTransform('halfwidth') },
      { id: 'circled-letters', name: 'Ⓒⓘⓡⓒⓛⓔⓓ', transform: getTransform('circled-letters'), hasOptions: true },
      { id: 'squared-letters', name: '🅂🅀🅄🄰🅁🄴🄳', transform: getTransform('squared-letters'), hasOptions: true },
      { id: 'squared-filled', name: '🅂🆀🆄🅰🆁🅴🅳', transform: getTransform('squared-filled') },
      { id: 'bubble-text', name: '🅑🅤🅑🅑🅛🅔', transform: getTransform('bubble-text'), hasOptions: true },
      { id: 'parenthesized', name: '⒫⒜⒭⒠⒩⒮', transform: getTransform('parenthesized') },
      { id: 'upside-down', name: 'uʍop ǝpᴉsd∩', transform: getTransform('upside-down') },
      { id: 'mirror-text', name: 'ɿoɿɿiM', transform: getTransform('mirror-text') },
      { id: 'rotated-text', name: 'Rotated 180°', transform: getTransform('rotated-text'), hasOptions: true },
      { id: 'math-bold', name: '𝐁𝐨𝐥𝐝', transform: getTransform('math-bold') },
      { id: 'math-italic', name: '𝐼𝑡𝑎𝑙𝑖𝑐', transform: getTransform('math-italic') },
      { id: 'math-bold-italic', name: '𝑩𝒐𝒍𝒅 𝑰𝒕𝒂𝒍𝒊𝒄', transform: getTransform('math-bold-italic') },
      { id: 'math-sans', name: '𝖲𝖺𝗇𝗌', transform: getTransform('math-sans') },
      { id: 'math-sans-bold', name: '𝗦𝗮𝗻𝘀 𝗕𝗼𝗹𝗱', transform: getTransform('math-sans-bold') },
      { id: 'math-monospace', name: '𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎', transform: getTransform('math-monospace') },
      { id: 'math-script', name: '𝒮𝒸𝓇𝒾𝓅𝓉', transform: getTransform('math-script') },
      { id: 'math-script-bold', name: '𝓢𝓬𝓻𝓲𝓹𝓽 𝓑𝓸𝓵𝓭', transform: getTransform('math-script-bold') },
      { id: 'math-fraktur', name: '𝔉𝔯𝔞𝔨𝔱𝔲𝔯', transform: getTransform('math-fraktur') },
      { id: 'math-fraktur-bold', name: '𝕱𝖗𝖆𝖐𝖙𝖚𝖗 𝕭𝖔𝖑𝖉', transform: getTransform('math-fraktur-bold') },
      { id: 'math-double-struck', name: '𝔻𝕠𝕦𝕓𝕝𝕖', transform: getTransform('math-double-struck') },
      { id: 'strikethrough-unicode', name: 'S̶t̶r̶i̶k̶e̶', transform: getTransform('strikethrough-unicode') },
      { id: 'underline-unicode', name: 'U̲n̲d̲e̲r̲l̲i̲n̲e̲', transform: getTransform('underline-unicode') },
      { id: 'overline-unicode', name: 'O̅v̅e̅r̅l̅i̅n̅e̅', transform: getTransform('overline-unicode') },
      { id: 'double-underline', name: 'D̳o̳u̳b̳l̳e̳', transform: getTransform('double-underline') },
      { id: 'zalgo-text', name: 'Z̷̀̂a̶̛̋l̷̀̃g̶̈̀o̷̎̓', transform: getTransform('zalgo-text'), hasOptions: true },
      { id: 'emoji-text', name: '🇪🇲🇴🇯🇮', transform: getTransform('emoji-text') },
      { id: 'spaced-out', name: 'S p a c e d', transform: getTransform('spaced-out') },
    ],
  },
  {
    id: 'fun-text',
    name: 'Fun Text',
    icon: <FunTextIcon />,
    color: 'text-rose-400',
    tools: [
      { id: 'emoji-case', name: '😀 Emoji Case', transform: getTransform('emoji-case'), hasOptions: true },
      { id: 'emoji-wrap', name: '✨ Emoji Wrap ✨', transform: getTransform('emoji-wrap') },
      { id: 'emoji-translator', name: 'Emoji Translator', transform: getTransform('emoji-translator') },
      { id: 'clap-text', name: '👏 Clap 👏 Text', transform: getTransform('clap-text'), hasOptions: true },
      { id: 'sparkle-text', name: '✨ Sparkle ✨', transform: getTransform('sparkle-text'), hasOptions: true },
      { id: 'spoiler-text', name: '█████ Spoiler', transform: getTransform('spoiler-text') },
      { id: 'leet-speak', name: '1337 5P34K', transform: getTransform('leet-speak') },
      { id: 'pirate-speak', name: 'Pirate Speak', transform: getTransform('pirate-speak'), hasOptions: true },
      { id: 'uwu-speak', name: 'UwU Speak', transform: getTransform('uwu-speak'), hasOptions: true },
      { id: 'yoda-speak', name: 'Yoda Speak', transform: getTransform('yoda-speak') },
      { id: 'shakespearean', name: 'Shakespearean', transform: getTransform('shakespearean') },
      { id: 'meme-caption', name: 'MEME CAPTION', transform: getTransform('meme-caption') },
    ],
  },
  {
    id: 'encoding',
    name: 'Encoding & Decoding',
    icon: <SwapIcon />,
    color: 'text-blue-400',
    tools: [
      { id: 'base64-encode', name: 'Base64 Encode', transform: getTransform('base64-encode'), hasOptions: true },
      { id: 'base64-decode', name: 'Base64 Decode', transform: getTransform('base64-decode'), hasOptions: true },
      { id: 'base32-encode', name: 'Base32 Encode', transform: getTransform('base32-encode'), hasOptions: true },
      { id: 'base32-decode', name: 'Base32 Decode', transform: getTransform('base32-decode'), hasOptions: true },
      { id: 'base58-encode', name: 'Base58 Encode', transform: getTransform('base58-encode'), hasOptions: true },
      { id: 'base58-decode', name: 'Base58 Decode', transform: getTransform('base58-decode'), hasOptions: true },
      { id: 'url-encode', name: 'URL Encode', transform: getTransform('url-encode'), hasOptions: true },
      { id: 'url-decode', name: 'URL Decode', transform: getTransform('url-decode'), hasOptions: true },
      { id: 'url-encode-full', name: 'URI Encode', transform: getTransform('url-encode-full') },
      { id: 'url-decode-full', name: 'URI Decode', transform: getTransform('url-decode-full') },
      { id: 'url-slug', name: 'URL Slug', transform: getTransform('url-slug') },
      { id: 'hex-encode', name: 'Hex Encode', transform: getTransform('hex-encode'), hasOptions: true },
      { id: 'hex-decode', name: 'Hex Decode', transform: getTransform('hex-decode') },
      { id: 'binary-encode', name: 'Binary Encode', transform: getTransform('binary-encode'), hasOptions: true },
      { id: 'binary-decode', name: 'Binary Decode', transform: getTransform('binary-decode') },
      { id: 'binary-to-hex', name: 'Binary to Hex', transform: getTransform('binary-to-hex') },
      { id: 'hex-to-binary', name: 'Hex to Binary', transform: getTransform('hex-to-binary') },
      { id: 'octal-encode', name: 'Octal Encode', transform: getTransform('octal-encode'), hasOptions: true },
      { id: 'octal-decode', name: 'Octal Decode', transform: getTransform('octal-decode') },
      { id: 'decimal-encode', name: 'Decimal Encode', transform: getTransform('decimal-encode') },
      { id: 'decimal-decode', name: 'Decimal Decode', transform: getTransform('decimal-decode') },
      { id: 'ascii-code', name: 'ASCII Code', transform: getTransform('ascii-code'), hasOptions: true },
      { id: 'ascii-to-text', name: 'ASCII to Text', transform: getTransform('ascii-to-text') },
      { id: 'morse-encode', name: 'Morse Encode', transform: getTransform('morse-encode') },
      { id: 'morse-decode', name: 'Morse Decode', transform: getTransform('morse-decode') },
      { id: 'nato-phonetic', name: 'NATO Phonetic', transform: getTransform('nato-phonetic') },
      { id: 'braille', name: 'Braille', transform: getTransform('braille') },
      { id: 'tap-code', name: 'Tap Code', transform: getTransform('tap-code') },
      { id: 'pig-latin', name: 'Pig Latin', transform: getTransform('pig-latin') },
      { id: 'html-entities-encode', name: 'HTML Escape', transform: getTransform('html-entities-encode'), hasOptions: true },
      { id: 'html-entities-decode', name: 'HTML Unescape', transform: getTransform('html-entities-decode') },
      { id: 'xml-escape', name: 'XML Escape', transform: getTransform('xml-escape') },
      { id: 'unicode-escape', name: 'Unicode Escape', transform: getTransform('unicode-escape'), hasOptions: true },
      { id: 'unicode-unescape', name: 'Unicode Unescape', transform: getTransform('unicode-unescape') },
      { id: 'json-stringify', name: 'JSON Stringify', transform: getTransform('json-stringify') },
      { id: 'json-parse', name: 'JSON Parse', transform: getTransform('json-parse') },
      { id: 'json-escape', name: 'JSON Escape', transform: getTransform('json-escape'), hasOptions: true },
      { id: 'punycode-encode', name: 'Punycode Encode', transform: getTransform('punycode-encode') },
    ],
  },
  {
    id: 'ciphers',
    name: 'Ciphers & Encryption',
    icon: <LockIcon />,
    color: 'text-orange-400',
    tools: [
      { id: 'rot13', name: 'ROT13', transform: getTransform('rot13') },
      { id: 'rot5', name: 'ROT5 (Numbers)', transform: getTransform('rot5') },
      { id: 'rot47', name: 'ROT47', transform: getTransform('rot47') },
      { id: 'caesar-cipher', name: 'Caesar Cipher', transform: getTransform('caesar-cipher'), hasOptions: true },
      { id: 'caesar-bruteforce', name: 'Caesar Bruteforce', transform: getTransform('caesar-bruteforce'), hasOptions: true },
      { id: 'atbash-cipher', name: 'Atbash Cipher', transform: getTransform('atbash-cipher') },
      { id: 'vigenere-encrypt', name: 'Vigenère Encrypt', transform: getTransform('vigenere-encrypt'), hasOptions: true },
      { id: 'vigenere-decrypt', name: 'Vigenère Decrypt', transform: getTransform('vigenere-decrypt'), hasOptions: true },
      { id: 'playfair-cipher', name: 'Playfair Cipher', transform: getTransform('playfair-cipher'), hasOptions: true },
      { id: 'bacon-cipher', name: 'Bacon Cipher', transform: getTransform('bacon-cipher'), hasOptions: true },
      { id: 'rail-fence-cipher', name: 'Rail Fence Cipher', transform: getTransform('rail-fence-cipher'), hasOptions: true },
      { id: 'reverse-cipher', name: 'Reverse Cipher', transform: getTransform('reverse-cipher') },
      { id: 'pigpen-substitute', name: 'Pigpen Cipher', transform: getTransform('pigpen-substitute') },
    ],
  },
  {
    id: 'manipulation',
    name: 'Text Manipulation',
    icon: <ManipulationIcon />,
    color: 'text-teal-400',
    tools: [
      { id: 'reverse-text', name: 'Reverse Text', transform: getTransform('reverse-text') },
      { id: 'reverse-words', name: 'Reverse Words', transform: getTransform('reverse-words') },
      { id: 'reverse-lines', name: 'Reverse Lines', transform: getTransform('reverse-lines') },
      { id: 'reverse-each-word', name: 'Reverse Each Word', transform: getTransform('reverse-each-word') },
      { id: 'sort-lines-asc', name: 'Sort Lines A-Z', transform: getTransform('sort-lines-asc') },
      { id: 'sort-lines-desc', name: 'Sort Lines Z-A', transform: getTransform('sort-lines-desc') },
      { id: 'sort-words-asc', name: 'Sort Words A-Z', transform: getTransform('sort-words-asc') },
      { id: 'sort-words-desc', name: 'Sort Words Z-A', transform: getTransform('sort-words-desc') },
      { id: 'shuffle-lines', name: 'Shuffle Lines', transform: getTransform('shuffle-lines') },
      { id: 'shuffle-words', name: 'Shuffle Words', transform: getTransform('shuffle-words') },
      { id: 'shuffle-chars', name: 'Shuffle Characters', transform: getTransform('shuffle-chars'), hasOptions: true },
      { id: 'scramble-letters', name: 'Scramble Letters', transform: getTransform('scramble-letters'), hasOptions: true },
      { id: 'pick-random-line', name: 'Pick Random Line', transform: getTransform('pick-random-line'), hasOptions: true },
      { id: 'remove-whitespace', name: 'Remove Whitespace', transform: getTransform('remove-whitespace') },
      { id: 'normalize-whitespace', name: 'Normalize Spaces', transform: getTransform('normalize-whitespace') },
      { id: 'remove-empty-lines', name: 'Remove Empty Lines', transform: getTransform('remove-empty-lines') },
      { id: 'remove-duplicate-lines', name: 'Remove Dup Lines', transform: getTransform('remove-duplicate-lines') },
      { id: 'remove-duplicate-words', name: 'Remove Dup Words', transform: getTransform('remove-duplicate-words') },
      { id: 'trim-lines', name: 'Trim Lines', transform: getTransform('trim-lines') },
      { id: 'pad-lines', name: 'Pad Lines', transform: getTransform('pad-lines'), hasOptions: true },
      { id: 'indent-text', name: 'Indent Text', transform: getTransform('indent-text'), hasOptions: true },
      { id: 'dedent-text', name: 'Dedent Text', transform: getTransform('dedent-text') },
      { id: 'line-length-normalizer', name: 'Normalize Line Length', transform: getTransform('line-length-normalizer'), hasOptions: true },
      { id: 'split-by-length', name: 'Split by Length', transform: getTransform('split-by-length'), hasOptions: true },
      { id: 'replace-line-breaks', name: 'Replace Line Breaks', transform: getTransform('replace-line-breaks') },
      { id: 'remove-numbers', name: 'Remove Numbers', transform: getTransform('remove-numbers') },
      { id: 'remove-letters', name: 'Remove Letters', transform: getTransform('remove-letters') },
      { id: 'remove-punctuation', name: 'Remove Punctuation', transform: getTransform('remove-punctuation') },
      { id: 'remove-vowels', name: 'Remove Vowels', transform: getTransform('remove-vowels') },
      { id: 'remove-consonants', name: 'Remove Consonants', transform: getTransform('remove-consonants') },
      { id: 'remove-symbols', name: 'Remove Symbols', transform: getTransform('remove-symbols') },
      { id: 'remove-leading-zeros', name: 'Remove Leading Zeros', transform: getTransform('remove-leading-zeros') },
      { id: 'keep-only-letters', name: 'Keep Only Letters', transform: getTransform('keep-only-letters') },
      { id: 'keep-only-numbers', name: 'Keep Only Numbers', transform: getTransform('keep-only-numbers') },
    ],
  },
  {
    id: 'extraction',
    name: 'Text Extraction',
    icon: <ExtractIcon />,
    color: 'text-pink-400',
    tools: [
      { id: 'extract-emails', name: 'Extract Emails', transform: getTransform('extract-emails') },
      { id: 'extract-urls', name: 'Extract URLs', transform: getTransform('extract-urls') },
      { id: 'extract-numbers', name: 'Extract Numbers', transform: getTransform('extract-numbers') },
      { id: 'extract-words', name: 'Extract Words', transform: getTransform('extract-words') },
      { id: 'extract-sentences', name: 'Extract Sentences', transform: getTransform('extract-sentences') },
      { id: 'extract-hashtags', name: 'Extract #Hashtags', transform: getTransform('extract-hashtags') },
      { id: 'extract-mentions', name: 'Extract @Mentions', transform: getTransform('extract-mentions') },
      { id: 'extract-phone-numbers', name: 'Extract Phone #s', transform: getTransform('extract-phone-numbers') },
      { id: 'extract-ip-addresses', name: 'Extract IP Addresses', transform: getTransform('extract-ip-addresses') },
      { id: 'extract-dates', name: 'Extract Dates', transform: getTransform('extract-dates') },
      { id: 'word-frequency', name: 'Word Frequency', transform: getTransform('word-frequency') },
      { id: 'char-frequency', name: 'Char Frequency', transform: getTransform('char-frequency') },
    ],
  },
];

// ============== ANALYSIS BAR ==============
interface AnalysisBarProps {
  text: string;
  className?: string;
}

function AnalysisBar({ text, className }: AnalysisBarProps) {
  const chars = text.length;
  const words = text.split(/\s+/).filter(Boolean).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const lines = text.split('\n').length;
  const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  const isPalindrome = cleanText.length > 0 && cleanText === cleanText.split('').reverse().join('');

  return (
    <div className={cn('flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono px-1', className)}>
      <span className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Characters:</span>
        <strong className="text-foreground tabular-nums">{chars.toLocaleString()}</strong>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Words:</span>
        <strong className="text-foreground tabular-nums">{words.toLocaleString()}</strong>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Sentences:</span>
        <strong className="text-foreground tabular-nums">{sentences.toLocaleString()}</strong>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Lines:</span>
        <strong className="text-foreground tabular-nums">{lines.toLocaleString()}</strong>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Palindrome:</span>
        <strong className={cn('tabular-nums', isPalindrome ? 'text-green-500' : 'text-foreground')}>
          {isPalindrome ? 'Yes' : 'No'}
        </strong>
      </span>
    </div>
  );
}

// ============== CATEGORY SECTION (FAQ-STYLE ACCORDION) ==============
interface CategorySectionProps {
  category: ConverterCategory;
  onApply: (tool: ConverterTool) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function CategorySection({ category, onApply, isOpen, onToggle }: CategorySectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className={cn(category.color)}>{category.icon}</span>
          <span className="text-foreground font-medium">{category.name}</span>
          <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] text-muted-foreground font-mono">
            {category.tools.length} tools
          </span>
        </div>
        <span className={cn(
          'text-muted-foreground transition-transform duration-200',
          isOpen && 'rotate-180'
        )}>
          <ChevronDownIcon />
        </span>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-border bg-muted/30 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {category.tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onApply(tool)}
                className={cn(
                  "px-3 py-2 rounded bg-background border border-border hover:border-primary text-muted-foreground hover:text-foreground text-xs font-mono transition-all hover:bg-primary/10 text-left truncate flex items-center justify-between gap-1",
                  tool.hasOptions && "pr-2"
                )}
                title={tool.hasOptions ? `${tool.name} (has options)` : tool.name}
              >
                <span className="truncate">{tool.name}</span>
                {tool.hasOptions && <SettingsIcon />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============== TOOL OPTIONS POPUP ==============
interface ToolOptionsPopupProps {
  tool: ConverterTool;
  options: Record<string, unknown>;
  onApply: (opts: Record<string, unknown>) => void;
  onCancel: () => void;
}

function ToolOptionsPopup({ tool, options, onApply, onCancel }: ToolOptionsPopupProps) {
  const config = toolOptionsConfig[tool.id];
  const [localOpts, setLocalOpts] = React.useState<Record<string, unknown>>(() => {
    if (!config) return {};
    const initial: Record<string, unknown> = {};
    for (const opt of config) {
      initial[opt.id] = options[opt.id] ?? opt.default;
    }
    return initial;
  });

  if (!config) return null;

  const updateOption = (id: string, value: unknown) => {
    setLocalOpts(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{tool.name} Options</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <CloseIcon />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {config.map((opt) => (
            <div key={opt.id} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{opt.label}</label>
              {opt.type === 'select' && (
                <select
                  value={String(localOpts[opt.id] ?? opt.default)}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                  className="px-3 py-2 rounded border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {opt.values.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              )}
              {opt.type === 'integer' && (
                <input
                  type="number"
                  value={Number(localOpts[opt.id] ?? opt.default)}
                  onChange={(e) => updateOption(opt.id, parseInt(e.target.value, 10) || opt.default)}
                  min={opt.min}
                  max={opt.max}
                  className="px-3 py-2 rounded border border-border bg-muted text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
              {opt.type === 'slider' && (
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    value={Number(localOpts[opt.id] ?? opt.default)}
                    onChange={(e) => updateOption(opt.id, parseInt(e.target.value, 10))}
                    min={opt.min}
                    max={opt.max}
                    step={opt.step ?? 1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-muted-foreground w-10 text-right">
                    {localOpts[opt.id] as number}
                  </span>
                </div>
              )}
              {opt.type === 'text' && (
                <input
                  type="text"
                  value={String(localOpts[opt.id] ?? opt.default)}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                  placeholder={opt.placeholder}
                  className="px-3 py-2 rounded border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
              {opt.type === 'char' && (
                <input
                  type="text"
                  value={String(localOpts[opt.id] ?? opt.default)}
                  onChange={(e) => updateOption(opt.id, e.target.value.slice(-1) || opt.default)}
                  maxLength={1}
                  className="px-3 py-2 rounded border border-border bg-muted text-foreground text-sm font-mono w-16 text-center focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
              {opt.type === 'toggle' && (
                <button
                  type="button"
                  onClick={() => updateOption(opt.id, !localOpts[opt.id])}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    localOpts[opt.id] ? 'bg-foreground' : 'bg-muted border border-border'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform',
                    Boolean(localOpts[opt.id]) && 'translate-x-5'
                  )} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/50">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={() => onApply(localOpts)}>Apply Transform</Button>
        </div>
      </div>
    </div>
  );
}

// Helper to get/set options from localStorage
function getStoredOptions(toolId: string): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(`text-converter-opts-${toolId}`);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setStoredOptions(toolId: string, opts: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`text-converter-opts-${toolId}`, JSON.stringify(opts));
  } catch {
    // Ignore storage errors
  }
}

// ============== MAIN COMPONENT ==============
export interface TextConverterUnifiedProps {
  className?: string;
}

export function TextConverterUnified({ className }: TextConverterUnifiedProps) {
  // Original text (source of truth - never modified by transforms)
  const [originalText, setOriginalText] = React.useState('');
  // Converted text (result of transform on original)
  const [convertedText, setConvertedText] = React.useState('');
  // Track if any transform has been applied
  const [hasTransformed, setHasTransformed] = React.useState(false);
  // History for undo/redo (stores {original, converted} pairs)
  const [history, setHistory] = React.useState<Array<{original: string; converted: string}>>([{original: '', converted: ''}]);
  const [historyIndex, setHistoryIndex] = React.useState(0);
  // FAQ-style accordion: only one category open at a time
  const [openCategoryId, setOpenCategoryId] = React.useState<string | null>('case-converters');
  // Options popup state
  const [optionsPopupTool, setOptionsPopupTool] = React.useState<ConverterTool | null>(null);
  
  const { copy, copied } = useCopyToClipboard();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Total tool count
  const totalTools = converterCategories.reduce((sum, cat) => sum + cat.tools.length, 0);

  // Handle input change - updates original text and resets transform state
  const handleInputChange = React.useCallback((newText: string) => {
    setOriginalText(newText);
    setConvertedText(newText);
    setHasTransformed(false);
  }, []);

  // Apply transformation with optional options
  const applyTransformWithOpts = React.useCallback((tool: ConverterTool, opts?: Record<string, unknown>) => {
    if (!originalText.trim()) return;
    try {
      // Get the raw transform function that accepts options
      const transformFn = textTransforms[tool.id];
      const result = transformFn ? transformFn(originalText, opts) : tool.transform(originalText);
      setConvertedText(result);
      setHasTransformed(true);
      
      // Add to history
      const newHistory = [...history.slice(0, historyIndex + 1), { original: originalText, converted: result }];
      if (newHistory.length > 50) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } catch (error) {
      console.error('Transform error:', error);
    }
  }, [originalText, history, historyIndex]);

  // Handle tool click - show options popup if needed, otherwise apply directly
  const handleToolClick = React.useCallback((tool: ConverterTool) => {
    if (!originalText.trim()) return;
    
    if (tool.hasOptions && toolOptionsConfig[tool.id]) {
      setOptionsPopupTool(tool);
    } else {
      applyTransformWithOpts(tool);
    }
  }, [originalText, applyTransformWithOpts]);

  // Handle options popup apply
  const handleOptionsApply = React.useCallback((opts: Record<string, unknown>) => {
    if (!optionsPopupTool) return;
    setStoredOptions(optionsPopupTool.id, opts);
    applyTransformWithOpts(optionsPopupTool, opts);
    setOptionsPopupTool(null);
  }, [optionsPopupTool, applyTransformWithOpts]);

  // Handle options popup cancel
  const handleOptionsCancel = React.useCallback(() => {
    setOptionsPopupTool(null);
  }, []);

  // Reset to original text
  const resetToOriginal = React.useCallback(() => {
    setConvertedText(originalText);
    setHasTransformed(false);
  }, [originalText]);

  // Undo/Redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = React.useCallback(() => {
    if (canUndo) {
      const prev = history[historyIndex - 1]!;
      setHistoryIndex(historyIndex - 1);
      setOriginalText(prev.original);
      setConvertedText(prev.converted);
      setHasTransformed(prev.original !== prev.converted);
    }
  }, [canUndo, historyIndex, history]);

  const redo = React.useCallback(() => {
    if (canRedo) {
      const next = history[historyIndex + 1]!;
      setHistoryIndex(historyIndex + 1);
      setOriginalText(next.original);
      setConvertedText(next.converted);
      setHasTransformed(next.original !== next.converted);
    }
  }, [canRedo, historyIndex, history]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Download
  const handleDownload = () => {
    const blob = new Blob([convertedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear
  const handleClear = () => {
    setOriginalText('');
    setConvertedText('');
    setHasTransformed(false);
    textareaRef.current?.focus();
  };

  // Toggle category (FAQ style - only one open)
  const toggleCategory = (categoryId: string) => {
    setOpenCategoryId(openCategoryId === categoryId ? null : categoryId);
  };

  return (
    <div className={cn('w-full max-w-5xl mx-auto flex flex-col gap-6', className)}>
      {/* Header with tool count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Text Converter</h2>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-mono">
            {totalTools} tools
          </span>
        </div>
      </div>

      {/* Textarea Section */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
        <div className="p-6 md:p-8 flex flex-col gap-4">
          {/* Label with status */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">
              {hasTransformed ? 'Converted Result' : 'Input Text'}
            </label>
            {hasTransformed && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  Original stored in memory
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToOriginal}
                  className="gap-1.5 h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ResetIcon />
                  Reset
                </Button>
              </div>
            )}
          </div>

          {/* Single Textarea - shows input when typing, shows converted after transform */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={hasTransformed ? convertedText : originalText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Enter your text here to convert..."
              className={cn(
                "min-h-40 resize-y font-mono text-sm shadow-inner",
                hasTransformed 
                  ? "bg-background border-primary/30" 
                  : "bg-muted/50 border-border focus:border-primary"
              )}
              spellCheck={false}
            />
          </div>

          {/* Analysis Bar */}
          <AnalysisBar text={hasTransformed ? convertedText : originalText} className="text-muted-foreground" />

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => copy(convertedText)}
              disabled={!convertedText}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              Copy
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleDownload}
              disabled={!convertedText}
            >
              <DownloadIcon />
              Download
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleClear}
              disabled={!originalText && !convertedText}
            >
              <ClearIcon />
              Clear
            </Button>
            <div className="flex-1" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                className="h-7 px-2"
              >
                Undo
              </Button>
              <span>/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                className="h-7 px-2"
              >
                Redo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Converter Categories (FAQ-style accordion) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Select Conversion</h3>
          <span className="text-xs text-muted-foreground">
            {converterCategories.length} categories • Click to expand one at a time
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {converterCategories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              onApply={handleToolClick}
              isOpen={openCategoryId === category.id}
              onToggle={() => toggleCategory(category.id)}
            />
          ))}
        </div>
      </div>

      {/* Options Popup */}
      {optionsPopupTool && (
        <ToolOptionsPopup
          tool={optionsPopupTool}
          options={getStoredOptions(optionsPopupTool.id)}
          onApply={handleOptionsApply}
          onCancel={handleOptionsCancel}
        />
      )}

      {/* Help Text */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="font-semibold text-sm text-foreground mb-2">How to Use</h4>
        <ul className="list-disc list-inside text-muted-foreground text-xs space-y-1">
          <li>Enter or paste your text in the input area above.</li>
          <li>Your <strong>original text is always preserved</strong> - transforms never modify your input.</li>
          <li>Click any category to expand it (FAQ-style: only one open at a time).</li>
          <li>Click any transformation button to convert the <strong>original</strong> text.</li>
          <li>Tools with a gear icon (⚙) have configurable options - your settings are remembered.</li>
          <li>Click "Reset to Original" to clear the conversion and start fresh.</li>
          <li>Use Copy or Download to export the converted result.</li>
          <li>Press <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl+Z</kbd> to undo, <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl+Y</kbd> to redo.</li>
        </ul>
      </div>
    </div>
  );
}

export default TextConverterUnified;
