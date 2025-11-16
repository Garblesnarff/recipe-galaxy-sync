import * as React from 'react';
import { cn } from '@/lib/utils';

interface FocusIndicatorProps {
  children: React.ReactNode;
  enhanced?: boolean;
  className?: string;
}

/**
 * Wrapper component that adds enhanced focus styling to its children
 * Useful for making focus states more visible
 */
export const FocusIndicator: React.FC<FocusIndicatorProps> = ({
  children,
  enhanced = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'focus-within:outline-none',
        enhanced ? 'focus-within:ring-4 focus-within:ring-ring focus-within:ring-offset-4' : 'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className
      )}
    >
      {children}
    </div>
  );
};

FocusIndicator.displayName = 'FocusIndicator';
