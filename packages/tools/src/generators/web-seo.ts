/**
 * Web SEO Generators - Exact copy from apps/web/src/lib/tools/seo-generators.ts
 * This is the canonical source for all SEO generator implementations used by the web app.
 */

// Generate meta tags for SEO
export interface MetaTagOptions {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  canonical?: string;
  ogType?: 'website' | 'article' | 'product' | 'profile';
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  robots?: string;
  viewport?: string;
  themeColor?: string;
  locale?: string;
  siteName?: string;
}

export function generateMetaTags(options: MetaTagOptions): string {
  const tags: string[] = [];
  
  // Basic meta tags
  tags.push(`<meta charset="UTF-8">`);
  tags.push(`<meta name="viewport" content="${options.viewport || 'width=device-width, initial-scale=1.0'}">`);
  tags.push(`<title>${escapeHtml(options.title)}</title>`);
  tags.push(`<meta name="description" content="${escapeHtml(options.description)}">`);
  
  if (options.keywords?.length) {
    tags.push(`<meta name="keywords" content="${escapeHtml(options.keywords.join(', '))}">`);
  }
  
  if (options.author) {
    tags.push(`<meta name="author" content="${escapeHtml(options.author)}">`);
  }
  
  if (options.robots) {
    tags.push(`<meta name="robots" content="${escapeHtml(options.robots)}">`);
  }
  
  if (options.themeColor) {
    tags.push(`<meta name="theme-color" content="${escapeHtml(options.themeColor)}">`);
  }
  
  if (options.canonical) {
    tags.push(`<link rel="canonical" href="${escapeHtml(options.canonical)}">`);
  }
  
  // Open Graph tags
  tags.push(`<meta property="og:title" content="${escapeHtml(options.title)}">`);
  tags.push(`<meta property="og:description" content="${escapeHtml(options.description)}">`);
  tags.push(`<meta property="og:type" content="${options.ogType || 'website'}">`);
  
  if (options.ogUrl) {
    tags.push(`<meta property="og:url" content="${escapeHtml(options.ogUrl)}">`);
  }
  
  if (options.ogImage) {
    tags.push(`<meta property="og:image" content="${escapeHtml(options.ogImage)}">`);
  }
  
  if (options.siteName) {
    tags.push(`<meta property="og:site_name" content="${escapeHtml(options.siteName)}">`);
  }
  
  if (options.locale) {
    tags.push(`<meta property="og:locale" content="${escapeHtml(options.locale)}">`);
  }
  
  // Twitter Card tags
  tags.push(`<meta name="twitter:card" content="${options.twitterCard || 'summary'}">`);
  tags.push(`<meta name="twitter:title" content="${escapeHtml(options.title)}">`);
  tags.push(`<meta name="twitter:description" content="${escapeHtml(options.description)}">`);
  
  if (options.ogImage) {
    tags.push(`<meta name="twitter:image" content="${escapeHtml(options.ogImage)}">`);
  }
  
  if (options.twitterSite) {
    tags.push(`<meta name="twitter:site" content="${escapeHtml(options.twitterSite)}">`);
  }
  
  if (options.twitterCreator) {
    tags.push(`<meta name="twitter:creator" content="${escapeHtml(options.twitterCreator)}">`);
  }
  
  return tags.join('\n');
}

// HTML escape helper
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => map[char] || char);
}

// Generate robots.txt
export function generateRobotsTxt(rules: Record<string, string[]>, sitemap?: string): string {
  const lines: string[] = [];
  
  for (const [userAgent, paths] of Object.entries(rules)) {
    lines.push(`User-agent: ${userAgent}`);
    
    for (const path of paths) {
      if (path.startsWith('!')) {
        lines.push(`Allow: ${path.slice(1)}`);
      } else {
        lines.push(`Disallow: ${path}`);
      }
    }
    
    lines.push('');
  }
  
  if (sitemap) {
    lines.push(`Sitemap: ${sitemap}`);
  }
  
  return lines.join('\n').trim();
}

// Generate sitemap.xml
export interface SitemapUrl {
  loc?: string;
  url?: string;  // Alias for loc
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemap(urls: SitemapUrl[]): string {
  const xmlUrls = urls.map(urlEntry => {
    const loc = urlEntry.loc || urlEntry.url || '';
    const parts = [`    <loc>${escapeXml(loc)}</loc>`];
    
    if (urlEntry.lastmod) {
      parts.push(`    <lastmod>${urlEntry.lastmod}</lastmod>`);
    }
    
    if (urlEntry.changefreq) {
      parts.push(`    <changefreq>${urlEntry.changefreq}</changefreq>`);
    }
    
    if (urlEntry.priority !== undefined) {
      parts.push(`    <priority>${urlEntry.priority.toFixed(1)}</priority>`);
    }
    
    return `  <url>\n${parts.join('\n')}\n  </url>`;
  });
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls.join('\n')}
</urlset>`;
}

// XML escape helper
function escapeXml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  };
  return text.replace(/[&<>"']/g, char => map[char] || char);
}

// Generate structured data (JSON-LD)
export type StructuredDataType = 
  | 'Organization'
  | 'Person'
  | 'Article'
  | 'BlogPosting'
  | 'Product'
  | 'LocalBusiness'
  | 'Event'
  | 'Recipe'
  | 'FAQPage'
  | 'BreadcrumbList'
  | 'WebSite'
  | 'WebPage';

export interface StructuredDataOptions {
  type: StructuredDataType;
  name: string;
  description?: string;
  url?: string;
  image?: string;
  // Organization/LocalBusiness
  logo?: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  // Article/BlogPosting
  author?: string | { name: string; url?: string };
  datePublished?: string;
  dateModified?: string;
  publisher?: { name: string; logo?: string };
  // Product
  sku?: string;
  brand?: string;
  price?: number;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  reviewRating?: number;
  reviewCount?: number;
  // Event
  startDate?: string;
  endDate?: string;
  location?: string | { name: string; address?: string };
  // Recipe
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string;
  recipeIngredient?: string[];
  recipeInstructions?: string[];
  // FAQPage
  faqs?: Array<{ question: string; answer: string }>;
  // BreadcrumbList
  breadcrumbs?: Array<{ name: string; url: string }>;
  // Additional properties
  sameAs?: string[];
}

export function generateStructuredData(options: StructuredDataOptions): string {
  let data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': options.type,
  };
  
  // Common properties
  if (options.name) data.name = options.name;
  if (options.description) data.description = options.description;
  if (options.url) data.url = options.url;
  if (options.image) data.image = options.image;
  if (options.sameAs?.length) data.sameAs = options.sameAs;
  
  switch (options.type) {
    case 'Organization':
    case 'LocalBusiness':
      if (options.logo) data.logo = options.logo;
      if (options.telephone) data.telephone = options.telephone;
      if (options.email) data.email = options.email;
      if (options.address) {
        data.address = {
          '@type': 'PostalAddress',
          ...options.address,
        };
      }
      break;
      
    case 'Article':
    case 'BlogPosting':
      if (options.author) {
        data.author = typeof options.author === 'string'
          ? { '@type': 'Person', name: options.author }
          : { '@type': 'Person', ...options.author };
      }
      if (options.datePublished) data.datePublished = options.datePublished;
      if (options.dateModified) data.dateModified = options.dateModified;
      if (options.publisher) {
        data.publisher = {
          '@type': 'Organization',
          name: options.publisher.name,
          ...(options.publisher.logo && { logo: { '@type': 'ImageObject', url: options.publisher.logo } }),
        };
      }
      break;
      
    case 'Product':
      if (options.sku) data.sku = options.sku;
      if (options.brand) data.brand = { '@type': 'Brand', name: options.brand };
      if (options.price !== undefined) {
        data.offers = {
          '@type': 'Offer',
          price: options.price,
          priceCurrency: options.priceCurrency || 'USD',
          availability: options.availability 
            ? `https://schema.org/${options.availability}` 
            : 'https://schema.org/InStock',
        };
      }
      if (options.reviewRating !== undefined) {
        data.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: options.reviewRating,
          reviewCount: options.reviewCount || 1,
        };
      }
      break;
      
    case 'Event':
      if (options.startDate) data.startDate = options.startDate;
      if (options.endDate) data.endDate = options.endDate;
      if (options.location) {
        data.location = typeof options.location === 'string'
          ? { '@type': 'Place', name: options.location }
          : { '@type': 'Place', name: options.location.name, address: options.location.address };
      }
      break;
      
    case 'Recipe':
      if (options.prepTime) data.prepTime = options.prepTime;
      if (options.cookTime) data.cookTime = options.cookTime;
      if (options.totalTime) data.totalTime = options.totalTime;
      if (options.recipeYield) data.recipeYield = options.recipeYield;
      if (options.recipeIngredient) data.recipeIngredient = options.recipeIngredient;
      if (options.recipeInstructions) {
        data.recipeInstructions = options.recipeInstructions.map((step, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          text: step,
        }));
      }
      break;
      
    case 'FAQPage':
      if (options.faqs?.length) {
        data.mainEntity = options.faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        }));
      }
      break;
      
    case 'BreadcrumbList':
      if (options.breadcrumbs?.length) {
        data.itemListElement = options.breadcrumbs.map((crumb, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: crumb.name,
          item: crumb.url,
        }));
      }
      break;
  }
  
  return `<script type="application/ld+json">
${JSON.stringify(data, null, 2)}
</script>`;
}

// Generate Open Graph article tags
export interface OpenGraphArticleOptions {
  publishedTime: string;
  modifiedTime?: string;
  expirationTime?: string;
  author: string | string[];
  section?: string;
  tags?: string[];
}

export function generateOpenGraphArticle(options: OpenGraphArticleOptions): string {
  const tags: string[] = [];
  
  tags.push(`<meta property="article:published_time" content="${options.publishedTime}">`);
  
  if (options.modifiedTime) {
    tags.push(`<meta property="article:modified_time" content="${options.modifiedTime}">`);
  }
  
  if (options.expirationTime) {
    tags.push(`<meta property="article:expiration_time" content="${options.expirationTime}">`);
  }
  
  const authors = Array.isArray(options.author) ? options.author : [options.author];
  for (const author of authors) {
    tags.push(`<meta property="article:author" content="${escapeHtml(author)}">`);
  }
  
  if (options.section) {
    tags.push(`<meta property="article:section" content="${escapeHtml(options.section)}">`);
  }
  
  if (options.tags?.length) {
    for (const tag of options.tags) {
      tags.push(`<meta property="article:tag" content="${escapeHtml(tag)}">`);
    }
  }
  
  return tags.join('\n');
}

// Generate .htaccess SEO rules
export function generateHtaccessSeoRules(options: {
  forceHttps?: boolean;
  forceWww?: boolean;
  removeWww?: boolean;
  removeTrailingSlash?: boolean;
  addTrailingSlash?: boolean;
  gzipEnabled?: boolean;
  browserCaching?: boolean;
  customRedirects?: Array<{ from: string; to: string; type: 301 | 302 }>;
}): string {
  const lines: string[] = [];
  
  lines.push('# Generated SEO Rules');
  lines.push('RewriteEngine On');
  lines.push('');
  
  if (options.forceHttps) {
    lines.push('# Force HTTPS');
    lines.push('RewriteCond %{HTTPS} off');
    lines.push('RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]');
    lines.push('');
  }
  
  if (options.forceWww) {
    lines.push('# Force www');
    lines.push('RewriteCond %{HTTP_HOST} !^www\\.');
    lines.push('RewriteRule ^(.*)$ https://www.%{HTTP_HOST}%{REQUEST_URI} [L,R=301]');
    lines.push('');
  }
  
  if (options.removeWww) {
    lines.push('# Remove www');
    lines.push('RewriteCond %{HTTP_HOST} ^www\\.(.*)$ [NC]');
    lines.push('RewriteRule ^(.*)$ https://%1%{REQUEST_URI} [L,R=301]');
    lines.push('');
  }
  
  if (options.removeTrailingSlash) {
    lines.push('# Remove trailing slash');
    lines.push('RewriteCond %{REQUEST_FILENAME} !-d');
    lines.push('RewriteRule ^(.*)/$ /$1 [L,R=301]');
    lines.push('');
  }
  
  if (options.addTrailingSlash) {
    lines.push('# Add trailing slash');
    lines.push('RewriteCond %{REQUEST_FILENAME} !-f');
    lines.push('RewriteRule ^(.*[^/])$ /$1/ [L,R=301]');
    lines.push('');
  }
  
  if (options.gzipEnabled) {
    lines.push('# Enable GZIP compression');
    lines.push('<IfModule mod_deflate.c>');
    lines.push('  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json');
    lines.push('</IfModule>');
    lines.push('');
  }
  
  if (options.browserCaching) {
    lines.push('# Browser caching');
    lines.push('<IfModule mod_expires.c>');
    lines.push('  ExpiresActive On');
    lines.push('  ExpiresByType image/jpg "access plus 1 year"');
    lines.push('  ExpiresByType image/jpeg "access plus 1 year"');
    lines.push('  ExpiresByType image/png "access plus 1 year"');
    lines.push('  ExpiresByType image/gif "access plus 1 year"');
    lines.push('  ExpiresByType image/svg+xml "access plus 1 year"');
    lines.push('  ExpiresByType image/webp "access plus 1 year"');
    lines.push('  ExpiresByType text/css "access plus 1 month"');
    lines.push('  ExpiresByType application/javascript "access plus 1 month"');
    lines.push('  ExpiresByType application/pdf "access plus 1 month"');
    lines.push('</IfModule>');
    lines.push('');
  }
  
  if (options.customRedirects?.length) {
    lines.push('# Custom redirects');
    for (const redirect of options.customRedirects) {
      lines.push(`Redirect ${redirect.type} ${redirect.from} ${redirect.to}`);
    }
    lines.push('');
  }
  
  return lines.join('\n').trim();
}

// Generate canonical URL variations
export function generateCanonicalVariations(baseUrl: string): Record<string, string> {
  const url = new URL(baseUrl);
  const domain = url.hostname;
  const path = url.pathname;
  
  const wwwDomain = domain.startsWith('www.') ? domain : `www.${domain}`;
  const nonWwwDomain = domain.startsWith('www.') ? domain.slice(4) : domain;
  
  const withSlash = path.endsWith('/') ? path : `${path}/`;
  const withoutSlash = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  
  return {
    'https + www + trailing slash': `https://${wwwDomain}${withSlash}`,
    'https + www + no trailing slash': `https://${wwwDomain}${withoutSlash}`,
    'https + non-www + trailing slash': `https://${nonWwwDomain}${withSlash}`,
    'https + non-www + no trailing slash': `https://${nonWwwDomain}${withoutSlash}`,
    'http + www + trailing slash': `http://${wwwDomain}${withSlash}`,
    'http + www + no trailing slash': `http://${wwwDomain}${withoutSlash}`,
    'http + non-www + trailing slash': `http://${nonWwwDomain}${withSlash}`,
    'http + non-www + no trailing slash': `http://${nonWwwDomain}${withoutSlash}`,
    recommended: `https://${nonWwwDomain}${withoutSlash === '/' ? '/' : withoutSlash}`,
  };
}

// SEO analysis/score generator
export interface SeoAnalysisInput {
  title: string;
  description: string;
  h1Count: number;
  h2Count: number;
  wordCount: number;
  imageCount: number;
  imagesWithAlt: number;
  internalLinks: number;
  externalLinks: number;
  hasCanonical: boolean;
  hasRobots: boolean;
  hasSitemap: boolean;
  loadTimeMs: number;
  mobileResponsive: boolean;
  httpsEnabled: boolean;
}

export interface SeoAnalysisResult {
  score: number;
  maxScore: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: Array<{ severity: 'error' | 'warning' | 'info'; message: string }>;
  recommendations: string[];
}

export function analyzeSeo(input: SeoAnalysisInput): SeoAnalysisResult {
  const issues: Array<{ severity: 'error' | 'warning' | 'info'; message: string }> = [];
  const recommendations: string[] = [];
  let score = 0;
  const maxScore = 100;
  
  // Title analysis (max 15 points)
  if (!input.title) {
    issues.push({ severity: 'error', message: 'Missing page title' });
  } else if (input.title.length < 30) {
    issues.push({ severity: 'warning', message: 'Title is too short (under 30 characters)' });
    score += 8;
    recommendations.push('Extend your title to 50-60 characters for better SEO');
  } else if (input.title.length > 60) {
    issues.push({ severity: 'warning', message: 'Title is too long (over 60 characters)' });
    score += 10;
    recommendations.push('Shorten your title to under 60 characters');
  } else {
    score += 15;
  }
  
  // Description analysis (max 15 points)
  if (!input.description) {
    issues.push({ severity: 'error', message: 'Missing meta description' });
  } else if (input.description.length < 120) {
    issues.push({ severity: 'warning', message: 'Meta description is too short' });
    score += 8;
    recommendations.push('Extend your meta description to 150-160 characters');
  } else if (input.description.length > 160) {
    issues.push({ severity: 'warning', message: 'Meta description is too long' });
    score += 10;
    recommendations.push('Shorten your meta description to under 160 characters');
  } else {
    score += 15;
  }
  
  // H1 analysis (max 10 points)
  if (input.h1Count === 0) {
    issues.push({ severity: 'error', message: 'Missing H1 heading' });
  } else if (input.h1Count > 1) {
    issues.push({ severity: 'warning', message: 'Multiple H1 headings found' });
    score += 5;
    recommendations.push('Use only one H1 heading per page');
  } else {
    score += 10;
  }
  
  // Content analysis (max 10 points)
  if (input.wordCount < 300) {
    issues.push({ severity: 'warning', message: 'Content is thin (under 300 words)' });
    score += 5;
    recommendations.push('Add more content - aim for at least 500 words');
  } else if (input.wordCount >= 500) {
    score += 10;
  } else {
    score += 7;
  }
  
  // Image analysis (max 10 points)
  if (input.imageCount > 0) {
    const altRatio = input.imagesWithAlt / input.imageCount;
    if (altRatio === 1) {
      score += 10;
    } else if (altRatio >= 0.8) {
      score += 7;
      issues.push({ severity: 'warning', message: 'Some images missing alt text' });
      recommendations.push('Add alt text to all images');
    } else {
      score += 3;
      issues.push({ severity: 'error', message: 'Many images missing alt text' });
      recommendations.push('Add descriptive alt text to all images');
    }
  } else {
    score += 5;
    issues.push({ severity: 'info', message: 'No images on the page' });
  }
  
  // Links analysis (max 10 points)
  if (input.internalLinks === 0) {
    issues.push({ severity: 'warning', message: 'No internal links found' });
    recommendations.push('Add internal links to other pages on your site');
  } else {
    score += 5;
  }
  if (input.externalLinks > 0) {
    score += 5;
  } else {
    issues.push({ severity: 'info', message: 'No external links found' });
  }
  
  // Technical SEO (max 20 points)
  if (input.hasCanonical) score += 5;
  else {
    issues.push({ severity: 'warning', message: 'Missing canonical URL' });
    recommendations.push('Add a canonical URL to prevent duplicate content issues');
  }
  
  if (input.hasRobots) score += 5;
  else issues.push({ severity: 'info', message: 'No robots meta tag' });
  
  if (input.hasSitemap) score += 5;
  else {
    issues.push({ severity: 'warning', message: 'Missing sitemap' });
    recommendations.push('Create and submit a sitemap');
  }
  
  if (input.httpsEnabled) score += 5;
  else {
    issues.push({ severity: 'error', message: 'HTTPS not enabled' });
    recommendations.push('Enable HTTPS for your website');
  }
  
  // Performance (max 5 points)
  if (input.loadTimeMs < 2000) {
    score += 5;
  } else if (input.loadTimeMs < 4000) {
    score += 3;
    issues.push({ severity: 'warning', message: 'Page load time is slow' });
    recommendations.push('Optimize page load time to under 2 seconds');
  } else {
    issues.push({ severity: 'error', message: 'Page load time is very slow' });
    recommendations.push('Urgently optimize page performance');
  }
  
  // Mobile responsiveness (max 5 points)
  if (input.mobileResponsive) {
    score += 5;
  } else {
    issues.push({ severity: 'error', message: 'Page is not mobile responsive' });
    recommendations.push('Make your page mobile responsive');
  }
  
  const percentage = Math.round((score / maxScore) * 100);
  const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
  
  return {
    score,
    maxScore,
    percentage,
    grade,
    issues,
    recommendations,
  };
}

// Generate hreflang tags
export function generateHreflangTags(
  pages: Array<{ url: string; lang: string; region?: string }>
): string {
  return pages
    .map(page => {
      const hreflang = page.region ? `${page.lang}-${page.region}` : page.lang;
      return `<link rel="alternate" hreflang="${hreflang}" href="${escapeHtml(page.url)}">`;
    })
    .join('\n');
}

// Generate security.txt
export function generateSecurityTxt(options: {
  contact: string | string[];
  expires: string;
  encryption?: string;
  acknowledgments?: string;
  preferredLanguages?: string[];
  canonical?: string;
  policy?: string;
  hiring?: string;
}): string {
  const lines: string[] = [];
  
  const contacts = Array.isArray(options.contact) ? options.contact : [options.contact];
  for (const contact of contacts) {
    lines.push(`Contact: ${contact}`);
  }
  
  lines.push(`Expires: ${options.expires}`);
  
  if (options.encryption) {
    lines.push(`Encryption: ${options.encryption}`);
  }
  
  if (options.acknowledgments) {
    lines.push(`Acknowledgments: ${options.acknowledgments}`);
  }
  
  if (options.preferredLanguages?.length) {
    lines.push(`Preferred-Languages: ${options.preferredLanguages.join(', ')}`);
  }
  
  if (options.canonical) {
    lines.push(`Canonical: ${options.canonical}`);
  }
  
  if (options.policy) {
    lines.push(`Policy: ${options.policy}`);
  }
  
  if (options.hiring) {
    lines.push(`Hiring: ${options.hiring}`);
  }
  
  return lines.join('\n');
}

// Generate humans.txt
export function generateHumansTxt(options: {
  team: Array<{ role: string; name: string; contact?: string; twitter?: string; location?: string }>;
  thanks?: string[];
  site?: {
    lastUpdate?: string;
    language?: string;
    standards?: string[];
    components?: string[];
    software?: string[];
  };
}): string {
  const lines: string[] = [];
  
  lines.push('/* TEAM */');
  for (const member of options.team) {
    lines.push(`${member.role}: ${member.name}`);
    if (member.contact) lines.push(`Contact: ${member.contact}`);
    if (member.twitter) lines.push(`Twitter: ${member.twitter}`);
    if (member.location) lines.push(`Location: ${member.location}`);
    lines.push('');
  }
  
  if (options.thanks?.length) {
    lines.push('/* THANKS */');
    for (const thank of options.thanks) {
      lines.push(thank);
    }
    lines.push('');
  }
  
  if (options.site) {
    lines.push('/* SITE */');
    if (options.site.lastUpdate) lines.push(`Last update: ${options.site.lastUpdate}`);
    if (options.site.language) lines.push(`Language: ${options.site.language}`);
    if (options.site.standards?.length) lines.push(`Standards: ${options.site.standards.join(', ')}`);
    if (options.site.components?.length) lines.push(`Components: ${options.site.components.join(', ')}`);
    if (options.site.software?.length) lines.push(`Software: ${options.site.software.join(', ')}`);
  }
  
  return lines.join('\n').trim();
}

// Generate htaccess file (alias for generateHtaccessSeoRules)
export function generateHtaccess(options: Parameters<typeof generateHtaccessSeoRules>[0]): string {
  return generateHtaccessSeoRules(options);
}

// Generate canonical tag
export function generateCanonicalTag(url: string): string {
  return `<link rel="canonical" href="${escapeHtml(url)}">`;
}

// Generate SEO-friendly slug
export function generateSeoSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Generate Article Schema (JSON-LD)
export interface ArticleSchemaOptions {
  headline: string;
  description: string;
  author: string | { name: string; url?: string };
  datePublished: string;
  dateModified?: string;
  image?: string;
  publisher: { name: string; logo?: string };
  url?: string;
}

export function generateArticleSchema(options: ArticleSchemaOptions): string {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: options.headline,
    description: options.description,
    datePublished: options.datePublished,
    author: typeof options.author === 'string'
      ? { '@type': 'Person', name: options.author }
      : { '@type': 'Person', ...options.author },
    publisher: {
      '@type': 'Organization',
      name: options.publisher.name,
      ...(options.publisher.logo && { logo: { '@type': 'ImageObject', url: options.publisher.logo } }),
    },
  };
  
  if (options.dateModified) data.dateModified = options.dateModified;
  if (options.image) data.image = options.image;
  if (options.url) data.url = options.url;
  
  return `<script type="application/ld+json">
${JSON.stringify(data, null, 2)}
</script>`;
}

// Generate Product Schema (JSON-LD)
export interface ProductSchemaOptions {
  name: string;
  description: string;
  image?: string;
  sku?: string;
  brand?: string;
  price: number;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  url?: string;
  reviewRating?: number;
  reviewCount?: number;
}

export function generateProductSchema(options: ProductSchemaOptions): string {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: options.name,
    description: options.description,
    offers: {
      '@type': 'Offer',
      price: options.price,
      priceCurrency: options.priceCurrency || 'USD',
      availability: options.availability 
        ? `https://schema.org/${options.availability}` 
        : 'https://schema.org/InStock',
    },
  };
  
  if (options.image) data.image = options.image;
  if (options.sku) data.sku = options.sku;
  if (options.brand) data.brand = { '@type': 'Brand', name: options.brand };
  if (options.url) data.url = options.url;
  
  if (options.reviewRating !== undefined) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: options.reviewRating,
      reviewCount: options.reviewCount || 1,
    };
  }
  
  return `<script type="application/ld+json">
${JSON.stringify(data, null, 2)}
</script>`;
}

// Generate FAQ Schema (JSON-LD)
export interface FaqSchemaOptions {
  faqs: Array<{ question: string; answer: string }>;
}

export function generateFaqSchema(options: FaqSchemaOptions): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: options.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
  
  return `<script type="application/ld+json">
${JSON.stringify(data, null, 2)}
</script>`;
}

