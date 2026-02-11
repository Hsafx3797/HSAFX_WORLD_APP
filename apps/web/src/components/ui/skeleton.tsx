'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circle' | 'text';
}

function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-primary/10',
        {
          default: 'rounded-md',
          circle: 'rounded-full',
          text: 'rounded h-4',
        }[variant],
        className
      )}
      {...props}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(i === lines - 1 && 'w-4/5')}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <div className="flex items-center space-x-4">
        <Skeleton variant="circle" className="h-12 w-12" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="mt-4">
        <SkeletonText lines={3} />
      </div>
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard };
