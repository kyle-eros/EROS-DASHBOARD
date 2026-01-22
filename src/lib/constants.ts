/**
 * @file constants.ts
 * @description Application-wide constants and configuration
 * @layer Configuration
 * @status IMPLEMENTED
 *
 * Contains all static configuration values used throughout the application:
 * - Application metadata
 * - Pagination defaults
 * - Ticket type, status, and priority configurations
 * - User role configurations and permissions
 * - Valid status transitions (state machine)
 * - Date format strings
 * - API and dashboard routes
 */

import type {
  TicketType,
  TicketStatus,
  TicketPriority,
  UserRole,
} from '@prisma/client';

// ============================================================================
// APPLICATION METADATA
// ============================================================================

/**
 * Application name used in UI and metadata
 */
export const APP_NAME = 'EROS Ticketing System';

/**
 * Application description for SEO and metadata
 */
export const APP_DESCRIPTION =
  'Agency Ticketing System - Structured ticket management for content creator operations. Replaces chaotic chat-based workflows with organized, auditable ticket tracking.';

/**
 * Application version - matches package.json
 */
export const APP_VERSION = '0.1.0';

// ============================================================================
// PAGINATION DEFAULTS
// ============================================================================

/**
 * Default number of items per page for list views
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Maximum items per page (prevents memory issues)
 */
export const MAX_PAGE_SIZE = 100;

/**
 * Available page size options for pagination controls
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// ============================================================================
// TICKET TYPE CONFIGURATION
// ============================================================================

/**
 * Ticket type prefixes for generating ticket numbers
 */
export const TICKET_TYPE_PREFIXES: Record<TicketType, string> = {
  CUSTOM_VIDEO: 'CVR',
  VIDEO_CALL: 'VCL',
  CONTENT_REQUEST: 'CTR',
  GENERAL_INQUIRY: 'GEN',
  URGENT_ALERT: 'URG',
} as const;

/**
 * Configuration for each ticket type including display labels, colors, and icons
 */
export const TICKET_TYPE_CONFIG: Record<
  TicketType,
  {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    textColor: string;
    icon: string;
    defaultPriority: TicketPriority;
  }
> = {
  CUSTOM_VIDEO: {
    label: 'Custom Video',
    description: 'Custom video requests from fans',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: 'Video',
    defaultPriority: 'MEDIUM',
  },
  VIDEO_CALL: {
    label: 'Video Call',
    description: 'Scheduled video call requests',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: 'VideoIcon',
    defaultPriority: 'HIGH',
  },
  CONTENT_REQUEST: {
    label: 'Content Request',
    description: 'Content scheduling and production requests',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: 'FileImage',
    defaultPriority: 'MEDIUM',
  },
  GENERAL_INQUIRY: {
    label: 'General Inquiry',
    description: 'General questions and feedback',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: 'HelpCircle',
    defaultPriority: 'LOW',
  },
  URGENT_ALERT: {
    label: 'Urgent Alert',
    description: 'High-priority urgent matters',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: 'AlertTriangle',
    defaultPriority: 'URGENT',
  },
} as const;

// ============================================================================
// TICKET STATUS CONFIGURATION
// ============================================================================

/**
 * Configuration for each ticket status including display labels, colors, and descriptions
 */
export const TICKET_STATUS_CONFIG: Record<
  TicketStatus,
  {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    isTerminal: boolean;
  }
> = {
  DRAFT: {
    label: 'Draft',
    description: 'Created but not yet submitted',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    isTerminal: false,
  },
  SUBMITTED: {
    label: 'Submitted',
    description: 'Submitted and awaiting review',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    isTerminal: false,
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    description: 'Under manager or assignee review',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    isTerminal: false,
  },
  ACCEPTED: {
    label: 'Accepted',
    description: 'Creator accepted, work to begin',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-300',
    isTerminal: false,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    description: 'Actively being worked on',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    isTerminal: false,
  },
  COMPLETED: {
    label: 'Completed',
    description: 'Successfully finished and closed',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    isTerminal: true,
  },
  REJECTED: {
    label: 'Rejected',
    description: 'Denied with reason',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    isTerminal: true,
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'Cancelled by requester',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-500',
    borderColor: 'border-gray-300',
    isTerminal: true,
  },
} as const;

/**
 * Valid status transitions - defines which statuses can transition to which
 * This implements the ticket workflow state machine
 */
export const VALID_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['PENDING_REVIEW', 'REJECTED', 'CANCELLED'],
  PENDING_REVIEW: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'REJECTED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'PENDING_REVIEW', 'CANCELLED'],
  COMPLETED: [], // Terminal state - no transitions
  REJECTED: [], // Terminal state - no transitions
  CANCELLED: [], // Terminal state - no transitions
} as const;

// ============================================================================
// TICKET PRIORITY CONFIGURATION
// ============================================================================

/**
 * Configuration for each priority level including display labels, colors, and SLA info
 */
export const PRIORITY_CONFIG: Record<
  TicketPriority,
  {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    slaHours: number | null; // Response time SLA in hours, null = no SLA
  }
> = {
  LOW: {
    label: 'Low',
    description: 'Can be addressed when convenient',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    slaHours: null,
  },
  MEDIUM: {
    label: 'Medium',
    description: 'Standard priority, normal SLA',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    slaHours: 48,
  },
  HIGH: {
    label: 'High',
    description: 'Elevated priority, faster response needed',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    slaHours: 24,
  },
  URGENT: {
    label: 'Urgent',
    description: 'Critical priority, immediate attention required',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    slaHours: 4,
  },
} as const;

// ============================================================================
// USER ROLE CONFIGURATION
// ============================================================================

/**
 * Permission types for role-based access control
 */
export type Permission =
  | 'tickets:create'
  | 'tickets:read'
  | 'tickets:update'
  | 'tickets:delete'
  | 'tickets:assign'
  | 'tickets:read_all'
  | 'creators:create'
  | 'creators:read'
  | 'creators:update'
  | 'creators:delete'
  | 'creators:read_all'
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'users:read_all'
  | 'settings:read'
  | 'settings:update'
  | 'reports:view'
  | 'reports:export'
  | 'audit:view';

/**
 * Configuration for each user role including display labels, descriptions, and permissions
 */
export const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    textColor: string;
    level: number; // Higher = more permissions
    permissions: Permission[];
  }
> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    description: 'Full system access, user management, system configuration',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    level: 100,
    permissions: [
      'tickets:create',
      'tickets:read',
      'tickets:update',
      'tickets:delete',
      'tickets:assign',
      'tickets:read_all',
      'creators:create',
      'creators:read',
      'creators:update',
      'creators:delete',
      'creators:read_all',
      'users:create',
      'users:read',
      'users:update',
      'users:delete',
      'users:read_all',
      'settings:read',
      'settings:update',
      'reports:view',
      'reports:export',
      'audit:view',
    ],
  },
  MANAGER: {
    label: 'Manager',
    description: 'All tickets, assignments, reporting, team oversight',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    level: 80,
    permissions: [
      'tickets:create',
      'tickets:read',
      'tickets:update',
      'tickets:assign',
      'tickets:read_all',
      'creators:read',
      'creators:update',
      'creators:read_all',
      'users:read',
      'users:read_all',
      'reports:view',
      'reports:export',
    ],
  },
  SCHEDULER: {
    label: 'Scheduler',
    description: 'Content scheduling, creator management, availability',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    level: 60,
    permissions: [
      'tickets:create',
      'tickets:read',
      'tickets:update',
      'tickets:read_all',
      'creators:read',
      'creators:update',
      'creators:read_all',
      'reports:view',
    ],
  },
  CHATTER: {
    label: 'Chatter',
    description: 'Submit requests for assigned creators only',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    level: 40,
    permissions: ['tickets:create', 'tickets:read', 'tickets:update', 'creators:read'],
  },
  CREATOR: {
    label: 'Creator',
    description: 'View and respond to own assigned tickets only',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    level: 20,
    permissions: ['tickets:read', 'tickets:update'],
  },
} as const;

// ============================================================================
// DATE FORMATS
// ============================================================================

/**
 * Date format strings for various use cases (date-fns compatible)
 */
export const DATE_FORMATS = {
  /** Display format for dates: "Jan 15, 2025" */
  display: 'MMM d, yyyy',
  /** Display format with time: "Jan 15, 2025 10:30 AM" */
  displayTime: 'MMM d, yyyy h:mm a',
  /** Display format with full time: "Jan 15, 2025 10:30:45 AM" */
  displayFullTime: 'MMM d, yyyy h:mm:ss a',
  /** Input format for date pickers: "2025-01-15" */
  input: 'yyyy-MM-dd',
  /** Input format with time: "2025-01-15T10:30" */
  inputTime: "yyyy-MM-dd'T'HH:mm",
  /** ISO format for API: "2025-01-15T10:30:00.000Z" */
  api: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  /** Short date format: "01/15/25" */
  short: 'MM/dd/yy',
  /** Long date format: "January 15, 2025" */
  long: 'MMMM d, yyyy',
  /** Time only: "10:30 AM" */
  time: 'h:mm a',
  /** Day of week: "Wednesday, Jan 15" */
  dayOfWeek: 'EEEE, MMM d',
} as const;

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * Type-safe API route constants
 */
export const API_ROUTES = {
  // Auth
  auth: {
    signIn: '/api/auth/signin',
    signOut: '/api/auth/signout',
    session: '/api/auth/session',
    csrf: '/api/auth/csrf',
  },
  // Tickets
  tickets: {
    list: '/api/v1/tickets',
    create: '/api/v1/tickets',
    detail: (id: string) => `/api/v1/tickets/${id}`,
    update: (id: string) => `/api/v1/tickets/${id}`,
    delete: (id: string) => `/api/v1/tickets/${id}`,
    comments: (id: string) => `/api/v1/tickets/${id}/comments`,
    history: (id: string) => `/api/v1/tickets/${id}/history`,
  },
  // Creators
  creators: {
    list: '/api/v1/creators',
    create: '/api/v1/creators',
    detail: (id: string) => `/api/v1/creators/${id}`,
    update: (id: string) => `/api/v1/creators/${id}`,
    delete: (id: string) => `/api/v1/creators/${id}`,
    availability: (id: string) => `/api/v1/creators/${id}/availability`,
    tickets: (id: string) => `/api/v1/creators/${id}/tickets`,
  },
  // Users
  users: {
    list: '/api/v1/users',
    create: '/api/v1/users',
    detail: (id: string) => `/api/v1/users/${id}`,
    update: (id: string) => `/api/v1/users/${id}`,
    delete: (id: string) => `/api/v1/users/${id}`,
    me: '/api/v1/users/me',
  },
  // Notifications
  notifications: {
    list: '/api/v1/notifications',
    markRead: (id: string) => `/api/v1/notifications/${id}/read`,
    markAllRead: '/api/v1/notifications/read-all',
  },
  // Health check
  health: '/api/health',
} as const;

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================

/**
 * Type-safe dashboard route constants
 */
export const DASHBOARD_ROUTES = {
  // Main
  home: '/dashboard',
  // Tickets
  tickets: {
    list: '/tickets',
    new: '/tickets/new',
    detail: (id: string) => `/tickets/${id}`,
    edit: (id: string) => `/tickets/${id}/edit`,
  },
  // Creators
  creators: {
    list: '/creators',
    new: '/creators/new',
    detail: (id: string) => `/creators/${id}`,
    edit: (id: string) => `/creators/${id}/edit`,
  },
  // Users
  users: {
    list: '/users',
    new: '/users/new',
    detail: (id: string) => `/users/${id}`,
    edit: (id: string) => `/users/${id}/edit`,
  },
  // Settings
  settings: '/settings',
  // Auth
  login: '/login',
  register: '/register',
  logout: '/api/auth/signout',
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Validation constraints for form fields
 */
export const VALIDATION = {
  /** Minimum password length */
  PASSWORD_MIN_LENGTH: 8,
  /** Maximum password length */
  PASSWORD_MAX_LENGTH: 128,
  /** Minimum ticket title length */
  TICKET_TITLE_MIN_LENGTH: 5,
  /** Maximum ticket title length */
  TICKET_TITLE_MAX_LENGTH: 200,
  /** Maximum ticket description length */
  TICKET_DESCRIPTION_MAX_LENGTH: 5000,
  /** Minimum comment length */
  COMMENT_MIN_LENGTH: 1,
  /** Maximum comment length */
  COMMENT_MAX_LENGTH: 2000,
  /** Minimum name length */
  NAME_MIN_LENGTH: 2,
  /** Maximum name length */
  NAME_MAX_LENGTH: 100,
  /** Maximum stage name length */
  STAGE_NAME_MAX_LENGTH: 100,
  /** Maximum rejection reason length */
  REJECTION_REASON_MAX_LENGTH: 500,
  /** Maximum file upload size in bytes (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** Allowed file extensions for uploads */
  ALLOWED_FILE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.mp4', '.mov'],
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a user has a specific permission based on their role
 *
 * @param role - The user's role
 * @param permission - The permission to check
 * @returns True if the role has the permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_CONFIG[role].permissions.includes(permission);
}

/**
 * Check if a status transition is valid
 *
 * @param currentStatus - The current ticket status
 * @param newStatus - The proposed new status
 * @returns True if the transition is allowed
 */
export function isValidStatusTransition(
  currentStatus: TicketStatus,
  newStatus: TicketStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}

/**
 * Get all available statuses a ticket can transition to
 *
 * @param currentStatus - The current ticket status
 * @returns Array of valid target statuses
 */
export function getAvailableTransitions(currentStatus: TicketStatus): TicketStatus[] {
  return [...VALID_STATUS_TRANSITIONS[currentStatus]];
}

// ============================================================================
// BACKWARDS COMPATIBILITY EXPORTS
// ============================================================================
// These exports maintain compatibility with existing code that uses
// the old constant names. New code should use the Prisma enums directly.

/**
 * @deprecated Use Prisma's TicketStatus enum directly
 * Legacy ticket status constants for backwards compatibility
 */
export const TICKET_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  PENDING_REVIEW: 'PENDING_REVIEW',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

/**
 * @deprecated Use TICKET_STATUS_CONFIG instead
 * Legacy display config for ticket statuses
 */
export const TICKET_STATUS_DISPLAY: Record<
  keyof typeof TICKET_STATUS,
  { label: string; color: string }
> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-500' },
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-500' },
  PENDING_REVIEW: { label: 'Pending Review', color: 'bg-yellow-500' },
  ACCEPTED: { label: 'Accepted', color: 'bg-indigo-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-500' },
  COMPLETED: { label: 'Completed', color: 'bg-green-500' },
  REJECTED: { label: 'Rejected', color: 'bg-red-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500' },
};

/**
 * @deprecated Use Prisma's TicketPriority enum directly
 * Legacy ticket priority constants for backwards compatibility
 */
export const TICKET_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

/**
 * @deprecated Use PRIORITY_CONFIG instead
 * Legacy display config for priorities
 */
export const TICKET_PRIORITY_DISPLAY: Record<
  keyof typeof TICKET_PRIORITY,
  { label: string; color: string }
> = {
  LOW: { label: 'Low', color: 'bg-gray-500' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-500' },
  HIGH: { label: 'High', color: 'bg-orange-500' },
  URGENT: { label: 'Urgent', color: 'bg-red-500' },
};

/**
 * @deprecated Use Prisma's UserRole enum directly
 * Legacy user role constants for backwards compatibility
 */
export const USER_ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  MANAGER: 'MANAGER',
  SCHEDULER: 'SCHEDULER',
  CHATTER: 'CHATTER',
  CREATOR: 'CREATOR',
} as const;

/**
 * @deprecated Use ROLE_CONFIG instead
 * Legacy display config for user roles
 */
export const USER_ROLE_DISPLAY: Record<
  keyof typeof USER_ROLE,
  { label: string; description: string }
> = {
  SUPER_ADMIN: { label: 'Super Admin', description: 'Full system access' },
  MANAGER: { label: 'Manager', description: 'Team management and reporting' },
  SCHEDULER: { label: 'Scheduler', description: 'Content scheduling' },
  CHATTER: { label: 'Chatter', description: 'Submit requests for creators' },
  CREATOR: { label: 'Creator', description: 'View and respond to tickets' },
};

/**
 * @deprecated Use DEFAULT_PAGE_SIZE and MAX_PAGE_SIZE directly
 * Legacy pagination config for backwards compatibility
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} as const;
