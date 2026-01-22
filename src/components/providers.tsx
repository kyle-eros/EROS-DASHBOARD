/**
 * @file providers.tsx
 * @description Client-side providers wrapper for the application
 * @layer UI/Infrastructure
 * @status IMPLEMENTED
 *
 * Wraps the application with all necessary providers:
 * - SessionProvider for NextAuth.js authentication
 * - QueryClientProvider for TanStack Query
 * - ThemeProvider if implemented
 *
 * This component is marked as 'use client' since providers need to run on the client.
 */

'use client';

import * as React from 'react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Create a stable QueryClient instance
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important so we don't re-make a new client if React
    // suspends during the initial render.
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Providers component that wraps the application with all necessary providers
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * import { Providers } from '@/components/providers';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <Providers>{children}</Providers>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
