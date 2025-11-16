/**
 * Accessibility Testing Utilities
 * Tools for testing and validating accessibility features
 */

export interface A11yIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  element?: HTMLElement;
  wcagCriteria?: string;
}

/**
 * Run a basic accessibility audit on an element
 * Note: For production use, integrate with axe-core or similar tools
 */
export async function runA11yAudit(element: HTMLElement): Promise<A11yIssue[]> {
  const issues: A11yIssue[] = [];

  // Check for images without alt text
  const images = element.querySelectorAll('img');
  images.forEach((img) => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        type: 'error',
        message: 'Image missing alt attribute',
        element: img as HTMLElement,
        wcagCriteria: 'WCAG 2.1 Level A - 1.1.1',
      });
    }
  });

  // Check for form inputs without labels
  const inputs = element.querySelectorAll('input, textarea, select');
  inputs.forEach((input) => {
    const hasLabel =
      input.hasAttribute('aria-label') ||
      input.hasAttribute('aria-labelledby') ||
      element.querySelector(`label[for="${input.id}"]`);

    if (!hasLabel) {
      issues.push({
        type: 'error',
        message: 'Form input missing accessible label',
        element: input as HTMLElement,
        wcagCriteria: 'WCAG 2.1 Level A - 3.3.2',
      });
    }
  });

  // Check for buttons without accessible names
  const buttons = element.querySelectorAll('button');
  buttons.forEach((button) => {
    const hasAccessibleName =
      button.textContent?.trim() ||
      button.hasAttribute('aria-label') ||
      button.hasAttribute('aria-labelledby');

    if (!hasAccessibleName) {
      issues.push({
        type: 'error',
        message: 'Button missing accessible name',
        element: button,
        wcagCriteria: 'WCAG 2.1 Level A - 4.1.2',
      });
    }
  });

  // Check for proper heading hierarchy
  const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.substring(1));
    if (level > lastLevel + 1) {
      issues.push({
        type: 'warning',
        message: `Heading level skipped from h${lastLevel} to h${level}`,
        element: heading as HTMLElement,
        wcagCriteria: 'WCAG 2.1 Level AAA - 2.4.6',
      });
    }
    lastLevel = level;
  });

  // Check for color contrast (basic check on computed styles)
  const textElements = element.querySelectorAll('p, span, a, button, label, li');
  textElements.forEach((el) => {
    const styles = window.getComputedStyle(el);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    if (color && backgroundColor) {
      const contrast = checkColorContrast(color, backgroundColor);
      if (!contrast.passes) {
        issues.push({
          type: 'warning',
          message: `Insufficient color contrast ratio (${contrast.ratio.toFixed(2)}:1)`,
          element: el as HTMLElement,
          wcagCriteria: 'WCAG 2.1 Level AA - 1.4.3',
        });
      }
    }
  });

  return issues;
}

/**
 * Check color contrast ratio between foreground and background colors
 * Returns whether it meets WCAG AA standards (4.5:1 for normal text)
 */
export function checkColorContrast(
  foreground: string,
  background: string
): { ratio: number; passes: boolean } {
  const fgRgb = parseColor(foreground);
  const bgRgb = parseColor(background);

  if (!fgRgb || !bgRgb) {
    return { ratio: 0, passes: false };
  }

  const fgLuminance = getRelativeLuminance(fgRgb);
  const bgLuminance = getRelativeLuminance(bgRgb);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  const passes = ratio >= 4.5;

  return { ratio, passes };
}

/**
 * Parse color string to RGB values
 */
function parseColor(color: string): [number, number, number] | null {
  // Create a temporary element to get computed color
  const temp = document.createElement('div');
  temp.style.color = color;
  document.body.appendChild(temp);
  const computed = window.getComputedStyle(temp).color;
  document.body.removeChild(temp);

  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }

  return null;
}

/**
 * Calculate relative luminance of an RGB color
 */
function getRelativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Check if an element is keyboard navigable
 */
export function checkKeyboardNavigability(element: HTMLElement): boolean {
  const focusableSelectors = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    '[contenteditable]',
    '[tabindex]:not([tabindex^="-"])',
  ];

  return focusableSelectors.some((selector) => {
    try {
      return element.matches(selector) || element.querySelector(selector) !== null;
    } catch {
      return false;
    }
  });
}

/**
 * Simulate screen reader output for an element
 * Returns a string representation of what a screen reader might announce
 */
export function simulateScreenReader(element: HTMLElement): string {
  const parts: string[] = [];

  // Role
  const role = element.getAttribute('role') || element.tagName.toLowerCase();
  parts.push(`${role}`);

  // Accessible name
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const textContent = element.textContent?.trim();

  if (ariaLabel) {
    parts.push(ariaLabel);
  } else if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) {
      parts.push(labelElement.textContent?.trim() || '');
    }
  } else if (textContent) {
    parts.push(textContent);
  }

  // State
  const ariaExpanded = element.getAttribute('aria-expanded');
  const ariaPressed = element.getAttribute('aria-pressed');
  const ariaChecked = element.getAttribute('aria-checked');
  const ariaSelected = element.getAttribute('aria-selected');
  const ariaDisabled = element.getAttribute('aria-disabled');

  if (ariaExpanded) {
    parts.push(ariaExpanded === 'true' ? 'expanded' : 'collapsed');
  }

  if (ariaPressed) {
    parts.push(ariaPressed === 'true' ? 'pressed' : 'not pressed');
  }

  if (ariaChecked) {
    parts.push(ariaChecked === 'true' ? 'checked' : 'not checked');
  }

  if (ariaSelected) {
    parts.push(ariaSelected === 'true' ? 'selected' : 'not selected');
  }

  if (ariaDisabled === 'true') {
    parts.push('disabled');
  }

  // Description
  const ariaDescribedBy = element.getAttribute('aria-describedby');
  if (ariaDescribedBy) {
    const descElement = document.getElementById(ariaDescribedBy);
    if (descElement) {
      parts.push(descElement.textContent?.trim() || '');
    }
  }

  return parts.filter(Boolean).join(', ');
}
