// Category configuration with mapping to registry categories
export const categoryConfig: Record<string, { 
  name: string; 
  emoji: string; 
  description: string;
  longDescription: string;
  registryCategory: string; // Maps to tool.category.toLowerCase()
  usePopup?: boolean; // Use popup UI for tool execution
}> = {
  text: {
    name: 'Text Tools',
    emoji: '✏️',
    description: 'Text manipulation, formatting, encoding, and analysis tools',
    longDescription: 'A comprehensive collection of text processing tools including case converters, encoding/decoding, string manipulation, text analysis, and formatting utilities.',
    registryCategory: 'text',
    usePopup: false, // Text tools have their own unified converter
  },
  converters: {
    name: 'Data Converters',
    emoji: '🔄',
    description: 'Convert between JSON, XML, YAML, CSV, and more formats',
    longDescription: 'Tools to seamlessly convert data between different formats including JSON, XML, YAML, CSV, TOML, and more. Perfect for data transformation tasks.',
    registryCategory: 'data',
    usePopup: true,
  },
  media: {
    name: 'Media Processors',
    emoji: '🎬',
    description: 'Image conversion, PDF tools, video and audio processing',
    longDescription: 'Process and convert media files including images, PDFs, videos, and audio. Resize, compress, convert formats, and extract data from media files.',
    registryCategory: 'media',
    usePopup: true,
  },
  generators: {
    name: 'Generators',
    emoji: '⚡',
    description: 'UUID, password, QR code, lorem ipsum, and more generators',
    longDescription: 'Generate various types of data including UUIDs, secure passwords, QR codes, placeholder text, random data, and more.',
    registryCategory: 'generator',
    usePopup: true,
  },
  calculators: {
    name: 'Calculators',
    emoji: '🔢',
    description: 'Math, statistics, unit conversion, and financial calculators',
    longDescription: 'Powerful calculation tools for mathematics, statistics, unit conversions, date/time calculations, and financial computations.',
    registryCategory: 'calculator',
    usePopup: true,
  },
  'unit-converters': {
    name: 'Unit Converters',
    emoji: '📐',
    description: 'Length, weight, temperature, and measurement conversions',
    longDescription: 'Convert between different units of measurement including length, weight, temperature, area, volume, speed, and many more.',
    registryCategory: 'converter',
    usePopup: true,
  },
  specialized: {
    name: 'Specialized',
    emoji: '🎯',
    description: 'Islamic calculators, cheque generators, and more',
    longDescription: 'Specialized tools including Islamic calculators (Zakat, Inheritance), financial document generators, and domain-specific utilities.',
    registryCategory: 'specialized',
    usePopup: false, // Specialized tools have unique UIs
  },
};
