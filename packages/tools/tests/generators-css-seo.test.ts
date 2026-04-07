import { describe, it, expect } from 'vitest';
import { writeOutput } from './helpers';
import {
  tailwindToCss,
  cssToObject,
  objectToCss,
  generateClipPath,
  generateTypography,
} from '../src/generators/web-css';
import {
  generateHtaccess,
  generateCanonicalTag,
  generateSeoSlug,
  generateStructuredData,
  generateOpenGraphArticle,
  generateCanonicalVariations,
  analyzeSeo,
  generateSecurityTxt,
  generateHumansTxt,
} from '../src/generators/web-seo';

// =============================================
// CSS GENERATORS
// =============================================

describe('tailwindToCss', () => {
  it('converts Tailwind classes to CSS properties', () => {
    const css = tailwindToCss('p-4 m-2 text-center bg-blue-500 rounded-lg');
    writeOutput('generators-css', 'tailwind-to-css.json', JSON.stringify(css, null, 2));
    expect(typeof css).toBe('object');
    expect(Object.keys(css).length).toBeGreaterThan(0);
  });

  it('handles flex and grid utilities', () => {
    const css = tailwindToCss('flex items-center justify-between gap-4');
    expect(typeof css).toBe('object');
  });
});

describe('cssToObject', () => {
  it('parses CSS string to key-value object', () => {
    const obj = cssToObject('color: red; font-size: 16px; margin: 0 auto;');
    writeOutput('generators-css', 'css-to-object.json', JSON.stringify(obj, null, 2));
    expect(obj).toHaveProperty('color', 'red');
    expect(obj).toHaveProperty('font-size', '16px');
  });

  it('handles shorthand properties', () => {
    const obj = cssToObject('padding: 10px 20px; border: 1px solid black;');
    expect(obj).toHaveProperty('padding');
    expect(obj).toHaveProperty('border');
  });
});

describe('objectToCss', () => {
  it('converts object back to CSS string', () => {
    const css = objectToCss({ color: 'red', 'font-size': '16px', margin: '0 auto' });
    writeOutput('generators-css', 'object-to-css.txt', css);
    expect(css).toContain('color');
    expect(css).toContain('red');
    expect(css).toContain('font-size');
  });

  it('roundtrips with cssToObject', () => {
    const original = { color: 'blue', padding: '10px' };
    const css = objectToCss(original);
    const parsed = cssToObject(css);
    expect(parsed.color).toBe('blue');
    expect(parsed.padding).toBe('10px');
  });
});

describe('generateClipPath', () => {
  it('generates clip-path for polygon', () => {
    const clipPath = generateClipPath('polygon', [
      [0, 0], [100, 0], [100, 100], [0, 100],
    ]);
    writeOutput('generators-css', 'clip-path-polygon.txt', clipPath);
    expect(clipPath).toContain('polygon');
  });

  it('generates clip-path for circle', () => {
    const clipPath = generateClipPath('circle');
    writeOutput('generators-css', 'clip-path-circle.txt', clipPath);
    expect(clipPath).toContain('circle');
  });

  it('generates clip-path for ellipse', () => {
    const clipPath = generateClipPath('ellipse');
    expect(clipPath).toContain('ellipse');
  });
});

describe('generateTypography', () => {
  it('generates typography CSS with all options', () => {
    const css = generateTypography({
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0.02em',
      textTransform: 'none',
      textAlign: 'left',
      color: '#333',
    });
    writeOutput('generators-css', 'typography-full.txt', css);
    expect(css).toContain('font-family');
    expect(css).toContain('font-size');
    expect(css).toContain('Inter');
  });

  it('generates typography with minimal options', () => {
    const css = generateTypography({ fontSize: '14px' });
    expect(css).toContain('font-size');
  });
});

// =============================================
// SEO GENERATORS
// =============================================

describe('generateHtaccess', () => {
  it('generates .htaccess with HTTPS and caching', () => {
    const htaccess = generateHtaccess({
      forceHttps: true,
      forceWww: true,
      gzipEnabled: true,
      browserCaching: true,
    });
    writeOutput('generators-seo', 'htaccess-full.txt', htaccess);
    expect(htaccess).toContain('RewriteEngine');
  });

  it('generates .htaccess with custom redirects', () => {
    const htaccess = generateHtaccess({
      customRedirects: [
        { from: '/old-page', to: '/new-page', type: 301 },
        { from: '/temp', to: '/current', type: 302 },
      ],
    });
    writeOutput('generators-seo', 'htaccess-redirects.txt', htaccess);
    expect(htaccess).toContain('Redirect');
  });
});

describe('generateCanonicalTag', () => {
  it('generates canonical link tag', () => {
    const tag = generateCanonicalTag('https://example.com/page');
    writeOutput('generators-seo', 'canonical-tag.html', tag);
    expect(tag).toContain('canonical');
    expect(tag).toContain('https://example.com/page');
  });
});

describe('generateSeoSlug', () => {
  it('generates SEO-friendly slug', () => {
    const slug = generateSeoSlug('Hello World! This Is a Test Page');
    writeOutput('generators-seo', 'seo-slug.txt', slug);
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slug).not.toContain(' ');
  });

  it('handles special characters', () => {
    const slug = generateSeoSlug('Café & Restaurant — Best Food!');
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });
});

describe('generateStructuredData', () => {
  it('generates Organization structured data', () => {
    const output = generateStructuredData({
      type: 'Organization',
      name: 'Acme Corp',
      description: 'A leading technology company',
      url: 'https://acme.com',
      logo: 'https://acme.com/logo.png',
    });
    writeOutput('generators-seo', 'structured-data-org.html', output);
    // Returns a <script type="application/ld+json"> tag
    expect(output).toContain('application/ld+json');
    expect(output).toContain('Organization');
    expect(output).toContain('Acme Corp');
  });

  it('generates FAQPage structured data', () => {
    const output = generateStructuredData({
      type: 'FAQPage',
      name: 'FAQ',
      faqs: [
        { question: 'What is this?', answer: 'A test FAQ page.' },
        { question: 'How does it work?', answer: 'It generates JSON-LD.' },
      ],
    });
    writeOutput('generators-seo', 'structured-data-faq.html', output);
    expect(output).toContain('FAQPage');
    expect(output).toContain('What is this?');
  });

  it('generates Product structured data', () => {
    const output = generateStructuredData({
      type: 'Product',
      name: 'Widget Pro',
      description: 'The best widget ever',
      brand: 'WidgetCo',
      price: 29.99,
      priceCurrency: 'USD',
      availability: 'InStock',
    });
    expect(output).toContain('Product');
    expect(output).toContain('Widget Pro');
  });
});

describe('generateOpenGraphArticle', () => {
  it('generates OG article meta tags', () => {
    const og = generateOpenGraphArticle({
      publishedTime: '2024-01-15T10:00:00Z',
      modifiedTime: '2024-01-16T12:00:00Z',
      author: 'John Doe',
      section: 'Technology',
      tags: ['typescript', 'testing', 'web'],
    });
    writeOutput('generators-seo', 'og-article.html', og);
    expect(og).toContain('article:published_time');
    expect(og).toContain('article:author');
  });
});

describe('generateCanonicalVariations', () => {
  it('generates all canonical URL variations', () => {
    const variations = generateCanonicalVariations('https://example.com/page');
    writeOutput('generators-seo', 'canonical-variations.json', JSON.stringify(variations, null, 2));
    expect(typeof variations).toBe('object');
    expect(Object.keys(variations).length).toBeGreaterThan(0);
  });
});

describe('analyzeSeo', () => {
  it('analyzes SEO health of page metrics', () => {
    const result = analyzeSeo({
      title: 'Best Widget Reviews 2024 - Top 10 Picks',
      description: 'Comprehensive guide to the best widgets available in 2024. Compare features, prices, and user reviews.',
      h1Count: 1,
      h2Count: 5,
      wordCount: 1200,
      imageCount: 8,
      imagesWithAlt: 6,
      internalLinks: 12,
      externalLinks: 3,
      hasCanonical: true,
      hasRobots: true,
      hasSitemap: true,
      loadTimeMs: 1500,
      mobileResponsive: true,
      httpsEnabled: true,
    });
    writeOutput('generators-seo', 'seo-analysis-good.json', JSON.stringify(result, null, 2));
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('maxScore');
    expect(result).toHaveProperty('percentage');
    expect(result).toHaveProperty('grade');
    expect(result).toHaveProperty('issues');
    expect(result).toHaveProperty('recommendations');
    expect(result.percentage).toBeGreaterThan(50);
  });

  it('detects SEO issues for poor page', () => {
    const result = analyzeSeo({
      title: 'Hi',
      description: '',
      h1Count: 0,
      h2Count: 0,
      wordCount: 50,
      imageCount: 5,
      imagesWithAlt: 0,
      internalLinks: 0,
      externalLinks: 0,
      hasCanonical: false,
      hasRobots: false,
      hasSitemap: false,
      loadTimeMs: 8000,
      mobileResponsive: false,
      httpsEnabled: false,
    });
    writeOutput('generators-seo', 'seo-analysis-poor.json', JSON.stringify(result, null, 2));
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.percentage).toBeLessThan(50);
  });
});

describe('generateSecurityTxt', () => {
  it('generates security.txt content', () => {
    const txt = generateSecurityTxt({
      contact: 'mailto:security@example.com',
      expires: '2025-12-31T23:59:59Z',
      encryption: 'https://example.com/.well-known/pgp-key.txt',
      preferredLanguages: ['en', 'ar'],
      canonical: 'https://example.com/.well-known/security.txt',
      policy: 'https://example.com/security-policy',
    });
    writeOutput('generators-seo', 'security.txt', txt);
    expect(txt).toContain('Contact:');
    expect(txt).toContain('Expires:');
  });
});

describe('generateHumansTxt', () => {
  it('generates humans.txt content', () => {
    const txt = generateHumansTxt({
      team: [
        { role: 'Lead Developer', name: 'Alice', contact: 'alice@example.com', location: 'Dubai' },
        { role: 'Designer', name: 'Bob', twitter: '@bob', location: 'London' },
      ],
      thanks: ['Open source community', 'Coffee'],
      site: {
        lastUpdate: '2024-06-15',
        language: 'English',
        standards: ['HTML5', 'CSS3'],
        components: ['React', 'Next.js'],
        software: ['VS Code', 'Figma'],
      },
    });
    writeOutput('generators-seo', 'humans.txt', txt);
    expect(txt).toContain('Alice');
    expect(txt).toContain('Bob');
    expect(txt).toContain('Lead Developer');
  });
});
