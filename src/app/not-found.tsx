/**
 * @file not-found.tsx
 * @description 404 Not Found page
 * @layer UI
 * @status PLACEHOLDER - Basic 404 UI
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-2 text-6xl font-bold">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">Page Not Found</h2>
        <p className="mb-6 text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
