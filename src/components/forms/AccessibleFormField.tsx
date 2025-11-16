import * as React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AccessibleFormFieldProps {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Accessible form field wrapper with proper label association,
 * error handling, and help text support
 */
export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  label,
  error,
  helpText,
  required = false,
  children,
  className,
  id,
}) => {
  const fieldId = id || `field-${React.useId()}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  // Clone child element to add ARIA attributes
  const childWithProps = React.cloneElement(children as React.ReactElement, {
    id: fieldId,
    'aria-required': required,
    'aria-invalid': !!error,
    'aria-describedby': [
      error ? errorId : null,
      helpText ? helpId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined,
  });

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={fieldId}>
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </Label>

      {helpText && (
        <p id={helpId} className="text-sm text-muted-foreground">
          {helpText}
        </p>
      )}

      {childWithProps}

      {error && (
        <p
          id={errorId}
          className="text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

AccessibleFormField.displayName = 'AccessibleFormField';
