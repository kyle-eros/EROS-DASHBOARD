/**
 * @file skeleton.tsx
 * @description Skeleton loading placeholder component
 * @layer UI/Base
 * @status IMPLEMENTED
 */

import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-primary/10', className)}
      {...props}
    />
  );
}

export { Skeleton };
