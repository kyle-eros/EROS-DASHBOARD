/**
 * @file filters.store.ts
 * @description Zustand store for filter/search state
 * @layer Store
 * @status PLACEHOLDER - Core filter state defined
 *
 * Manages filter state for lists including:
 * - Ticket filters
 * - Search queries
 * - Sort preferences
 */

import { create } from 'zustand';
import type { TicketStatus, TicketPriority } from '@/types/ticket.types';

interface TicketFiltersState {
  status: TicketStatus[];
  priority: TicketPriority[];
  creatorId: string | null;
  assigneeId: string | null;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface FiltersState {
  // Ticket filters
  ticketFilters: TicketFiltersState;
  setTicketFilter: <K extends keyof TicketFiltersState>(
    key: K,
    value: TicketFiltersState[K]
  ) => void;
  resetTicketFilters: () => void;

  // Creator filters
  creatorSearch: string;
  setCreatorSearch: (search: string) => void;

  // User filters
  userSearch: string;
  setUserSearch: (search: string) => void;
}

const defaultTicketFilters: TicketFiltersState = {
  status: [],
  priority: [],
  creatorId: null,
  assigneeId: null,
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useFiltersStore = create<FiltersState>((set) => ({
  // Ticket filters
  ticketFilters: { ...defaultTicketFilters },
  setTicketFilter: (key, value) =>
    set((state) => ({
      ticketFilters: { ...state.ticketFilters, [key]: value },
    })),
  resetTicketFilters: () => set({ ticketFilters: { ...defaultTicketFilters } }),

  // Creator filters
  creatorSearch: '',
  setCreatorSearch: (search) => set({ creatorSearch: search }),

  // User filters
  userSearch: '',
  setUserSearch: (search) => set({ userSearch: search }),
}));
