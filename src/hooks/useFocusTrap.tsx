import { useEffect, useRef } from 'react';
import { FocusTrap } from '@/services/accessibility/focusManagement';

/**
 * Hook to trap focus within an element (for modals/dialogs)
 * Returns a ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  active: boolean = true
) {
  const elementRef = useRef<T>(null);
  const focusTrapRef = useRef<FocusTrap | null>(null);

  useEffect(() => {
    if (!active || !elementRef.current) {
      return;
    }

    // Create and activate focus trap
    focusTrapRef.current = new FocusTrap();
    focusTrapRef.current.activate(elementRef.current);

    // Cleanup: deactivate focus trap
    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
        focusTrapRef.current = null;
      }
    };
  }, [active]);

  return elementRef;
}
