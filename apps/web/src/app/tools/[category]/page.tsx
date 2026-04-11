import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const CATEGORIES: Record<string, { name: string }> = {
  'text-tools': { name: 'Text Tools' },
  'data-tools': { name: 'Data Tools' },
  'media-tools': { name: 'Media Tools' },
  generators: { name: 'Generators' },
  calculators: { name: 'Calculators' },
  measurement: { name: 'Measurement & Validation' },
  'db-schema': { name: 'DB & Schema Tools' },
  'file-structure': { name: 'File & Archive Tools' },
  'cheque-generator': { name: 'Cheque Generator' },
  'container-tracking': { name: 'Container Tracking' },
};

type Params = Promise<{ category: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES[category];
  if (!cat) return { title: 'Not Found' };
  return { title: cat.name };
}

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({ category }));
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { category } = await params;
  const cat = CATEGORIES[category];

  if (!cat) {
    notFound();
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          All Tools
        </Link>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">{cat.name}</h1>

      {/* Custom UI for this category will be built here */}
      <div className="min-h-[60vh] rounded-lg border border-border bg-card" />
    </div>
  );
}
