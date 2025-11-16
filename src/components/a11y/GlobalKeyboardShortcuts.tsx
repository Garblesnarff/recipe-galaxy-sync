import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { KEYBOARD_SHORTCUTS } from '@/config/accessibility';

/**
 * Global keyboard shortcuts component
 * Add this to your App.tsx to enable global shortcuts
 */
export const GlobalKeyboardShortcuts: React.FC = () => {
  const navigate = useNavigate();
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  useKeyboardShortcuts([
    {
      key: KEYBOARD_SHORTCUTS.HELP,
      handler: () => setShowShortcutsDialog(true),
      description: 'Show keyboard shortcuts help',
      category: 'General',
    },
    {
      key: KEYBOARD_SHORTCUTS.NEW_WORKOUT,
      handler: () => navigate('/workouts/add'),
      description: 'Create new workout',
      category: 'Actions',
    },
    {
      key: KEYBOARD_SHORTCUTS.SEARCH,
      handler: () => {
        // Focus search input if it exists
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus search',
      category: 'Navigation',
    },
  ]);

  return (
    <KeyboardShortcutsDialog
      open={showShortcutsDialog}
      onOpenChange={setShowShortcutsDialog}
    />
  );
};

GlobalKeyboardShortcuts.displayName = 'GlobalKeyboardShortcuts';
