/**
 * @file url-pagination.tsx
 * @description Pagination component that syncs with URL query parameters
 * @layer UI/Component
 * @status IMPLEMENTED
 *
 * Wraps the base Pagination component to handle URL-based navigation.
 */

'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from './pagination';

interface UrlPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  showPageSizeSelector?: boolean;
  className?: string;
}

export function UrlPagination({
  page,
  pageSize,
  total,
  showPageSizeSelector = true,
  className,
}: UrlPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== '1') {
        params.set(key, value);
      } else if (key === 'page') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: String(newPage) });
  };

  const handlePageSizeChange = (newSize: number) => {
    // Reset to page 1 when page size changes
    updateUrl({ page: '1', pageSize: String(newSize) });
  };

  return (
    <Pagination
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={handlePageChange}
      onPageSizeChange={showPageSizeSelector ? handlePageSizeChange : undefined}
      showPageSizeSelector={showPageSizeSelector}
      className={className}
    />
  );
}
