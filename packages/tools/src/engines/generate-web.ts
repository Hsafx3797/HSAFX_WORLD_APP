/**
 * Generate-Web Engine — Web-Specific Output Generation
 *
 * CSS generators, QR codes, SEO tools, lorem ipsum, meta-tags,
 * and other web convention formats (HTML, CSS, SVG, XML).
 *
 * Backend: Node.js (inline execution)
 */

import type { Engine, GenerateWebOptions, EngineInput, EngineResult, ValidationOutcome } from './types';
import { generateSlug } from '../generators';
import { generateLoremIpsum } from '../text';
import {
  generateMetaTags,
  generateSitemap,
  generateRobotsTxt,
  generateCanonicalUrl,
} from '../generators/seo';
import {
  generateLinearGradient,
  generateBoxShadow,
  generateBorderRadius,
  generateFilter,
  generateTransform,
  generateFlexbox,
  generateGrid,
  generateTextShadow,
} from '../generators/css';
import type { FlexboxOptions } from '../generators/css';
import { generateQrSvg, generateVcardQr } from '../generators/qr';

// ---------------------------------------------------------------------------
// Generator type registry
// ---------------------------------------------------------------------------

const WEB_TYPES = [
  'slug', 'lorem', 'quote', 'emoji',
  // CSS generators
  'gradient', 'box-shadow', 'border-radius', 'filter', 'transform', 'flexbox', 'grid',
  'clip-path', 'typography',
  // SEO generators
  'meta-tags', 'og-meta', 'sitemap', 'robots-txt', 'canonical-url', 'htaccess',
  // Output generators
  'placeholder-image', 'qr', 'vcard-qr',
] as const;

type GenerateWebType = typeof WEB_TYPES[number];

function runWebGenerator(type: GenerateWebType, options: Record<string, unknown> = {}): unknown {
  switch (type) {
    case 'slug':
      return generateSlug(options.length as number | undefined);
    case 'lorem':
      return generateLoremIpsum({
        type: 'paragraphs',
        count: (options.paragraphs as number | undefined) ?? 3,
      });

    // CSS generators
    case 'gradient':
      return generateLinearGradient(
        (options.stops as { color: string; position: number }[]) || [
          { color: '#ff6b6b', position: 0 },
          { color: '#4ecdc4', position: 50 },
          { color: '#45b7d1', position: 100 },
        ],
        (options.angle as number) ?? 135,
      );
    case 'box-shadow':
      return generateBoxShadow(
        (options.shadows as { offsetX: number; offsetY: number; blurRadius: number; spreadRadius: number; color: string; inset?: boolean }[]) || [
          { offsetX: 4, offsetY: 4, blurRadius: 8, spreadRadius: 0, color: 'rgba(0,0,0,0.2)' },
        ],
      );
    case 'border-radius':
      return generateBorderRadius({
        topLeft: (options.topLeft as number) ?? 8,
        topRight: (options.topRight as number) ?? 8,
        bottomRight: (options.bottomRight as number) ?? 8,
        bottomLeft: (options.bottomLeft as number) ?? 8,
        unit: (options.unit as 'px' | '%' | 'em' | 'rem') ?? 'px',
      });
    case 'filter':
      return generateFilter(
        (options as { blur?: number; brightness?: number; contrast?: number; grayscale?: number; saturate?: number; sepia?: number; hueRotate?: number }) || {
          blur: 2, brightness: 1.1, contrast: 1.2,
        },
      );
    case 'transform':
      return generateTransform(
        (options as { translateX?: number; translateY?: number; rotate?: number; scaleX?: number; scaleY?: number; skewX?: number; skewY?: number }) || {
          translateX: 10, translateY: 10, rotate: 45,
        },
        (options.unit as string) ?? 'px',
      );
    case 'flexbox':
      return generateFlexbox({
        display: 'flex',
        flexDirection: (options.flexDirection as FlexboxOptions['flexDirection']) ?? 'row',
        justifyContent: (options.justifyContent as FlexboxOptions['justifyContent']) ?? 'center',
        alignItems: (options.alignItems as FlexboxOptions['alignItems']) ?? 'center',
        gap: (options.gap as string) ?? '1rem',
      });
    case 'grid':
      return generateGrid({
        display: 'grid',
        gridTemplateColumns: (options.columns as string) ?? '1fr 1fr 1fr',
        gridTemplateRows: (options.rows as string) ?? 'auto',
        gap: (options.gap as string) ?? '1rem',
      });

    // SEO generators
    case 'meta-tags':
    case 'og-meta':
      return generateMetaTags({
        title: (options.title as string) || 'My Page Title',
        description: (options.description as string) || 'A description of the page content.',
        keywords: (options.keywords as string[]) || ['example', 'page'],
        canonical: (options.canonical as string) || undefined,
        ogImage: (options.ogImage as string) || undefined,
        ogUrl: (options.ogUrl as string) || undefined,
        twitterCard: (options.twitterCard as 'summary') || undefined,
        twitterSite: (options.twitterSite as string) || undefined,
      });
    case 'sitemap':
      return generateSitemap(
        ((options.urls as { url?: string; loc?: string; lastmod?: string; changefreq?: string; priority?: number }[]) || [
          { loc: 'https://example.com/', changefreq: 'daily', priority: 1.0 },
          { loc: 'https://example.com/about', changefreq: 'monthly', priority: 0.8 },
        ]).map(u => ({ ...u, loc: u.loc || u.url || '' })) as { loc: string; lastmod?: string; changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'; priority?: number }[],
      );
    case 'robots-txt':
      return generateRobotsTxt(
        (options.rules as { userAgent: string; allow?: string[]; disallow?: string[] }[]) || [
          { userAgent: '*', allow: ['/'], disallow: ['/admin', '/private'] },
        ],
        options.sitemapUrl as string | undefined,
      );
    case 'canonical-url':
      return generateCanonicalUrl(
        (options.url as string) || 'https://example.com/page',
        '',
        {
          removeTrailingSlash: (options.removeTrailingSlash as boolean) ?? true,
        },
      );
    case 'htaccess':
      return generateHtaccess(options);

    case 'quote': {
      const category = (options.category as string) || 'all';
      return generateQuote(category);
    }
    case 'emoji': {
      const search = (options.search as string) || '';
      const count = (options.count as number) || 10;
      return pickEmojis(search, count);
    }
    case 'clip-path': {
      const shape = (options.shape as string) || 'polygon';
      return generateClipPath(shape, options);
    }
    case 'typography': {
      return generateTypography(options);
    }
    case 'placeholder-image': {
      const w = (options.width as number) || 300;
      const h = (options.height as number) || 200;
      const bg = (options.bgColor as string) || '#cccccc';
      const fg = (options.textColor as string) || '#666666';
      const text = (options.text as string) || `${w}×${h}`;
      return [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
        `  <rect fill="${bg}" width="${w}" height="${h}"/>`,
        `  <text fill="${fg}" font-family="Arial,sans-serif" font-size="${Math.min(w, h) / 8}" text-anchor="middle" dominant-baseline="central" x="${w / 2}" y="${h / 2}">${text}</text>`,
        `</svg>`,
      ].join('\n');
    }
    case 'qr': {
      const qrText = (options.text as string) || (typeof options.input === 'string' ? options.input : 'https://example.com');
      const qrSize = (options.size as number) || 256;
      const qrFg = (options.fg as string) || '#000000';
      const qrBg = (options.bg as string) || '#ffffff';
      return generateQrSvg(qrText, { size: qrSize, fg: qrFg, bg: qrBg });
    }
    case 'vcard-qr': {
      const name = (options.name as string) || 'John Doe';
      const email = options.email as string | undefined;
      const phone = options.phone as string | undefined;
      const org = options.org as string | undefined;
      const title = options.title as string | undefined;
      const url = options.url as string | undefined;
      const vcardSize = (options.size as number) || 256;
      return generateVcardQr({ name, email, phone, org, title, url }, { size: vcardSize });
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function generateHtaccess(options: Record<string, unknown>): string {
  const lines: string[] = [];
  if (options.forceHttps !== false) {
    lines.push('RewriteEngine On', 'RewriteCond %{HTTPS} off', 'RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]', '');
  }
  if (options.removeWww) {
    lines.push('RewriteCond %{HTTP_HOST} ^www\\.(.+)$', 'RewriteRule ^(.*)$ https://%1/$1 [L,R=301]', '');
  }
  if (options.gzip !== false) {
    lines.push('<IfModule mod_deflate.c>', '  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json', '</IfModule>', '');
  }
  if (options.cacheControl !== false) {
    lines.push('<IfModule mod_expires.c>', '  ExpiresActive On', '  ExpiresByType text/css "access plus 1 month"', '  ExpiresByType application/javascript "access plus 1 month"', '  ExpiresByType image/png "access plus 1 year"', '  ExpiresByType image/jpeg "access plus 1 year"', '</IfModule>', '');
  }
  lines.push('# Security Headers', 'Header set X-Content-Type-Options "nosniff"', 'Header set X-Frame-Options "SAMEORIGIN"', 'Header set X-XSS-Protection "1; mode=block"');
  return lines.join('\n');
}

const QUOTES: { text: string; author: string; category: string }[] = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'inspirational' },
  { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs', category: 'inspirational' },
  { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs', category: 'inspirational' },
  { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb', category: 'inspirational' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', category: 'inspirational' },
  { text: 'Everything you can imagine is real.', author: 'Pablo Picasso', category: 'inspirational' },
  { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt', category: 'inspirational' },
  { text: 'What you get by achieving your goals is not as important as what you become by achieving your goals.', author: 'Zig Ziglar', category: 'inspirational' },
  { text: 'Any sufficiently advanced technology is indistinguishable from magic.', author: 'Arthur C. Clarke', category: 'technology' },
  { text: 'The computer was born to solve problems that did not exist before.', author: 'Bill Gates', category: 'technology' },
  { text: 'Talk is cheap. Show me the code.', author: 'Linus Torvalds', category: 'technology' },
  { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson', category: 'technology' },
  { text: 'Code is like humor. When you have to explain it, it\'s bad.', author: 'Cory House', category: 'technology' },
  { text: 'Programs must be written for people to read, and only incidentally for machines to execute.', author: 'Harold Abelson', category: 'technology' },
  { text: 'Simplicity is the soul of efficiency.', author: 'Austin Freeman', category: 'technology' },
  { text: 'Measuring programming progress by lines of code is like measuring aircraft building progress by weight.', author: 'Bill Gates', category: 'technology' },
  { text: 'I think, therefore I am.', author: 'René Descartes', category: 'philosophy' },
  { text: 'The unexamined life is not worth living.', author: 'Socrates', category: 'philosophy' },
  { text: 'He who has a why to live can bear almost any how.', author: 'Friedrich Nietzsche', category: 'philosophy' },
  { text: 'Happiness is not something ready made. It comes from your own actions.', author: 'Dalai Lama', category: 'philosophy' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle', category: 'philosophy' },
  { text: 'The only true wisdom is in knowing you know nothing.', author: 'Socrates', category: 'philosophy' },
  { text: 'Imagination is more important than knowledge.', author: 'Albert Einstein', category: 'science' },
  { text: 'The important thing is not to stop questioning.', author: 'Albert Einstein', category: 'science' },
  { text: 'If I have seen further it is by standing on the shoulders of Giants.', author: 'Isaac Newton', category: 'science' },
  { text: 'Nothing in life is to be feared, it is only to be understood.', author: 'Marie Curie', category: 'science' },
  { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney', category: 'business' },
  { text: 'Your time is limited, don\'t waste it living someone else\'s life.', author: 'Steve Jobs', category: 'business' },
  { text: 'If you really look closely, most overnight successes took a long time.', author: 'Steve Jobs', category: 'business' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain', category: 'business' },
];

function generateQuote(category: string): string {
  const pool = category === 'all' ? QUOTES : QUOTES.filter(q => q.category === category);
  const q = pool[Math.floor(Math.random() * pool.length)] || QUOTES[0];
  return `"${q.text}"\n— ${q.author}`;
}

const EMOJI_DATA: { emoji: string; name: string; category: string }[] = [
  { emoji: '😀', name: 'grinning face', category: 'smileys' },
  { emoji: '😂', name: 'face with tears of joy', category: 'smileys' },
  { emoji: '🥹', name: 'face holding back tears', category: 'smileys' },
  { emoji: '😊', name: 'smiling face with smiling eyes', category: 'smileys' },
  { emoji: '😍', name: 'smiling face with heart-eyes', category: 'smileys' },
  { emoji: '🤔', name: 'thinking face', category: 'smileys' },
  { emoji: '😎', name: 'smiling face with sunglasses', category: 'smileys' },
  { emoji: '🥳', name: 'partying face', category: 'smileys' },
  { emoji: '😱', name: 'face screaming in fear', category: 'smileys' },
  { emoji: '🤯', name: 'exploding head', category: 'smileys' },
  { emoji: '👍', name: 'thumbs up', category: 'gestures' },
  { emoji: '👎', name: 'thumbs down', category: 'gestures' },
  { emoji: '👏', name: 'clapping hands', category: 'gestures' },
  { emoji: '🙌', name: 'raising hands', category: 'gestures' },
  { emoji: '🤝', name: 'handshake', category: 'gestures' },
  { emoji: '✌️', name: 'victory hand', category: 'gestures' },
  { emoji: '🤞', name: 'crossed fingers', category: 'gestures' },
  { emoji: '💪', name: 'flexed biceps', category: 'gestures' },
  { emoji: '❤️', name: 'red heart', category: 'symbols' },
  { emoji: '💔', name: 'broken heart', category: 'symbols' },
  { emoji: '⭐', name: 'star', category: 'symbols' },
  { emoji: '🔥', name: 'fire', category: 'symbols' },
  { emoji: '✨', name: 'sparkles', category: 'symbols' },
  { emoji: '💯', name: 'hundred points', category: 'symbols' },
  { emoji: '⚡', name: 'high voltage', category: 'symbols' },
  { emoji: '🎯', name: 'direct hit', category: 'symbols' },
  { emoji: '✅', name: 'check mark button', category: 'symbols' },
  { emoji: '❌', name: 'cross mark', category: 'symbols' },
  { emoji: '🌍', name: 'globe europe-africa', category: 'nature' },
  { emoji: '🌞', name: 'sun with face', category: 'nature' },
  { emoji: '🌙', name: 'crescent moon', category: 'nature' },
  { emoji: '🌈', name: 'rainbow', category: 'nature' },
  { emoji: '🌸', name: 'cherry blossom', category: 'nature' },
  { emoji: '🍀', name: 'four leaf clover', category: 'nature' },
  { emoji: '💻', name: 'laptop', category: 'objects' },
  { emoji: '📱', name: 'mobile phone', category: 'objects' },
  { emoji: '⌨️', name: 'keyboard', category: 'objects' },
  { emoji: '🖥️', name: 'desktop computer', category: 'objects' },
  { emoji: '🔑', name: 'key', category: 'objects' },
  { emoji: '📧', name: 'e-mail', category: 'objects' },
  { emoji: '📝', name: 'memo', category: 'objects' },
  { emoji: '🗑️', name: 'wastebasket', category: 'objects' },
  { emoji: '🍕', name: 'pizza', category: 'food' },
  { emoji: '🍔', name: 'hamburger', category: 'food' },
  { emoji: '☕', name: 'hot beverage', category: 'food' },
  { emoji: '🍎', name: 'red apple', category: 'food' },
  { emoji: '🎂', name: 'birthday cake', category: 'food' },
  { emoji: '🏁', name: 'chequered flag', category: 'flags' },
  { emoji: '🚩', name: 'triangular flag', category: 'flags' },
  { emoji: '🏳️', name: 'white flag', category: 'flags' },
];

function pickEmojis(search: string, count: number): string {
  let pool = EMOJI_DATA;
  if (search) {
    const q = search.toLowerCase();
    pool = EMOJI_DATA.filter(e => e.name.includes(q) || e.category.includes(q));
  }
  if (pool.length === 0) return 'No matching emojis found.';
  const results: string[] = [];
  const used = new Set<number>();
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    let idx: number;
    do { idx = Math.floor(Math.random() * pool.length); } while (used.has(idx) && used.size < pool.length);
    used.add(idx);
    results.push(`${pool[idx].emoji}  ${pool[idx].name}`);
  }
  return results.join('\n');
}

function generateClipPath(shape: string, options: Record<string, unknown>): string {
  switch (shape) {
    case 'circle': {
      const r = (options.radius as string) || '50%';
      const pos = (options.position as string) || '50% 50%';
      return `clip-path: circle(${r} at ${pos});`;
    }
    case 'ellipse': {
      const rx = (options.radiusX as string) || '50%';
      const ry = (options.radiusY as string) || '40%';
      const pos = (options.position as string) || '50% 50%';
      return `clip-path: ellipse(${rx} ${ry} at ${pos});`;
    }
    case 'inset': {
      const top = (options.top as string) || '10%';
      const right = (options.right as string) || '10%';
      const bottom = (options.bottom as string) || '10%';
      const left = (options.left as string) || '10%';
      const round = options.borderRadius ? ` round ${options.borderRadius}` : '';
      return `clip-path: inset(${top} ${right} ${bottom} ${left}${round});`;
    }
    case 'triangle':
      return 'clip-path: polygon(50% 0%, 0% 100%, 100% 100%);';
    case 'star':
      return 'clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);';
    case 'hexagon':
      return 'clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);';
    case 'pentagon':
      return 'clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);';
    case 'arrow-right':
      return 'clip-path: polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%);';
    case 'cross':
      return 'clip-path: polygon(33% 0%, 67% 0%, 67% 33%, 100% 33%, 100% 67%, 67% 67%, 67% 100%, 33% 100%, 33% 67%, 0% 67%, 0% 33%, 33% 33%);';
    case 'polygon':
    default: {
      const points = (options.points as string) || '50% 0%, 100% 100%, 0% 100%';
      return `clip-path: polygon(${points});`;
    }
  }
}

function generateTypography(options: Record<string, unknown>): string {
  const lines: string[] = [];
  const fontFamily = (options.fontFamily as string) || "'Inter', 'Segoe UI', system-ui, sans-serif";
  const fontSize = (options.fontSize as string) || '16px';
  const fontWeight = (options.fontWeight as string | number) || 400;
  const lineHeight = (options.lineHeight as string | number) || 1.6;
  const letterSpacing = (options.letterSpacing as string) || 'normal';
  const color = (options.color as string) || '#333333';
  const textAlign = (options.textAlign as string) || 'left';

  lines.push(`font-family: ${fontFamily};`);
  lines.push(`font-size: ${fontSize};`);
  lines.push(`font-weight: ${fontWeight};`);
  lines.push(`line-height: ${lineHeight};`);
  if (letterSpacing !== 'normal') lines.push(`letter-spacing: ${letterSpacing};`);
  lines.push(`color: ${color};`);
  if (textAlign !== 'left') lines.push(`text-align: ${textAlign};`);

  if (options.textShadow) {
    const ts = options.textShadow as { offsetX: number; offsetY: number; blurRadius: number; color: string }[];
    const shadow = generateTextShadow(ts);
    lines.push(shadow);
  }

  if (options.textDecoration) lines.push(`text-decoration: ${options.textDecoration};`);
  if (options.textTransform) lines.push(`text-transform: ${options.textTransform};`);
  if (options.wordSpacing) lines.push(`word-spacing: ${options.wordSpacing};`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const generateWebEngine: Engine<GenerateWebOptions> = {
  name: 'generate-web',
  description: 'Generate web content — CSS, QR codes, SEO tools, lorem ipsum, meta-tags, placeholders.',

  validate(options: GenerateWebOptions): ValidationOutcome {
    const errors: string[] = [];
    if (!WEB_TYPES.includes(options.type as GenerateWebType)) {
      errors.push(`Unknown generator type "${options.type}". Available: ${WEB_TYPES.join(', ')}`);
    }
    if (options.count !== undefined && (options.count < 1 || options.count > 100)) {
      errors.push('count must be between 1 and 100');
    }
    return errors.length ? { valid: false, errors } : { valid: true };
  },

  execute(_input: EngineInput, options: GenerateWebOptions): EngineResult {
    const count = options.count ?? 1;
    const results: unknown[] = [];
    for (let i = 0; i < count; i++) {
      results.push(runWebGenerator(options.type as GenerateWebType, options.options));
    }

    if (count === 1) {
      const val = results[0];
      if (typeof val === 'string') {
        return { output: val, metadata: { type: options.type, count } };
      }
      return {
        output: JSON.stringify(val, null, 2),
        metadata: { type: options.type, count },
      };
    }

    if (results.every(r => typeof r === 'string')) {
      return { output: (results as string[]).join('\n'), metadata: { type: options.type, count } };
    }
    return {
      output: JSON.stringify(results, null, 2),
      metadata: { type: options.type, count },
    };
  },
};
