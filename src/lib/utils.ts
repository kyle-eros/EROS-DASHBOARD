/**
 * @file utils.ts
 * @description General utility functions used throughout the application
 * @layer Utility
 * @status IMPLEMENTED
 *
 * Contains pure, tested utility functions for:
 * - Tailwind class merging (cn)
 * - Date formatting (formatDate, formatRelativeTime)
 * - Ticket number generation (generateTicketNumber)
 * - String manipulation (slugify, truncate, getInitials)
 * - Validation (isValidUUID)
 * - Safe parsing (parseJSON)
 * - Async utilities (sleep)
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import type { TicketType } from '@prisma/client';

/**
 * Ticket type prefixes for generating ticket numbers
 * Maps each ticket type to its 3-letter prefix
 */
const TICKET_TYPE_PREFIXES: Record<TicketType, string> = {
  CUSTOM_VIDEO: 'CVR',
  VIDEO_CALL: 'VCL',
  CONTENT_REQUEST: 'CTR',
  GENERAL_INQUIRY: 'GEN',
  URGENT_ALERT: 'URG',
};

// ============================================================================
// TAILWIND UTILITIES
// ============================================================================

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 * Combines clsx for conditional classes with tailwind-merge for deduplication
 *
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged class string with conflicts resolved
 *
 * @example
 * ```typescript
 * cn('px-4 py-2', 'px-6') // => 'py-2 px-6'
 * cn('bg-red-500', isActive && 'bg-blue-500') // => 'bg-blue-500' if isActive
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Format a date for display
 *
 * @param date - Date object, ISO string, or timestamp
 * @param formatStr - date-fns format string (default: 'MMM d, yyyy')
 * @returns Formatted date string, or empty string if invalid
 *
 * @example
 * ```typescript
 * formatDate(new Date()) // => "Jan 15, 2025"
 * formatDate('2025-01-15T10:30:00Z', 'yyyy-MM-dd') // => "2025-01-15"
 * formatDate('2025-01-15', 'MMMM d, yyyy h:mm a') // => "January 15, 2025 12:00 AM"
 * ```
 */
export function formatDate(date: Date | string | number, formatStr = 'MMM d, yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);

    if (!isValid(dateObj)) {
      return '';
    }

    return format(dateObj, formatStr);
  } catch {
    return '';
  }
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 *
 * @param date - Date object, ISO string, or timestamp
 * @returns Relative time string, or empty string if invalid
 *
 * @example
 * ```typescript
 * formatRelativeTime(new Date(Date.now() - 3600000)) // => "about 1 hour ago"
 * formatRelativeTime('2025-01-14T10:00:00Z') // => "1 day ago"
 * ```
 */
export function formatRelativeTime(date: Date | string | number): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);

    if (!isValid(dateObj)) {
      return '';
    }

    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return '';
  }
}

// ============================================================================
// TICKET UTILITIES
// ============================================================================

/**
 * Generate a human-readable ticket number
 *
 * Format: {TYPE_PREFIX}-{YEAR}-{SEQUENCE}
 * Example: CVR-2025-00001
 *
 * @param type - The ticket type (determines prefix)
 * @param sequenceNumber - The sequential number for this ticket type
 * @returns Formatted ticket number string
 *
 * @example
 * ```typescript
 * generateTicketNumber('CUSTOM_VIDEO', 1) // => "CVR-2025-00001"
 * generateTicketNumber('VIDEO_CALL', 42) // => "VCL-2025-00042"
 * generateTicketNumber('URGENT_ALERT', 999) // => "URG-2025-00999"
 * ```
 */
export function generateTicketNumber(type: TicketType, sequenceNumber: number): string {
  const prefix = TICKET_TYPE_PREFIXES[type];
  const year = new Date().getFullYear();
  const paddedSequence = sequenceNumber.toString().padStart(5, '0');

  return `${prefix}-${year}-${paddedSequence}`;
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Generate a URL-safe slug from a string
 *
 * @param text - The text to convert to a slug
 * @returns URL-safe slug string
 *
 * @example
 * ```typescript
 * slugify('Hello World') // => "hello-world"
 * slugify('  Custom Video Request!  ') // => "custom-video-request"
 * slugify('Test_Multiple___Separators') // => "test-multiple-separators"
 * ```
 */
export function slugify(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Truncate a string to a maximum length with ellipsis
 *
 * @param text - The text to truncate
 * @param length - Maximum length including ellipsis
 * @returns Truncated text with ellipsis if exceeded length
 *
 * @example
 * ```typescript
 * truncate('Hello World', 8) // => "Hello..."
 * truncate('Short', 10) // => "Short"
 * truncate('', 10) // => ""
 * ```
 */
export function truncate(text: string, length: number): string {
  if (!text) return '';
  if (length <= 3) return text.slice(0, length);
  if (text.length <= length) return text;

  return text.slice(0, length - 3) + '...';
}

/**
 * Get initials from a name (up to 2 characters)
 *
 * @param name - Full name to extract initials from
 * @returns Uppercase initials (1-2 characters)
 *
 * @example
 * ```typescript
 * getInitials('John Doe') // => "JD"
 * getInitials('Alice') // => "A"
 * getInitials('John Paul Jones') // => "JJ" (first and last)
 * getInitials('') // => ""
 * ```
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return '';

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  // Return first and last initials
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);

  return (first + last).toUpperCase();
}

/**
 * Capitalize the first letter of a string
 *
 * @param str - String to capitalize
 * @returns String with first letter capitalized
 *
 * @example
 * ```typescript
 * capitalize('hello') // => "Hello"
 * capitalize('WORLD') // => "World"
 * capitalize('') // => ""
 * ```
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * UUID v4 regex pattern for validation
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate if a string is a valid UUID v4
 *
 * @param uuid - String to validate
 * @returns True if valid UUID v4, false otherwise
 *
 * @example
 * ```typescript
 * isValidUUID('550e8400-e29b-41d4-a716-446655440000') // => true
 * isValidUUID('not-a-uuid') // => false
 * isValidUUID('') // => false
 * ```
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  return UUID_REGEX.test(uuid);
}

// ============================================================================
// PARSING UTILITIES
// ============================================================================

/**
 * Safely parse JSON with a fallback value
 *
 * @param json - JSON string to parse
 * @param fallback - Value to return if parsing fails
 * @returns Parsed value or fallback
 *
 * @example
 * ```typescript
 * parseJSON('{"name": "John"}', {}) // => { name: "John" }
 * parseJSON('invalid json', {}) // => {}
 * parseJSON('null', { default: true }) // => null
 * parseJSON('[1, 2, 3]', []) // => [1, 2, 3]
 * ```
 */
export function parseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Sleep for a given number of milliseconds
 * Useful for testing loading states or adding delays
 *
 * @param ms - Number of milliseconds to sleep
 * @returns Promise that resolves after the delay
 *
 * @example
 * ```typescript
 * await sleep(1000); // Wait 1 second
 * await sleep(0); // Yield to event loop
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// ENVIRONMENT UTILITIES
// ============================================================================

/**
 * Check if running on the server (Node.js)
 */
export const isServer = typeof window === 'undefined';

/**
 * Check if running on the client (browser)
 */
export const isClient = !isServer;

/**
 * Check if running in development mode
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = process.env.NODE_ENV === 'production';

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

/**
 * Clamp a number between min and max values
 *
 * @param value - Number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped number
 *
 * @example
 * ```typescript
 * clamp(5, 0, 10) // => 5
 * clamp(-5, 0, 10) // => 0
 * clamp(15, 0, 10) // => 10
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Remove undefined and null values from an object
 * Useful for building query parameters or API payloads
 *
 * @param obj - Object to clean
 * @returns New object without null/undefined values
 *
 * @example
 * ```typescript
 * removeEmpty({ a: 1, b: null, c: undefined, d: '' })
 * // => { a: 1, d: '' }
 * ```
 */
export function removeEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== null && value !== undefined)
  ) as Partial<T>;
}
