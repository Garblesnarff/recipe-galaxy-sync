import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveRecipe, updateRecipe } from '@/services/recipe/recipeCrud'
import { mockSupabaseClient } from '@/test/mocks'

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
  })
})
