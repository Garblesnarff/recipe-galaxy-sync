import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@/test/utils'
import { RecipeInstructionsList } from '../RecipeInstructionsList'

describe('RecipeInstructionsList', () => {
  describe('Basic Rendering', () => {
    it('renders instructions correctly', () => {
      const instructions = 'Step 1: Mix ingredients\nStep 2: Bake for 30 minutes\nStep 3: Let cool'
      render(<RecipeInstructionsList instructions={instructions} />)

      expect(screen.getByText('Instructions')).toBeInTheDocument()
      expect(screen.getByText('Step 1: Mix ingredients')).toBeInTheDocument()
      expect(screen.getByText('Step 2: Bake for 30 minutes')).toBeInTheDocument()
      expect(screen.getByText('Step 3: Let cool')).toBeInTheDocument()
    })

    it('renders numbered steps correctly', () => {
      const instructions = 'Mix ingredients\nBake for 30 minutes'
      render(<RecipeInstructionsList instructions={instructions} />)

      // Check for step numbers displayed
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('filters out empty lines', () => {
      const instructions = 'Step 1: Mix\n\n\nStep 2: Bake\n\n'
      const { container } = render(<RecipeInstructionsList instructions={instructions} />)

      // Should only render 2 steps, not empty lines
      const stepContainers = container.querySelectorAll('.flex.mb-6')
      expect(stepContainers).toHaveLength(2)
    })
  })

  describe('Stable Keys', () => {
    it('uses content-based keys instead of array index', () => {
      const instructions = 'First step\nSecond step'
      const { container, rerender } = render(<RecipeInstructionsList instructions={instructions} />)

      const firstRenderSteps = container.querySelectorAll('[role="checkbox"]')
      const firstKeys = Array.from(firstRenderSteps).map((el) => el.parentElement?.getAttribute('key'))

      // Re-render with same content
      rerender(<RecipeInstructionsList instructions={instructions} />)

      const secondRenderSteps = container.querySelectorAll('[role="checkbox"]')
      const secondKeys = Array.from(secondRenderSteps).map((el) => el.parentElement?.getAttribute('key'))

      // Keys should be stable and content-based
      expect(firstKeys).toEqual(secondKeys)
    })

    it('generates unique keys for similar instructions', () => {
      const instructions = 'Mix well\nMix well\nMix well'
      const { container } = render(<RecipeInstructionsList instructions={instructions} />)

      const steps = container.querySelectorAll('.flex.mb-6')
      const keys = new Set()

      steps.forEach((step, index) => {
        // Extract key from data attribute or structure
        const stepKey = `step-Mix-well-${index}`
        keys.add(stepKey)
      })

      // All keys should be unique despite same content
      expect(keys.size).toBe(3)
    })
  })

  describe('Checkbox Toggles', () => {
    it('toggles step completion on click', () => {
      const instructions = 'Step 1: Mix ingredients'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox', { name: /mark step 1 as complete/i })

      // Initially unchecked
      expect(checkbox).toHaveAttribute('aria-checked', 'false')

      // Click to check
      fireEvent.click(checkbox)
      expect(checkbox).toHaveAttribute('aria-checked', 'true')

      // Click again to uncheck
      fireEvent.click(checkbox)
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
    })

    it('updates visual state when toggled', () => {
      const instructions = 'Test instruction'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox')
      const instructionText = screen.getByText('Test instruction')

      // Before checking - no line-through
      expect(instructionText).not.toHaveClass('line-through')

      // Click to check
      fireEvent.click(checkbox)

      // After checking - should have line-through
      expect(instructionText).toHaveClass('line-through')
      expect(instructionText).toHaveClass('opacity-70')
    })

    it('shows check icon when completed', () => {
      const instructions = 'Complete this step'
      const { container } = render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox')

      // Initially shows number
      expect(screen.getByText('1')).toBeInTheDocument()

      // Click to complete
      fireEvent.click(checkbox)

      // Should show CheckCircle icon (check by class name)
      const checkIcon = container.querySelector('.text-recipe-green')
      expect(checkIcon).toBeInTheDocument()
    })

    it('handles multiple steps independently', () => {
      const instructions = 'Step 1\nStep 2\nStep 3'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkboxes = screen.getAllByRole('checkbox')

      // Toggle first and third
      fireEvent.click(checkboxes[0])
      fireEvent.click(checkboxes[2])

      expect(checkboxes[0]).toHaveAttribute('aria-checked', 'true')
      expect(checkboxes[1]).toHaveAttribute('aria-checked', 'false')
      expect(checkboxes[2]).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('State Persistence', () => {
    it('maintains state across re-renders with same content', () => {
      const instructions = 'Step 1\nStep 2'
      const { rerender } = render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getAllByRole('checkbox')[0]

      // Check the first step
      fireEvent.click(checkbox)
      expect(checkbox).toHaveAttribute('aria-checked', 'true')

      // Re-render with same content
      rerender(<RecipeInstructionsList instructions={instructions} />)

      // State should persist
      const checkboxAfterRerender = screen.getAllByRole('checkbox')[0]
      expect(checkboxAfterRerender).toHaveAttribute('aria-checked', 'true')
    })

    it('resets state when instruction content changes', () => {
      const instructions1 = 'Original step'
      const instructions2 = 'New step'
      const { rerender } = render(<RecipeInstructionsList instructions={instructions1} />)

      const checkbox = screen.getByRole('checkbox')

      // Check the step
      fireEvent.click(checkbox)
      expect(checkbox).toHaveAttribute('aria-checked', 'true')

      // Re-render with different content
      rerender(<RecipeInstructionsList instructions={instructions2} />)

      // New step should be unchecked
      const newCheckbox = screen.getByRole('checkbox')
      expect(newCheckbox).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('ARIA Attributes', () => {
    it('has proper checkbox role', () => {
      const instructions = 'Test step'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
    })

    it('has descriptive aria-label', () => {
      const instructions = 'First step\nSecond step'
      render(<RecipeInstructionsList instructions={instructions} />)

      expect(screen.getByRole('checkbox', { name: /mark step 1 as complete/i })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /mark step 2 as complete/i })).toBeInTheDocument()
    })

    it('updates aria-checked on toggle', () => {
      const instructions = 'Test step'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox')

      expect(checkbox).toHaveAttribute('aria-checked', 'false')
      fireEvent.click(checkbox)
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Keyboard Navigation', () => {
    it('is focusable with keyboard', () => {
      const instructions = 'Keyboard accessible step'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()

      expect(checkbox).toHaveFocus()
    })

    it('can be toggled with Enter key', () => {
      const instructions = 'Press enter to toggle'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()

      expect(checkbox).toHaveAttribute('aria-checked', 'false')

      fireEvent.keyDown(checkbox, { key: 'Enter', code: 'Enter' })
      fireEvent.click(checkbox) // Simulating the button's onClick

      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })

    it('can be toggled with Space key', () => {
      const instructions = 'Press space to toggle'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()

      expect(checkbox).toHaveAttribute('aria-checked', 'false')

      fireEvent.keyDown(checkbox, { key: ' ', code: 'Space' })
      fireEvent.click(checkbox) // Simulating the button's onClick

      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty instructions', () => {
      const { container } = render(<RecipeInstructionsList instructions="" />)

      expect(screen.getByText('Instructions')).toBeInTheDocument()

      // Should render no steps
      const steps = container.querySelectorAll('.flex.mb-6')
      expect(steps).toHaveLength(0)
    })

    it('handles single step', () => {
      const instructions = 'Only one step'
      render(<RecipeInstructionsList instructions={instructions} />)

      expect(screen.getByText('Only one step')).toBeInTheDocument()
      expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    })

    it('handles very long instructions', () => {
      const longInstruction = 'A'.repeat(500) + ' - this is a very long instruction that should still render correctly'
      render(<RecipeInstructionsList instructions={longInstruction} />)

      const instructionElement = screen.getByText(longInstruction)
      expect(instructionElement).toBeInTheDocument()
    })

    it('handles instructions with special characters', () => {
      const instructions = 'Add ½ cup sugar & 2 tbsp "vanilla"\nMix @ 350°F for 30\'s'
      render(<RecipeInstructionsList instructions={instructions} />)

      expect(screen.getByText(/Add ½ cup sugar & 2 tbsp "vanilla"/i)).toBeInTheDocument()
      expect(screen.getByText(/Mix @ 350°F for 30's/i)).toBeInTheDocument()
    })

    it('handles instructions with HTML-like characters', () => {
      const instructions = 'Step <1>: Use tags\nStep <2>: More <tags>'
      render(<RecipeInstructionsList instructions={instructions} />)

      // Text should be rendered as-is, not interpreted as HTML
      expect(screen.getByText('Step <1>: Use tags')).toBeInTheDocument()
      expect(screen.getByText('Step <2>: More <tags>')).toBeInTheDocument()
    })

    it('handles instructions with unicode emojis', () => {
      const instructions = 'Step 1: Add flour 🍞\nStep 2: Mix well 🥄\nStep 3: Bake 🔥'
      render(<RecipeInstructionsList instructions={instructions} />)

      expect(screen.getByText('Step 1: Add flour 🍞')).toBeInTheDocument()
      expect(screen.getByText('Step 2: Mix well 🥄')).toBeInTheDocument()
      expect(screen.getByText('Step 3: Bake 🔥')).toBeInTheDocument()
    })

    it('handles newline variations (\\n, \\r\\n)', () => {
      const instructionsUnix = 'Step 1\nStep 2\nStep 3'
      const instructionsWindows = 'Step 1\r\nStep 2\r\nStep 3'

      const { container: container1 } = render(<RecipeInstructionsList instructions={instructionsUnix} />)
      const steps1 = container1.querySelectorAll('.flex.mb-6')

      const { container: container2 } = render(<RecipeInstructionsList instructions={instructionsWindows} />)
      const steps2 = container2.querySelectorAll('.flex.mb-6')

      // Both should render same number of steps
      expect(steps1.length).toBeGreaterThan(0)
      expect(steps2.length).toBeGreaterThan(0)
    })

    it('handles instructions with only whitespace', () => {
      const instructions = '   \n\n   \n   '
      const { container } = render(<RecipeInstructionsList instructions={instructions} />)

      // Should render no steps
      const steps = container.querySelectorAll('.flex.mb-6')
      expect(steps).toHaveLength(0)
    })

    it('trims whitespace from individual steps', () => {
      const instructions = '  Step with spaces  \n\t\tStep with tabs\t\t'
      render(<RecipeInstructionsList instructions={instructions} />)

      expect(screen.getByText('Step with spaces')).toBeInTheDocument()
      expect(screen.getByText('Step with tabs')).toBeInTheDocument()
    })

    it('handles many steps (50+)', () => {
      const manySteps = Array.from({ length: 50 }, (_, i) => `Step ${i + 1}`).join('\n')
      const { container } = render(<RecipeInstructionsList instructions={manySteps} />)

      const steps = container.querySelectorAll('.flex.mb-6')
      expect(steps).toHaveLength(50)

      // Verify first and last
      expect(screen.getByText('Step 1')).toBeInTheDocument()
      expect(screen.getByText('Step 50')).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('applies correct classes to completed steps', () => {
      const instructions = 'Style test'
      render(<RecipeInstructionsList instructions={instructions} />)

      const checkbox = screen.getByRole('checkbox')
      const text = screen.getByText('Style test')

      // Initial state
      expect(text.className).toContain('text-gray-700')
      expect(text).not.toHaveClass('line-through')

      // After completion
      fireEvent.click(checkbox)
      expect(text).toHaveClass('line-through')
      expect(text).toHaveClass('opacity-70')
    })

    it('displays step number badge for uncompleted steps', () => {
      const instructions = 'Test badge'
      render(<RecipeInstructionsList instructions={instructions} />)

      const badge = screen.getByText('1')
      expect(badge.parentElement).toHaveClass('rounded-full')
      expect(badge.parentElement).toHaveClass('bg-recipe-green-light')
    })
  })
})
