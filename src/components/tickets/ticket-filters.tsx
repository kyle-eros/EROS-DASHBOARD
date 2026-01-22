/**
 * @file ticket-filters.tsx
 * @description Client-side ticket filtering component with URL sync
 * @layer UI/Component
 * @status IMPLEMENTED
 *
 * Features:
 * - Filter by type, status, priority
 * - Search by title/description
 * - URL query parameter sync
 * - Mobile responsive
 */

'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { TICKET_TYPE_CONFIG, TICKET_STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/constants';
import type { TicketType, TicketStatus, TicketPriority } from '@prisma/client';

interface TicketFiltersProps {
  showCreatorFilter?: boolean;
  creators?: Array<{ id: string; stageName: string }>;
}

export function TicketFilters({ showCreatorFilter, creators }: TicketFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(false);

  // Get current filter values from URL
  const currentFilters = {
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    creatorId: searchParams.get('creatorId') || '',
  };

  // Count active filters
  const activeFilterCount = Object.entries(currentFilters)
    .filter(([key, value]) => key !== 'search' && value)
    .length;

  // Update URL with new params
  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    params.delete('page');

    router.push(`/tickets?${params.toString()}`);
  };

  // Clear all filters
  const clearFilters = () => {
    router.push('/tickets');
    setIsOpen(false);
  };

  // Handle search with debounce
  const [searchValue, setSearchValue] = React.useState(currentFilters.search);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== currentFilters.search) {
        updateFilters({ search: searchValue });
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  // Sync search value with URL
  React.useEffect(() => {
    setSearchValue(currentFilters.search);
  }, [currentFilters.search]);

  const filterContent = (
    <div className="space-y-4">
      {/* Type Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Select
          value={currentFilters.type}
          onValueChange={(value) => updateFilters({ type: value === 'all' ? '' : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(TICKET_TYPE_CONFIG).map(([type, config]) => (
              <SelectItem key={type} value={type}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select
          value={currentFilters.status}
          onValueChange={(value) => updateFilters({ status: value === 'all' ? '' : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(TICKET_STATUS_CONFIG).map(([status, config]) => (
              <SelectItem key={status} value={status}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Priority</label>
        <Select
          value={currentFilters.priority}
          onValueChange={(value) => updateFilters({ priority: value === 'all' ? '' : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
              <SelectItem key={priority} value={priority}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Creator Filter */}
      {showCreatorFilter && creators && creators.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Creator</label>
          <Select
            value={currentFilters.creatorId}
            onValueChange={(value) => updateFilters({ creatorId: value === 'all' ? '' : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All creators" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All creators</SelectItem>
              {creators.map((creator) => (
                <SelectItem key={creator.id} value={creator.id}>
                  {creator.stageName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="mr-2 h-4 w-4" />
          Clear filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search tickets..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:flex items-center gap-2">
        <Select
          value={currentFilters.type}
          onValueChange={(value) => updateFilters({ type: value === 'all' ? '' : value })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(TICKET_TYPE_CONFIG).map(([type, config]) => (
              <SelectItem key={type} value={type}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.status}
          onValueChange={(value) => updateFilters({ status: value === 'all' ? '' : value })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(TICKET_STATUS_CONFIG).map(([status, config]) => (
              <SelectItem key={status} value={status}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.priority}
          onValueChange={(value) => updateFilters({ priority: value === 'all' ? '' : value })}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
              <SelectItem key={priority} value={priority}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="lg:hidden">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filter Tickets</SheetTitle>
            <SheetDescription>
              Narrow down tickets by type, status, priority, or creator.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">{filterContent}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
