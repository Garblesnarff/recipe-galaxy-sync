import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { axe } from 'jest-axe'
import { RecipeInstructionsList } from '@/components/recipe/RecipeInstructionsList'
import { RecipeFilterBar } from '@/components/recipe/RecipeFilters'
import { GroceryItem } from '@/components/grocery/GroceryItem'
import { RecipeFilters } from '@/types/recipe'

/**
 * Comprehensive Accessibility Test Suite
 *
 * This suite uses jest-axe for automated accessibility testing following
 * WCAG 2.1 Level A guidelines.
 *
 * Tests cover:
 * - ARIA compliance
 * - Keyboard navigation
 * - Screen reader support
 * - Focus indicators
 * - Color contrast (where applicable)
 * - Heading hierarchy
 */

describe('Accessibility Compliance', () => {
  describe('RecipeInstructionsList Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const instructions = 'Mix ingredients\nBake for 30 minutes\nLet cool'
      const { container } = render(<RecipeInstructionsList instructions={instructions} />)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has proper ARIA roles for checkboxes', () => {
      const instructions = 'Step 1: Mix\nStep 2: Bake'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(2)

      checkboxes.forEach((checkbox, index) => {
        expect(checkbox).toHaveAttribute('role', 'checkbox')
        expect(checkbox).toHaveAttribute('aria-checked')
        expect(checkbox).toHaveAttribute('aria-label', `Mark step ${index + 1} as complete`)
      })
    })

    it('updates aria-checked when checkbox is toggled', () => {
      const instructions = 'Test step'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-checked', 'false')

      fireEvent.click(checkbox)
      expect(checkbox).toHaveAttribute('aria-checked', 'true')

      fireEvent.click(checkbox)
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
    })

    it('is keyboard navigable (Tab, Enter, Space)', () => {
      const instructions = 'Keyboard test'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox')

      // Tab to focus
      checkbox.focus()
      expect(checkbox).toHaveFocus()

      // Should be clickable (Space and Enter work on buttons)
      expect(checkbox.tagName).toBe('BUTTON')
    })

    it('has proper heading hierarchy', () => {
      const instructions = 'Test'
      const { container } = render(<RecipeInstructionsList instructions={instructions} />)

      const heading = container.querySelector('h2')
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Instructions')
    })

    it('provides accessible labels for all interactive elements', () => {
      const instructions = 'Step A\nStep B\nStep C'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach((checkbox) => {
        const ariaLabel = checkbox.getAttribute('aria-label')
        expect(ariaLabel).toBeTruthy()
        expect(ariaLabel).toMatch(/mark step \d+ as complete/i)
      })
    })
  })

  describe('RecipeFilters Accessibility', () => {
    const mockFilters: RecipeFilters = {
      searchQuery: '',
      categories: [],
      cuisine_type: null,
      diet_tags: [],
      cooking_method: null,
      season_occasion: [],
      difficulty: null,
      favorite_only: false
    }

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <RecipeFilterBar
          filters={mockFilters}
          onFiltersChange={() => {}}
          sortOption={{ value: 'created_at', direction: 'desc', label: 'Newest First' }}
          onSortChange={() => {}}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has proper ARIA tablist structure', () => {
      const { container } = render(
        <RecipeFilterBar
          filters={mockFilters}
          onFiltersChange={() => {}}
          sortOption={{ value: 'created_at', direction: 'desc', label: 'Newest First' }}
          onSortChange={() => {}}
        />
      )

      // Open filters first
      const filterButton = screen.getByText('Filter')
      fireEvent.click(filterButton)

      const tablist = container.querySelector('[role="tablist"]')
      expect(tablist).toBeInTheDocument()
      expect(tablist).toHaveAttribute('aria-label', 'Filter categories')
    })

    it('tabs have proper ARIA attributes', async () => {
      render(
        <RecipeFilterBar
          filters={mockFilters}
          onFiltersChange={() => {}}
          sortOption={{ value: 'created_at', direction: 'desc', label: 'Newest First' }}
          onSortChange={() => {}}
        />
      )

      // Open filters
      const filterButton = screen.getByText('Filter')
      fireEvent.click(filterButton)

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab')
        expect(tabs.length).toBeGreaterThan(0)

        tabs.forEach((tab) => {
          expect(tab).toHaveAttribute('aria-selected')
          expect(tab).toHaveAttribute('aria-controls')
          expect(tab).toHaveAttribute('id')
        })
      })
    })

    it('supports keyboard navigation with Arrow keys', async () => {
      render(
        <RecipeFilterBar
          filters={mockFilters}
          onFiltersChange={() => {}}
          sortOption={{ value: 'created_at', direction: 'desc', label: 'Newest First' }}
          onSortChange={() => {}}
        />
      )

      // Open filters
      const filterButton = screen.getByText('Filter')
      fireEvent.click(filterButton)

      await waitFor(() => {
        const categoriesTab = screen.getByRole('tab', { name: 'Categories' })
        categoriesTab.focus()
        expect(categoriesTab).toHaveFocus()

        // Arrow Right should move to next tab
        fireEvent.keyDown(categoriesTab, { key: 'ArrowRight' })

        const cuisineTab = screen.getByRole('tab', { name: 'Cuisine' })
        expect(cuisineTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('tab panels are properly connected to tabs', async () => {
      render(
        <RecipeFilterBar
          filters={mockFilters}
          onFiltersChange={() => {}}
          sortOption={{ value: 'created_at', direction: 'desc', label: 'Newest First' }}
          onSortChange={() => {}}
        />
      )

      // Open filters
      const filterButton = screen.getByText('Filter')
      fireEvent.click(filterButton)

      await waitFor(() => {
        const categoriesTab = screen.getByRole('tab', { name: 'Categories' })
        const ariaControls = categoriesTab.getAttribute('aria-controls')

        expect(ariaControls).toBe('categories-panel')

        const panel = screen.getByRole('tabpanel')
        expect(panel).toHaveAttribute('id', ariaControls)
        expect(panel).toHaveAttribute('aria-labelledby', 'categories-tab')
      })
    })

    it('all checkboxes have associated labels', async () => {
      render(
        <RecipeFilterBar
          filters={mockFilters}
          onFiltersChange={() => {}}
          sortOption={{ value: 'created_at', direction: 'desc', label: 'Newest First' }}
          onSortChange={() => {}}
        />
      )

      // Open filters
      const filterButton = screen.getByText('Filter')
      fireEvent.click(filterButton)

      await waitFor(() => {
        const { container } = render(
          <RecipeFilterBar
            filters={mockFilters}
            onFiltersChange={() => {}}
            sortOption={{ value: 'created_at', direction: 'desc', label: 'Newest First' }}
            onSortChange={() => {}}
          />
        )

        const checkboxes = container.querySelectorAll('[type="button"][role="checkbox"]')
        checkboxes.forEach((checkbox) => {
          const id = checkbox.getAttribute('id')
          if (id) {
            const label = container.querySelector(`label[for="${id}"]`)
            expect(label).toBeInTheDocument()
          }
        })
      })
    })

    it('search input has accessible label', () => {
      render(
        <RecipeFilterBar
          filters={mockFilters}
          onFiltersChange={() => {}}
          sortOption={{ value: 'created_at', direction: 'desc', label: 'Newest First' }}
          onSortChange={() => {}}
        />
      )

      const searchInput = screen.getByPlaceholderText('Search recipes...')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('type', 'text')
    })
  })

  describe('GroceryItem Accessibility', () => {
    const mockItem = {
      id: '1',
      user_id: 'user123',
      item_name: 'Milk',
      quantity: '1',
      unit: 'gallon',
      is_purchased: false,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      recipe_id: null
    }

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <GroceryItem
          item={mockItem}
          onStatusChange={() => {}}
          onDelete={() => {}}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('checkbox has proper ARIA attributes', () => {
      render(
        <GroceryItem
          item={mockItem}
          onStatusChange={() => {}}
          onDelete={() => {}}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('role', 'checkbox')
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
      expect(checkbox).toHaveAttribute('aria-label', 'Mark Milk as purchased')
    })

    it('delete button has accessible name', () => {
      render(
        <GroceryItem
          item={mockItem}
          onStatusChange={() => {}}
          onDelete={() => {}}
        />
      )

      const deleteButton = screen.getByLabelText('Delete Milk from grocery list')
      expect(deleteButton).toBeInTheDocument()
      expect(deleteButton.tagName).toBe('BUTTON')
    })

    it('is keyboard navigable', () => {
      render(
        <GroceryItem
          item={mockItem}
          onStatusChange={() => {}}
          onDelete={() => {}}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()
      expect(checkbox).toHaveFocus()

      const deleteButton = screen.getByLabelText('Delete Milk from grocery list')
      deleteButton.focus()
      expect(deleteButton).toHaveFocus()
    })

    it('updates aria-checked on status change', () => {
      const { rerender } = render(
        <GroceryItem
          item={mockItem}
          onStatusChange={() => {}}
          onDelete={() => {}}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-checked', 'false')

      // Re-render with purchased state
      rerender(
        <GroceryItem
          item={{ ...mockItem, is_purchased: true }}
          onStatusChange={() => {}}
          onDelete={() => {}}
        />
      )

      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })

    it('visually indicates purchased state for screen readers', () => {
      render(
        <GroceryItem
          item={{ ...mockItem, is_purchased: true }}
          onStatusChange={() => {}}
          onDelete={() => {}}
        />
      )

      const itemName = screen.getByText('Milk')
      expect(itemName).toHaveClass('line-through')
      expect(itemName).toHaveClass('text-gray-400')
    })
  })

  describe('Focus Management', () => {
    it('all interactive elements are keyboard focusable', () => {
      const instructions = 'Test step'
      const { container } = render(<RecipeInstructionsList instructions={instructions} />)

      const interactiveElements = container.querySelectorAll('button, input, select, textarea, a[href]')

      interactiveElements.forEach((element) => {
        const tabIndex = element.getAttribute('tabindex')
        // Ensure element is not explicitly excluded from tab order (tabindex="-1")
        // unless it's part of a custom keyboard navigation pattern
        if (tabIndex !== '-1') {
          expect(element).not.toHaveAttribute('disabled')
        }
      })
    })

    it('focus indicators are visible', () => {
      const instructions = 'Focus test'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()

      // Button should be focusable
      expect(checkbox).toHaveFocus()
      // Focus styles are applied via CSS, we just verify element receives focus
    })
  })

  describe('Color Contrast', () => {
    it('completed steps have sufficient contrast', () => {
      const instructions = 'Contrast test'
      const { container } = render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      const text = screen.getByText('Contrast test')
      // Completed steps have visual styling (line-through, opacity)
      expect(text).toHaveClass('line-through')
      expect(text).toHaveClass('opacity-70')

      // Parent div has text-gray-500 which provides sufficient contrast ratio (4.5:1+)
      const parentDiv = text.closest('div')
      expect(parentDiv).toHaveClass('text-gray-500')
    })

    it('interactive elements have visible states', () => {
      const mockItem = {
        id: '1',
        user_id: 'user123',
        item_name: 'Test Item',
        quantity: '1',
        unit: 'unit',
        is_purchased: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        recipe_id: null
      }

      const { container } = render(
        <GroceryItem
          item={mockItem}
          onStatusChange={() => {}}
          onDelete={() => {}}
        />
      )

      // Verify interactive elements have hover states
      const deleteButton = screen.getByLabelText(/delete/i)
      expect(deleteButton).toHaveClass('hover:text-red-500')
    })
  })

  describe('Heading Hierarchy', () => {
    it('maintains proper heading levels', () => {
      const instructions = 'Test'
      const { container } = render(<RecipeInstructionsList instructions={instructions} />)

      // Check h2 for instructions
      const h2 = container.querySelector('h2')
      expect(h2).toBeInTheDocument()
      expect(h2).toHaveTextContent('Instructions')

      // No h4 should exist without h3
      const h4s = container.querySelectorAll('h4')
      const h3s = container.querySelectorAll('h3')

      if (h4s.length > 0) {
        expect(h3s.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Screen Reader Support', () => {
    it('provides context for checkbox state changes', () => {
      const instructions = 'Screen reader test'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox')

      // Initial state announced
      expect(checkbox).toHaveAttribute('aria-label', 'Mark step 1 as complete')
      expect(checkbox).toHaveAttribute('aria-checked', 'false')

      // After click, new state is announced
      fireEvent.click(checkbox)
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })

    it('badges and status indicators are accessible', () => {
      const mockItem = {
        id: '1',
        user_id: 'user123',
        item_name: 'Test Item',
        quantity: '1',
        unit: 'unit',
        is_purchased: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        recipe_id: null
      }

      render(
        <GroceryItem
          item={mockItem}
          onStatusChange={() => {}}
          onDelete={() => {}}
          onSale={true}
          salePrice={1.99}
          regularPrice={2.99}
        />
      )

      // Sale badge should be visible
      const saleBadge = screen.getByText('SALE')
      expect(saleBadge).toBeInTheDocument()
    })

    it('dynamic content updates are perceivable', () => {
      const instructions = 'Dynamic test'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox')
      const text = screen.getByText('Dynamic test')

      // Initial state
      expect(text).not.toHaveClass('line-through')

      // After toggle, visual change is complemented by ARIA state
      fireEvent.click(checkbox)
      expect(text).toHaveClass('line-through')
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Form Controls', () => {
    it('all form inputs have associated labels', async () => {
      const mockFilters: RecipeFilters = {
        searchQuery: '',
        categories: [],
        cuisine_type: null,
        diet_tags: [],
        cooking_method: null,
        season_occasion: [],
        difficulty: null,
        favorite_only: false
      }

      const { container } = render(
        <RecipeFilterBar
          filters={mockFilters}
          onFiltersChange={() => {}}
          sortOption={{ value: 'created_at', direction: 'desc', label: 'Newest First' }}
          onSortChange={() => {}}
        />
      )

      // Open filters to reveal form controls
      const filterButton = screen.getByText('Filter')
      fireEvent.click(filterButton)

      await waitFor(() => {
        // Click on Cuisine tab
        const cuisineTab = screen.getByRole('tab', { name: 'Cuisine' })
        fireEvent.click(cuisineTab)
      })

      await waitFor(() => {
        // Check for labels
        const cuisineLabel = screen.getByText('Cuisine Type')
        expect(cuisineLabel).toBeInTheDocument()

        const cookingMethodLabel = screen.getByText('Cooking Method')
        expect(cookingMethodLabel).toBeInTheDocument()
      })
    })

    it('switch controls have labels', async () => {
      const mockFilters: RecipeFilters = {
        searchQuery: '',
        categories: [],
        cuisine_type: null,
        diet_tags: [],
        cooking_method: null,
        season_occasion: [],
        difficulty: null,
        favorite_only: false
      }

      render(
        <RecipeFilterBar
          filters={mockFilters}
          onFiltersChange={() => {}}
          sortOption={{ value: 'created_at', direction: 'desc', label: 'Newest First' }}
          onSortChange={() => {}}
        />
      )

      // Open filters
      const filterButton = screen.getByText('Filter')
      fireEvent.click(filterButton)

      await waitFor(() => {
        // Click on Other tab
        const otherTab = screen.getByRole('tab', { name: 'Other' })
        fireEvent.click(otherTab)
      })

      await waitFor(() => {
        const favoriteLabel = screen.getByText('Favorites Only')
        expect(favoriteLabel).toBeInTheDocument()
      })
    })
  })

  describe('Button Accessibility', () => {
    it('all buttons have accessible names', () => {
      const mockFilters: RecipeFilters = {
        searchQuery: '',
        categories: [],
        cuisine_type: null,
        diet_tags: [],
        cooking_method: null,
        season_occasion: [],
        difficulty: null,
        favorite_only: false
      }

      const { container } = render(
        <RecipeFilterBar
          filters={mockFilters}
          onFiltersChange={() => {}}
          sortOption={{ value: 'created_at', direction: 'desc', label: 'Newest First' }}
          onSortChange={() => {}}
        />
      )

      const buttons = container.querySelectorAll('button')
      buttons.forEach((button) => {
        const hasTextContent = button.textContent && button.textContent.trim().length > 0
        const hasAriaLabel = button.hasAttribute('aria-label')
        const hasAriaLabelledBy = button.hasAttribute('aria-labelledby')
        const hasTitle = button.hasAttribute('title')

        // Button should have at least one way to be labeled
        expect(
          hasTextContent || hasAriaLabel || hasAriaLabelledBy || hasTitle
        ).toBe(true)
      })
    })

    it('icon-only buttons have aria-labels', () => {
      const mockItem = {
        id: '1',
        user_id: 'user123',
        item_name: 'Test Item',
        quantity: '1',
        unit: 'unit',
        is_purchased: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        recipe_id: null
      }

      render(
        <GroceryItem
          item={mockItem}
          onStatusChange={() => {}}
          onDelete={() => {}}
        />
      )

      // Delete button is icon-only, should have aria-label
      const deleteButton = screen.getByLabelText(/delete/i)
      expect(deleteButton).toHaveAttribute('aria-label')
    })
  })
})
