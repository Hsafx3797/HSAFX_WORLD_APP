import { Skeleton } from '@/components/ui/skeleton';

export default function CategoryLoading() {
  return (
    <div className="container py-8">
      <Skeleton className="h-4 w-24 mb-6" />
      <Skeleton className="h-8 w-48 mb-8" />
      <Skeleton className="min-h-[60vh] w-full rounded-lg" />
    </div>
  );
}
