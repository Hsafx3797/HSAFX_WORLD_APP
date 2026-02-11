import { describe, it, expect } from 'vitest';
import {
  generateMetaTags,
  generateArticleSchema,
  generateOrganizationSchema,
  generateProductSchema,
  generateBreadcrumbSchema,
  generateFaqSchema,
  generateSitemap,
  generateRobotsTxt,
  generateHreflangTags,
  generateCanonicalUrl,
  generateSecurityHeaders,
} from '../seo';

// ==================== generateMetaTags ====================

describe('generateMetaTags', () => {
  it('should include title and description', () => {
    const result = generateMetaTags({ title: 'My Page', description: 'Page desc' });
    expect(result).toContain('<title>My Page</title>');
    expect(result).toContain('<meta name="description" content="Page desc">');
  });

  it('should escape HTML in title and description', () => {
    const result = generateMetaTags({ title: '<script>alert("x")</script>', description: 'A & B "C"' });
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('A &amp; B &quot;C&quot;');
  });

  it('should include keywords when provided', () => {
    const result = generateMetaTags({ title: 'T', description: 'D', keywords: ['a', 'b', 'c'] });
    expect(result).toContain('<meta name="keywords" content="a, b, c">');
  });

  it('should not include keywords when array is empty', () => {
    const result = generateMetaTags({ title: 'T', description: 'D', keywords: [] });
    expect(result).not.toContain('keywords');
  });

  it('should include author when provided', () => {
    const result = generateMetaTags({ title: 'T', description: 'D', author: 'John' });
    expect(result).toContain('<meta name="author" content="John">');
  });

  it('should include canonical link when provided', () => {
    const result = generateMetaTags({ title: 'T', description: 'D', canonical: 'https://example.com/page' });
    expect(result).toContain('<link rel="canonical" href="https://example.com/page">');
  });

  it('should include robots meta when provided', () => {
    const result = generateMetaTags({ title: 'T', description: 'D', robots: 'noindex, nofollow' });
    expect(result).toContain('<meta name="robots" content="noindex, nofollow">');
  });

  it('should default og:title to title', () => {
    const result = generateMetaTags({ title: 'My Title', description: 'D' });
    expect(result).toContain('<meta property="og:title" content="My Title">');
  });

  it('should use ogTitle when provided', () => {
    const result = generateMetaTags({ title: 'T', description: 'D', ogTitle: 'OG Title' });
    expect(result).toContain('<meta property="og:title" content="OG Title">');
  });

  it('should default og:type to website', () => {
    const result = generateMetaTags({ title: 'T', description: 'D' });
    expect(result).toContain('<meta property="og:type" content="website">');
  });

  it('should use ogType when provided', () => {
    const result = generateMetaTags({ title: 'T', description: 'D', ogType: 'article' });
    expect(result).toContain('<meta property="og:type" content="article">');
  });

  it('should include og:image when provided', () => {
    const result = generateMetaTags({ title: 'T', description: 'D', ogImage: 'https://img.com/a.png' });
    expect(result).toContain('<meta property="og:image" content="https://img.com/a.png">');
    expect(result).toContain('<meta name="twitter:image" content="https://img.com/a.png">');
  });

  it('should default twitter:card to summary', () => {
    const result = generateMetaTags({ title: 'T', description: 'D' });
    expect(result).toContain('<meta name="twitter:card" content="summary">');
  });

  it('should use twitterCard when provided', () => {
    const result = generateMetaTags({ title: 'T', description: 'D', twitterCard: 'summary_large_image' });
    expect(result).toContain('<meta name="twitter:card" content="summary_large_image">');
  });

  it('should include twitter site and creator when provided', () => {
    const result = generateMetaTags({ title: 'T', description: 'D', twitterSite: '@site', twitterCreator: '@author' });
    expect(result).toContain('<meta name="twitter:site" content="@site">');
    expect(result).toContain('<meta name="twitter:creator" content="@author">');
  });

  it('should join tags with newlines', () => {
    const result = generateMetaTags({ title: 'T', description: 'D' });
    expect(result.split('\n').length).toBeGreaterThan(1);
  });
});

// ==================== generateArticleSchema ====================

describe('generateArticleSchema', () => {
  const base = { headline: 'H', description: 'D', author: 'A', datePublished: '2024-01-01' };

  it('should wrap in script tag with ld+json type', () => {
    const result = generateArticleSchema(base);
    expect(result).toContain('<script type="application/ld+json">');
    expect(result).toContain('</script>');
  });

  it('should include Article type and schema.org context', () => {
    const result = generateArticleSchema(base);
    expect(result).toContain('"@context": "https://schema.org"');
    expect(result).toContain('"@type": "Article"');
  });

  it('should include headline, description, author, datePublished', () => {
    const result = generateArticleSchema(base);
    expect(result).toContain('"headline": "H"');
    expect(result).toContain('"description": "D"');
    expect(result).toContain('"name": "A"');
    expect(result).toContain('"datePublished": "2024-01-01"');
  });

  it('should format author as Person type', () => {
    const result = generateArticleSchema(base);
    expect(result).toContain('"@type": "Person"');
  });

  it('should include dateModified when provided', () => {
    const result = generateArticleSchema({ ...base, dateModified: '2024-06-01' });
    expect(result).toContain('"dateModified": "2024-06-01"');
  });

  it('should not include dateModified when not provided', () => {
    const result = generateArticleSchema(base);
    expect(result).not.toContain('dateModified');
  });

  it('should include image when provided', () => {
    const result = generateArticleSchema({ ...base, image: 'https://img.com/a.png' });
    expect(result).toContain('"image": "https://img.com/a.png"');
  });

  it('should include publisher with logo', () => {
    const result = generateArticleSchema({ ...base, publisher: { name: 'Pub', logo: 'https://logo.png' } });
    expect(result).toContain('"@type": "Organization"');
    expect(result).toContain('"name": "Pub"');
    expect(result).toContain('"@type": "ImageObject"');
    expect(result).toContain('"url": "https://logo.png"');
  });

  it('should include publisher without logo', () => {
    const result = generateArticleSchema({ ...base, publisher: { name: 'Pub' } });
    expect(result).toContain('"name": "Pub"');
    expect(result).not.toContain('ImageObject');
  });
});

// ==================== generateOrganizationSchema ====================

describe('generateOrganizationSchema', () => {
  const base = { name: 'Org', url: 'https://org.com' };

  it('should include Organization type and required fields', () => {
    const result = generateOrganizationSchema(base);
    expect(result).toContain('"@type": "Organization"');
    expect(result).toContain('"name": "Org"');
    expect(result).toContain('"url": "https://org.com"');
  });

  it('should include logo when provided', () => {
    const result = generateOrganizationSchema({ ...base, logo: 'https://logo.png' });
    expect(result).toContain('"logo": "https://logo.png"');
  });

  it('should include description when provided', () => {
    const result = generateOrganizationSchema({ ...base, description: 'A company' });
    expect(result).toContain('"description": "A company"');
  });

  it('should include email when provided', () => {
    const result = generateOrganizationSchema({ ...base, email: 'a@b.com' });
    expect(result).toContain('"email": "a@b.com"');
  });

  it('should map phone to telephone', () => {
    const result = generateOrganizationSchema({ ...base, phone: '+1234567890' });
    expect(result).toContain('"telephone": "+1234567890"');
  });

  it('should include PostalAddress when address provided', () => {
    const result = generateOrganizationSchema({
      ...base,
      address: { street: '123 Main', city: 'City', state: 'ST', postalCode: '12345', country: 'US' },
    });
    expect(result).toContain('"@type": "PostalAddress"');
    expect(result).toContain('"streetAddress": "123 Main"');
    expect(result).toContain('"addressLocality": "City"');
    expect(result).toContain('"addressRegion": "ST"');
    expect(result).toContain('"postalCode": "12345"');
    expect(result).toContain('"addressCountry": "US"');
  });

  it('should include sameAs for social profiles', () => {
    const result = generateOrganizationSchema({ ...base, socialProfiles: ['https://twitter.com/org', 'https://fb.com/org'] });
    expect(result).toContain('"sameAs"');
    expect(result).toContain('https://twitter.com/org');
    expect(result).toContain('https://fb.com/org');
  });

  it('should not include sameAs when socialProfiles is empty', () => {
    const result = generateOrganizationSchema({ ...base, socialProfiles: [] });
    expect(result).not.toContain('sameAs');
  });
});

// ==================== generateProductSchema ====================

describe('generateProductSchema', () => {
  const base = {
    name: 'Widget',
    description: 'A widget',
    image: 'https://img.com/w.png',
    brand: 'Acme',
    sku: 'W-001',
    price: 29.99,
    currency: 'USD',
    availability: 'InStock' as const,
  };

  it('should include Product type and core fields', () => {
    const result = generateProductSchema(base);
    expect(result).toContain('"@type": "Product"');
    expect(result).toContain('"name": "Widget"');
    expect(result).toContain('"description": "A widget"');
    expect(result).toContain('"image": "https://img.com/w.png"');
    expect(result).toContain('"sku": "W-001"');
  });

  it('should format brand as Brand type', () => {
    const result = generateProductSchema(base);
    expect(result).toContain('"@type": "Brand"');
    expect(result).toContain('"name": "Acme"');
  });

  it('should include Offer with price, currency, availability', () => {
    const result = generateProductSchema(base);
    expect(result).toContain('"@type": "Offer"');
    expect(result).toContain('"price": 29.99');
    expect(result).toContain('"priceCurrency": "USD"');
    expect(result).toContain('"availability": "https://schema.org/InStock"');
  });

  it('should handle OutOfStock availability', () => {
    const result = generateProductSchema({ ...base, availability: 'OutOfStock' });
    expect(result).toContain('"availability": "https://schema.org/OutOfStock"');
  });

  it('should handle PreOrder availability', () => {
    const result = generateProductSchema({ ...base, availability: 'PreOrder' });
    expect(result).toContain('"availability": "https://schema.org/PreOrder"');
  });

  it('should include aggregateRating when rating provided', () => {
    const result = generateProductSchema({ ...base, rating: { value: 4.5, count: 120 } });
    expect(result).toContain('"@type": "AggregateRating"');
    expect(result).toContain('"ratingValue": 4.5');
    expect(result).toContain('"reviewCount": 120');
  });

  it('should not include aggregateRating when rating not provided', () => {
    const result = generateProductSchema(base);
    expect(result).not.toContain('AggregateRating');
  });
});

// ==================== generateBreadcrumbSchema ====================

describe('generateBreadcrumbSchema', () => {
  it('should include BreadcrumbList type', () => {
    const result = generateBreadcrumbSchema([{ name: 'Home', url: '/' }]);
    expect(result).toContain('"@type": "BreadcrumbList"');
  });

  it('should assign 1-based positions', () => {
    const result = generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Products', url: '/products' },
      { name: 'Widget', url: '/products/widget' },
    ]);
    expect(result).toContain('"position": 1');
    expect(result).toContain('"position": 2');
    expect(result).toContain('"position": 3');
  });

  it('should include name and item (url) for each ListItem', () => {
    const result = generateBreadcrumbSchema([{ name: 'Home', url: 'https://example.com' }]);
    expect(result).toContain('"@type": "ListItem"');
    expect(result).toContain('"name": "Home"');
    expect(result).toContain('"item": "https://example.com"');
  });

  it('should handle empty array', () => {
    const result = generateBreadcrumbSchema([]);
    expect(result).toContain('"itemListElement": []');
  });
});

// ==================== generateFaqSchema ====================

describe('generateFaqSchema', () => {
  const items = [
    { question: 'What is this?', answer: 'A tool.' },
    { question: 'How much?', answer: 'Free.' },
  ];

  it('should include FAQPage type', () => {
    const result = generateFaqSchema(items);
    expect(result).toContain('"@type": "FAQPage"');
  });

  it('should format each item as Question with acceptedAnswer', () => {
    const result = generateFaqSchema(items);
    expect(result).toContain('"@type": "Question"');
    expect(result).toContain('"name": "What is this?"');
    expect(result).toContain('"@type": "Answer"');
    expect(result).toContain('"text": "A tool."');
  });

  it('should handle empty FAQ array', () => {
    const result = generateFaqSchema([]);
    expect(result).toContain('"mainEntity": []');
  });

  it('should handle single FAQ item', () => {
    const result = generateFaqSchema([{ question: 'Q?', answer: 'A.' }]);
    const parsed = JSON.parse(result.replace(/<script[^>]*>/, '').replace(/<\/script>/, ''));
    expect(parsed.mainEntity).toHaveLength(1);
  });
});

// ==================== generateSitemap ====================

describe('generateSitemap', () => {
  it('should include XML declaration and urlset', () => {
    const result = generateSitemap([]);
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(result).toContain('</urlset>');
  });

  it('should include loc for each URL', () => {
    const result = generateSitemap([{ loc: 'https://example.com/' }]);
    expect(result).toContain('<loc>https://example.com/</loc>');
  });

  it('should escape XML in loc', () => {
    const result = generateSitemap([{ loc: 'https://example.com/?a=1&b=2' }]);
    expect(result).toContain('<loc>https://example.com/?a=1&amp;b=2</loc>');
  });

  it('should include lastmod when provided', () => {
    const result = generateSitemap([{ loc: 'https://example.com/', lastmod: '2024-01-01' }]);
    expect(result).toContain('<lastmod>2024-01-01</lastmod>');
  });

  it('should include changefreq when provided', () => {
    const result = generateSitemap([{ loc: 'https://example.com/', changefreq: 'daily' }]);
    expect(result).toContain('<changefreq>daily</changefreq>');
  });

  it('should include priority when provided', () => {
    const result = generateSitemap([{ loc: 'https://example.com/', priority: 0.8 }]);
    expect(result).toContain('<priority>0.8</priority>');
  });

  it('should include priority 0 when explicitly set', () => {
    const result = generateSitemap([{ loc: 'https://example.com/', priority: 0 }]);
    expect(result).toContain('<priority>0</priority>');
  });

  it('should handle multiple URLs', () => {
    const result = generateSitemap([
      { loc: 'https://example.com/' },
      { loc: 'https://example.com/about' },
    ]);
    expect(result).toContain('<loc>https://example.com/</loc>');
    expect(result).toContain('<loc>https://example.com/about</loc>');
  });

  it('should not include optional fields when not provided', () => {
    const result = generateSitemap([{ loc: 'https://example.com/' }]);
    expect(result).not.toContain('<lastmod>');
    expect(result).not.toContain('<changefreq>');
    expect(result).not.toContain('<priority>');
  });
});

// ==================== generateRobotsTxt ====================

describe('generateRobotsTxt', () => {
  it('should include User-agent line', () => {
    const result = generateRobotsTxt([{ userAgent: '*' }]);
    expect(result).toContain('User-agent: *');
  });

  it('should include Allow directives', () => {
    const result = generateRobotsTxt([{ userAgent: '*', allow: ['/', '/public'] }]);
    expect(result).toContain('Allow: /');
    expect(result).toContain('Allow: /public');
  });

  it('should include Disallow directives', () => {
    const result = generateRobotsTxt([{ userAgent: '*', disallow: ['/admin', '/private'] }]);
    expect(result).toContain('Disallow: /admin');
    expect(result).toContain('Disallow: /private');
  });

  it('should include Crawl-delay when provided', () => {
    const result = generateRobotsTxt([{ userAgent: 'Googlebot', crawlDelay: 10 }]);
    expect(result).toContain('Crawl-delay: 10');
  });

  it('should append Sitemap when sitemapUrl provided', () => {
    const result = generateRobotsTxt([{ userAgent: '*' }], 'https://example.com/sitemap.xml');
    expect(result).toContain('Sitemap: https://example.com/sitemap.xml');
  });

  it('should not include Sitemap when sitemapUrl not provided', () => {
    const result = generateRobotsTxt([{ userAgent: '*' }]);
    expect(result).not.toContain('Sitemap:');
  });

  it('should handle multiple rules', () => {
    const result = generateRobotsTxt([
      { userAgent: '*', disallow: ['/admin'] },
      { userAgent: 'Googlebot', allow: ['/'] },
    ]);
    expect(result).toContain('User-agent: *');
    expect(result).toContain('User-agent: Googlebot');
  });

  it('should separate rules with blank lines', () => {
    const result = generateRobotsTxt([
      { userAgent: '*' },
      { userAgent: 'Googlebot' },
    ]);
    // Each rule block ends with an empty line
    const lines = result.split('\n');
    const userAgentIndices = lines.map((l, i) => l.startsWith('User-agent:') ? i : -1).filter(i => i >= 0);
    expect(userAgentIndices).toHaveLength(2);
  });
});

// ==================== generateHreflangTags ====================

describe('generateHreflangTags', () => {
  it('should generate alternate link tags for each entry', () => {
    const result = generateHreflangTags([
      { lang: 'en', url: 'https://example.com/en' },
      { lang: 'fr', url: 'https://example.com/fr' },
    ]);
    expect(result).toContain('<link rel="alternate" hreflang="en" href="https://example.com/en">');
    expect(result).toContain('<link rel="alternate" hreflang="fr" href="https://example.com/fr">');
  });

  it('should include x-default when provided', () => {
    const result = generateHreflangTags(
      [{ lang: 'en', url: 'https://example.com/en' }],
      'https://example.com'
    );
    expect(result).toContain('<link rel="alternate" hreflang="x-default" href="https://example.com">');
  });

  it('should not include x-default when not provided', () => {
    const result = generateHreflangTags([{ lang: 'en', url: 'https://example.com/en' }]);
    expect(result).not.toContain('x-default');
  });

  it('should escape HTML in URLs', () => {
    const result = generateHreflangTags([{ lang: 'en', url: 'https://example.com/?a=1&b=2' }]);
    expect(result).toContain('href="https://example.com/?a=1&amp;b=2"');
  });

  it('should handle empty entries array with x-default', () => {
    const result = generateHreflangTags([], 'https://example.com');
    expect(result).toContain('x-default');
  });
});

// ==================== generateCanonicalUrl ====================

describe('generateCanonicalUrl', () => {
  it('should join base and path with slash', () => {
    expect(generateCanonicalUrl('https://example.com', '/page')).toBe('https://example.com/page');
  });

  it('should avoid double slashes when base ends with slash', () => {
    expect(generateCanonicalUrl('https://example.com/', '/page')).toBe('https://example.com/page');
  });

  it('should handle path without leading slash', () => {
    expect(generateCanonicalUrl('https://example.com', 'page')).toBe('https://example.com/page');
  });

  it('should handle base with trailing slash and path without leading slash', () => {
    expect(generateCanonicalUrl('https://example.com/', 'page')).toBe('https://example.com/page');
  });

  it('should remove www when removeWww is true', () => {
    expect(generateCanonicalUrl('https://www.example.com', '/page', { removeWww: true }))
      .toBe('https://example.com/page');
  });

  it('should not remove www when removeWww is false or omitted', () => {
    expect(generateCanonicalUrl('https://www.example.com', '/page'))
      .toBe('https://www.example.com/page');
  });

  it('should lowercase when lowercase is true', () => {
    expect(generateCanonicalUrl('https://Example.COM', '/Page', { lowercase: true }))
      .toBe('https://example.com/page');
  });

  it('should remove trailing slash when removeTrailingSlash is true', () => {
    expect(generateCanonicalUrl('https://example.com', '/page/', { removeTrailingSlash: true }))
      .toBe('https://example.com/page');
  });

  it('should not remove trailing slash from root URL (base + /)', () => {
    // The condition: url !== baseUrl + '/' means root path keeps its slash
    expect(generateCanonicalUrl('https://example.com', '/', { removeTrailingSlash: true }))
      .toBe('https://example.com/');
  });

  it('should apply all options together', () => {
    expect(generateCanonicalUrl('https://www.Example.COM', '/Page/', {
      removeWww: true,
      lowercase: true,
      removeTrailingSlash: true,
    })).toBe('https://example.com/page');
  });
});

// ==================== generateSecurityHeaders ====================

describe('generateSecurityHeaders', () => {
  it('should include X-Content-Type-Options nosniff', () => {
    const result = generateSecurityHeaders();
    expect(result).toContain('X-Content-Type-Options "nosniff"');
  });

  it('should include X-Frame-Options SAMEORIGIN', () => {
    const result = generateSecurityHeaders();
    expect(result).toContain('X-Frame-Options "SAMEORIGIN"');
  });

  it('should include X-XSS-Protection', () => {
    const result = generateSecurityHeaders();
    expect(result).toContain('X-XSS-Protection "1; mode=block"');
  });

  it('should include Referrer-Policy', () => {
    const result = generateSecurityHeaders();
    expect(result).toContain('Referrer-Policy "strict-origin-when-cross-origin"');
  });

  it('should include Permissions-Policy', () => {
    const result = generateSecurityHeaders();
    expect(result).toContain('Permissions-Policy "geolocation=(), microphone=(), camera=()"');
  });

  it('should start with # Security Headers comment', () => {
    const result = generateSecurityHeaders();
    expect(result.startsWith('# Security Headers')).toBe(true);
  });

  it('should use Header always set directives', () => {
    const result = generateSecurityHeaders();
    const lines = result.split('\n').filter(l => l.startsWith('Header'));
    expect(lines).toHaveLength(5);
    lines.forEach(line => expect(line).toMatch(/^Header always set /));
  });
});
