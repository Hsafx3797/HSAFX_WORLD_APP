import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Type,
  Database,
  ImageIcon,
  Sparkles,
  Calculator,
  Ruler,
  TableProperties,
  FolderTree,
  FileText,
  Ship,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'All Tools',
  description: 'Browse all developer tools — text, data, media, generators, calculators, and more.',
};

const categories = [
  { slug: 'text-tools', name: 'Text Tools', icon: Type },
  { slug: 'data-tools', name: 'Data Tools', icon: Database },
  { slug: 'media-tools', name: 'Media Tools', icon: ImageIcon },
  { slug: 'generators', name: 'Generators', icon: Sparkles },
  { slug: 'calculators', name: 'Calculators', icon: Calculator },
  { slug: 'measurement', name: 'Measurement & Validation', icon: Ruler },
  { slug: 'db-schema', name: 'DB & Schema Tools', icon: TableProperties },
  { slug: 'file-structure', name: 'File & Archive Tools', icon: FolderTree },
  { slug: 'cheque-generator', name: 'Cheque Generator', icon: FileText },
  { slug: 'container-tracking', name: 'Container Tracking', icon: Ship },
] as const;

export default function ToolsPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">All Tools</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Pick a category to explore.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Link key={cat.slug} href={`/tools/${cat.slug}`}>
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <cat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{cat.name}</CardTitle>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
