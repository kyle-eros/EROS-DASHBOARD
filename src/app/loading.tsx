/**
 * @file loading.tsx
 * @description Global loading state component
 * @layer UI
 * @status PLACEHOLDER - Basic loading spinner
 *
 * Shown while page segments are loading.
 */

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
