/**
 * Focus Management Utilities for Accessibility
 */

const FOCUSABLE_ELEMENTS_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex^="-"])',
].join(',');

/**
 * Get all keyboard focusable elements within a container
 */
export function getKeyboardFocusableElements(element: HTMLElement): HTMLElement[] {
  const focusableElements = element.querySelectorAll(FOCUSABLE_ELEMENTS_SELECTOR);
  return Array.from(focusableElements) as HTMLElement[];
}

/**
 * Trap focus within an element (for modals/dialogs)
 * Returns a cleanup function to remove the trap
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = getKeyboardFocusableElements(element);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  // Focus the first element
  firstFocusable?.focus();

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    // If shift+tab on first element, focus last
    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable?.focus();
    }
    // If tab on last element, focus first
    else if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable?.focus();
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Restore focus to a previously focused element
 */
export function restoreFocus(previousElement: HTMLElement): void {
  if (previousElement && typeof previousElement.focus === 'function') {
    previousElement.focus();
  }
}

/**
 * Move focus to the first error in a form
 */
export function moveFocusToFirstError(formElement: HTMLElement): void {
  // Look for elements with aria-invalid="true"
  const firstError = formElement.querySelector('[aria-invalid="true"]') as HTMLElement;

  if (firstError) {
    firstError.focus();

    // Scroll into view if needed
    firstError.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
}

/**
 * Skip to main content (bypass navigation)
 */
export function skipToContent(): void {
  const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');

  if (mainContent instanceof HTMLElement) {
    // Make it focusable if it isn't
    if (!mainContent.hasAttribute('tabindex')) {
      mainContent.setAttribute('tabindex', '-1');
    }

    mainContent.focus();

    // Scroll into view
    mainContent.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}

/**
 * Create a focus trap context (stores and restores previous focus)
 */
export class FocusTrap {
  private previousFocus: HTMLElement | null = null;
  private cleanup: (() => void) | null = null;

  activate(element: HTMLElement): void {
    // Store current focus
    this.previousFocus = document.activeElement as HTMLElement;

    // Trap focus
    this.cleanup = trapFocus(element);
  }

  deactivate(): void {
    // Remove trap
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }

    // Restore previous focus
    if (this.previousFocus) {
      restoreFocus(this.previousFocus);
      this.previousFocus = null;
    }
  }
}
