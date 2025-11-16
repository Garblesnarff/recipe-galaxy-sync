import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { getShortcutManager } from '@/services/accessibility/keyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal dialog displaying all available keyboard shortcuts
 * Organized by category with search functionality
 */
export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const shortcutManager = getShortcutManager();
  const allShortcuts = shortcutManager.getAllShortcuts();

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, typeof allShortcuts> = {};

    allShortcuts.forEach((shortcut) => {
      const category = shortcut.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
    });

    return groups;
  }, [allShortcuts]);

  // Filter shortcuts based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedShortcuts;

    const filtered: Record<string, typeof allShortcuts> = {};
    const query = searchQuery.toLowerCase();

    Object.entries(groupedShortcuts).forEach(([category, shortcuts]) => {
      const matchingShortcuts = shortcuts.filter(
        (s) =>
          s.description.toLowerCase().includes(query) ||
          s.key.toLowerCase().includes(query)
      );

      if (matchingShortcuts.length > 0) {
        filtered[category] = matchingShortcuts;
      }
    });

    return filtered;
  }, [groupedShortcuts, searchQuery]);

  const formatKey = (key: string): string => {
    return key
      .split('+')
      .map((part) => {
        const normalized = part.trim();
        // Capitalize first letter
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
      })
      .join(' + ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and interact with the app quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search keyboard shortcuts"
            />
          </div>

          {/* Shortcuts List */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(filteredGroups).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.key}
                        className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                          {formatKey(shortcut.key)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(filteredGroups).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No shortcuts found matching "{searchQuery}"
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

KeyboardShortcutsDialog.displayName = 'KeyboardShortcutsDialog';
