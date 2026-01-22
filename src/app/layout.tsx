/**
 * @file layout.tsx
 * @description Root layout for the entire application
 * @layer UI
 * @status IMPLEMENTED
 *
 * This is the root layout that wraps all pages.
 * It includes:
 * - HTML structure with lang attribute
 * - Global metadata (title, description)
 * - Inter font from Google Fonts
 * - Providers wrapper (Session, Query)
 * - Toast notifications via Toaster component
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'EROS Ticketing System',
    template: '%s | EROS',
  },
  description:
    'Agency Ticketing System - Structured ticket management for content creator operations. Replaces chaotic chat-based workflows with organized, auditable ticket tracking.',
  keywords: ['ticketing', 'content creator', 'management', 'agency'],
  authors: [{ name: 'EROS Agency' }],
  robots: {
    index: false, // Private application
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
