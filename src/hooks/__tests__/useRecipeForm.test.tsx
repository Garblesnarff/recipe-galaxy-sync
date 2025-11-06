import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRecipeForm } from '../useRecipeForm'
import { mockNavigate } from '@/test/mocks'
import { BrowserRouter } from 'react-router-dom'
import * as recipeServices from '@/services/recipe'

// Mock the recipe services
vi.mock('@/services/recipe', () => ({
  uploadImage: vi.fn(),
  saveRecipe: vi.fn(),
  importRecipeFromUrl: vi.fn(),
  validateUrl: vi.fn(),
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('useRecipeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mock implementations
    vi.mocked(recipeServices.validateUrl).mockReturnValue(true)
    vi.mocked(recipeServices.uploadImage).mockResolvedValue('https://example.com/uploaded-image.jpg')
    vi.mocked(recipeServices.saveRecipe).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Initialization', () => {
    it('initializes with default form data', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      expect(result.current.formData).toEqual({
        title: '',
        description: '',
        cookTime: '',
        difficulty: 'Easy',
        instructions: '',
        ingredients: [],
        currentIngredient: '',
        imageUrl: '',
        source_url: '',
        recipe_type: 'manual',
        categories: [],
        cuisine_type: 'Uncategorized',
        diet_tags: [],
        cooking_method: 'Various',
        season_occasion: [],
        prep_time: '15 minutes',
        servings: 4,
      })
    })

    it('initializes with non-submitting state', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.isImporting).toBe(false)
    })

    it('has no image file or preview initially', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      expect(result.current.imageFile).toBeNull()
      expect(result.current.imagePreview).toBeNull()
    })
  })

  describe('Add Ingredient', () => {
    it('adds ingredient to list', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          currentIngredient: 'flour',
        })
      })

      act(() => {
        result.current.addIngredient({ preventDefault: vi.fn() } as any)
      })

      expect(result.current.formData.ingredients).toContain('flour')
      expect(result.current.formData.currentIngredient).toBe('')
    })

    it('trims whitespace from ingredient', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          currentIngredient: '  flour  ',
        })
      })

      act(() => {
        result.current.addIngredient({ preventDefault: vi.fn() } as any)
      })

      expect(result.current.formData.ingredients).toContain('flour')
    })

    it('does not add empty ingredient', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          currentIngredient: '   ',
        })
      })

      act(() => {
        result.current.addIngredient({ preventDefault: vi.fn() } as any)
      })

      expect(result.current.formData.ingredients).toHaveLength(0)
    })

    it('adds multiple ingredients sequentially', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      const ingredients = ['flour', 'sugar', 'butter']

      ingredients.forEach((ingredient) => {
        act(() => {
          result.current.setFormData({
            ...result.current.formData,
            currentIngredient: ingredient,
          })
        })

        act(() => {
          result.current.addIngredient({ preventDefault: vi.fn() } as any)
        })
      })

      expect(result.current.formData.ingredients).toEqual(ingredients)
    })

    it('prevents default form submission', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })
      const preventDefault = vi.fn()

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          currentIngredient: 'flour',
        })
      })

      act(() => {
        result.current.addIngredient({ preventDefault } as any)
      })

      expect(preventDefault).toHaveBeenCalled()
    })
  })

  describe('Remove Ingredient', () => {
    it('removes ingredient at specific index', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          ingredients: ['flour', 'sugar', 'butter'],
        })
      })

      act(() => {
        result.current.removeIngredient(1) // Remove 'sugar'
      })

      expect(result.current.formData.ingredients).toEqual(['flour', 'butter'])
    })

    it('handles removing first ingredient', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          ingredients: ['flour', 'sugar'],
        })
      })

      act(() => {
        result.current.removeIngredient(0)
      })

      expect(result.current.formData.ingredients).toEqual(['sugar'])
    })

    it('handles removing last ingredient', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          ingredients: ['flour', 'sugar'],
        })
      })

      act(() => {
        result.current.removeIngredient(1)
      })

      expect(result.current.formData.ingredients).toEqual(['flour'])
    })

    it('handles removing from single-item list', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          ingredients: ['flour'],
        })
      })

      act(() => {
        result.current.removeIngredient(0)
      })

      expect(result.current.formData.ingredients).toEqual([])
    })
  })

  describe('Image Upload', () => {
    it('handles image file selection', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockEvent = {
        target: {
          files: [file],
        },
      } as any

      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'mock-blob-url')

      act(() => {
        result.current.handleImageChange(mockEvent)
      })

      expect(result.current.imageFile).toBe(file)
      expect(result.current.imagePreview).toBe('mock-blob-url')
    })

    it('ignores event with no files', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      const mockEvent = {
        target: {
          files: [],
        },
      } as any

      act(() => {
        result.current.handleImageChange(mockEvent)
      })

      expect(result.current.imageFile).toBeNull()
    })

    it('updates image preview when file changes', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      global.URL.createObjectURL = vi.fn()
        .mockReturnValueOnce('first-blob-url')
        .mockReturnValueOnce('second-blob-url')

      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' })
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.handleImageChange({ target: { files: [file1] } } as any)
      })

      expect(result.current.imagePreview).toBe('first-blob-url')

      act(() => {
        result.current.handleImageChange({ target: { files: [file2] } } as any)
      })

      expect(result.current.imagePreview).toBe('second-blob-url')
    })
  })

  describe('Recipe Import from URL', () => {
    it('imports recipe successfully', async () => {
      const mockImportedData = {
        title: 'Imported Recipe',
        description: 'Imported description',
        cook_time: '30 minutes',
        ingredients: ['imported ingredient 1', 'imported ingredient 2'],
        instructions: 'Imported instructions',
        image_url: 'https://example.com/imported.jpg',
      }

      vi.mocked(recipeServices.importRecipeFromUrl).mockResolvedValue(mockImportedData)

      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setRecipeUrl('https://example.com/recipe')
      })

      await act(async () => {
        await result.current.importRecipe()
      })

      expect(result.current.formData.title).toBe('Imported Recipe')
      expect(result.current.formData.ingredients).toEqual(['imported ingredient 1', 'imported ingredient 2'])
      expect(result.current.formData.source_url).toBe('https://example.com/recipe')
    })

    it('validates URL before importing', async () => {
      vi.mocked(recipeServices.validateUrl).mockReturnValue(false)

      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setRecipeUrl('invalid-url')
      })

      await act(async () => {
        await result.current.importRecipe()
      })

      expect(recipeServices.importRecipeFromUrl).not.toHaveBeenCalled()
    })

    it('handles empty URL', async () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setRecipeUrl('')
      })

      await act(async () => {
        await result.current.importRecipe()
      })

      expect(recipeServices.importRecipeFromUrl).not.toHaveBeenCalled()
    })

    it('sets isImporting state during import', async () => {
      let resolveImport: any
      const importPromise = new Promise((resolve) => {
        resolveImport = resolve
      })

      vi.mocked(recipeServices.importRecipeFromUrl).mockReturnValue(importPromise as any)

      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setRecipeUrl('https://example.com/recipe')
      })

      const importCall = act(async () => {
        await result.current.importRecipe()
      })

      // Should be importing
      await waitFor(() => expect(result.current.isImporting).toBe(true))

      // Resolve import
      resolveImport({ title: 'Test' })
      await importCall

      // Should no longer be importing
      expect(result.current.isImporting).toBe(false)
    })

    it('handles import errors', async () => {
      vi.mocked(recipeServices.importRecipeFromUrl).mockRejectedValue(new Error('Import failed'))

      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setRecipeUrl('https://example.com/recipe')
      })

      await act(async () => {
        await result.current.importRecipe()
      })

      expect(result.current.importError).toBe('Import failed')
      expect(result.current.isImporting).toBe(false)
    })

    it('detects YouTube URLs and sets correct recipe type', async () => {
      vi.mocked(recipeServices.importRecipeFromUrl).mockResolvedValue({
        title: 'YouTube Recipe',
      })

      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setRecipeUrl('https://youtube.com/watch?v=123')
      })

      await act(async () => {
        await result.current.importRecipe()
      })

      expect(result.current.formData.recipe_type).toBe('youtube')
    })

    it('detects webpage URLs and sets correct recipe type', async () => {
      vi.mocked(recipeServices.importRecipeFromUrl).mockResolvedValue({
        title: 'Webpage Recipe',
      })

      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setRecipeUrl('https://example.com/recipe')
      })

      await act(async () => {
        await result.current.importRecipe()
      })

      expect(result.current.formData.recipe_type).toBe('webpage')
    })

    it('handles ingredients as JSON string', async () => {
      vi.mocked(recipeServices.importRecipeFromUrl).mockResolvedValue({
        title: 'Test',
        ingredients: JSON.stringify(['ingredient 1', 'ingredient 2']),
      })

      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setRecipeUrl('https://example.com/recipe')
      })

      await act(async () => {
        await result.current.importRecipe()
      })

      expect(result.current.formData.ingredients).toEqual(['ingredient 1', 'ingredient 2'])
    })

    it('handles ingredients as comma-separated string', async () => {
      vi.mocked(recipeServices.importRecipeFromUrl).mockResolvedValue({
        title: 'Test',
        ingredients: 'ingredient 1, ingredient 2, ingredient 3',
      })

      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setRecipeUrl('https://example.com/recipe')
      })

      await act(async () => {
        await result.current.importRecipe()
      })

      expect(result.current.formData.ingredients).toEqual(['ingredient 1', 'ingredient 2', 'ingredient 3'])
    })
  })

  describe('Form Submission', () => {
    it('submits recipe successfully', async () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          title: 'Test Recipe',
          ingredients: ['flour', 'sugar'],
          instructions: 'Mix and bake',
        })
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      })

      expect(recipeServices.saveRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Recipe',
          ingredients: ['flour', 'sugar'],
          instructions: 'Mix and bake',
        }),
        'user-123'
      )
    })

    it('uploads image before saving recipe', async () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      global.URL.createObjectURL = vi.fn(() => 'mock-blob-url')

      act(() => {
        result.current.handleImageChange({ target: { files: [file] } } as any)
      })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          title: 'Test Recipe',
          ingredients: ['flour'],
          instructions: 'Mix',
        })
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      })

      expect(recipeServices.uploadImage).toHaveBeenCalledWith(file)
      expect(recipeServices.saveRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          image_url: 'https://example.com/uploaded-image.jpg',
        }),
        'user-123'
      )
    })

    it('prevents submission without user ID', async () => {
      const { result } = renderHook(() => useRecipeForm(null), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          title: 'Test Recipe',
        })
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      })

      expect(recipeServices.saveRecipe).not.toHaveBeenCalled()
    })

    it('sets isSubmitting during submission', async () => {
      let resolveSave: any
      const savePromise = new Promise((resolve) => {
        resolveSave = resolve
      })

      vi.mocked(recipeServices.saveRecipe).mockReturnValue(savePromise as any)

      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          title: 'Test Recipe',
          ingredients: ['flour'],
          instructions: 'Mix',
        })
      })

      const submitCall = act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      })

      // Should be submitting
      await waitFor(() => expect(result.current.isSubmitting).toBe(true))

      // Resolve save
      resolveSave(undefined)
      await submitCall

      // Should no longer be submitting
      expect(result.current.isSubmitting).toBe(false)
    })

    it('navigates to home after successful submission', async () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          title: 'Test Recipe',
          ingredients: ['flour'],
          instructions: 'Mix',
        })
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('handles submission errors', async () => {
      vi.mocked(recipeServices.saveRecipe).mockRejectedValue(new Error('Save failed'))

      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          title: 'Test Recipe',
          ingredients: ['flour'],
          instructions: 'Mix',
        })
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      })

      expect(result.current.isSubmitting).toBe(false)
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('prevents default form submission', async () => {
      const preventDefault = vi.fn()
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          title: 'Test Recipe',
          ingredients: ['flour'],
          instructions: 'Mix',
        })
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault } as any)
      })

      expect(preventDefault).toHaveBeenCalled()
    })

    it('includes all form fields in submission', async () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          title: 'Complete Recipe',
          description: 'A complete test recipe',
          cookTime: '30 minutes',
          difficulty: 'Medium',
          instructions: 'Mix and bake',
          ingredients: ['flour', 'sugar'],
          currentIngredient: '',
          imageUrl: 'https://example.com/image.jpg',
          source_url: 'https://example.com/source',
          recipe_type: 'webpage',
          categories: ['Dinner'],
          cuisine_type: 'Italian',
          diet_tags: ['Vegetarian'],
          cooking_method: 'Baking',
          season_occasion: ['Summer'],
          prep_time: '10 minutes',
          servings: 4,
        })
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      })

      expect(recipeServices.saveRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Complete Recipe',
          description: 'A complete test recipe',
          cook_time: '30 minutes',
          difficulty: 'Medium',
          instructions: 'Mix and bake',
          ingredients: ['flour', 'sugar'],
          categories: ['Dinner'],
          cuisine_type: 'Italian',
          diet_tags: ['Vegetarian'],
          cooking_method: 'Baking',
          season_occasion: ['Summer'],
          prep_time: '10 minutes',
          servings: 4,
        }),
        'user-123'
      )
    })
  })

  describe('Error States', () => {
    it('handles image upload errors gracefully', async () => {
      vi.mocked(recipeServices.uploadImage).mockRejectedValue(new Error('Upload failed'))

      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      global.URL.createObjectURL = vi.fn(() => 'mock-blob-url')

      act(() => {
        result.current.handleImageChange({ target: { files: [file] } } as any)
      })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          title: 'Test Recipe',
          ingredients: ['flour'],
          instructions: 'Mix',
        })
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any)
      })

      // Should still attempt to save even if image upload fails
      expect(result.current.isSubmitting).toBe(false)
    })

    it('clears import error on successful import', async () => {
      vi.mocked(recipeServices.importRecipeFromUrl)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ title: 'Success' })

      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setRecipeUrl('https://example.com/recipe')
      })

      // First import fails
      await act(async () => {
        await result.current.importRecipe()
      })

      expect(result.current.importError).toBe('First error')

      // Second import succeeds
      await act(async () => {
        await result.current.importRecipe()
      })

      expect(result.current.importError).toBeUndefined()
    })
  })

  describe('Form Data Updates', () => {
    it('updates form data via setFormData', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          title: 'New Title',
          description: 'New Description',
        })
      })

      expect(result.current.formData.title).toBe('New Title')
      expect(result.current.formData.description).toBe('New Description')
    })

    it('maintains other fields when updating one field', () => {
      const { result } = renderHook(() => useRecipeForm('user-123'), { wrapper })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          ingredients: ['flour', 'sugar'],
        })
      })

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          title: 'New Title',
        })
      })

      expect(result.current.formData.title).toBe('New Title')
      expect(result.current.formData.ingredients).toEqual(['flour', 'sugar'])
    })
  })
})
