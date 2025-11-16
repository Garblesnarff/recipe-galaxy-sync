import * as React from 'react';
import { cn } from '@/lib/utils';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * Component that renders content visible only to screen readers
 * Content is visually hidden but accessible to assistive technologies
 */
export const ScreenReaderOnly = React.forwardRef<
  HTMLElement,
  ScreenReaderOnlyProps
>(({ children, as: Component = 'span', className, ...props }, ref) => {
  return React.createElement(
    Component,
    {
      ref,
      className: cn('sr-only', className),
      ...props,
    },
    children
  );
});

ScreenReaderOnly.displayName = 'ScreenReaderOnly';
