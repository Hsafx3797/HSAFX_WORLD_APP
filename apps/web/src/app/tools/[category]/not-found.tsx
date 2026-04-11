import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function CategoryNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-4xl font-bold text-foreground">404</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          This tool category doesn&apos;t exist.
        </p>
        <Button variant="outline" className="mt-6" asChild>
          <Link href="/tools">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to All Tools
          </Link>
        </Button>
      </div>
    </div>
  );
}
