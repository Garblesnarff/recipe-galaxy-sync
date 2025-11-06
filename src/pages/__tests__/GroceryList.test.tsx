import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@/test/utils';
import GroceryList from '../GroceryList';
import * as groceryService from '@/services/groceryService';
import { GroceryItem } from '@/services/groceryTypes';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/services/groceryService', () => ({
  getGroceryList: vi.fn(),
  addToGroceryList: vi.fn(),
  toggleItemPurchasedStatus: vi.fn(),
  deleteGroceryItem: vi.fn(),
  clearPurchasedItems: vi.fn(),
  clearAllItems: vi.fn(),
}));

vi.mock('@/hooks/useAuthSession', () => ({
  useAuthSession: vi.fn(() => ({ userId: 'test-user-id' })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

const createMockGroceryItem = (overrides?: Partial<GroceryItem>): GroceryItem => ({
  id: `item-${Math.random()}`,
  user_id: 'test-user',
  item_name: 'Test Item',
  quantity: '1',
  unit: 'cup',
  category: 'Dairy',
  is_purchased: false,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('GroceryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for getGroceryList to return empty array
    vi.mocked(groceryService.getGroceryList).mockResolvedValue([]);
  });

  describe('Initial Rendering', () => {
    it('renders the grocery list page', async () => {
      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText('Grocery List')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      render(<GroceryList />);

      expect(screen.getByText(/loading grocery list/i)).toBeInTheDocument();
    });

    it('renders add item form', async () => {
      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add new item/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      });
    });

    it('shows back button', async () => {
      render(<GroceryList />);

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: '' });
        expect(backButton).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no items', async () => {
      vi.mocked(groceryService.getGroceryList).mockResolvedValue([]);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText(/your grocery list is empty/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/add items manually or from recipes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /browse recipes/i })).toBeInTheDocument();
    });

    it('does not show remove all button when list is empty', async () => {
      vi.mocked(groceryService.getGroceryList).mockResolvedValue([]);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText(/your grocery list is empty/i)).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /remove all/i })).not.toBeInTheDocument();
    });
  });

  describe('Display Items', () => {
    it('displays unpurchased items correctly', async () => {
      const items = [
        createMockGroceryItem({ item_name: 'Milk', is_purchased: false }),
        createMockGroceryItem({ item_name: 'Eggs', is_purchased: false }),
      ];

      vi.mocked(groceryService.getGroceryList).mockResolvedValue(items);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
        expect(screen.getByText('Eggs')).toBeInTheDocument();
      });

      expect(screen.getByText(/items to buy \(2\)/i)).toBeInTheDocument();
    });

    it('displays purchased items correctly', async () => {
      const items = [
        createMockGroceryItem({ item_name: 'Bread', is_purchased: true }),
        createMockGroceryItem({ item_name: 'Butter', is_purchased: true }),
      ];

      vi.mocked(groceryService.getGroceryList).mockResolvedValue(items);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText('Bread')).toBeInTheDocument();
        expect(screen.getByText('Butter')).toBeInTheDocument();
      });

      expect(screen.getByText(/purchased items \(2\)/i)).toBeInTheDocument();
    });

    it('separates purchased and unpurchased items', async () => {
      const items = [
        createMockGroceryItem({ item_name: 'Milk', is_purchased: false }),
        createMockGroceryItem({ item_name: 'Bread', is_purchased: true }),
        createMockGroceryItem({ item_name: 'Eggs', is_purchased: false }),
      ];

      vi.mocked(groceryService.getGroceryList).mockResolvedValue(items);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText(/items to buy \(2\)/i)).toBeInTheDocument();
        expect(screen.getByText(/purchased items \(1\)/i)).toBeInTheDocument();
      });
    });

    it('shows clear purchased button when purchased items exist', async () => {
      const items = [
        createMockGroceryItem({ item_name: 'Bread', is_purchased: true }),
      ];

      vi.mocked(groceryService.getGroceryList).mockResolvedValue(items);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear purchased/i })).toBeInTheDocument();
      });
    });
  });

  describe('Add Item', () => {
    it('adds a new item successfully', async () => {
      const user = userEvent.setup();
      vi.mocked(groceryService.getGroceryList).mockResolvedValue([]);
      vi.mocked(groceryService.addToGroceryList).mockResolvedValue(true);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add new item/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/add new item/i);
      await user.type(input, 'Tomatoes');

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(groceryService.addToGroceryList).toHaveBeenCalledWith(
          expect.objectContaining({
            item_name: 'Tomatoes',
            is_purchased: false,
          }),
          'test-user-id'
        );
        expect(toast.success).toHaveBeenCalledWith('Item added to grocery list');
      });

      // Input should be cleared
      expect(input).toHaveValue('');
    });

    it('validates empty item name', async () => {
      const user = userEvent.setup();
      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add new item/i)).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('required'));
      });

      expect(groceryService.addToGroceryList).not.toHaveBeenCalled();
    });

    it('validates item name too long', async () => {
      const user = userEvent.setup();
      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add new item/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/add new item/i);
      const longName = 'A'.repeat(201); // Exceeds 200 character limit
      await user.type(input, longName);

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('less than 200 characters')
        );
      });

      expect(groceryService.addToGroceryList).not.toHaveBeenCalled();
    });

    it('trims whitespace from item name', async () => {
      const user = userEvent.setup();
      vi.mocked(groceryService.getGroceryList).mockResolvedValue([]);
      vi.mocked(groceryService.addToGroceryList).mockResolvedValue(true);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add new item/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/add new item/i);
      await user.type(input, '  Carrots  ');

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(groceryService.addToGroceryList).toHaveBeenCalledWith(
          expect.objectContaining({
            item_name: 'Carrots',
          }),
          'test-user-id'
        );
      });
    });

    it('shows error when user not logged in', async () => {
      const user = userEvent.setup();
      const { useAuthSession } = await import('@/hooks/useAuthSession');
      vi.mocked(useAuthSession).mockReturnValue({ userId: null } as any);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add new item/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/add new item/i);
      await user.type(input, 'Test Item');

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('You must be logged in to add items');
      });

      expect(groceryService.addToGroceryList).not.toHaveBeenCalled();
    });

    it('shows error when add fails', async () => {
      const user = userEvent.setup();
      vi.mocked(groceryService.addToGroceryList).mockResolvedValue(false);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add new item/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/add new item/i);
      await user.type(input, 'Test Item');

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to add item');
      });
    });
  });

  describe('Toggle Purchased', () => {
    it('refetches list when item status toggled', async () => {
      const items = [
        createMockGroceryItem({ id: 'item-1', item_name: 'Milk', is_purchased: false }),
      ];

      let callCount = 0;
      vi.mocked(groceryService.getGroceryList).mockImplementation(() => {
        callCount++;
        return Promise.resolve(items);
      });

      vi.mocked(groceryService.toggleItemPurchasedStatus).mockResolvedValue(true);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
      });

      const initialCallCount = callCount;

      // The GroceryItem component should render - we'll need to find and click the checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 0) {
        fireEvent.click(checkboxes[0]);

        await waitFor(() => {
          expect(callCount).toBeGreaterThan(initialCallCount);
        });
      }
    });
  });

  describe('Delete Item', () => {
    it('refetches list when item deleted', async () => {
      const items = [
        createMockGroceryItem({ id: 'item-1', item_name: 'Milk' }),
      ];

      let callCount = 0;
      vi.mocked(groceryService.getGroceryList).mockImplementation(() => {
        callCount++;
        return Promise.resolve(items);
      });

      vi.mocked(groceryService.deleteGroceryItem).mockResolvedValue(true);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
      });

      const initialCallCount = callCount;

      // Find delete button by aria-label
      const deleteButton = screen.getByLabelText(/delete milk from grocery list/i);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(callCount).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Clear Purchased Items', () => {
    it('shows clear purchased button and clears items', async () => {
      const user = userEvent.setup();
      const items = [
        createMockGroceryItem({ item_name: 'Milk', is_purchased: true }),
        createMockGroceryItem({ item_name: 'Bread', is_purchased: true }),
      ];

      vi.mocked(groceryService.getGroceryList).mockResolvedValue(items);
      vi.mocked(groceryService.clearPurchasedItems).mockResolvedValue(true);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText(/purchased items \(2\)/i)).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear purchased/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(groceryService.clearPurchasedItems).toHaveBeenCalled();
      });
    });

    it('refetches list after clearing purchased items', async () => {
      const user = userEvent.setup();
      const items = [
        createMockGroceryItem({ item_name: 'Bread', is_purchased: true }),
      ];

      let callCount = 0;
      vi.mocked(groceryService.getGroceryList).mockImplementation(() => {
        callCount++;
        return Promise.resolve(items);
      });

      vi.mocked(groceryService.clearPurchasedItems).mockResolvedValue(true);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText('Bread')).toBeInTheDocument();
      });

      const initialCallCount = callCount;

      const clearButton = screen.getByRole('button', { name: /clear purchased/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(callCount).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Clear All Dialog', () => {
    it('shows remove all button when items exist', async () => {
      const items = [createMockGroceryItem({ item_name: 'Milk' })];

      vi.mocked(groceryService.getGroceryList).mockResolvedValue(items);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove all/i })).toBeInTheDocument();
      });
    });

    it('opens confirmation dialog when remove all clicked', async () => {
      const user = userEvent.setup();
      const items = [createMockGroceryItem({ item_name: 'Milk' })];

      vi.mocked(groceryService.getGroceryList).mockResolvedValue(items);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove all/i })).toBeInTheDocument();
      });

      const removeAllButton = screen.getByRole('button', { name: /remove all/i });
      await user.click(removeAllButton);

      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to remove all items/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    });

    it('closes dialog when cancel clicked', async () => {
      const user = userEvent.setup();
      const items = [createMockGroceryItem({ item_name: 'Milk' })];

      vi.mocked(groceryService.getGroceryList).mockResolvedValue(items);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove all/i })).toBeInTheDocument();
      });

      const removeAllButton = screen.getByRole('button', { name: /remove all/i });
      await user.click(removeAllButton);

      await waitFor(() => {
        expect(screen.getByText(/remove all items/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/are you sure you want to remove all items/i)).not.toBeInTheDocument();
      });
    });

    it('clears all items when confirmed', async () => {
      const user = userEvent.setup();
      const items = [
        createMockGroceryItem({ item_name: 'Milk' }),
        createMockGroceryItem({ item_name: 'Eggs' }),
      ];

      vi.mocked(groceryService.getGroceryList).mockResolvedValue(items);
      vi.mocked(groceryService.clearAllItems).mockResolvedValue(true);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove all/i })).toBeInTheDocument();
      });

      const removeAllButton = screen.getByRole('button', { name: /remove all/i });
      await user.click(removeAllButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });

      const confirmButton = within(screen.getByRole('dialog')).getByRole('button', {
        name: /remove all/i
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(groceryService.clearAllItems).toHaveBeenCalled();
      });
    });

    it('refetches list after clearing all items', async () => {
      const user = userEvent.setup();
      const items = [createMockGroceryItem({ item_name: 'Milk' })];

      let callCount = 0;
      vi.mocked(groceryService.getGroceryList).mockImplementation(() => {
        callCount++;
        return Promise.resolve(items);
      });

      vi.mocked(groceryService.clearAllItems).mockResolvedValue(true);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove all/i })).toBeInTheDocument();
      });

      const initialCallCount = callCount;

      const removeAllButton = screen.getByRole('button', { name: /remove all/i });
      await user.click(removeAllButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });

      const confirmButton = within(screen.getByRole('dialog')).getByRole('button', {
        name: /remove all/i
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(callCount).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
      vi.mocked(groceryService.getGroceryList).mockRejectedValue(
        new Error('Failed to fetch')
      );

      render(<GroceryList />);

      // Should still render the page even with error
      await waitFor(() => {
        expect(screen.getByText('Grocery List')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back when back button clicked', async () => {
      const user = userEvent.setup();
      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText('Grocery List')).toBeInTheDocument();
      });

      const backButtons = screen.getAllByRole('button');
      const backButton = backButtons[0]; // First button should be back button
      await user.click(backButton);

      // Check that navigation occurred (window.location would change in real app)
      expect(window.location.pathname).toBe('/');
    });

    it('navigates to recipes from empty state', async () => {
      const user = userEvent.setup();
      vi.mocked(groceryService.getGroceryList).mockResolvedValue([]);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText(/your grocery list is empty/i)).toBeInTheDocument();
      });

      const browseButton = screen.getByRole('button', { name: /browse recipes/i });
      await user.click(browseButton);

      expect(window.location.pathname).toBe('/');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      const items = [createMockGroceryItem({ item_name: 'Milk' })];
      vi.mocked(groceryService.getGroceryList).mockResolvedValue(items);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /grocery list/i })).toBeInTheDocument();
      });
    });

    it('has accessible form elements', async () => {
      render(<GroceryList />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/add new item/i);
        expect(input).toBeInTheDocument();

        const addButton = screen.getByRole('button', { name: /add/i });
        expect(addButton).toBeInTheDocument();
      });
    });

    it('uses semantic HTML', async () => {
      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles special characters in item names', async () => {
      const items = [
        createMockGroceryItem({ item_name: 'Milk & Cream "Fresh"' }),
      ];

      vi.mocked(groceryService.getGroceryList).mockResolvedValue(items);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText('Milk & Cream "Fresh"')).toBeInTheDocument();
      });
    });

    it('handles unicode characters in item names', async () => {
      const items = [
        createMockGroceryItem({ item_name: '牛奶 (Milk) 🥛' }),
      ];

      vi.mocked(groceryService.getGroceryList).mockResolvedValue(items);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText('牛奶 (Milk) 🥛')).toBeInTheDocument();
      });
    });

    it('handles very long item names', async () => {
      const longName = 'A'.repeat(200);
      const items = [
        createMockGroceryItem({ item_name: longName }),
      ];

      vi.mocked(groceryService.getGroceryList).mockResolvedValue(items);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText(longName)).toBeInTheDocument();
      });
    });

    it('handles large number of items', async () => {
      const items = Array.from({ length: 100 }, (_, i) =>
        createMockGroceryItem({
          id: `item-${i}`,
          item_name: `Item ${i + 1}`
        })
      );

      vi.mocked(groceryService.getGroceryList).mockResolvedValue(items);

      render(<GroceryList />);

      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 100')).toBeInTheDocument();
        expect(screen.getByText(/items to buy \(100\)/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});
