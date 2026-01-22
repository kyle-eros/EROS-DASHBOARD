/**
 * @file ui.store.ts
 * @description Zustand store for UI state
 * @layer Store
 * @status PLACEHOLDER - Core UI state defined
 *
 * Manages client-side UI state including:
 * - Sidebar collapse state
 * - Modal visibility
 * - Toast notifications
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Mobile menu
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Mobile menu
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

      // Modals
      activeModal: null,
      modalData: null,
      openModal: (modalId, data) => set({ activeModal: modalId, modalData: data ?? null }),
      closeModal: () => set({ activeModal: null, modalData: null }),
    }),
    {
      name: 'eros-ui-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
