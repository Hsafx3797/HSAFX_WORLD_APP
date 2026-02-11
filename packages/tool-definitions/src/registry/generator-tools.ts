/**
 * Generator Tools Registry
 * Category: Generator
 * Subcategories: ID, Security, Text, Visual, SEO, CSS, Number, Date
 */

import type { ToolMetadata } from '../types';

export const generatorTools: ToolMetadata[] = [
  // =====================================================
  // ID GENERATORS
  // =====================================================

  {
    id: 'uuid-v1', name: 'UUID v1 Generator', description: 'Generate time-based UUID v1', category: 'Generator', subcategory: 'ID', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'count', type: 'number', label: 'Number of UUIDs to Generate', description: 'How many UUID v1 identifiers to create', min: 1, max: 100, defaultValue: 1 },
    ]
  },
  {
    id: 'uuid-v4', name: 'UUID v4 Generator', description: 'Generate random UUID v4', category: 'Generator', subcategory: 'ID', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'count', type: 'number', label: 'Number of UUIDs to Generate', description: 'How many UUID v4 identifiers to create', min: 1, max: 100, defaultValue: 1 },
    ]
  },
  {
    id: 'uuid-v5', name: 'UUID v5 Generator', description: 'Generate UUID v5 from namespace', category: 'Generator', subcategory: 'ID', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'name', type: 'text', label: 'Name String', description: 'The name to hash (e.g., domain name, URL, or identifier)', placeholder: 'example.com', required: true },
      {
        name: 'namespace', type: 'select', label: 'Namespace Type', description: 'Predefined namespace for UUID generation', options: [
          { value: 'dns', label: 'DNS (Domain Names)' }, { value: 'url', label: 'URL (Web Addresses)' }, { value: 'oid', label: 'OID (Object Identifiers)' }, { value: 'x500', label: 'X500 (Distinguished Names)' }, { value: 'custom', label: 'Custom (Enter UUID)' },
        ], defaultValue: 'dns'
      },
      { name: 'customNamespace', type: 'text', label: 'Custom Namespace UUID', description: 'Enter a valid UUID for custom namespace', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
      { name: 'count', type: 'number', label: 'Number of UUIDs to Generate', min: 1, max: 100, defaultValue: 1 },
    ]
  },

  // =====================================================
  // SECURITY GENERATORS
  // =====================================================

  {
    id: 'password-generator', name: 'Password Generator', description: 'Generate secure passwords', category: 'Generator', subcategory: 'Security', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'length', type: 'number', label: 'Password Length', min: 4, max: 128, defaultValue: 16 },
      { name: 'uppercase', type: 'checkbox', label: 'Uppercase (A-Z)', defaultValue: true },
      { name: 'lowercase', type: 'checkbox', label: 'Lowercase (a-z)', defaultValue: true },
      { name: 'numbers', type: 'checkbox', label: 'Numbers (0-9)', defaultValue: true },
      { name: 'symbols', type: 'checkbox', label: 'Symbols (!@#$%^&*)', defaultValue: true },
      { name: 'excludeAmbiguous', type: 'checkbox', label: 'Exclude Ambiguous Characters (0O1lI)', defaultValue: false },
      { name: 'requireAll', type: 'checkbox', label: 'Require at Least One of Each Selected Type', defaultValue: false },
      { name: 'count', type: 'number', label: 'Number of Passwords', min: 1, max: 50, defaultValue: 1 },
      { name: 'showStrength', type: 'checkbox', label: 'Show Password Strength Analysis', defaultValue: true },
    ]
  },
  {
    id: 'hash-generator', name: 'Hash Generator', description: 'MD5, SHA1, SHA256 hashes', category: 'Generator', subcategory: 'Security', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'input', type: 'textarea', label: 'Input Text', required: true },
      {
        name: 'algorithm', type: 'select', label: 'Algorithm', options: [
          { value: 'md5', label: 'MD5' }, { value: 'sha1', label: 'SHA-1' }, { value: 'sha256', label: 'SHA-256' }, { value: 'sha512', label: 'SHA-512' }, { value: 'sha384', label: 'SHA-384' }, { value: 'sha3-256', label: 'SHA3-256' },
        ], defaultValue: 'sha256'
      },
      {
        name: 'encoding', type: 'select', label: 'Output Encoding', options: [
          { value: 'hex', label: 'Hexadecimal' }, { value: 'base64', label: 'Base64' }, { value: 'binary', label: 'Binary' },
        ], defaultValue: 'hex'
      },
      { name: 'uppercase', type: 'checkbox', label: 'Uppercase Output', defaultValue: false },
    ]
  },
  {
    id: 'api-key-generator', name: 'API Key Generator', description: 'Generate secure API keys', category: 'Generator', subcategory: 'Security', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'length', type: 'number', label: 'Key Length (excluding prefix)', min: 16, max: 128, defaultValue: 32 },
      { name: 'prefix', type: 'text', label: 'Key Prefix', placeholder: 'sk_, pk_, api_', defaultValue: 'sk_' },
      {
        name: 'encoding', type: 'select', label: 'Character Set', options: [
          { value: 'alphanumeric', label: 'Alphanumeric (A-Za-z0-9)' }, { value: 'alphanumericLower', label: 'Alphanumeric Lowercase (a-z0-9)' }, { value: 'base64', label: 'Base64 (URL-safe)' }, { value: 'hex', label: 'Hexadecimal' },
        ], defaultValue: 'alphanumeric'
      },
      { name: 'includeSeparators', type: 'checkbox', label: 'Include Dashes in Key (e.g., sk-xxx-xxx)', defaultValue: false },
      { name: 'count', type: 'number', label: 'Number of Keys', min: 1, max: 50, defaultValue: 1 },
    ]
  },
  {
    id: 'jwt-generator', name: 'JWT Generator', description: 'Create JWT tokens', category: 'Generator', subcategory: 'Security', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'payload', type: 'textarea', label: 'Payload (JSON)', placeholder: '{"sub": "1234567890", "name": "John Doe"}', required: true },
      { name: 'secret', type: 'text', label: 'Secret Key', description: 'Use a strong, random secret for production', required: true },
      {
        name: 'algorithm', type: 'select', label: 'Algorithm', options: [
          { value: 'HS256', label: 'HS256 (HMAC SHA-256)' }, { value: 'HS384', label: 'HS384 (HMAC SHA-384)' }, { value: 'HS512', label: 'HS512 (HMAC SHA-512)' },
        ], defaultValue: 'HS256'
      },
      { name: 'expiresIn', type: 'text', label: 'Expires In', placeholder: '1h, 7d, 30m', defaultValue: '1h' },
      { name: 'issuer', type: 'text', label: 'Issuer (iss)', placeholder: 'your-app.com' },
      { name: 'audience', type: 'text', label: 'Audience (aud)', placeholder: 'your-api' },
      { name: 'includeIssuedAt', type: 'checkbox', label: 'Include Issued At (iat)', defaultValue: true },
    ]
  },
  {
    id: 'password-strength', name: 'Password Strength Analyzer', description: 'Real-time password strength analysis with detailed feedback', category: 'Generator', subcategory: 'Security', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'password', type: 'text', label: 'Enter Password to Analyze', required: true },
      { name: 'showTimeToCrack', type: 'checkbox', label: 'Show Estimated Time to Crack', defaultValue: true },
      { name: 'showRequirements', type: 'checkbox', label: 'Show Requirements Checklist', defaultValue: true },
      { name: 'showSuggestions', type: 'checkbox', label: 'Show Improvement Suggestions', defaultValue: true },
      { name: 'checkCommonPasswords', type: 'checkbox', label: 'Check Against Common Passwords', defaultValue: true },
      { name: 'checkLeakedPasswords', type: 'checkbox', label: 'Check if Password Was Leaked (HIBP)', defaultValue: false },
      {
        name: 'strengthScale', type: 'select', label: 'Strength Display', options: [
          { value: 'simple', label: 'Simple (Weak/Medium/Strong)' }, { value: 'detailed', label: 'Detailed (0-100 score)' }, { value: 'visual', label: 'Visual Progress Bar' },
        ], defaultValue: 'detailed'
      },
    ]
  },

  // =====================================================
  // TEXT GENERATORS
  // =====================================================

  {
    id: 'lorem-ipsum', name: 'Lorem Ipsum Generator', description: 'Generate placeholder text', category: 'Generator', subcategory: 'Text', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'count', type: 'number', label: 'Amount', description: 'Number of units to generate', min: 1, max: 100, defaultValue: 5 },
      {
        name: 'unit', type: 'select', label: 'Unit Type', options: [
          { value: 'words', label: 'Words' }, { value: 'sentences', label: 'Sentences' }, { value: 'paragraphs', label: 'Paragraphs' },
        ], defaultValue: 'paragraphs'
      },
      { name: 'startWithLorem', type: 'checkbox', label: 'Start with "Lorem ipsum dolor sit amet..."', defaultValue: true },
    ]
  },
  {
    id: 'username-generator', name: 'Username / Name Generator', description: 'Generate random names', category: 'Generator', subcategory: 'Text', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      {
        name: 'category', type: 'select', label: 'Name Category', options: [
          { value: 'adjNoun', label: 'Adjective + Noun (e.g., SwiftEagle)' },
          { value: 'firstName', label: 'First Names (Human)' },
          { value: 'fullName', label: 'Full Names (First + Last)' },
          { value: 'fantasy', label: 'Fantasy Names (Elven, Dwarven)' },
          { value: 'scifi', label: 'Sci-Fi Names (Futuristic)' },
          { value: 'anime', label: 'Anime-Style Names' },
          { value: 'gamer', label: 'Gamer Tags (xXShadowXx style)' },
          { value: 'medieval', label: 'Medieval Names' },
          { value: 'pirate', label: 'Pirate Names' },
          { value: 'superhero', label: 'Superhero Names' },
          { value: 'villain', label: 'Villain Names' },
          { value: 'food', label: 'Food-Based Names' },
          { value: 'animal', label: 'Animal Names' },
          { value: 'nature', label: 'Nature-Inspired Names' },
          { value: 'tech', label: 'Tech/Hacker Names' },
          { value: 'cute', label: 'Cute/Kawaii Names' },
          { value: 'dark', label: 'Dark/Gothic Names' },
          { value: 'royal', label: 'Royal/Noble Names' },
          { value: 'warrior', label: 'Warrior Names' },
          { value: 'wizard', label: 'Wizard/Mage Names' },
          { value: 'random', label: 'Completely Random' },
        ], defaultValue: 'adjNoun'
      },
      { name: 'yourWord', type: 'text', label: 'Include Your Word (Optional)', placeholder: 'e.g., Storm, Night, Star' },
      {
        name: 'wordPosition', type: 'select', label: 'Your Word Position', options: [
          { value: 'prefix', label: 'Prefix (before generated word)' }, { value: 'suffix', label: 'Suffix (after generated word)' }, { value: 'random', label: 'Random Position' },
        ], defaultValue: 'prefix'
      },
      { name: 'startLetter', type: 'text', label: 'Start with Letter (Optional)', placeholder: 'A-Z', maxLength: 1 },
      { name: 'minLength', type: 'number', label: 'Min Length', min: 3, max: 30, defaultValue: 6 },
      { name: 'maxLength', type: 'number', label: 'Max Length', min: 3, max: 30, defaultValue: 16 },
      {
        name: 'separator', type: 'select', label: 'Word Separator', options: [
          { value: 'none', label: 'None (CamelCase)' }, { value: '_', label: 'Underscore (_)' }, { value: '-', label: 'Dash (-)' }, { value: '.', label: 'Dot (.)' },
        ], defaultValue: 'none'
      },
      { name: 'includeNumbers', type: 'checkbox', label: 'Add Random Numbers', defaultValue: false },
      { name: 'count', type: 'number', label: 'Number of Names to Generate', min: 1, max: 50, defaultValue: 5 },
    ]
  },
  {
    id: 'quote-generator', name: 'Random Quote Generator', description: 'Generate random quotes', category: 'Generator', subcategory: 'Text', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      {
        name: 'category', type: 'select', label: 'Category', options: [
          { value: 'inspirational', label: 'Inspirational' }, { value: 'motivational', label: 'Motivational' }, { value: 'wisdom', label: 'Wisdom' }, { value: 'funny', label: 'Funny' }, { value: 'love', label: 'Love' }, { value: 'life', label: 'Life' }, { value: 'success', label: 'Success' }, { value: 'philosophy', label: 'Philosophy' }, { value: 'science', label: 'Science' }, { value: 'random', label: 'Random' },
        ], defaultValue: 'inspirational'
      },
      {
        name: 'lengthPreference', type: 'select', label: 'Quote Length', options: [
          { value: 'short', label: 'Short (1-2 sentences)' }, { value: 'medium', label: 'Medium (3-4 sentences)' }, { value: 'long', label: 'Long (paragraph)' }, { value: 'any', label: 'Any Length' },
        ], defaultValue: 'any'
      },
      { name: 'includeAuthor', type: 'checkbox', label: 'Include Author Attribution', defaultValue: true },
      { name: 'count', type: 'number', label: 'Number of Quotes', min: 1, max: 20, defaultValue: 1 },
    ]
  },
  {
    id: 'emoji-picker', name: 'Emoji / Symbol Picker Generator', description: 'Pick and search emojis', category: 'Generator', subcategory: 'Text', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'search', type: 'text', label: 'Search Emoji', placeholder: 'smile, heart, fire...' },
      {
        name: 'category', type: 'select', label: 'Category', options: [
          { value: 'all', label: 'All Emojis' }, { value: 'smileys', label: '😀 Smileys & Emotion' }, { value: 'people', label: '👋 People & Body' }, { value: 'animals', label: '🐱 Animals & Nature' }, { value: 'food', label: '🍕 Food & Drink' }, { value: 'travel', label: '✈️ Travel & Places' }, { value: 'activities', label: '⚽ Activities' }, { value: 'objects', label: '💡 Objects' }, { value: 'symbols', label: '❤️ Symbols' }, { value: 'flags', label: '🏳️ Flags' },
        ], defaultValue: 'all'
      },
      {
        name: 'skinTone', type: 'select', label: 'Default Skin Tone', options: [
          { value: 'default', label: '✋ Default (Yellow)' }, { value: 'light', label: '✋🏻 Light' }, { value: 'mediumLight', label: '✋🏼 Medium-Light' }, { value: 'medium', label: '✋🏽 Medium' }, { value: 'mediumDark', label: '✋🏾 Medium-Dark' }, { value: 'dark', label: '✋🏿 Dark' },
        ], defaultValue: 'default'
      },
      { name: 'showRecentlyUsed', type: 'checkbox', label: 'Show Recently Used', defaultValue: true },
      {
        name: 'outputFormat', type: 'select', label: 'Copy Format', options: [
          { value: 'emoji', label: 'Emoji Character' }, { value: 'unicode', label: 'Unicode (U+1F600)' }, { value: 'html', label: 'HTML Entity (&#128512;)' }, { value: 'shortcode', label: 'Shortcode (:smile:)' },
        ], defaultValue: 'emoji'
      },
    ]
  },

  // =====================================================
  // VISUAL GENERATORS
  // =====================================================

  {
    id: 'qr-barcode', name: 'QR Code / Barcode Generator', description: 'Generate QR codes and barcodes', category: 'Generator', subcategory: 'Visual', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'file',
    options: [
      { name: 'content', type: 'textarea', label: 'Content', description: 'Data to encode in QR/barcode', required: true },
      {
        name: 'type', type: 'select', label: 'Code Type', options: [
          { value: 'qr', label: 'QR Code' }, { value: 'code128', label: 'Code 128' }, { value: 'code39', label: 'Code 39' }, { value: 'ean13', label: 'EAN-13' }, { value: 'ean8', label: 'EAN-8' }, { value: 'upc', label: 'UPC-A' }, { value: 'itf14', label: 'ITF-14' }, { value: 'datamatrix', label: 'Data Matrix' },
        ], defaultValue: 'qr'
      },
      { name: 'size', type: 'number', label: 'Size (px)', min: 64, max: 1024, step: 32, defaultValue: 256 },
      {
        name: 'errorCorrection', type: 'select', label: 'Error Correction (QR only)', description: 'Higher = more redundancy, larger code', options: [
          { value: 'L', label: 'Low (7%)' }, { value: 'M', label: 'Medium (15%)' }, { value: 'Q', label: 'Quartile (25%)' }, { value: 'H', label: 'High (30%)' },
        ], defaultValue: 'M'
      },
      { name: 'foreground', type: 'color', label: 'Foreground Color', defaultValue: '#000000' },
      { name: 'background', type: 'color', label: 'Background Color', defaultValue: '#ffffff' },
      {
        name: 'imageFormat', type: 'select', label: 'Output Format', options: [
          { value: 'png', label: 'PNG' }, { value: 'svg', label: 'SVG' }, { value: 'jpeg', label: 'JPEG' },
        ], defaultValue: 'png'
      },
      { name: 'includeMargin', type: 'checkbox', label: 'Include Quiet Zone (Margin)', defaultValue: true },
    ]
  },
  {
    id: 'signature-generator', name: 'Signature / Monogram Generator', description: 'Generate signature graphics', category: 'Generator', subcategory: 'Visual', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'json', outputType: 'file',
    options: [
      { name: 'name', type: 'text', label: 'Name / Text', required: true },
      {
        name: 'style', type: 'select', label: 'Signature Style', options: [
          { value: 'cursive', label: 'Cursive Script' }, { value: 'elegant', label: 'Elegant Calligraphy' }, { value: 'casual', label: 'Casual Handwriting' }, { value: 'monogram', label: 'Monogram (Initials)' }, { value: 'initials', label: 'Stylized Initials' }, { value: 'bold', label: 'Bold Signature' }, { value: 'artistic', label: 'Artistic Flourish' },
        ], defaultValue: 'cursive'
      },
      { name: 'strokeWidth', type: 'number', label: 'Stroke Width', min: 1, max: 10, defaultValue: 2 },
      { name: 'color', type: 'color', label: 'Ink Color', defaultValue: '#000000' },
      { name: 'backgroundColor', type: 'color', label: 'Background Color', defaultValue: '#ffffff' },
      { name: 'transparentBackground', type: 'checkbox', label: 'Transparent Background', defaultValue: false },
      { name: 'width', type: 'number', label: 'Width (px)', min: 100, max: 800, defaultValue: 400 },
      { name: 'height', type: 'number', label: 'Height (px)', min: 50, max: 400, defaultValue: 150 },
      {
        name: 'imageFormat', type: 'select', label: 'Output Format', options: [
          { value: 'png', label: 'PNG' }, { value: 'svg', label: 'SVG' },
        ], defaultValue: 'png'
      },
    ]
  },
  {
    id: 'color-palette', name: 'Color Scheme / Palette Generator', description: 'Generate color palettes', category: 'Generator', subcategory: 'Visual', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'baseColor', type: 'color', label: 'Base Color', defaultValue: '#3498db' },
      { name: 'additionalColors', type: 'text', label: 'Additional Base Colors (comma-separated hex)', placeholder: '#e74c3c, #2ecc71' },
      {
        name: 'scheme', type: 'select', label: 'Color Scheme', options: [
          { value: 'complementary', label: 'Complementary (2 colors)' }, { value: 'analogous', label: 'Analogous (3 colors)' }, { value: 'triadic', label: 'Triadic (3 colors)' }, { value: 'tetradic', label: 'Tetradic/Square (4 colors)' }, { value: 'split-complementary', label: 'Split-Complementary (3 colors)' }, { value: 'monochromatic', label: 'Monochromatic (shades)' }, { value: 'gradient', label: 'Gradient Steps' },
        ], defaultValue: 'complementary'
      },
      { name: 'count', type: 'number', label: 'Number of Colors', min: 2, max: 20, defaultValue: 5 },
      { name: 'includeTintsShades', type: 'checkbox', label: 'Include Tints & Shades', defaultValue: false },
      {
        name: 'outputFormat', type: 'select', label: 'Color Format', options: [
          { value: 'hex', label: 'HEX (#RRGGBB)' }, { value: 'rgb', label: 'RGB' }, { value: 'hsl', label: 'HSL' }, { value: 'all', label: 'All Formats' },
        ], defaultValue: 'hex'
      },
    ]
  },
  {
    id: 'favicon-generator', name: 'Favicon Generator', description: 'Generate favicons from text/icon', category: 'Generator', subcategory: 'Visual', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      {
        name: 'sourceType', type: 'select', label: 'Create From', options: [
          { value: 'text', label: 'Text/Letter' }, { value: 'emoji', label: 'Emoji' }, { value: 'image', label: 'Upload Image' },
        ], defaultValue: 'text'
      },
      { name: 'text', type: 'text', label: 'Text/Letter', maxLength: 2, placeholder: 'A', description: 'For text favicon (1-2 characters)' },
      { name: 'emoji', type: 'text', label: 'Emoji', placeholder: '🚀', description: 'For emoji favicon' },
      { name: 'backgroundColor', type: 'color', label: 'Background Color', defaultValue: '#3498db' },
      { name: 'textColor', type: 'color', label: 'Text Color', defaultValue: '#ffffff' },
      { name: 'rounded', type: 'checkbox', label: 'Rounded Corners', defaultValue: false },
      { name: 'borderRadius', type: 'number', label: 'Border Radius (%)', min: 0, max: 50, defaultValue: 20 },
      {
        name: 'sizes', type: 'select', label: 'Output Sizes', options: [
          { value: 'all', label: 'All Standard Sizes (16, 32, 48, 180, 192, 512)' }, { value: 'minimal', label: 'Minimal (16, 32, 180)' }, { value: 'ico', label: 'ICO Only' },
        ], defaultValue: 'all'
      },
      { name: 'generateManifest', type: 'checkbox', label: 'Generate Web Manifest', defaultValue: true },
    ]
  },
  {
    id: 'placeholder-image', name: 'Random Lorem Pics / Placeholder Images', description: 'Generate placeholder images', category: 'Generator', subcategory: 'Visual', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'width', type: 'number', label: 'Width (px)', min: 50, max: 4000, defaultValue: 640 },
      { name: 'height', type: 'number', label: 'Height (px)', min: 50, max: 4000, defaultValue: 480 },
      {
        name: 'category', type: 'select', label: 'Image Category', options: [
          { value: 'any', label: 'Any / Random' }, { value: 'nature', label: 'Nature' }, { value: 'city', label: 'City / Urban' }, { value: 'tech', label: 'Technology' }, { value: 'animals', label: 'Animals' }, { value: 'people', label: 'People' }, { value: 'food', label: 'Food' }, { value: 'abstract', label: 'Abstract' }, { value: 'business', label: 'Business' }, { value: 'sports', label: 'Sports' }, { value: 'fashion', label: 'Fashion' }, { value: 'architecture', label: 'Architecture' },
        ], defaultValue: 'any'
      },
      {
        name: 'service', type: 'select', label: 'Image Service', options: [
          { value: 'picsum', label: 'Lorem Picsum' }, { value: 'placeholder', label: 'Placeholder.com' }, { value: 'placehold', label: 'Placehold.co' }, { value: 'dummyimage', label: 'DummyImage' },
        ], defaultValue: 'picsum'
      },
      { name: 'grayscale', type: 'checkbox', label: 'Grayscale', defaultValue: false },
      { name: 'blur', type: 'number', label: 'Blur Amount (px)', min: 0, max: 10, defaultValue: 0 },
      { name: 'text', type: 'text', label: 'Custom Text (for placeholder services)', placeholder: 'Your text here' },
      { name: 'backgroundColor', type: 'color', label: 'Background Color (solid)', defaultValue: '#cccccc' },
      { name: 'textColor', type: 'color', label: 'Text Color', defaultValue: '#333333' },
      { name: 'count', type: 'number', label: 'Number of Images', min: 1, max: 10, defaultValue: 1 },
    ]
  },
  {
    id: 'vcard-qr-generator', name: 'QR Code with vCard / Contact Info', description: 'Generate vCard QR codes', category: 'Generator', subcategory: 'Visual', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'file',
    options: [
      { name: 'firstName', type: 'text', label: 'First Name', required: true },
      { name: 'lastName', type: 'text', label: 'Last Name', required: true },
      { name: 'email', type: 'text', label: 'Email', placeholder: 'john@example.com' },
      { name: 'phone', type: 'text', label: 'Phone', placeholder: '+1 (555) 123-4567' },
      { name: 'mobile', type: 'text', label: 'Mobile Phone' },
      { name: 'company', type: 'text', label: 'Company / Organization' },
      { name: 'title', type: 'text', label: 'Job Title' },
      { name: 'website', type: 'text', label: 'Website URL', placeholder: 'https://example.com' },
      { name: 'addressStreet', type: 'text', label: 'Street Address' },
      { name: 'addressCity', type: 'text', label: 'City' },
      { name: 'addressState', type: 'text', label: 'State / Province' },
      { name: 'addressZip', type: 'text', label: 'Postal Code' },
      { name: 'addressCountry', type: 'text', label: 'Country' },
      { name: 'note', type: 'textarea', label: 'Notes' },
      { name: 'size', type: 'number', label: 'QR Code Size (px)', min: 128, max: 1024, defaultValue: 256 },
      {
        name: 'errorCorrection', type: 'select', label: 'Error Correction', options: [
          { value: 'L', label: 'Low (7%)' }, { value: 'M', label: 'Medium (15%)' }, { value: 'Q', label: 'Quartile (25%)' }, { value: 'H', label: 'High (30%)' },
        ], defaultValue: 'M'
      },
      { name: 'foreground', type: 'color', label: 'QR Code Color', defaultValue: '#000000' },
      { name: 'background', type: 'color', label: 'Background Color', defaultValue: '#ffffff' },
      {
        name: 'imageFormat', type: 'select', label: 'Output Format', options: [
          { value: 'png', label: 'PNG' }, { value: 'svg', label: 'SVG' },
        ], defaultValue: 'png'
      },
    ]
  },

  // =====================================================
  // SEO GENERATORS
  // =====================================================

  {
    id: 'meta-tags-generator', name: 'Meta Tags Generator', description: 'Generate SEO meta tags', category: 'Generator', subcategory: 'SEO', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'title', type: 'text', label: 'Page Title', description: 'Recommended: 50-60 characters', maxLength: 70, required: true },
      { name: 'description', type: 'textarea', label: 'Meta Description', description: 'Recommended: 150-160 characters', maxLength: 200, required: true },
      { name: 'keywords', type: 'textarea', label: 'Keywords (one per line or comma-separated)', placeholder: 'keyword1, keyword2, keyword3' },
      { name: 'author', type: 'text', label: 'Author Name' },
      { name: 'canonicalUrl', type: 'text', label: 'Canonical URL', placeholder: 'https://example.com/page' },
      {
        name: 'pageType', type: 'select', label: 'Page Type', options: [
          { value: 'website', label: 'Website' }, { value: 'article', label: 'Article' }, { value: 'blog', label: 'Blog Post' }, { value: 'product', label: 'Product' }, { value: 'profile', label: 'Profile' },
        ], defaultValue: 'website'
      },
      { name: 'includeSocialTags', type: 'checkbox', label: 'Include Open Graph & Twitter Cards', defaultValue: true },
      { name: 'ogImage', type: 'text', label: 'Social Share Image URL', placeholder: 'https://example.com/image.jpg' },
      { name: 'twitterHandle', type: 'text', label: 'Twitter Handle', placeholder: '@username' },
      {
        name: 'robots', type: 'select', label: 'Robot Directives', options: [
          { value: 'index,follow', label: 'Index, Follow (default)' }, { value: 'noindex,follow', label: 'No Index, Follow' }, { value: 'index,nofollow', label: 'Index, No Follow' }, { value: 'noindex,nofollow', label: 'No Index, No Follow' },
        ], defaultValue: 'index,follow'
      },
    ]
  },
  {
    id: 'sitemap-generator', name: 'Sitemap Generator', description: 'Generate XML sitemaps', category: 'Generator', subcategory: 'SEO', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'urls', type: 'textarea', label: 'URLs (one per line)', description: 'Enter full URLs including https://', required: true },
      { name: 'baseUrl', type: 'text', label: 'Base URL', placeholder: 'https://example.com', description: 'Prepended to relative URLs' },
      {
        name: 'changefreq', type: 'select', label: 'Change Frequency', options: [
          { value: 'always', label: 'Always' }, { value: 'hourly', label: 'Hourly' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }, { value: 'never', label: 'Never' },
        ], defaultValue: 'weekly'
      },
      { name: 'priority', type: 'number', label: 'Default Priority', description: '0.0 to 1.0', min: 0, max: 1, step: 0.1, defaultValue: 0.8 },
      { name: 'includeLastmod', type: 'checkbox', label: 'Include Last Modified Date', defaultValue: true },
    ]
  },
  {
    id: 'robots-txt-generator', name: 'Robots.txt Generator', description: 'Generate robots.txt', category: 'Generator', subcategory: 'SEO', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'userAgent', type: 'text', label: 'User Agent', description: 'Use * for all bots', defaultValue: '*' },
      { name: 'disallow', type: 'textarea', label: 'Disallow Paths (one per line)', placeholder: '/admin/\n/private/' },
      { name: 'allow', type: 'textarea', label: 'Allow Paths (one per line)', placeholder: '/public/' },
      { name: 'sitemap', type: 'text', label: 'Sitemap URL', placeholder: 'https://example.com/sitemap.xml' },
      { name: 'crawlDelay', type: 'number', label: 'Crawl Delay (seconds)', min: 0, max: 60, defaultValue: 0 },
      {
        name: 'preset', type: 'select', label: 'Quick Preset', options: [
          { value: 'custom', label: 'Custom (use above)' }, { value: 'allowAll', label: 'Allow All' }, { value: 'disallowAll', label: 'Disallow All' }, { value: 'standard', label: 'Standard (block admin, api)' },
        ], defaultValue: 'custom'
      },
    ]
  },
  {
    id: 'htaccess-generator', name: '.htaccess Generator', description: 'Generate .htaccess rules', category: 'Generator', subcategory: 'SEO', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      {
        name: 'useCase', type: 'select', label: 'Primary Use Case', options: [
          { value: 'custom', label: 'Custom Configuration' }, { value: 'wordpress', label: 'WordPress' }, { value: 'spa', label: 'Single Page App (SPA)' }, { value: 'static', label: 'Static Site' },
        ], defaultValue: 'custom'
      },
      { name: 'httpsRedirect', type: 'checkbox', label: 'Force HTTPS', defaultValue: true },
      {
        name: 'wwwRedirect', type: 'select', label: 'WWW Redirect', options: [
          { value: 'none', label: 'None' }, { value: 'add', label: 'Add WWW' }, { value: 'remove', label: 'Remove WWW' },
        ], defaultValue: 'none'
      },
      { name: 'compression', type: 'checkbox', label: 'Enable Gzip Compression', defaultValue: true },
      { name: 'caching', type: 'checkbox', label: 'Enable Browser Caching', defaultValue: true },
      { name: 'expiresDays', type: 'number', label: 'Cache Expiry (days)', min: 1, max: 365, defaultValue: 30 },
      { name: 'securityHeaders', type: 'checkbox', label: 'Add Security Headers', defaultValue: false },
      { name: 'hotlinkProtection', type: 'checkbox', label: 'Hotlink Protection', defaultValue: false },
      { name: 'customRedirects', type: 'textarea', label: 'Custom Redirects (old|new per line)', placeholder: '/old-page|/new-page' },
    ]
  },
  {
    id: 'og-meta-generator', name: 'Open Graph / Twitter Card Generator', description: 'Generate social meta tags', category: 'Generator', subcategory: 'SEO', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'title', type: 'text', label: 'Title', maxLength: 70, required: true },
      { name: 'description', type: 'textarea', label: 'Description', maxLength: 200, required: true },
      { name: 'image', type: 'text', label: 'Image URL', placeholder: 'https://example.com/image.jpg (1200x630 recommended)' },
      { name: 'url', type: 'text', label: 'Page URL', required: true },
      {
        name: 'type', type: 'select', label: 'Content Type', options: [
          { value: 'website', label: 'Website' }, { value: 'article', label: 'Article' }, { value: 'product', label: 'Product' }, { value: 'video', label: 'Video' }, { value: 'music', label: 'Music' }, { value: 'profile', label: 'Profile' },
        ], defaultValue: 'website'
      },
      { name: 'siteName', type: 'text', label: 'Site Name', placeholder: 'Your Site Name' },
      {
        name: 'twitterCardType', type: 'select', label: 'Twitter Card Type', options: [
          { value: 'summary', label: 'Summary (square image)' }, { value: 'summary_large_image', label: 'Summary Large Image' }, { value: 'player', label: 'Player (video/audio)' },
        ], defaultValue: 'summary_large_image'
      },
      { name: 'twitterSite', type: 'text', label: 'Twitter Site Handle', placeholder: '@sitehandle' },
      { name: 'twitterCreator', type: 'text', label: 'Twitter Creator Handle', placeholder: '@authorhandle' },
      { name: 'locale', type: 'text', label: 'Locale', placeholder: 'en_US', defaultValue: 'en_US' },
    ]
  },
  {
    id: 'canonical-url-generator', name: 'Canonical URL Generator', description: 'Generate canonical URLs', category: 'Generator', subcategory: 'SEO', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'url', type: 'text', label: 'URL', placeholder: 'https://example.com/page?utm=123', required: true },
      { name: 'baseUrl', type: 'text', label: 'Base URL (optional)', placeholder: 'https://example.com' },
      { name: 'removeQueryParams', type: 'checkbox', label: 'Remove Query Parameters', defaultValue: true },
      { name: 'removeTrailingSlash', type: 'checkbox', label: 'Remove Trailing Slash', defaultValue: true },
      { name: 'forceLowercase', type: 'checkbox', label: 'Force Lowercase', defaultValue: true },
      { name: 'forceHttps', type: 'checkbox', label: 'Force HTTPS', defaultValue: true },
      { name: 'preserveParams', type: 'text', label: 'Preserve These Params (comma-separated)', placeholder: 'page, category' },
    ]
  },
  {
    id: 'seo-slug-generator', name: 'SEO-Friendly URL / Slug Generator', description: 'Generate SEO slugs', category: 'Generator', subcategory: 'SEO', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'text', type: 'text', label: 'Text to Convert', placeholder: 'My Amazing Blog Post Title!', required: true },
      {
        name: 'separator', type: 'select', label: 'Word Separator', options: [
          { value: '-', label: 'Hyphen (-)' }, { value: '_', label: 'Underscore (_)' },
        ], defaultValue: '-'
      },
      { name: 'lowercase', type: 'checkbox', label: 'Convert to Lowercase', defaultValue: true },
      { name: 'maxLength', type: 'number', label: 'Max Length', min: 10, max: 200, defaultValue: 60 },
      { name: 'removeStopWords', type: 'checkbox', label: 'Remove Stop Words (the, a, an, etc.)', defaultValue: false },
      {
        name: 'locale', type: 'select', label: 'Transliteration Locale', description: 'For converting accented characters', options: [
          { value: 'en', label: 'English' }, { value: 'de', label: 'German' }, { value: 'fr', label: 'French' }, { value: 'es', label: 'Spanish' }, { value: 'ar', label: 'Arabic' }, { value: 'zh', label: 'Chinese (Pinyin)' },
        ], defaultValue: 'en'
      },
    ]
  },

  // =====================================================
  // CSS GENERATORS
  // =====================================================

  {
    id: 'gradient-generator', name: 'Gradient Generator', description: 'Generate CSS gradients with live preview', category: 'Generator', subcategory: 'CSS', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      {
        name: 'type', type: 'select', label: 'Gradient Type', options: [
          { value: 'linear', label: 'Linear Gradient' }, { value: 'radial', label: 'Radial Gradient' }, { value: 'conic', label: 'Conic Gradient' }, { value: 'repeating-linear', label: 'Repeating Linear' }, { value: 'repeating-radial', label: 'Repeating Radial' },
        ], defaultValue: 'linear'
      },
      { name: 'color1', type: 'color', label: 'Color 1', defaultValue: '#3498db' },
      { name: 'color1Stop', type: 'number', label: 'Color 1 Stop (%)', min: 0, max: 100, defaultValue: 0 },
      { name: 'color2', type: 'color', label: 'Color 2', defaultValue: '#2ecc71' },
      { name: 'color2Stop', type: 'number', label: 'Color 2 Stop (%)', min: 0, max: 100, defaultValue: 100 },
      { name: 'color3', type: 'color', label: 'Color 3 (optional)', defaultValue: '' },
      { name: 'color3Stop', type: 'number', label: 'Color 3 Stop (%)', min: 0, max: 100, defaultValue: 50 },
      { name: 'angle', type: 'number', label: 'Angle (degrees)', min: 0, max: 360, step: 1, defaultValue: 90 },
      {
        name: 'radialShape', type: 'select', label: 'Radial Shape', options: [
          { value: 'circle', label: 'Circle' }, { value: 'ellipse', label: 'Ellipse' },
        ], defaultValue: 'circle'
      },
      {
        name: 'radialPosition', type: 'select', label: 'Radial Position', options: [
          { value: 'center', label: 'Center' }, { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' },
        ], defaultValue: 'center'
      },
    ]
  },
  {
    id: 'box-shadow-generator', name: 'Box Shadow Generator', description: 'Generate CSS box shadows with live preview', category: 'Generator', subcategory: 'CSS', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'offsetX', type: 'number', label: 'Horizontal Offset', min: -100, max: 100, defaultValue: 5 },
      { name: 'offsetY', type: 'number', label: 'Vertical Offset', min: -100, max: 100, defaultValue: 5 },
      { name: 'blur', type: 'number', label: 'Blur Radius', min: 0, max: 100, defaultValue: 10 },
      { name: 'spread', type: 'number', label: 'Spread Radius', min: -50, max: 50, defaultValue: 0 },
      {
        name: 'unit', type: 'select', label: 'Unit', options: [
          { value: 'px', label: 'Pixels (px)' }, { value: 'rem', label: 'REM' }, { value: 'em', label: 'EM' },
        ], defaultValue: 'px'
      },
      { name: 'color', type: 'color', label: 'Shadow Color', defaultValue: '#000000' },
      { name: 'opacity', type: 'number', label: 'Opacity (%)', min: 0, max: 100, defaultValue: 30 },
      { name: 'inset', type: 'checkbox', label: 'Inset (Inner Shadow)', defaultValue: false },
      { name: 'addSecondShadow', type: 'checkbox', label: 'Add Second Shadow Layer', defaultValue: false },
      { name: 'shadow2OffsetX', type: 'number', label: 'Shadow 2 Offset X', min: -100, max: 100, defaultValue: 0 },
      { name: 'shadow2OffsetY', type: 'number', label: 'Shadow 2 Offset Y', min: -100, max: 100, defaultValue: 0 },
      { name: 'shadow2Blur', type: 'number', label: 'Shadow 2 Blur', min: 0, max: 100, defaultValue: 20 },
      { name: 'shadow2Color', type: 'color', label: 'Shadow 2 Color', defaultValue: '#000000' },
    ]
  },
  {
    id: 'flexbox-generator', name: 'Flexbox Generator', description: 'Generate flexbox CSS with live preview', category: 'Generator', subcategory: 'CSS', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      {
        name: 'direction', type: 'select', label: 'Flex Direction', options: [
          { value: 'row', label: 'Row (→)' }, { value: 'column', label: 'Column (↓)' }, { value: 'row-reverse', label: 'Row Reverse (←)' }, { value: 'column-reverse', label: 'Column Reverse (↑)' },
        ], defaultValue: 'row'
      },
      {
        name: 'justify', type: 'select', label: 'Justify Content (main axis)', options: [
          { value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'flex-end', label: 'End' },
          { value: 'space-between', label: 'Space Between' }, { value: 'space-around', label: 'Space Around' }, { value: 'space-evenly', label: 'Space Evenly' },
        ], defaultValue: 'flex-start'
      },
      {
        name: 'align', type: 'select', label: 'Align Items (cross axis)', options: [
          { value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'flex-end', label: 'End' }, { value: 'stretch', label: 'Stretch' }, { value: 'baseline', label: 'Baseline' },
        ], defaultValue: 'stretch'
      },
      {
        name: 'alignContent', type: 'select', label: 'Align Content (multi-line)', options: [
          { value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'flex-end', label: 'End' }, { value: 'stretch', label: 'Stretch' }, { value: 'space-between', label: 'Space Between' }, { value: 'space-around', label: 'Space Around' },
        ], defaultValue: 'stretch'
      },
      {
        name: 'wrap', type: 'select', label: 'Flex Wrap', options: [
          { value: 'nowrap', label: 'No Wrap' }, { value: 'wrap', label: 'Wrap' }, { value: 'wrap-reverse', label: 'Wrap Reverse' },
        ], defaultValue: 'nowrap'
      },
      { name: 'gap', type: 'number', label: 'Gap', min: 0, max: 100, defaultValue: 10 },
      { name: 'rowGap', type: 'number', label: 'Row Gap', min: 0, max: 100, defaultValue: 10 },
      {
        name: 'gapUnit', type: 'select', label: 'Gap Unit', options: [
          { value: 'px', label: 'Pixels (px)' }, { value: 'rem', label: 'REM' }, { value: '%', label: 'Percent (%)' },
        ], defaultValue: 'px'
      },
      { name: 'itemCount', type: 'number', label: 'Preview Items', min: 1, max: 12, defaultValue: 4 },
    ]
  },
  {
    id: 'grid-generator', name: 'Grid Generator', description: 'Generate CSS grid with live preview', category: 'Generator', subcategory: 'CSS', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'columns', type: 'number', label: 'Number of Columns', min: 1, max: 24, defaultValue: 3 },
      { name: 'rows', type: 'number', label: 'Number of Rows', min: 1, max: 24, defaultValue: 2 },
      { name: 'columnGap', type: 'number', label: 'Column Gap', min: 0, max: 100, defaultValue: 10 },
      { name: 'rowGap', type: 'number', label: 'Row Gap', min: 0, max: 100, defaultValue: 10 },
      {
        name: 'gapUnit', type: 'select', label: 'Gap Unit', options: [
          { value: 'px', label: 'Pixels (px)' }, { value: 'rem', label: 'REM' }, { value: '%', label: 'Percent (%)' },
        ], defaultValue: 'px'
      },
      {
        name: 'columnSizing', type: 'select', label: 'Column Sizing', options: [
          { value: '1fr', label: 'Equal Width (1fr)' }, { value: 'auto', label: 'Auto (content-based)' }, { value: 'minmax', label: 'Minmax (responsive)' }, { value: 'fit-content', label: 'Fit Content' },
        ], defaultValue: '1fr'
      },
      { name: 'minColumnWidth', type: 'number', label: 'Min Column Width (for minmax)', min: 50, max: 500, defaultValue: 200 },
      {
        name: 'justifyItems', type: 'select', label: 'Justify Items', options: [
          { value: 'stretch', label: 'Stretch' }, { value: 'start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'end', label: 'End' },
        ], defaultValue: 'stretch'
      },
      {
        name: 'alignItems', type: 'select', label: 'Align Items', options: [
          { value: 'stretch', label: 'Stretch' }, { value: 'start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'end', label: 'End' },
        ], defaultValue: 'stretch'
      },
      {
        name: 'autoFlow', type: 'select', label: 'Auto Flow', options: [
          { value: 'row', label: 'Row' }, { value: 'column', label: 'Column' }, { value: 'dense', label: 'Dense' },
        ], defaultValue: 'row'
      },
    ]
  },
  {
    id: 'border-radius-generator', name: 'Border Radius Generator', description: 'Generate border radius with live preview', category: 'Generator', subcategory: 'CSS', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'allCorners', type: 'number', label: 'All Corners', min: 0, max: 200, defaultValue: 10 },
      { name: 'individualCorners', type: 'checkbox', label: 'Set Individual Corners', defaultValue: false },
      { name: 'topLeft', type: 'number', label: 'Top Left', min: 0, max: 200, defaultValue: 10 },
      { name: 'topRight', type: 'number', label: 'Top Right', min: 0, max: 200, defaultValue: 10 },
      { name: 'bottomRight', type: 'number', label: 'Bottom Right', min: 0, max: 200, defaultValue: 10 },
      { name: 'bottomLeft', type: 'number', label: 'Bottom Left', min: 0, max: 200, defaultValue: 10 },
      {
        name: 'unit', type: 'select', label: 'Unit', options: [
          { value: 'px', label: 'Pixels (px)' }, { value: '%', label: 'Percent (%)' }, { value: 'rem', label: 'REM' }, { value: 'em', label: 'EM' },
        ], defaultValue: 'px'
      },
      { name: 'previewWidth', type: 'number', label: 'Preview Width', min: 50, max: 400, defaultValue: 200 },
      { name: 'previewHeight', type: 'number', label: 'Preview Height', min: 50, max: 400, defaultValue: 200 },
      { name: 'previewColor', type: 'color', label: 'Preview Color', defaultValue: '#3498db' },
    ]
  },
  {
    id: 'color-palette-generator', name: 'Color Palette Generator', description: 'Generate CSS color scales', category: 'Generator', subcategory: 'CSS', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'json',
    options: [
      { name: 'baseColor', type: 'color', label: 'Base Color', defaultValue: '#3498db' },
      { name: 'shades', type: 'number', label: 'Number of Shades', min: 3, max: 15, defaultValue: 10 },
      { name: 'includeLighter', type: 'checkbox', label: 'Include Lighter Shades', defaultValue: true },
      { name: 'includeDarker', type: 'checkbox', label: 'Include Darker Shades', defaultValue: true },
      {
        name: 'outputFormat', type: 'select', label: 'Output Format', options: [
          { value: 'hex', label: 'HEX' }, { value: 'rgb', label: 'RGB' }, { value: 'hsl', label: 'HSL' }, { value: 'cssVariables', label: 'CSS Variables' }, { value: 'tailwind', label: 'Tailwind Config' },
        ], defaultValue: 'hex'
      },
      { name: 'variablePrefix', type: 'text', label: 'CSS Variable Prefix', placeholder: 'color-primary', defaultValue: 'color' },
    ]
  },
  {
    id: 'clip-path-generator', name: 'CSS Clip-Path / Shape Generator', description: 'Generate clip-path shapes with live preview', category: 'Generator', subcategory: 'CSS', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      {
        name: 'shape', type: 'select', label: 'Shape', options: [
          { value: 'circle', label: 'Circle' },
          { value: 'ellipse', label: 'Ellipse' },
          { value: 'inset', label: 'Inset (Rectangle)' },
          { value: 'triangle', label: 'Triangle' },
          { value: 'triangleRight', label: 'Triangle (Right)' },
          { value: 'triangleLeft', label: 'Triangle (Left)' },
          { value: 'triangleDown', label: 'Triangle (Down)' },
          { value: 'trapezoid', label: 'Trapezoid' },
          { value: 'trapezoidTop', label: 'Trapezoid (Top)' },
          { value: 'parallelogram', label: 'Parallelogram' },
          { value: 'parallelogramRight', label: 'Parallelogram (Right)' },
          { value: 'rhombus', label: 'Rhombus / Diamond' },
          { value: 'pentagon', label: 'Pentagon' },
          { value: 'hexagon', label: 'Hexagon' },
          { value: 'heptagon', label: 'Heptagon (7 sides)' },
          { value: 'octagon', label: 'Octagon' },
          { value: 'nonagon', label: 'Nonagon (9 sides)' },
          { value: 'decagon', label: 'Decagon (10 sides)' },
          { value: 'star', label: 'Star (5 points)' },
          { value: 'star6', label: 'Star (6 points)' },
          { value: 'cross', label: 'Cross / Plus' },
          { value: 'arrow', label: 'Arrow (Right)' },
          { value: 'arrowLeft', label: 'Arrow (Left)' },
          { value: 'arrowUp', label: 'Arrow (Up)' },
          { value: 'arrowDown', label: 'Arrow (Down)' },
          { value: 'chevronRight', label: 'Chevron (Right)' },
          { value: 'chevronLeft', label: 'Chevron (Left)' },
          { value: 'rabbet', label: 'Rabbet' },
          { value: 'leftArrow', label: 'Left Point' },
          { value: 'rightArrow', label: 'Right Point' },
          { value: 'frameCorner', label: 'Frame / Corner Cut' },
          { value: 'bevel', label: 'Bevel' },
          { value: 'message', label: 'Message Bubble' },
          { value: 'close', label: 'Close / X' },
          { value: 'custom', label: 'Custom Polygon' },
        ], defaultValue: 'circle'
      },
      { name: 'circleRadius', type: 'number', label: 'Circle Radius (%)', min: 1, max: 100, defaultValue: 50 },
      { name: 'ellipseX', type: 'number', label: 'Ellipse X Radius (%)', min: 1, max: 100, defaultValue: 50 },
      { name: 'ellipseY', type: 'number', label: 'Ellipse Y Radius (%)', min: 1, max: 100, defaultValue: 30 },
      { name: 'insetTop', type: 'number', label: 'Inset Top (%)', min: 0, max: 50, defaultValue: 10 },
      { name: 'insetRight', type: 'number', label: 'Inset Right (%)', min: 0, max: 50, defaultValue: 10 },
      { name: 'insetBottom', type: 'number', label: 'Inset Bottom (%)', min: 0, max: 50, defaultValue: 10 },
      { name: 'insetLeft', type: 'number', label: 'Inset Left (%)', min: 0, max: 50, defaultValue: 10 },
      { name: 'customPolygon', type: 'textarea', label: 'Custom Polygon Points', placeholder: '50% 0%, 100% 50%, 50% 100%, 0% 50%' },
      { name: 'previewColor', type: 'color', label: 'Preview Color', defaultValue: '#3498db' },
    ]
  },
  {
    id: 'filter-generator', name: 'CSS Filter Generator', description: 'Generate CSS filters with live preview', category: 'Generator', subcategory: 'CSS', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'blur', type: 'number', label: 'Blur (px)', min: 0, max: 50, defaultValue: 0 },
      { name: 'brightness', type: 'number', label: 'Brightness (%)', min: 0, max: 300, defaultValue: 100 },
      { name: 'contrast', type: 'number', label: 'Contrast (%)', min: 0, max: 300, defaultValue: 100 },
      { name: 'grayscale', type: 'number', label: 'Grayscale (%)', min: 0, max: 100, defaultValue: 0 },
      { name: 'saturate', type: 'number', label: 'Saturate (%)', min: 0, max: 300, defaultValue: 100 },
      { name: 'sepia', type: 'number', label: 'Sepia (%)', min: 0, max: 100, defaultValue: 0 },
      { name: 'hueRotate', type: 'number', label: 'Hue Rotate (deg)', min: 0, max: 360, defaultValue: 0 },
      { name: 'invert', type: 'number', label: 'Invert (%)', min: 0, max: 100, defaultValue: 0 },
      { name: 'opacity', type: 'number', label: 'Opacity (%)', min: 0, max: 100, defaultValue: 100 },
      { name: 'dropShadowX', type: 'number', label: 'Drop Shadow X (px)', min: -50, max: 50, defaultValue: 0 },
      { name: 'dropShadowY', type: 'number', label: 'Drop Shadow Y (px)', min: -50, max: 50, defaultValue: 0 },
      { name: 'dropShadowBlur', type: 'number', label: 'Drop Shadow Blur (px)', min: 0, max: 50, defaultValue: 0 },
      { name: 'dropShadowColor', type: 'color', label: 'Drop Shadow Color', defaultValue: '#000000' },
    ]
  },
  {
    id: 'transform-animation-generator', name: 'CSS Transform / Animation Generator', description: 'Generate transforms and animations with live preview', category: 'Generator', subcategory: 'CSS', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'translateX', type: 'number', label: 'Translate X', min: -500, max: 500, defaultValue: 0 },
      { name: 'translateY', type: 'number', label: 'Translate Y', min: -500, max: 500, defaultValue: 0 },
      { name: 'translateZ', type: 'number', label: 'Translate Z', min: -500, max: 500, defaultValue: 0 },
      {
        name: 'translateUnit', type: 'select', label: 'Translate Unit', options: [
          { value: 'px', label: 'Pixels (px)' }, { value: '%', label: 'Percent (%)' }, { value: 'rem', label: 'REM' },
        ], defaultValue: 'px'
      },
      { name: 'rotate', type: 'number', label: 'Rotate (deg)', min: -360, max: 360, defaultValue: 0 },
      { name: 'rotateX', type: 'number', label: 'Rotate X (deg)', min: -360, max: 360, defaultValue: 0 },
      { name: 'rotateY', type: 'number', label: 'Rotate Y (deg)', min: -360, max: 360, defaultValue: 0 },
      { name: 'scaleX', type: 'number', label: 'Scale X', min: 0, max: 5, step: 0.1, defaultValue: 1 },
      { name: 'scaleY', type: 'number', label: 'Scale Y', min: 0, max: 5, step: 0.1, defaultValue: 1 },
      { name: 'skewX', type: 'number', label: 'Skew X (deg)', min: -90, max: 90, defaultValue: 0 },
      { name: 'skewY', type: 'number', label: 'Skew Y (deg)', min: -90, max: 90, defaultValue: 0 },
      { name: 'perspective', type: 'number', label: 'Perspective (px)', min: 0, max: 2000, defaultValue: 0 },
      { name: 'generateAnimation', type: 'checkbox', label: 'Generate Animation Keyframes', defaultValue: false },
      { name: 'animationDuration', type: 'number', label: 'Animation Duration (s)', min: 0.1, max: 10, step: 0.1, defaultValue: 1 },
      {
        name: 'animationTiming', type: 'select', label: 'Timing Function', options: [
          { value: 'ease', label: 'Ease' }, { value: 'linear', label: 'Linear' }, { value: 'ease-in', label: 'Ease In' }, { value: 'ease-out', label: 'Ease Out' }, { value: 'ease-in-out', label: 'Ease In Out' },
        ], defaultValue: 'ease'
      },
      { name: 'animationIterations', type: 'text', label: 'Iterations', placeholder: '1 or infinite', defaultValue: '1' },
    ]
  },
  {
    id: 'typography-generator', name: 'CSS Typography / Text Shadow Generator', description: 'Generate typography CSS with live preview', category: 'Generator', subcategory: 'CSS', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      {
        name: 'fontFamily', type: 'select', label: 'Font Family', options: [
          { value: 'Inter', label: 'Inter' }, { value: 'Roboto', label: 'Roboto' }, { value: 'Open Sans', label: 'Open Sans' }, { value: 'Lato', label: 'Lato' }, { value: 'Montserrat', label: 'Montserrat' }, { value: 'Poppins', label: 'Poppins' }, { value: 'Nunito', label: 'Nunito' }, { value: 'Raleway', label: 'Raleway' }, { value: 'Source Sans Pro', label: 'Source Sans Pro' }, { value: 'Ubuntu', label: 'Ubuntu' }, { value: 'Oswald', label: 'Oswald' }, { value: 'Merriweather', label: 'Merriweather' }, { value: 'Playfair Display', label: 'Playfair Display' }, { value: 'Lora', label: 'Lora' }, { value: 'PT Serif', label: 'PT Serif' }, { value: 'Libre Baskerville', label: 'Libre Baskerville' }, { value: 'Crimson Text', label: 'Crimson Text' }, { value: 'Fira Code', label: 'Fira Code' }, { value: 'JetBrains Mono', label: 'JetBrains Mono' }, { value: 'Source Code Pro', label: 'Source Code Pro' }, { value: 'Roboto Mono', label: 'Roboto Mono' }, { value: 'IBM Plex Mono', label: 'IBM Plex Mono' }, { value: 'Space Mono', label: 'Space Mono' }, { value: 'Inconsolata', label: 'Inconsolata' }, { value: 'Courier Prime', label: 'Courier Prime' }, { value: 'Dancing Script', label: 'Dancing Script' }, { value: 'Pacifico', label: 'Pacifico' }, { value: 'Great Vibes', label: 'Great Vibes' }, { value: 'Satisfy', label: 'Satisfy' }, { value: 'Lobster', label: 'Lobster' }, { value: 'Comfortaa', label: 'Comfortaa' }, { value: 'Quicksand', label: 'Quicksand' }, { value: 'Josefin Sans', label: 'Josefin Sans' }, { value: 'Work Sans', label: 'Work Sans' }, { value: 'Cabin', label: 'Cabin' }, { value: 'Karla', label: 'Karla' }, { value: 'Rubik', label: 'Rubik' }, { value: 'Mulish', label: 'Mulish' }, { value: 'Barlow', label: 'Barlow' }, { value: 'DM Sans', label: 'DM Sans' }, { value: 'Noto Sans', label: 'Noto Sans' }, { value: 'Archivo', label: 'Archivo' }, { value: 'Manrope', label: 'Manrope' }, { value: 'Space Grotesk', label: 'Space Grotesk' }, { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' }, { value: 'Outfit', label: 'Outfit' }, { value: 'Lexend', label: 'Lexend' }, { value: 'Sora', label: 'Sora' }, { value: 'Be Vietnam Pro', label: 'Be Vietnam Pro' }, { value: 'Red Hat Display', label: 'Red Hat Display' }, { value: 'system-ui', label: 'System UI' }, { value: 'sans-serif', label: 'Sans Serif (generic)' }, { value: 'serif', label: 'Serif (generic)' }, { value: 'monospace', label: 'Monospace (generic)' },
        ], defaultValue: 'Inter'
      },
      { name: 'fontSize', type: 'number', label: 'Font Size', min: 8, max: 144, defaultValue: 16 },
      {
        name: 'fontSizeUnit', type: 'select', label: 'Font Size Unit', options: [
          { value: 'px', label: 'Pixels (px)' }, { value: 'rem', label: 'REM' }, { value: 'em', label: 'EM' }, { value: 'vw', label: 'VW' },
        ], defaultValue: 'px'
      },
      {
        name: 'fontWeight', type: 'select', label: 'Font Weight', options: [
          { value: '100', label: '100 - Thin' }, { value: '200', label: '200 - Extra Light' }, { value: '300', label: '300 - Light' }, { value: '400', label: '400 - Regular' }, { value: '500', label: '500 - Medium' }, { value: '600', label: '600 - Semi Bold' }, { value: '700', label: '700 - Bold' }, { value: '800', label: '800 - Extra Bold' }, { value: '900', label: '900 - Black' },
        ], defaultValue: '400'
      },
      { name: 'lineHeight', type: 'number', label: 'Line Height', min: 0.5, max: 4, step: 0.1, defaultValue: 1.5 },
      { name: 'letterSpacing', type: 'number', label: 'Letter Spacing (px)', min: -10, max: 50, step: 0.5, defaultValue: 0 },
      { name: 'wordSpacing', type: 'number', label: 'Word Spacing (px)', min: -10, max: 50, defaultValue: 0 },
      { name: 'textColor', type: 'color', label: 'Text Color', defaultValue: '#333333' },
      {
        name: 'textTransform', type: 'select', label: 'Text Transform', options: [
          { value: 'none', label: 'None' }, { value: 'uppercase', label: 'UPPERCASE' }, { value: 'lowercase', label: 'lowercase' }, { value: 'capitalize', label: 'Capitalize' },
        ], defaultValue: 'none'
      },
      {
        name: 'fontStyle', type: 'select', label: 'Font Style', options: [
          { value: 'normal', label: 'Normal' }, { value: 'italic', label: 'Italic' },
        ], defaultValue: 'normal'
      },
      { name: 'addTextShadow', type: 'checkbox', label: 'Add Text Shadow', defaultValue: false },
      { name: 'textShadowX', type: 'number', label: 'Shadow X (px)', min: -20, max: 20, defaultValue: 2 },
      { name: 'textShadowY', type: 'number', label: 'Shadow Y (px)', min: -20, max: 20, defaultValue: 2 },
      { name: 'textShadowBlur', type: 'number', label: 'Shadow Blur (px)', min: 0, max: 30, defaultValue: 4 },
      { name: 'textShadowColor', type: 'color', label: 'Shadow Color', defaultValue: '#000000' },
      { name: 'previewText', type: 'text', label: 'Preview Text', defaultValue: 'The quick brown fox jumps over the lazy dog' },
    ]
  },

  // =====================================================
  // NUMBER GENERATORS
  // =====================================================

  {
    id: 'random-number', name: 'Random Number Generator', description: 'Generate random numbers', category: 'Generator', subcategory: 'Number', tier: 'free', costType: 'free', execution: 'client', inputType: 'json', outputType: 'text',
    options: [
      { name: 'min', type: 'number', label: 'Minimum Value', defaultValue: 0 },
      { name: 'max', type: 'number', label: 'Maximum Value', defaultValue: 100 },
      { name: 'count', type: 'number', label: 'How Many Numbers', min: 1, max: 1000, defaultValue: 1 },
      { name: 'unique', type: 'checkbox', label: 'Unique Numbers Only', defaultValue: false },
      { name: 'allowDecimals', type: 'checkbox', label: 'Allow Decimal Numbers', defaultValue: false },
      { name: 'decimalPlaces', type: 'number', label: 'Decimal Places', min: 1, max: 10, defaultValue: 2 },
      {
        name: 'distribution', type: 'select', label: 'Distribution', options: [
          { value: 'uniform', label: 'Uniform (Equal chance)' }, { value: 'normal', label: 'Normal (Bell curve)' }, { value: 'exponential', label: 'Exponential' },
        ], defaultValue: 'uniform'
      },
      {
        name: 'sortOrder', type: 'select', label: 'Sort Results', options: [
          { value: 'none', label: 'No Sorting' }, { value: 'asc', label: 'Ascending' }, { value: 'desc', label: 'Descending' },
        ], defaultValue: 'none'
      },
    ]
  },

  // =====================================================
  // DATE GENERATORS
  // =====================================================

  {
    id: 'timestamp-converter', name: 'Timestamp Converter', description: 'Epoch ↔ Human Readable with timezone support', category: 'Generator', subcategory: 'Date', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'json',
    options: [
      { name: 'input', type: 'text', label: 'Input Value', description: 'Enter timestamp (10 or 13 digits) or date string', placeholder: '1672531200 or 2024-01-01 00:00:00', required: true },
      {
        name: 'direction', type: 'select', label: 'Conversion Direction', options: [
          { value: 'auto', label: 'Auto-Detect' }, { value: 'toEpoch', label: 'Date → Epoch Timestamp' }, { value: 'fromEpoch', label: 'Epoch Timestamp → Date' },
        ], defaultValue: 'auto'
      },
      {
        name: 'inputTimezone', type: 'select', label: 'Input Timezone', options: [
          { value: 'local', label: 'Local Timezone' }, { value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'Eastern (ET)' }, { value: 'America/Chicago', label: 'Central (CT)' }, { value: 'America/Denver', label: 'Mountain (MT)' }, { value: 'America/Los_Angeles', label: 'Pacific (PT)' }, { value: 'Europe/London', label: 'London (GMT/BST)' }, { value: 'Europe/Paris', label: 'Paris (CET)' }, { value: 'Europe/Berlin', label: 'Berlin (CET)' }, { value: 'Asia/Tokyo', label: 'Tokyo (JST)' }, { value: 'Asia/Shanghai', label: 'Shanghai (CST)' }, { value: 'Asia/Dubai', label: 'Dubai (GST)' }, { value: 'Asia/Kolkata', label: 'India (IST)' }, { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
        ], defaultValue: 'local'
      },
      {
        name: 'outputTimezone', type: 'select', label: 'Output Timezone', options: [
          { value: 'local', label: 'Local Timezone' }, { value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'Eastern (ET)' }, { value: 'America/Chicago', label: 'Central (CT)' }, { value: 'America/Denver', label: 'Mountain (MT)' }, { value: 'America/Los_Angeles', label: 'Pacific (PT)' }, { value: 'Europe/London', label: 'London (GMT/BST)' }, { value: 'Europe/Paris', label: 'Paris (CET)' }, { value: 'Europe/Berlin', label: 'Berlin (CET)' }, { value: 'Asia/Tokyo', label: 'Tokyo (JST)' }, { value: 'Asia/Shanghai', label: 'Shanghai (CST)' }, { value: 'Asia/Dubai', label: 'Dubai (GST)' }, { value: 'Asia/Kolkata', label: 'India (IST)' }, { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
        ], defaultValue: 'UTC'
      },
      {
        name: 'timestampUnit', type: 'select', label: 'Timestamp Unit', options: [
          { value: 'auto', label: 'Auto-Detect' }, { value: 'seconds', label: 'Seconds (Unix)' }, { value: 'milliseconds', label: 'Milliseconds (JS)' },
        ], defaultValue: 'auto'
      },
      {
        name: 'outputFormat', type: 'select', label: 'Date Output Format', options: [
          { value: 'iso', label: 'ISO 8601 (2024-01-01T00:00:00Z)' }, { value: 'rfc2822', label: 'RFC 2822 (Mon, 01 Jan 2024 00:00:00 +0000)' }, { value: 'shortDate', label: 'Short Date (01/01/2024)' }, { value: 'longDate', label: 'Long Date (January 1, 2024)' }, { value: 'shortDateTime', label: 'Short DateTime (01/01/2024 12:00 AM)' }, { value: 'longDateTime', label: 'Long DateTime (January 1, 2024 12:00:00 AM)' }, { value: 'relative', label: 'Relative (e.g., 2 days ago)' }, { value: 'all', label: 'Show All Formats' },
        ], defaultValue: 'all'
      },
      { name: 'showRelativeTime', type: 'checkbox', label: 'Show Relative Time (e.g., "3 days ago")', defaultValue: true },
      { name: 'showWeekday', type: 'checkbox', label: 'Show Day of Week', defaultValue: true },
      { name: 'showWeekNumber', type: 'checkbox', label: 'Show Week Number', defaultValue: false },
    ]
  },
];
