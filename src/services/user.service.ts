/**
 * @file user.service.ts
 * @description Service for user management operations
 * @layer Service
 * @status IMPLEMENTED
 *
 * Handles all user-related business logic:
 * - User CRUD operations
 * - Password management (hashing, verification, changes)
 * - Authentication support (getByEmail, verifyPassword)
 * - Activity tracking (lastLoginAt)
 * - Soft deactivation/reactivation
 *
 * This service does NOT handle authorization - that's the Server Action's job.
 */

import { prisma } from '@/lib/db';
import { auditService, AUDIT_ACTIONS, AUDIT_ENTITIES } from './audit.service';
import bcrypt from 'bcryptjs';
import type { User, UserRole, Prisma } from '@prisma/client';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Input for creating a new user
 */
export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

/**
 * Input for updating a user
 */
export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

/**
 * Filter options for listing users
 */
export interface UserFilterInput {
  /** Filter by role(s) */
  role?: UserRole | UserRole[];
  /** Filter by active status */
  isActive?: boolean;
  /** Search in name and email */
  search?: string;
  /** Page number (1-based) */
  page?: number;
  /** Items per page */
  pageSize?: number;
  /** Sort field */
  sortBy?: 'name' | 'email' | 'role' | 'createdAt' | 'lastLoginAt';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * User with computed stats
 */
export interface UserWithStats extends User {
  _count: {
    createdTickets: number;
    assignedTickets: number;
    creatorAssignments: number;
  };
}

/**
 * Result from list operation
 */
export interface UserListResult {
  users: UserWithStats[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BCRYPT_ROUNDS = 12;

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * UserService - Handles all user management operations
 *
 * All password operations use bcrypt for secure hashing.
 * Email addresses are normalized (lowercased, trimmed) before storage.
 */
class UserService {
  // ========================================
  // CREATE
  // ========================================

  /**
   * Create a new user
   *
   * @param input - User creation data
   * @returns The created user (without password hash)
   * @throws Error if email already exists
   *
   * @example
   * ```typescript
   * const user = await userService.create({
   *   email: 'john@example.com',
   *   password: 'securePassword123',
   *   name: 'John Doe',
   *   role: 'CHATTER'
   * });
   * ```
   */
  async create(input: CreateUserInput): Promise<User> {
    // Normalize email
    const email = input.email.toLowerCase().trim();

    // Check email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new Error(`User with email ${email} already exists`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: input.name.trim(),
        role: input.role,
        isActive: true,
      },
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.USER_CREATE,
      entityType: AUDIT_ENTITIES.USER,
      entityId: user.id,
      userEmail: email,
      details: {
        name: user.name,
        role: user.role,
      },
    });

    return user;
  }

  // ========================================
  // READ
  // ========================================

  /**
   * Get a user by ID
   *
   * @param id - User ID
   * @returns User or null if not found
   */
  async getById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Get a user by ID with statistics
   *
   * @param id - User ID
   * @returns User with stats or null if not found
   */
  async getByIdWithStats(id: string): Promise<UserWithStats | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            createdTickets: true,
            assignedTickets: true,
            creatorAssignments: true,
          },
        },
      },
    });
  }

  /**
   * Get a user by email (case-insensitive)
   *
   * Primarily used for authentication.
   *
   * @param email - User email
   * @returns User or null if not found
   */
  async getByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  /**
   * List users with filtering and pagination
   *
   * @param filter - Filter and pagination options
   * @returns Paginated list of users with stats
   */
  async list(filter: UserFilterInput = {}): Promise<UserListResult> {
    const {
      role,
      isActive,
      search,
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      sortBy = 'name',
      sortOrder = 'asc',
    } = filter;

    // Clamp page size
    const clampedPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
    const skip = (Math.max(1, page) - 1) * clampedPageSize;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = Array.isArray(role) ? { in: role } : role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              createdTickets: true,
              assignedTickets: true,
              creatorAssignments: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: clampedPageSize,
        skip,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page: Math.max(1, page),
      pageSize: clampedPageSize,
      totalPages: Math.ceil(total / clampedPageSize),
    };
  }

  /**
   * Get all users with a specific role
   *
   * Useful for dropdowns and assignment lists.
   *
   * @param role - Role to filter by
   * @param activeOnly - Only return active users (default: true)
   * @returns Array of users
   */
  async getByRole(role: UserRole, activeOnly = true): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        role,
        ...(activeOnly && { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });
  }

  // ========================================
  // UPDATE
  // ========================================

  /**
   * Update a user's profile
   *
   * @param id - User ID
   * @param input - Update data
   * @param updatedById - ID of user making the change (for audit)
   * @returns Updated user
   * @throws Error if user not found or email already taken
   */
  async update(id: string, input: UpdateUserInput, updatedById?: string): Promise<User> {
    // Get existing user
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`User not found: ${id}`);
    }

    // Build update data
    const data: Prisma.UserUpdateInput = {};
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    // Handle email change
    if (input.email !== undefined) {
      const normalizedEmail = input.email.toLowerCase().trim();

      if (normalizedEmail !== existing.email) {
        // Check uniqueness
        const emailExists = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (emailExists) {
          throw new Error(`Email ${normalizedEmail} is already in use`);
        }

        data.email = normalizedEmail;
        changes.email = { old: existing.email, new: normalizedEmail };
      }
    }

    // Handle name change
    if (input.name !== undefined && input.name.trim() !== existing.name) {
      data.name = input.name.trim();
      changes.name = { old: existing.name, new: input.name.trim() };
    }

    // Handle role change
    if (input.role !== undefined && input.role !== existing.role) {
      data.role = input.role;
      changes.role = { old: existing.role, new: input.role };
    }

    // Handle isActive change
    if (input.isActive !== undefined && input.isActive !== existing.isActive) {
      data.isActive = input.isActive;
      changes.isActive = { old: existing.isActive, new: input.isActive };
    }

    // If no changes, return existing user
    if (Object.keys(data).length === 0) {
      return existing;
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data,
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.USER_UPDATE,
      entityType: AUDIT_ENTITIES.USER,
      entityId: id,
      userId: updatedById,
      userEmail: user.email,
      details: { changes },
    });

    // Log role change specifically if it occurred
    if (changes.role) {
      await auditService.log({
        action: AUDIT_ACTIONS.USER_ROLE_CHANGE,
        entityType: AUDIT_ENTITIES.USER,
        entityId: id,
        userId: updatedById,
        userEmail: user.email,
        details: {
          previousRole: changes.role.old,
          newRole: changes.role.new,
        },
      });
    }

    return user;
  }

  /**
   * Soft deactivate a user
   *
   * Deactivated users cannot log in but their data is preserved.
   *
   * @param id - User ID
   * @param deactivatedById - ID of user performing deactivation
   * @returns Deactivated user
   * @throws Error if user not found or is the last super admin
   */
  async deactivate(id: string, deactivatedById?: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error(`User not found: ${id}`);
    }

    if (!user.isActive) {
      return user; // Already deactivated
    }

    // Prevent deactivating the last super admin
    if (user.role === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.user.count({
        where: {
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });

      if (superAdminCount <= 1) {
        throw new Error('Cannot deactivate the last super admin');
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.USER_DEACTIVATE,
      entityType: AUDIT_ENTITIES.USER,
      entityId: id,
      userId: deactivatedById,
      userEmail: user.email,
    });

    return updated;
  }

  /**
   * Reactivate a deactivated user
   *
   * @param id - User ID
   * @param activatedById - ID of user performing reactivation
   * @returns Activated user
   * @throws Error if user not found
   */
  async activate(id: string, activatedById?: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error(`User not found: ${id}`);
    }

    if (user.isActive) {
      return user; // Already active
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.USER_ACTIVATE,
      entityType: AUDIT_ENTITIES.USER,
      entityId: id,
      userId: activatedById,
      userEmail: user.email,
    });

    return updated;
  }

  // ========================================
  // PASSWORD MANAGEMENT
  // ========================================

  /**
   * Verify a user's password
   *
   * Used for authentication. Returns the user if valid, null if not.
   *
   * @param email - User email
   * @param password - Plain text password
   * @returns User if valid, null if invalid
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      return null; // Deactivated users cannot authenticate
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      // Log failed login attempt
      await auditService.log({
        action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
        entityType: AUDIT_ENTITIES.USER,
        entityId: user.id,
        userEmail: email,
        details: { reason: 'invalid_password' },
      });
      return null;
    }

    return user;
  }

  /**
   * Change a user's password
   *
   * Requires the current password for verification.
   *
   * @param id - User ID
   * @param currentPassword - Current password for verification
   * @param newPassword - New password
   * @returns true if successful
   * @throws Error if user not found or current password is wrong
   */
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error(`User not found: ${id}`);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.PASSWORD_CHANGE,
      entityType: AUDIT_ENTITIES.USER,
      entityId: id,
      userId: id,
      userEmail: user.email,
    });

    return true;
  }

  /**
   * Reset a user's password (admin action)
   *
   * Does not require current password - for admin reset scenarios.
   *
   * @param id - User ID
   * @param newPassword - New password
   * @param resetById - ID of admin performing reset
   * @returns true if successful
   * @throws Error if user not found
   */
  async resetPassword(id: string, newPassword: string, resetById: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error(`User not found: ${id}`);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.PASSWORD_RESET,
      entityType: AUDIT_ENTITIES.USER,
      entityId: id,
      userId: resetById,
      userEmail: user.email,
      details: { resetBy: resetById },
    });

    return true;
  }

  // ========================================
  // ACTIVITY TRACKING
  // ========================================

  /**
   * Update user's last login timestamp
   *
   * Called after successful authentication.
   *
   * @param id - User ID
   */
  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await auditService.log({
      action: AUDIT_ACTIONS.USER_LOGIN,
      entityType: AUDIT_ENTITIES.USER,
      entityId: id,
      userId: id,
    });
  }

  /**
   * Record user logout
   *
   * @param id - User ID
   */
  async recordLogout(id: string): Promise<void> {
    await auditService.log({
      action: AUDIT_ACTIONS.USER_LOGOUT,
      entityType: AUDIT_ENTITIES.USER,
      entityId: id,
      userId: id,
    });
  }

  // ========================================
  // VALIDATION HELPERS
  // ========================================

  /**
   * Check if an email is available
   *
   * @param email - Email to check
   * @param excludeUserId - User ID to exclude (for update scenarios)
   * @returns true if available
   */
  async isEmailAvailable(email: string, excludeUserId?: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!existing) {
      return true;
    }

    return excludeUserId ? existing.id === excludeUserId : false;
  }

  /**
   * Check if a user exists
   *
   * @param id - User ID
   * @returns true if exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { id },
    });
    return count > 0;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Singleton instance of the UserService
 */
export const userService = new UserService();

/**
 * Export the class for testing purposes
 */
export { UserService };
