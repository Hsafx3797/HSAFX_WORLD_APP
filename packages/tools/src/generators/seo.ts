/**
 * SEO Generators
 * Generate meta tags, structured data, sitemaps, robots.txt, etc.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ==================== META TAGS ====================

export interface SeoMetaOptions {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
}

export function generateMetaTags(options: SeoMetaOptions): string {
  const tags: string[] = [];
  
  tags.push(`<title>${escapeHtml(options.title)}</title>`);
  tags.push(`<meta name="description" content="${escapeHtml(options.description)}">`);
  
  if (options.keywords?.length) {
    tags.push(`<meta name="keywords" content="${escapeHtml(options.keywords.join(', '))}">`);
  }
  if (options.author) {
    tags.push(`<meta name="author" content="${escapeHtml(options.author)}">`);
  }
  if (options.canonical) {
    tags.push(`<link rel="canonical" href="${escapeHtml(options.canonical)}">`);
  }
  if (options.robots) {
    tags.push(`<meta name="robots" content="${escapeHtml(options.robots)}">`);
  }
  
  // Open Graph
  tags.push(`<meta property="og:title" content="${escapeHtml(options.ogTitle || options.title)}">`);
  tags.push(`<meta property="og:description" content="${escapeHtml(options.ogDescription || options.description)}">`);
  if (options.ogImage) tags.push(`<meta property="og:image" content="${escapeHtml(options.ogImage)}">`);
  if (options.ogUrl) tags.push(`<meta property="og:url" content="${escapeHtml(options.ogUrl)}">`);
  tags.push(`<meta property="og:type" content="${escapeHtml(options.ogType || 'website')}">`);
  
  // Twitter Card
  tags.push(`<meta name="twitter:card" content="${options.twitterCard || 'summary'}">`);
  tags.push(`<meta name="twitter:title" content="${escapeHtml(options.ogTitle || options.title)}">`);
  tags.push(`<meta name="twitter:description" content="${escapeHtml(options.ogDescription || options.description)}">`);
  if (options.ogImage) tags.push(`<meta name="twitter:image" content="${escapeHtml(options.ogImage)}">`);
  if (options.twitterSite) tags.push(`<meta name="twitter:site" content="${escapeHtml(options.twitterSite)}">`);
  if (options.twitterCreator) tags.push(`<meta name="twitter:creator" content="${escapeHtml(options.twitterCreator)}">`);
  
  return tags.join('\n');
}

// ==================== STRUCTURED DATA (JSON-LD) ====================

export interface ArticleSchema {
  headline: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  publisher?: { name: string; logo?: string };
}

export function generateArticleSchema(article: ArticleSchema): string {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    author: { '@type': 'Person', name: article.author },
    datePublished: article.datePublished,
  };
  
  if (article.dateModified) schema.dateModified = article.dateModified;
  if (article.image) schema.image = article.image;
  if (article.publisher) {
    schema.publisher = {
      '@type': 'Organization',
      name: article.publisher.name,
      ...(article.publisher.logo && { logo: { '@type': 'ImageObject', url: article.publisher.logo } }),
    };
  }
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

export interface OrganizationSchema {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: { street: string; city: string; state: string; postalCode: string; country: string };
  socialProfiles?: string[];
}

export function generateOrganizationSchema(org: OrganizationSchema): string {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    url: org.url,
  };
  
  if (org.logo) schema.logo = org.logo;
  if (org.description) schema.description = org.description;
  if (org.email) schema.email = org.email;
  if (org.phone) schema.telephone = org.phone;
  if (org.address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: org.address.street,
      addressLocality: org.address.city,
      addressRegion: org.address.state,
      postalCode: org.address.postalCode,
      addressCountry: org.address.country,
    };
  }
  if (org.socialProfiles?.length) schema.sameAs = org.socialProfiles;
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

export interface ProductSchema {
  name: string;
  description: string;
  image: string;
  brand: string;
  sku: string;
  price: number;
  currency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: { value: number; count: number };
}

export function generateProductSchema(product: ProductSchema): string {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: { '@type': 'Brand', name: product.brand },
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: `https://schema.org/${product.availability}`,
    },
  };
  
  if (product.rating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.value,
      reviewCount: product.rating.count,
    };
  }
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function generateFaqSchema(items: FaqItem[]): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
  
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

// ==================== SITEMAP ====================

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemap(urls: SitemapUrl[]): string {
  const urlElements = urls.map(url => {
    let element = `  <url>\n    <loc>${escapeXml(url.loc)}</loc>`;
    if (url.lastmod) element += `\n    <lastmod>${url.lastmod}</lastmod>`;
    if (url.changefreq) element += `\n    <changefreq>${url.changefreq}</changefreq>`;
    if (url.priority !== undefined) element += `\n    <priority>${url.priority}</priority>`;
    element += '\n  </url>';
    return element;
  });
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements.join('\n')}
</urlset>`;
}

// ==================== ROBOTS.TXT ====================

export interface RobotsRule {
  userAgent: string;
  allow?: string[];
  disallow?: string[];
  crawlDelay?: number;
}

export function generateRobotsTxt(rules: RobotsRule[], sitemapUrl?: string): string {
  const lines: string[] = [];
  
  for (const rule of rules) {
    lines.push(`User-agent: ${rule.userAgent}`);
    if (rule.allow) rule.allow.forEach(path => lines.push(`Allow: ${path}`));
    if (rule.disallow) rule.disallow.forEach(path => lines.push(`Disallow: ${path}`));
    if (rule.crawlDelay) lines.push(`Crawl-delay: ${rule.crawlDelay}`);
    lines.push('');
  }
  
  if (sitemapUrl) lines.push(`Sitemap: ${sitemapUrl}`);
  
  return lines.join('\n');
}

// ==================== HREFLANG ====================

export interface HreflangEntry {
  lang: string;
  url: string;
}

export function generateHreflangTags(entries: HreflangEntry[], xDefault?: string): string {
  const tags = entries.map(e => 
    `<link rel="alternate" hreflang="${e.lang}" href="${escapeHtml(e.url)}">`
  );
  if (xDefault) {
    tags.push(`<link rel="alternate" hreflang="x-default" href="${escapeHtml(xDefault)}">`);
  }
  return tags.join('\n');
}

// ==================== CANONICAL URL ====================

export function generateCanonicalUrl(
  baseUrl: string,
  path: string,
  options: { removeTrailingSlash?: boolean; lowercase?: boolean; removeWww?: boolean } = {}
): string {
  let url = baseUrl.endsWith('/') ? baseUrl + path.replace(/^\//, '') : baseUrl + '/' + path.replace(/^\//, '');
  
  if (options.removeWww) url = url.replace('://www.', '://');
  if (options.lowercase) url = url.toLowerCase();
  if (options.removeTrailingSlash && url.endsWith('/') && url !== baseUrl + '/') {
    url = url.slice(0, -1);
  }
  
  return url;
}

// ==================== SECURITY HEADERS ====================

export function generateSecurityHeaders(): string {
  return `# Security Headers
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"`;
}
