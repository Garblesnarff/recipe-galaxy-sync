import { describe, it, expect } from 'vitest'
import { formatCookTime, generateSlug, parseIngredients } from '@/utils/recipeUtils'

describe('Recipe Utilities', () => {
  describe('formatCookTime', () => {
    it('formats minutes correctly', () => {
      expect(formatCookTime(30)).toBe('30 minutes')
      expect(formatCookTime(1)).toBe('1 minute')
    })

    it('formats hours and minutes correctly', () => {
      expect(formatCookTime(90)).toBe('1 hour 30 minutes')
      expect(formatCookTime(120)).toBe('2 hours')
      expect(formatCookTime(61)).toBe('1 hour 1 minute')
    })

    it('handles zero and negative values', () => {
      expect(formatCookTime(0)).toBe('0 minutes')
      expect(formatCookTime(-10)).toBe('0 minutes')
    })
  })

  describe('generateSlug', () => {
    it('creates URL-friendly slugs', () => {
      expect(generateSlug('Delicious Pasta Recipe')).toBe('delicious-pasta-recipe')
      expect(generateSlug('Recipe with Special!@# Characters')).toBe('recipe-with-special-characters')
      expect(generateSlug('  Extra   Spaces  ')).toBe('extra-spaces')
    })

    it('handles empty strings', () => {
      expect(generateSlug('')).toBe('')
      expect(generateSlug('   ')).toBe('')
    })
  })

  describe('parseIngredients', () => {
    it('parses string ingredients into structured format', () => {
      const input = [
        '2 cups flour',
        '1 tsp salt',
        '500g chicken breast'
      ]

      const expected = [
        { item: 'flour', quantity: '2', unit: 'cups' },
        { item: 'salt', quantity: '1', unit: 'tsp' },
        { item: 'chicken breast', quantity: '500', unit: 'g' }
      ]

      expect(parseIngredients(input)).toEqual(expected)
    })

    it('handles ingredients without quantities', () => {
      const input = ['salt to taste', 'fresh herbs']
      const expected = [
        { item: 'salt to taste', quantity: '', unit: '' },
        { item: 'fresh herbs', quantity: '', unit: '' }
      ]

      expect(parseIngredients(input)).toEqual(expected)
    })
  })
})
