/**
 * @file setup.ts
 * @description Test setup and configuration
 * @status PLACEHOLDER - Configure test environment
 */

import '@testing-library/jest-dom';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Global test utilities
// Add any global mocks or setup here
