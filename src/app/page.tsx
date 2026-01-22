/**
 * @file page.tsx
 * @description Root page that redirects to dashboard
 * @layer UI
 * @status IMPLEMENTED - Redirects to dashboard
 *
 * The root page immediately redirects authenticated users to the dashboard.
 * Unauthenticated users will be caught by middleware and sent to login.
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard
  // Middleware will handle auth check and redirect to login if needed
  redirect('/dashboard');
}
