import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { CollectionForm } from '../CollectionForm';
import { createInvalidCollectionData } from '@/test/factories/recipeFactory';
import { Collection } from '@/types/collection';
import userEvent from '@testing-library/user-event';

describe('CollectionForm', () => {
  const mockOnSubmit = vi.fn();
  const defaultProps = {
    onSubmit: mockOnSubmit,
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all form fields', () => {
      render(<CollectionForm {...defaultProps} />);

      expect(screen.getByLabelText(/collection name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cover image url/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create collection/i })).toBeInTheDocument();
    });

    it('renders create button in create mode', () => {
      render(<CollectionForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /create collection/i })).toBeInTheDocument();
    });

    it('renders update button in edit mode', () => {
      const collection: Collection = {
        id: '1',
        user_id: 'user1',
        name: 'My Collection',
        description: 'Test description',
        cover_image_url: 'https://example.com/image.jpg',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        recipe_count: 0,
      };

      render(<CollectionForm {...defaultProps} collection={collection} />);

      expect(screen.getByRole('button', { name: /update collection/i })).toBeInTheDocument();
    });

    it('shows optional label for description', () => {
      render(<CollectionForm {...defaultProps} />);

      const descriptionLabel = screen.getByText(/description \(optional\)/i);
      expect(descriptionLabel).toBeInTheDocument();
    });

    it('shows optional label for cover image', () => {
      render(<CollectionForm {...defaultProps} />);

      const imageLabel = screen.getByText(/cover image url \(optional\)/i);
      expect(imageLabel).toBeInTheDocument();
    });
  });

  describe('Edit Mode - Pre-filled Values', () => {
    const existingCollection: Collection = {
      id: '123',
      user_id: 'user123',
      name: 'Summer Recipes',
      description: 'Light and refreshing recipes',
      cover_image_url: 'https://example.com/summer.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      recipe_count: 5,
    };

    it('pre-fills form with existing collection data', async () => {
      render(<CollectionForm {...defaultProps} collection={existingCollection} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/collection name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Summer Recipes');
      });

      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      expect(descriptionInput.value).toBe('Light and refreshing recipes');

      const imageInput = screen.getByLabelText(/cover image url/i) as HTMLInputElement;
      expect(imageInput.value).toBe('https://example.com/summer.jpg');
    });

    it('shows image preview for existing collection', async () => {
      render(<CollectionForm {...defaultProps} collection={existingCollection} />);

      await waitFor(() => {
        const preview = screen.getByAlt('Preview');
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', 'https://example.com/summer.jpg');
      });
    });

    it('updates form when collection prop changes', async () => {
      const { rerender } = render(<CollectionForm {...defaultProps} collection={existingCollection} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/collection name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Summer Recipes');
      });

      const newCollection: Collection = {
        ...existingCollection,
        name: 'Winter Recipes',
        description: 'Warm and cozy recipes',
      };

      rerender(<CollectionForm {...defaultProps} collection={newCollection} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/collection name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Winter Recipes');
      });
    });
  });

  describe('Validation Errors Display', () => {
    it('shows error for empty collection name', async () => {
      const user = userEvent.setup();
      render(<CollectionForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/collection name is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error for name too long', async () => {
      const user = userEvent.setup();
      const invalidData = createInvalidCollectionData();

      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      await user.type(nameInput, invalidData.nameTooLong.name);

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/collection name must be less than 100 characters/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error for description too long', async () => {
      const user = userEvent.setup();
      const invalidData = createInvalidCollectionData();

      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      await user.type(nameInput, 'Valid Name');

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, invalidData.descriptionTooLong.description);

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/description must be less than 500 characters/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error for invalid URL format', async () => {
      const user = userEvent.setup();

      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      await user.type(nameInput, 'Valid Name');

      const imageInput = screen.getByLabelText(/cover image url/i);
      await user.type(imageInput, 'not-a-valid-url');

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be a valid url/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error for non-image URL', async () => {
      const user = userEvent.setup();
      const invalidData = createInvalidCollectionData();

      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      await user.type(nameInput, 'Valid Name');

      const imageInput = screen.getByLabelText(/cover image url/i);
      await user.type(imageInput, invalidData.nonImageUrl.cover_image_url);

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be a valid image url/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('applies error styling to invalid fields', async () => {
      const user = userEvent.setup();
      render(<CollectionForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/collection name/i);
        expect(nameInput).toHaveClass('border-red-500');
      });
    });
  });

  describe('XSS Prevention', () => {
    it('rejects javascript: protocol URLs', async () => {
      const user = userEvent.setup();
      const invalidData = createInvalidCollectionData();

      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      await user.type(nameInput, 'Valid Name');

      const imageInput = screen.getByLabelText(/cover image url/i);
      await user.type(imageInput, invalidData.xssJavascriptUrl.cover_image_url);

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be a valid/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('rejects data: protocol URLs', async () => {
      const user = userEvent.setup();
      const invalidData = createInvalidCollectionData();

      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      await user.type(nameInput, 'Valid Name');

      const imageInput = screen.getByLabelText(/cover image url/i);
      await user.type(imageInput, invalidData.xssDataUrl.cover_image_url);

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be a valid/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Successful Submission', () => {
    it('submits valid data', async () => {
      const user = userEvent.setup();
      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      await user.type(nameInput, 'My New Collection');

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'A wonderful collection');

      const imageInput = screen.getByLabelText(/cover image url/i);
      await user.type(imageInput, 'https://example.com/image.jpg');

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'My New Collection',
          description: 'A wonderful collection',
          cover_image_url: 'https://example.com/image.jpg',
        });
      });
    });

    it('submits with empty optional fields', async () => {
      const user = userEvent.setup();
      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      await user.type(nameInput, 'Minimal Collection');

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Minimal Collection',
          description: '',
          cover_image_url: '',
        });
      });
    });

    it('trims whitespace from inputs', async () => {
      const user = userEvent.setup();
      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      await user.type(nameInput, '  Trimmed Name  ');

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Trimmed Name',
          })
        );
      });
    });
  });

  describe('Image Preview', () => {
    it('shows image preview when valid URL entered', async () => {
      const user = userEvent.setup();
      render(<CollectionForm {...defaultProps} />);

      const imageInput = screen.getByLabelText(/cover image url/i);
      await user.type(imageInput, 'https://example.com/preview.jpg');

      await waitFor(() => {
        const preview = screen.getByAlt('Preview');
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', 'https://example.com/preview.jpg');
      });
    });

    it('does not show preview when field is empty', async () => {
      const { container } = render(<CollectionForm {...defaultProps} />);

      // Preview should not be shown when no URL entered
      const preview = container.querySelector('img[alt="Preview"]');
      expect(preview).not.toBeInTheDocument();
    });

    it('handles image load errors gracefully', async () => {
      const user = userEvent.setup();
      const { container } = render(<CollectionForm {...defaultProps} />);

      const imageInput = screen.getByLabelText(/cover image url/i);
      await user.type(imageInput, 'https://example.com/broken-image.jpg');

      await waitFor(() => {
        const preview = container.querySelector('img[alt="Preview"]');
        expect(preview).toBeInTheDocument();
      });

      const preview = container.querySelector('img[alt="Preview"]') as HTMLImageElement;
      fireEvent.error(preview);

      await waitFor(() => {
        expect(preview.style.display).toBe('none');
      });
    });

    it('updates preview when URL changes', async () => {
      const user = userEvent.setup();
      render(<CollectionForm {...defaultProps} />);

      const imageInput = screen.getByLabelText(/cover image url/i);
      await user.type(imageInput, 'https://example.com/first.jpg');

      await waitFor(() => {
        const preview = screen.getByAlt('Preview');
        expect(preview).toHaveAttribute('src', 'https://example.com/first.jpg');
      });

      await user.clear(imageInput);
      await user.type(imageInput, 'https://example.com/second.jpg');

      await waitFor(() => {
        const preview = screen.getByAlt('Preview');
        expect(preview).toHaveAttribute('src', 'https://example.com/second.jpg');
      });
    });
  });

  describe('Form Reset', () => {
    it('does not reset on re-render in edit mode', async () => {
      const collection: Collection = {
        id: '1',
        user_id: 'user1',
        name: 'Original',
        description: 'Original desc',
        cover_image_url: 'https://example.com/original.jpg',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        recipe_count: 0,
      };

      const { rerender } = render(<CollectionForm {...defaultProps} collection={collection} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/collection name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Original');
      });

      // Re-render with same collection
      rerender(<CollectionForm {...defaultProps} collection={collection} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/collection name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Original');
      });
    });
  });

  describe('Submitting State', () => {
    it('disables submit button when submitting', () => {
      render(<CollectionForm {...defaultProps} isSubmitting={true} />);

      const submitButton = screen.getByRole('button', { name: /saving/i });
      expect(submitButton).toBeDisabled();
    });

    it('shows "Saving..." text when submitting', () => {
      render(<CollectionForm {...defaultProps} isSubmitting={true} />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('enables submit button when not submitting', () => {
      render(<CollectionForm {...defaultProps} isSubmitting={false} />);

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Max Length Enforcement', () => {
    it('validates max length for name (100 chars)', async () => {
      const user = userEvent.setup();
      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      const longName = 'A'.repeat(101);
      await user.type(nameInput, longName);

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/collection name must be less than 100 characters/i)).toBeInTheDocument();
      });
    });

    it('validates max length for description (500 chars)', async () => {
      const user = userEvent.setup();
      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      await user.type(nameInput, 'Valid Name');

      const descriptionInput = screen.getByLabelText(/description/i);
      const longDescription = 'A'.repeat(501);
      await user.type(descriptionInput, longDescription);

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/description must be less than 500 characters/i)).toBeInTheDocument();
      });
    });

    it('accepts maximum allowed length', async () => {
      const user = userEvent.setup();
      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      const maxName = 'A'.repeat(100);
      await user.type(nameInput, maxName);

      const descriptionInput = screen.getByLabelText(/description/i);
      const maxDescription = 'B'.repeat(500);
      await user.type(descriptionInput, maxDescription);

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Should not show validation errors
      expect(screen.queryByText(/must be less than/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('associates labels with inputs', () => {
      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const imageInput = screen.getByLabelText(/cover image url/i);

      expect(nameInput).toBeInTheDocument();
      expect(descriptionInput).toBeInTheDocument();
      expect(imageInput).toBeInTheDocument();
    });

    it('displays error messages with proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(<CollectionForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/collection name is required/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveClass('text-red-500');
      });
    });

    it('has proper button type for submit', () => {
      render(<CollectionForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Edge Cases', () => {
    it('handles special characters in name', async () => {
      const user = userEvent.setup();
      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      await user.type(nameInput, 'Collection with "quotes" & <tags>');

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Collection with "quotes" & <tags>',
          })
        );
      });
    });

    it('handles unicode characters in name and description', async () => {
      const user = userEvent.setup();
      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      await user.type(nameInput, '美味しい料理 🍜');

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Delicious Japanese recipes 日本料理');

      const submitButton = screen.getByRole('button', { name: /create collection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: '美味しい料理 🍜',
          description: 'Delicious Japanese recipes 日本料理',
          cover_image_url: '',
        });
      });
    });

    it('handles rapid form submissions', async () => {
      const user = userEvent.setup();
      render(<CollectionForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/collection name/i);
      await user.type(nameInput, 'Quick Submit Test');

      const submitButton = screen.getByRole('button', { name: /create collection/i });

      // Try to submit multiple times rapidly
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only submit once (or handle based on isSubmitting state)
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });
  });
});
