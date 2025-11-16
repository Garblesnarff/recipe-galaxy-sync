import * as React from 'react';
import { SkipLinks } from '@/components/a11y/SkipLinks';
import { cn } from '@/lib/utils';

interface AccessibleLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  navigation?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Accessible layout component with proper ARIA landmarks and semantic HTML
 * Includes skip links for keyboard navigation
 */
export const AccessibleLayout: React.FC<AccessibleLayoutProps> = ({
  children,
  header,
  navigation,
  sidebar,
  footer,
  className,
}) => {
  return (
    <>
      <SkipLinks />
      <div className={cn('min-h-screen flex flex-col', className)}>
        {header && (
          <header role="banner" className="sticky top-0 z-40">
            {header}
          </header>
        )}

        {navigation && (
          <nav
            role="navigation"
            aria-label="Main navigation"
            id="main-navigation"
            className="border-b"
          >
            {navigation}
          </nav>
        )}

        <div className="flex flex-1">
          {sidebar && (
            <aside
              role="complementary"
              aria-label="Sidebar"
              className="border-r"
            >
              {sidebar}
            </aside>
          )}

          <main
            role="main"
            id="main-content"
            className="flex-1"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>

        {footer && (
          <footer role="contentinfo" id="footer" className="mt-auto border-t">
            {footer}
          </footer>
        )}
      </div>
    </>
  );
};

AccessibleLayout.displayName = 'AccessibleLayout';
