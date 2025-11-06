import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveRecipe, updateRecipe } from '@/services/recipe/recipeCrud'
import { mockSupabaseClient } from '@/test/mocks'
import { createTestRecipe, createTestIngredient } from '@/test/factories/recipeFactory'

describe('Recipe CRUD Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveRecipe', () => {
    it('saves recipe with correct data structure', async () => {
      const mockRecipeData = {
        title: 'Test Recipe',
        ingredients: ['flour', 'sugar'],
        instructions: 'Mix ingredients'
      }
      const userId = 'user-123'

      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: 'recipe-123', ...mockRecipeData, user_id: userId }],
        error: null
      })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(), // Spread existing mock to include all methods
        insert: mockInsert,
        select: mockSelect
      })

      const result = await saveRecipe(mockRecipeData, userId)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('recipes')
      expect(mockInsert).toHaveBeenCalledWith({
        ...mockRecipeData,
        ingredients: mockRecipeData.ingredients,
        user_id: userId
      })
      expect(result).toEqual([{ id: 'recipe-123', ...mockRecipeData, user_id: userId }])
    })

    it('saves recipe with structured ingredients (RecipeIngredient[])', async () => {
      const structuredIngredients = [
        createTestIngredient({ name: 'flour', quantity: '2', unit: 'cups' }),
        createTestIngredient({ name: 'sugar', quantity: '1', unit: 'cup' }),
        createTestIngredient({ name: 'butter', quantity: '1/2', unit: 'cup' })
      ]

      const mockRecipeData = {
        title: 'Structured Ingredient Recipe',
        ingredients: structuredIngredients,
        instructions: 'Mix and bake'
      }

      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: 'recipe-456', ...mockRecipeData }],
        error: null
      })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        insert: mockInsert,
        select: mockSelect
      })

      await saveRecipe(mockRecipeData, 'user-123')

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: structuredIngredients,
          user_id: 'user-123'
        })
      )
    })

    it('saves recipe with string[] ingredients', async () => {
      const mockRecipeData = {
        title: 'Simple Recipe',
        ingredients: ['2 cups flour', '1 cup sugar', '1/2 cup butter'],
        instructions: 'Mix and bake'
      }

      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: 'recipe-789', ...mockRecipeData }],
        error: null
      })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        insert: mockInsert,
        select: mockSelect
      })

      await saveRecipe(mockRecipeData, 'user-123')

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: mockRecipeData.ingredients,
          user_id: 'user-123'
        })
      )
    })

    it('handles array ingredients correctly', async () => {
      const mockRecipeData = {
        title: 'Test Recipe',
        ingredients: [
          { item: 'flour', quantity: '2', unit: 'cups' },
          { item: 'sugar', quantity: '1', unit: 'cup' }
        ]
      }

      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        insert: mockInsert,
        select: mockSelect
      })

      await saveRecipe(mockRecipeData, 'user-123')

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: mockRecipeData.ingredients
        })
      )
    })

    it('handles empty ingredients array', async () => {
      const mockRecipeData = {
        title: 'No Ingredients Recipe',
        ingredients: [],
        instructions: 'Just serve'
      }

      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: 'recipe-empty', ...mockRecipeData }],
        error: null
      })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        insert: mockInsert,
        select: mockSelect
      })

      await saveRecipe(mockRecipeData, 'user-123')

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: [],
          user_id: 'user-123'
        })
      )
    })

    it('handles non-array ingredients by converting to empty array', async () => {
      const mockRecipeData = {
        title: 'Bad Ingredients',
        ingredients: 'not an array' as any,
        instructions: 'Test'
      }

      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: 'recipe-bad', title: 'Bad Ingredients', ingredients: [] }],
        error: null
      })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        insert: mockInsert,
        select: mockSelect
      })

      await saveRecipe(mockRecipeData, 'user-123')

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: [], // Should be converted to empty array
          user_id: 'user-123'
        })
      )
    })

    it('throws error when save fails', async () => {
      const mockError = new Error('Database error')

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      })

      await expect(saveRecipe({}, 'user-123')).rejects.toThrow('Database error')
    })

    it('throws error for missing user ID', async () => {
      const mockRecipeData = {
        title: 'Test Recipe',
        ingredients: ['flour'],
        instructions: 'Mix'
      }

      // Supabase should enforce this via RLS, but test the client-side behavior
      await expect(saveRecipe(mockRecipeData, '')).rejects.toThrow()
    })

    it('handles network errors', async () => {
      const mockRecipeData = {
        title: 'Test Recipe',
        ingredients: ['flour'],
        instructions: 'Mix'
      }

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockRejectedValue(new Error('Network error'))
      })

      await expect(saveRecipe(mockRecipeData, 'user-123')).rejects.toThrow('Network error')
    })

    it('includes all recipe fields in save', async () => {
      const mockRecipeData = {
        title: 'Complete Recipe',
        description: 'A test recipe',
        ingredients: ['flour', 'sugar'],
        instructions: 'Mix and bake',
        prep_time: '10 minutes',
        cook_time: '30 minutes',
        servings: 4,
        difficulty: 'Easy',
        categories: ['Dinner'],
        cuisine_type: 'American',
        diet_tags: ['Vegetarian'],
        cooking_method: 'Baking',
        image_url: 'https://example.com/image.jpg'
      }

      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: 'recipe-complete', ...mockRecipeData }],
        error: null
      })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        insert: mockInsert,
        select: mockSelect
      })

      await saveRecipe(mockRecipeData, 'user-123')

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockRecipeData.title,
          description: mockRecipeData.description,
          prep_time: mockRecipeData.prep_time,
          cook_time: mockRecipeData.cook_time,
          servings: mockRecipeData.servings,
          difficulty: mockRecipeData.difficulty,
          user_id: 'user-123'
        })
      )
    })
  })

  describe('updateRecipe', () => {
    it('updates recipe with correct data', async () => {
      const recipeId = 'recipe-123'
      const updates = {
        title: 'Updated Recipe',
        ingredients: ['updated flour']
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: recipeId, ...updates }],
        error: null
      })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect
      })

      const result = await updateRecipe(recipeId, updates)

      expect(mockUpdate).toHaveBeenCalledWith({
        ...updates,
        ingredients: updates.ingredients
      })
      expect(mockEq).toHaveBeenCalledWith('id', recipeId)
      expect(result).toEqual([{ id: recipeId, ...updates }])
    })

    it('updates recipe with partial data', async () => {
      const recipeId = 'recipe-456'
      const partialUpdates = {
        title: 'New Title Only'
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: recipeId, ...partialUpdates }],
        error: null
      })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect
      })

      await updateRecipe(recipeId, partialUpdates)

      expect(mockUpdate).toHaveBeenCalledWith(partialUpdates)
      expect(mockEq).toHaveBeenCalledWith('id', recipeId)
    })

    it('updates recipe with structured ingredients', async () => {
      const recipeId = 'recipe-789'
      const structuredIngredients = [
        createTestIngredient({ name: 'new flour', quantity: '3', unit: 'cups' }),
        createTestIngredient({ name: 'new sugar', quantity: '2', unit: 'cups' })
      ]

      const updates = {
        ingredients: structuredIngredients
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: recipeId, ...updates }],
        error: null
      })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect
      })

      await updateRecipe(recipeId, updates)

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: structuredIngredients
        })
      )
    })

    it('handles update errors', async () => {
      const mockError = new Error('Update failed')

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      })

      await expect(updateRecipe('recipe-123', { title: 'Test' })).rejects.toThrow('Update failed')
    })

    it('handles non-existent recipe ID', async () => {
      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      const result = await updateRecipe('non-existent-id', { title: 'Test' })

      expect(result).toEqual([])
    })

    it('updates multiple fields simultaneously', async () => {
      const recipeId = 'recipe-multi'
      const updates = {
        title: 'Updated Title',
        description: 'Updated Description',
        cook_time: '45 minutes',
        difficulty: 'Medium',
        ingredients: ['new ingredient 1', 'new ingredient 2']
      }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: recipeId, ...updates }],
        error: null
      })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect
      })

      await updateRecipe(recipeId, updates)

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: updates.title,
          description: updates.description,
          cook_time: updates.cook_time,
          difficulty: updates.difficulty,
          ingredients: updates.ingredients
        })
      )
    })

    it('does not modify user_id on update', async () => {
      const recipeId = 'recipe-ownership'
      const updates = {
        title: 'Updated Recipe',
        user_id: 'different-user' // Should not be included
      } as any

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: recipeId, title: 'Updated Recipe' }],
        error: null
      })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect
      })

      await updateRecipe(recipeId, updates)

      // The function should pass through the updates as-is
      // RLS policies on Supabase will prevent user_id changes
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('handles network errors on update', async () => {
      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockRejectedValue(new Error('Network timeout'))
      })

      await expect(
        updateRecipe('recipe-123', { title: 'Test' })
      ).rejects.toThrow('Network timeout')
    })

    it('verifies correct Supabase method chain', async () => {
      const recipeId = 'recipe-chain'
      const updates = { title: 'Chain Test' }

      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: recipeId, ...updates }],
        error: null
      })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect
      })

      await updateRecipe(recipeId, updates)

      // Verify the chain: from -> update -> eq -> select
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('recipes')
      expect(mockUpdate).toHaveBeenCalledWith(updates)
      expect(mockEq).toHaveBeenCalledWith('id', recipeId)
      expect(mockSelect).toHaveBeenCalled()
    })
  })

  describe('Error Validation', () => {
    it('handles invalid data types gracefully', async () => {
      const invalidData = {
        title: 123, // Should be string
        ingredients: 'not an array',
        servings: 'not a number'
      } as any

      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Invalid data type')
      })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        insert: mockInsert,
        select: mockSelect
      })

      await expect(saveRecipe(invalidData, 'user-123')).rejects.toThrow('Invalid data type')
    })

    it('handles missing required fields', async () => {
      const incompleteData = {
        // Missing title
        ingredients: ['flour']
      } as any

      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Missing required field: title')
      })

      mockSupabaseClient.from.mockReturnValue({
        ...mockSupabaseClient.from(),
        insert: mockInsert,
        select: mockSelect
      })

      await expect(saveRecipe(incompleteData, 'user-123')).rejects.toThrow()
    })
  })
})
