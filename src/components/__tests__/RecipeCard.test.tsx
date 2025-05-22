import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@/test/utils'
import { RecipeCard } from '@/components/RecipeCard'

const mockRecipe = {
  id: '1',
  title: 'Test Recipe',
  description: 'A test recipe description',
  image: 'https://example.com/image.jpg', // Changed from image_url to image
  rating: 4, // Added rating
  cookTime: '30 minutes', // Changed from cook_time to cookTime
  difficulty: 'Easy', // Added difficulty
  isFavorite: false, // Changed from is_favorite to isFavorite
  tags: ['Vegetarian', 'Quick'], // Added tags
}

describe('RecipeCard', () => {
  it('renders recipe information correctly', () => {
    render(<RecipeCard {...mockRecipe} />)
    
    expect(screen.getByText('Test Recipe')).toBeInTheDocument()
    expect(screen.getByText('A test recipe description')).toBeInTheDocument()
    expect(screen.getByText('30 minutes')).toBeInTheDocument()
    expect(screen.getByText('Easy')).toBeInTheDocument() // Check for difficulty
  })

  it('displays favorite status correctly', () => {
    const favoriteRecipe = { ...mockRecipe, isFavorite: true, onFavoriteToggle: vi.fn() } // Add onFavoriteToggle
    render(<RecipeCard {...favoriteRecipe} />) // Use spread operator for props
    
    const favoriteButton = screen.getByTestId('favorite-button')
    const heartIcon = within(favoriteButton).getByTestId('heart-icon'); // Use getByTestId for the Heart icon
    expect(heartIcon).toHaveClass('fill-red-500'); // Check the class on the icon (it's fill-red-500, not text-red-500)
  })

  it('renders default image when no image provided', () => {
    const recipeWithoutImage = { ...mockRecipe, image: null }
    render(<RecipeCard {...recipeWithoutImage} />) // Use spread operator for props
    
    expect(screen.getByText('No image available')).toBeInTheDocument()
  })

  it('navigates to recipe detail page on click', () => {
    render(<RecipeCard {...mockRecipe} />)
    
    fireEvent.click(screen.getByText('Test Recipe')) // Click on the title or any clickable part
    expect(window.location.pathname).toBe(`/recipe/${mockRecipe.id}`) // Verify navigation
  })
})
