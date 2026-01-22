/**
 * @file creator.types.ts
 * @description TypeScript type definitions for creators
 * @layer Types
 * @status PLACEHOLDER - Core types defined, extend as schema evolves
 *
 * These types represent content creators managed by the agency.
 */

/**
 * Creator status
 */
export type CreatorStatus = 'ACTIVE' | 'INACTIVE' | 'ONBOARDING' | 'PAUSED';

/**
 * Core creator entity
 */
export interface Creator {
  id: string;
  name: string;
  stageName: string | null;
  email: string | null;
  phone: string | null;
  status: CreatorStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creator with related statistics
 */
export interface CreatorWithStats extends Creator {
  _count: {
    tickets: number;
  };
  openTicketCount: number;
  lastTicketDate: Date | null;
}

/**
 * Input type for creating a creator
 */
export interface CreateCreatorInput {
  name: string;
  stageName?: string;
  email?: string;
  phone?: string;
  status?: CreatorStatus;
  notes?: string;
}

/**
 * Input type for updating a creator
 */
export interface UpdateCreatorInput {
  name?: string;
  stageName?: string;
  email?: string;
  phone?: string;
  status?: CreatorStatus;
  notes?: string;
}

/**
 * Filter options for creator queries
 */
export interface CreatorFilters {
  status?: CreatorStatus | CreatorStatus[];
  search?: string;
}

/**
 * Creator list response with pagination
 */
export interface CreatorListResponse {
  creators: CreatorWithStats[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
