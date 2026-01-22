/**
 * @file loading-spinner.tsx
 * @description Loading spinner component
 * @layer UI/Component
 * @status IMPLEMENTED
 *
 * Features:
 * - Multiple sizes (sm, md, lg)
 * - Accessible
 * - Customizable className
 */

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading...',
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)} role="status">
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Full page loading spinner
 */
export function LoadingPage({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}

/**
 * Inline loading spinner with text
 */
export function LoadingInline({
  text = 'Loading...',
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{text}</span>
    </div>
  );
}
