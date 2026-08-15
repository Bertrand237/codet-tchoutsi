'use client';

import { useEffect } from 'react';

// Sidebar navigation paths mapped to Alt+1 through Alt+5
const ALT_NAV_ITEMS = [
  '/dashboard',   // Alt+1
  '/projects',    // Alt+2
  '/members',     // Alt+3
  '/budget',      // Alt+4
  '/calendar',    // Alt+5
];

interface UseKeyboardShortcutsOptions {
  disabled?: boolean;
  onNavigate?: (page: string) => void;
  onToggleSidebar?: () => void;
}

export function useKeyboardShortcuts({
  disabled = false,
  onNavigate,
  onToggleSidebar,
}: UseKeyboardShortcutsOptions = {}) {
  useEffect(() => {
    if (disabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Ctrl+K / Cmd+K: Open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        // Handled directly by CommandPalette, also dispatch for external listeners
        return;
      }

      // Ctrl+/ : Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        if (onToggleSidebar) {
          onToggleSidebar();
        } else {
          document.dispatchEvent(new CustomEvent('toggle-sidebar'));
        }
        return;
      }

      // Escape: Close dialogs (native browser behavior handles most, but dispatch for custom)
      if (e.key === 'Escape') {
        document.dispatchEvent(new CustomEvent('close-all-dialogs'));
        return;
      }

      // Don't process further shortcuts when in input fields
      if (isInput) return;

      // ? (without shift, i.e. pressing ? directly): Show shortcuts help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('show-shortcuts'));
        return;
      }

      // Alt+1 through Alt+5: Navigate to sidebar items
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 5) {
          e.preventDefault();
          const path = ALT_NAV_ITEMS[num - 1];
          if (onNavigate) {
            onNavigate(path);
          } else {
            document.dispatchEvent(
              new CustomEvent('navigate-shortcut', { detail: { path } })
            );
          }
          return;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onNavigate, onToggleSidebar]);
}

export { ALT_NAV_ITEMS };
