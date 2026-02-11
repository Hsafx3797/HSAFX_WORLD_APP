import { Metadata } from 'next';
import ToolsPageClient from './tools-page-client';
import { toolRegistry } from '@/lib/tools/registry';

export const metadata: Metadata = {
  title: 'All Tools - HSAFX World',
  description: 'Browse our collection of 446+ professional tools across multiple categories',
};

// Tool category configuration with mapping to registry categories
const categories = [
  {
    id: 'text',
    registryCategory: 'text',
    name: 'Text Tools',
    emoji: '✏️',
    description: 'Text manipulation, formatting, encoding, and analysis tools',
    color: 'from-primary/10 to-chart-5/10 border-primary/20',
    href: '/tools/text-converter',
  },
  {
    id: 'converters',
    registryCategory: 'data',
    name: 'Data Converters',
    emoji: '🔄',
    description: 'Convert between JSON, XML, YAML, CSV, and more formats',
    color: 'from-success/10 to-chart-2/10 border-success/20',
  },
  {
    id: 'media',
    registryCategory: 'media',
    name: 'Media Processors',
    emoji: '🎬',
    description: 'Image conversion, PDF tools, video and audio processing',
    color: 'from-chart-4/10 to-chart-1/10 border-chart-4/20',
  },
  {
    id: 'generators',
    registryCategory: 'generator',
    name: 'Generators',
    emoji: '⚡',
    description: 'UUID, password, QR code, lorem ipsum, and more generators',
    color: 'from-warning/10 to-chart-3/10 border-warning/20',
  },
  {
    id: 'calculators',
    registryCategory: 'calculator',
    name: 'Calculators',
    emoji: '🔢',
    description: 'Math, statistics, unit conversion, and financial calculators',
    color: 'from-destructive/10 to-chart-1/10 border-destructive/20',
  },
  {
    id: 'unit-converters',
    registryCategory: 'converter',
    name: 'Unit Converters',
    emoji: '📐',
    description: 'Length, weight, temperature, and measurement conversions',
    color: 'from-chart-5/10 to-primary/10 border-chart-5/20',
  },
  {
    id: 'specialized',
    registryCategory: 'specialized',
    name: 'Specialized',
    emoji: '🎯',
    description: 'Schema Visualizer, File Trees, Islamic calculators, and more',
    color: 'from-success/10 to-chart-2/10 border-success/20',
  },
];

// Get tools grouped by registry category (lowercase)
function getToolsByRegistryCategory() {
  const tools = toolRegistry;
  const grouped: Record<string, typeof tools> = {};
  
  for (const tool of tools) {
    const category = tool.category.toLowerCase();
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category]!.push(tool);
  }
  
  return grouped;
}

export default function ToolsPage() {
  const toolsByRegistryCategory = getToolsByRegistryCategory();
  const totalTools = toolRegistry.length;

  return (
    <ToolsPageClient 
      categories={categories}
      toolsByRegistryCategory={toolsByRegistryCategory}
      allTools={toolRegistry}
      totalTools={totalTools}
    />
  );
}
