import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ToolNotFound() {
  return (
    <div className="container py-20 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Tool Not Found</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        The tool you're looking for doesn't exist or may have been moved.
        Try searching for it or browse our tools catalog.
      </p>
      <div className="flex justify-center gap-4">
        <Button asChild>
          <Link href="/tools">Browse All Tools</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
