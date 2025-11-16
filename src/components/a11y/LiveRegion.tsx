import * as React from 'react';
import { useEffect, useState } from 'react';

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive' | 'off';
  clearAfter?: number; // milliseconds
  className?: string;
}

/**
 * ARIA live region for dynamic announcements to screen readers
 * Automatically clears message after specified time
 */
export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = 'polite',
  clearAfter = 5000,
  className = '',
}) => {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);

    if (message && clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      role={priority === 'off' ? undefined : 'status'}
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {currentMessage}
    </div>
  );
};

LiveRegion.displayName = 'LiveRegion';
