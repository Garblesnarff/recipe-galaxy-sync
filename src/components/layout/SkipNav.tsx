/**
 * SkipNav Component
 *
 * Provides a "Skip to main content" link for keyboard and screen reader users
 * to bypass repetitive navigation and jump directly to main content.
 *
 * WCAG 2.4.1 - Bypass Blocks (Level A)
 * https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html
 *
 * Usage:
 * 1. Place <SkipNav /> at the very top of your app (before navigation)
 * 2. Add id="main-content" to your main content container
 *
 * Behavior:
 * - Hidden until focused (keyboard Tab)
 * - Visible when focused
 * - Clicking/activating moves focus to main content
 */

export const SkipNav = () => {
  const skipToMainContent = (e: React.MouseEvent<HTMLAnchorElement> | React.KeyboardEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView()
    }
  }

  return (
    <a
      href="#main-content"
      onClick={skipToMainContent}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          skipToMainContent(e)
        }
      }}
      className="skip-nav-link"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '0',
        zIndex: 9999,
        padding: '1rem 1.5rem',
        backgroundColor: '#1e40af',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '0 0 0.375rem 0.375rem',
        fontWeight: '600',
        fontSize: '1rem',
        transition: 'left 0.2s ease-in-out'
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = '0'
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = '-9999px'
      }}
    >
      Skip to main content
    </a>
  )
}

/**
 * MainContent Component
 *
 * Wrapper for main content area that works with SkipNav.
 * Ensures the main content is properly identified and focusable.
 */

interface MainContentProps {
  children: React.ReactNode
  className?: string
}

export const MainContent = ({ children, className = '' }: MainContentProps) => {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={className}
      style={{
        outline: 'none' // Remove focus outline since this is a programmatic focus target
      }}
    >
      {children}
    </main>
  )
}
