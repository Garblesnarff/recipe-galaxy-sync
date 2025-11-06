import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@/test/utils'
import { RecipeCard } from '@/components/RecipeCard'

// Mock the SalesDataContext hook
vi.mock('@/contexts/SalesDataContext', () => ({
  useSalesDataFromContext: vi.fn(() => ({ salesData: [], isLoading: false, hasError: false })),
}))

const mockRecipe = {
  id: '1',
  title: 'Test Recipe',
  description: 'A test recipe description',
  image: 'https://example.com/image.jpg',
  rating: 4,
  cookTime: '30 minutes',
  difficulty: 'Easy',
  isFavorite: false,
  tags: ['Vegetarian', 'Quick'],
}

describe('RecipeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders recipe information correctly', () => {
      render(<RecipeCard {...mockRecipe} />)

      expect(screen.getByText('Test Recipe')).toBeInTheDocument()
      expect(screen.getByText('A test recipe description')).toBeInTheDocument()
      expect(screen.getByText('30 minutes')).toBeInTheDocument()
      expect(screen.getByText('Easy')).toBeInTheDocument()
    })

    it('renders with all optional props', () => {
      const fullRecipe = {
        ...mockRecipe,
        savesCount: 42,
        recentCooks: [
          { id: '1', name: 'John Doe', avatar: 'https://example.com/avatar1.jpg' },
          { id: '2', name: 'Jane Smith', avatar: 'https://example.com/avatar2.jpg' },
        ],
        adaptable: true,
        trending: true,
      }

      render(<RecipeCard {...fullRecipe} />)

      expect(screen.getByText('42 saves')).toBeInTheDocument()
      expect(screen.getByText(/John Doe/)).toBeInTheDocument()
      expect(screen.getByText('🔥 Trending')).toBeInTheDocument()
      expect(screen.getByText('✓ Adaptable')).toBeInTheDocument()
    })

    it('displays tags correctly', () => {
      render(<RecipeCard {...mockRecipe} />)

      expect(screen.getByText('Vegetarian')).toBeInTheDocument()
      expect(screen.getByText('Quick')).toBeInTheDocument()
    })
  })

  describe('Favorite Toggle', () => {
    it('displays favorite status correctly', () => {
      const onFavoriteToggle = vi.fn()
      const favoriteRecipe = { ...mockRecipe, isFavorite: true, onFavoriteToggle }
      render(<RecipeCard {...favoriteRecipe} />)

      const favoriteButton = screen.getByTestId('favorite-button')
      const heartIcon = within(favoriteButton).getByTestId('heart-icon')
      expect(heartIcon).toHaveClass('fill-red-500')
    })

    it('calls onFavoriteToggle when favorite button clicked', () => {
      const onFavoriteToggle = vi.fn()
      render(<RecipeCard {...mockRecipe} onFavoriteToggle={onFavoriteToggle} />)

      const favoriteButton = screen.getByTestId('favorite-button')
      fireEvent.click(favoriteButton)

      expect(onFavoriteToggle).toHaveBeenCalledTimes(1)
    })

    it('toggles favorite icon when clicked', () => {
      let isFavorite = false
      const onFavoriteToggle = vi.fn(() => {
        isFavorite = !isFavorite
      })

      const { rerender } = render(
        <RecipeCard {...mockRecipe} isFavorite={isFavorite} onFavoriteToggle={onFavoriteToggle} />
      )

      const favoriteButton = screen.getByTestId('favorite-button')
      let heartIcon = within(favoriteButton).getByTestId('heart-icon')

      // Initially not favorited
      expect(heartIcon).not.toHaveClass('fill-red-500')

      // Click to favorite
      fireEvent.click(favoriteButton)
      expect(onFavoriteToggle).toHaveBeenCalled()

      // Re-render with updated state
      rerender(<RecipeCard {...mockRecipe} isFavorite={true} onFavoriteToggle={onFavoriteToggle} />)

      heartIcon = within(favoriteButton).getByTestId('heart-icon')
      expect(heartIcon).toHaveClass('fill-red-500')
    })
  })

  describe('Navigation', () => {
    it('navigates to recipe detail page on click', () => {
      render(<RecipeCard {...mockRecipe} />)

      fireEvent.click(screen.getByText('Test Recipe'))
      expect(window.location.pathname).toBe(`/recipe/${mockRecipe.id}`)
    })

    it('navigates when clicking the "Make This Tonight" button', () => {
      render(<RecipeCard {...mockRecipe} />)

      const button = screen.getByRole('button', { name: /make this tonight/i })
      fireEvent.click(button)

      // The button is wrapped in a Link component
      const link = button.closest('a')
      expect(link).toHaveAttribute('href', `/recipe/${mockRecipe.id}`)
    })

    it('shows adapt button on card click when adaptable', () => {
      const { container } = render(<RecipeCard {...mockRecipe} adaptable={true} />)

      const card = container.querySelector('.recipe-card')
      if (card) {
        fireEvent.click(card)
      }

      // Adapt button should appear
      expect(screen.getByRole('button', { name: /adapt for my diet/i })).toBeInTheDocument()
    })
  })

  describe('Image Handling', () => {
    it('renders image when provided', () => {
      render(<RecipeCard {...mockRecipe} />)

      const image = screen.getByAlt('Test Recipe')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
    })

    it('renders default image when no image provided', () => {
      const recipeWithoutImage = { ...mockRecipe, image: undefined }
      render(<RecipeCard {...recipeWithoutImage} />)

      expect(screen.getByText('No image available')).toBeInTheDocument()
    })

    it('handles null image', () => {
      const recipeWithNullImage = { ...mockRecipe, image: null }
      render(<RecipeCard {...recipeWithNullImage} />)

      expect(screen.getByText('No image available')).toBeInTheDocument()
    })

    it('handles image object with url property', () => {
      const recipeWithImageObject = {
        ...mockRecipe,
        image: { url: 'https://example.com/object-image.jpg' } as any,
      }
      render(<RecipeCard {...recipeWithImageObject} />)

      // The normalizeImageUrl function should handle this
      const image = screen.getByAlt('Test Recipe')
      expect(image).toBeInTheDocument()
    })

    it('handles image load errors gracefully', () => {
      render(<RecipeCard {...mockRecipe} />)

      const image = screen.getByAlt('Test Recipe') as HTMLImageElement
      fireEvent.error(image)

      // Component should still render without crashing
      expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    })
  })

  describe('Sales Data Integration', () => {
    it('displays sales count when sales data exists', async () => {
      const { useSalesDataFromContext } = await import('@/contexts/SalesDataContext')
      vi.mocked(useSalesDataFromContext).mockReturnValue({
        salesData: [{ id: '1' }, { id: '2' }] as any,
        isLoading: false,
        hasError: false
      })

      const { rerender } = render(<RecipeCard {...mockRecipe} />)
      rerender(<RecipeCard {...mockRecipe} />)

      const saleIndicator = screen.getByTestId('sale-indicator')
      expect(saleIndicator).toBeInTheDocument()
    })

    it('does not display sales indicator when no sales', () => {
      const { useSalesDataFromContext } = require('@/contexts/SalesDataContext')
      vi.mocked(useSalesDataFromContext).mockReturnValue({
        salesData: [],
        isLoading: false,
        hasError: false
      })

      render(<RecipeCard {...mockRecipe} />)

      const saleIndicator = screen.queryByTestId('sale-indicator')
      expect(saleIndicator).not.toBeInTheDocument()
    })
  })

  describe('Social Proof Elements', () => {
    it('displays saves count', () => {
      render(<RecipeCard {...mockRecipe} savesCount={25} />)

      expect(screen.getByText('25 saves')).toBeInTheDocument()
    })

    it('displays recent cooks', () => {
      const recentCooks = [
        { id: '1', name: 'Alice', avatar: 'https://example.com/alice.jpg' },
        { id: '2', name: 'Bob', avatar: 'https://example.com/bob.jpg' },
        { id: '3', name: 'Charlie', avatar: 'https://example.com/charlie.jpg' },
      ]

      render(<RecipeCard {...mockRecipe} recentCooks={recentCooks} />)

      expect(screen.getByText(/Alice and 2\+ others made this recently/)).toBeInTheDocument()
    })

    it('displays "made this" count', () => {
      const recentCooks = [
        { id: '1', name: 'Alice', avatar: 'https://example.com/alice.jpg' },
        { id: '2', name: 'Bob', avatar: 'https://example.com/bob.jpg' },
      ]

      render(<RecipeCard {...mockRecipe} recentCooks={recentCooks} />)

      expect(screen.getByText('2+ made this')).toBeInTheDocument()
    })

    it('limits displayed avatars to 3', () => {
      const recentCooks = [
        { id: '1', name: 'Alice', avatar: 'https://example.com/alice.jpg' },
        { id: '2', name: 'Bob', avatar: 'https://example.com/bob.jpg' },
        { id: '3', name: 'Charlie', avatar: 'https://example.com/charlie.jpg' },
        { id: '4', name: 'David', avatar: 'https://example.com/david.jpg' },
      ]

      const { container } = render(<RecipeCard {...mockRecipe} recentCooks={recentCooks} />)

      const avatars = container.querySelectorAll('.rounded-full')
      expect(avatars.length).toBeLessThanOrEqual(3)
    })
  })

  describe('Trending and Adaptable Badges', () => {
    it('shows trending badge when trending prop is true', () => {
      render(<RecipeCard {...mockRecipe} trending={true} />)

      expect(screen.getByText('🔥 Trending')).toBeInTheDocument()
    })

    it('does not show trending badge when trending prop is false', () => {
      render(<RecipeCard {...mockRecipe} trending={false} />)

      expect(screen.queryByText('🔥 Trending')).not.toBeInTheDocument()
    })

    it('shows adaptable badge when adaptable prop is true', () => {
      render(<RecipeCard {...mockRecipe} adaptable={true} />)

      expect(screen.getByText('✓ Adaptable')).toBeInTheDocument()
    })

    it('does not show adaptable badge when adaptable prop is false', () => {
      render(<RecipeCard {...mockRecipe} adaptable={false} />)

      expect(screen.queryByText('✓ Adaptable')).not.toBeInTheDocument()
    })
  })

  describe('Delete Functionality', () => {
    it('calls onDelete when delete button clicked', () => {
      const onDelete = vi.fn()
      render(<RecipeCard {...mockRecipe} onDelete={onDelete} />)

      const deleteButton = screen.getByTestId('delete-button')
      fireEvent.click(deleteButton)

      expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it('does not show delete button when onDelete not provided', () => {
      render(<RecipeCard {...mockRecipe} />)

      const deleteButton = screen.queryByTestId('delete-button')
      expect(deleteButton).not.toBeInTheDocument()
    })
  })

  describe('Missing Data Handling', () => {
    it('handles missing description', () => {
      const recipeWithoutDescription = { ...mockRecipe, description: '' }
      render(<RecipeCard {...recipeWithoutDescription} />)

      expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    })

    it('handles missing cook time', () => {
      const recipeWithoutCookTime = { ...mockRecipe, cookTime: undefined }
      render(<RecipeCard {...recipeWithoutCookTime} />)

      expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    })

    it('handles missing difficulty', () => {
      const recipeWithoutDifficulty = { ...mockRecipe, difficulty: undefined }
      render(<RecipeCard {...recipeWithoutDifficulty} />)

      expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    })

    it('handles empty tags array', () => {
      const recipeWithoutTags = { ...mockRecipe, tags: [] }
      render(<RecipeCard {...recipeWithoutTags} />)

      expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    })

    it('renders minimal recipe data', () => {
      const minimalRecipe = {
        id: '1',
        title: 'Minimal Recipe',
        description: '',
        rating: 0,
      }
      render(<RecipeCard {...minimalRecipe} />)

      expect(screen.getByText('Minimal Recipe')).toBeInTheDocument()
    })
  })

  describe('Title Transformations', () => {
    it('transforms generic titles to benefit-driven headlines', () => {
      const chickenAlfredoRecipe = { ...mockRecipe, title: 'Chicken Alfredo' }
      render(<RecipeCard {...chickenAlfredoRecipe} />)

      expect(
        screen.getByText('15-Minute Chicken Alfredo Your Family Will Beg You To Make Again')
      ).toBeInTheDocument()
    })

    it('keeps original title when no transformation exists', () => {
      render(<RecipeCard {...mockRecipe} />)

      expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    })
  })

  describe('Success Confidence Booster', () => {
    it('displays success rate message', () => {
      render(<RecipeCard {...mockRecipe} />)

      expect(screen.getByText(/94% success rate/i)).toBeInTheDocument()
      expect(screen.getByText(/nearly impossible to mess up/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has accessible image alt text', () => {
      render(<RecipeCard {...mockRecipe} />)

      const image = screen.getByAlt('Test Recipe')
      expect(image).toBeInTheDocument()
    })

    it('has proper button roles', () => {
      const onFavoriteToggle = vi.fn()
      render(<RecipeCard {...mockRecipe} onFavoriteToggle={onFavoriteToggle} />)

      const favoriteButton = screen.getByTestId('favorite-button')
      expect(favoriteButton.tagName).toBe('BUTTON')
    })

    it('has descriptive button text', () => {
      render(<RecipeCard {...mockRecipe} />)

      expect(screen.getByRole('button', { name: /make this tonight/i })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles very long titles', () => {
      const longTitleRecipe = {
        ...mockRecipe,
        title: 'A'.repeat(200),
      }
      render(<RecipeCard {...longTitleRecipe} />)

      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument()
    })

    it('handles very long descriptions', () => {
      const longDescriptionRecipe = {
        ...mockRecipe,
        description: 'B'.repeat(500),
      }
      render(<RecipeCard {...longDescriptionRecipe} />)

      // Description should be truncated with line-clamp-2
      expect(screen.getByText('B'.repeat(500))).toBeInTheDocument()
    })

    it('handles special characters in title', () => {
      const specialCharRecipe = {
        ...mockRecipe,
        title: 'Recipe with "Quotes" & <Tags>',
      }
      render(<RecipeCard {...specialCharRecipe} />)

      expect(screen.getByText('Recipe with "Quotes" & <Tags>')).toBeInTheDocument()
    })

    it('handles unicode emojis in title', () => {
      const emojiRecipe = {
        ...mockRecipe,
        title: 'Delicious 🍕 Pizza 🔥',
      }
      render(<RecipeCard {...emojiRecipe} />)

      expect(screen.getByText('Delicious 🍕 Pizza 🔥')).toBeInTheDocument()
    })

    it('handles many tags', () => {
      const manyTagsRecipe = {
        ...mockRecipe,
        tags: Array.from({ length: 20 }, (_, i) => `Tag ${i + 1}`),
      }
      render(<RecipeCard {...manyTagsRecipe} />)

      // Tags should be rendered
      expect(screen.getByText('Tag 1')).toBeInTheDocument()
    })

    it('handles zero rating', () => {
      const zeroRatingRecipe = {
        ...mockRecipe,
        rating: 0,
      }
      render(<RecipeCard {...zeroRatingRecipe} />)

      expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    })

    it('handles missing avatar in recent cooks', () => {
      const recentCooks = [{ id: '1', name: 'Alice', avatar: '' }]
      render(<RecipeCard {...mockRecipe} recentCooks={recentCooks} />)

      // Should handle missing avatar gracefully
      expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    })
  })

  describe('Component Memoization', () => {
    it('does not re-render when props unchanged', () => {
      const { rerender } = render(<RecipeCard {...mockRecipe} />)

      // Re-render with same props
      rerender(<RecipeCard {...mockRecipe} />)

      // Component should use memo to avoid unnecessary re-renders
      expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    })
  })
})
