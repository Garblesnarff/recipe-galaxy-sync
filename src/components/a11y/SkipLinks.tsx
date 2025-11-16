import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkipLink {
  href: string;
  label: string;
}

const defaultSkipLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#main-navigation', label: 'Skip to navigation' },
  { href: '#footer', label: 'Skip to footer' },
];

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

/**
 * Skip links for keyboard navigation
 * Hidden until focused, allowing users to bypass repetitive content
 */
export const SkipLinks: React.FC<SkipLinksProps> = ({
  links = defaultSkipLinks,
  className,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

    const target = document.querySelector(href);
    if (target instanceof HTMLElement) {
      // Make target focusable if it isn't
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }

      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={cn('skip-links-container', className)}>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="skip-link"
          onClick={(e) => handleClick(e, link.href)}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

SkipLinks.displayName = 'SkipLinks';
