import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadImage } from '../recipe/recipeUpload';
import { supabase } from '@/integrations/supabase/client';
import { createMockFile } from '@/test/utils';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}));

describe('recipeUpload - uploadImage', () => {
  const mockBucket = {
    upload: vi.fn(),
    getPublicUrl: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.storage.from).mockReturnValue(mockBucket as any);
  });

  describe('Valid File Upload', () => {
    it('uploads valid JPEG file successfully', async () => {
      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg'); // 1MB
      const mockPublicUrl = 'https://storage.example.com/recipe-images/test-uuid.jpg';

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: mockPublicUrl } });

      const result = await uploadImage(file);

      expect(result).toBe(mockPublicUrl);
      expect(supabase.storage.from).toHaveBeenCalledWith('recipe-images');
      expect(mockBucket.upload).toHaveBeenCalledWith(
        expect.stringMatching(/\.jpg$/),
        file
      );
      expect(mockBucket.getPublicUrl).toHaveBeenCalled();
    });

    it('uploads valid PNG file successfully', async () => {
      const file = createMockFile('recipe.png', 2 * 1024 * 1024, 'image/png'); // 2MB
      const mockPublicUrl = 'https://storage.example.com/recipe-images/test-uuid.png';

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: mockPublicUrl } });

      const result = await uploadImage(file);

      expect(result).toBe(mockPublicUrl);
      expect(mockBucket.upload).toHaveBeenCalledWith(
        expect.stringMatching(/\.png$/),
        file
      );
    });

    it('uploads valid WebP file successfully', async () => {
      const file = createMockFile('image.webp', 1024 * 1024, 'image/webp'); // 1MB
      const mockPublicUrl = 'https://storage.example.com/recipe-images/test-uuid.webp';

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: mockPublicUrl } });

      const result = await uploadImage(file);

      expect(result).toBe(mockPublicUrl);
      expect(mockBucket.upload).toHaveBeenCalledWith(
        expect.stringMatching(/\.webp$/),
        file
      );
    });

    it('uploads valid GIF file successfully', async () => {
      const file = createMockFile('animated.gif', 1024 * 1024, 'image/gif'); // 1MB
      const mockPublicUrl = 'https://storage.example.com/recipe-images/test-uuid.gif';

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: mockPublicUrl } });

      const result = await uploadImage(file);

      expect(result).toBe(mockPublicUrl);
      expect(mockBucket.upload).toHaveBeenCalledWith(
        expect.stringMatching(/\.gif$/),
        file
      );
    });

    it('handles uppercase file extensions', async () => {
      const file = createMockFile('IMAGE.JPG', 1024 * 1024, 'image/jpeg');
      const mockPublicUrl = 'https://storage.example.com/recipe-images/test-uuid.JPG';

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: mockPublicUrl } });

      const result = await uploadImage(file);

      expect(result).toBe(mockPublicUrl);
    });

    it('handles mixed case file extensions', async () => {
      const file = createMockFile('photo.JpEg', 1024 * 1024, 'image/jpeg');
      const mockPublicUrl = 'https://storage.example.com/recipe-images/test-uuid.JpEg';

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({ data: { publicUrl: mockPublicUrl } });

      const result = await uploadImage(file);

      expect(result).toBe(mockPublicUrl);
    });

    it('generates unique filename with UUID', async () => {
      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' }
      });

      await uploadImage(file);

      // Should be called with a UUID-like filename
      expect(mockBucket.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^[a-f0-9-]{36}\.jpg$/),
        file
      );
    });
  });

  describe('File Size Validation', () => {
    it('rejects files larger than 5MB', async () => {
      const file = createMockFile('large.jpg', 6 * 1024 * 1024, 'image/jpeg'); // 6MB

      await expect(uploadImage(file)).rejects.toThrow(/must be less than 5MB/i);

      expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    it('accepts files exactly at 5MB limit', async () => {
      const file = createMockFile('max-size.jpg', 5 * 1024 * 1024, 'image/jpeg'); // Exactly 5MB

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' }
      });

      await expect(uploadImage(file)).resolves.toBeDefined();

      expect(mockBucket.upload).toHaveBeenCalled();
    });

    it('rejects empty files (0 bytes)', async () => {
      const file = createMockFile('empty.jpg', 0, 'image/jpeg');

      await expect(uploadImage(file)).rejects.toThrow(/cannot be empty/i);

      expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    it('accepts very small files (1 byte)', async () => {
      const file = createMockFile('tiny.jpg', 1, 'image/jpeg');

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' }
      });

      await expect(uploadImage(file)).resolves.toBeDefined();

      expect(mockBucket.upload).toHaveBeenCalled();
    });

    it('rejects files just over 5MB limit', async () => {
      const file = createMockFile('over-limit.jpg', 5 * 1024 * 1024 + 1, 'image/jpeg'); // 5MB + 1 byte

      await expect(uploadImage(file)).rejects.toThrow(/must be less than 5MB/i);

      expect(mockBucket.upload).not.toHaveBeenCalled();
    });
  });

  describe('File Type Validation', () => {
    it('rejects PDF files', async () => {
      const file = createMockFile('document.pdf', 1024, 'application/pdf');

      await expect(uploadImage(file)).rejects.toThrow(/must be an image/i);

      expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    it('rejects text files', async () => {
      const file = createMockFile('text.txt', 1024, 'text/plain');

      await expect(uploadImage(file)).rejects.toThrow(/must be an image/i);

      expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    it('rejects video files', async () => {
      const file = createMockFile('video.mp4', 1024, 'video/mp4');

      await expect(uploadImage(file)).rejects.toThrow(/must be an image/i);

      expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    it('rejects SVG files', async () => {
      const file = createMockFile('vector.svg', 1024, 'image/svg+xml');

      await expect(uploadImage(file)).rejects.toThrow(/must be an image/i);

      expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    it('rejects files with image MIME type but wrong extension', async () => {
      const file = createMockFile('fake.txt', 1024, 'image/jpeg');

      await expect(uploadImage(file)).rejects.toThrow(/must have a valid image extension/i);

      expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    it('rejects files with correct extension but wrong MIME type', async () => {
      const file = createMockFile('fake.jpg', 1024, 'application/octet-stream');

      await expect(uploadImage(file)).rejects.toThrow(/must be an image/i);

      expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    it('rejects HEIC files (not in allowed list)', async () => {
      const file = createMockFile('photo.heic', 1024, 'image/heic');

      await expect(uploadImage(file)).rejects.toThrow(/must be an image/i);

      expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    it('rejects BMP files (not in allowed list)', async () => {
      const file = createMockFile('bitmap.bmp', 1024, 'image/bmp');

      await expect(uploadImage(file)).rejects.toThrow(/must be an image/i);

      expect(mockBucket.upload).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles Supabase upload errors', async () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const uploadError = new Error('Storage quota exceeded');

      mockBucket.upload.mockResolvedValue({ data: null, error: uploadError });

      // The uploadImage function wraps all errors in a generic "Failed to upload image" message
      await expect(uploadImage(file)).rejects.toThrow('Failed to upload image');
    });

    it('handles network errors during upload', async () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      mockBucket.upload.mockRejectedValue(new Error('Network error'));

      await expect(uploadImage(file)).rejects.toThrow('Failed to upload image');
    });

    it('provides user-friendly error for validation failures', async () => {
      const file = createMockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg'); // 10MB

      await expect(uploadImage(file)).rejects.toThrow(/must be less than 5MB/i);
    });

    it('handles missing file extension', async () => {
      const file = new File(['content'], 'noextension', { type: 'image/jpeg' });

      await expect(uploadImage(file)).rejects.toThrow(/must have a valid image extension/i);

      expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    it('handles files with multiple dots in name', async () => {
      const file = createMockFile('my.recipe.photo.jpg', 1024, 'image/jpeg');

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' }
      });

      await expect(uploadImage(file)).resolves.toBeDefined();

      expect(mockBucket.upload).toHaveBeenCalledWith(
        expect.stringMatching(/\.jpg$/),
        file
      );
    });
  });

  describe('Boundary Cases', () => {
    it('handles file at exactly 5MB (5242880 bytes)', async () => {
      const file = createMockFile('exact.jpg', 5242880, 'image/jpeg');

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' }
      });

      await expect(uploadImage(file)).resolves.toBeDefined();
    });

    it('rejects file at 5MB + 1 byte', async () => {
      const file = createMockFile('over.jpg', 5242881, 'image/jpeg');

      await expect(uploadImage(file)).rejects.toThrow(/must be less than 5MB/i);
    });

    it('handles very long filenames', async () => {
      const longName = 'a'.repeat(200) + '.jpg';
      const file = createMockFile(longName, 1024, 'image/jpeg');

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' }
      });

      await expect(uploadImage(file)).resolves.toBeDefined();
    });

    it('handles filenames with special characters', async () => {
      const file = createMockFile('my-recipe_2024!.jpg', 1024, 'image/jpeg');

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' }
      });

      await expect(uploadImage(file)).resolves.toBeDefined();
    });

    it('handles filenames with unicode characters', async () => {
      const file = createMockFile('レシピ写真.jpg', 1024, 'image/jpeg');

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' }
      });

      await expect(uploadImage(file)).resolves.toBeDefined();
    });
  });

  describe('Supported Image Formats', () => {
    const supportedFormats = [
      { ext: 'jpg', mime: 'image/jpeg', name: 'JPEG' },
      { ext: 'jpeg', mime: 'image/jpeg', name: 'JPEG (alternate)' },
      { ext: 'png', mime: 'image/png', name: 'PNG' },
      { ext: 'gif', mime: 'image/gif', name: 'GIF' },
      { ext: 'webp', mime: 'image/webp', name: 'WebP' },
    ];

    supportedFormats.forEach(({ ext, mime, name }) => {
      it(`accepts ${name} format (.${ext})`, async () => {
        const file = createMockFile(`image.${ext}`, 1024, mime);

        mockBucket.upload.mockResolvedValue({ data: {}, error: null });
        mockBucket.getPublicUrl.mockReturnValue({
          data: { publicUrl: `https://example.com/image.${ext}` }
        });

        await expect(uploadImage(file)).resolves.toBeDefined();

        expect(mockBucket.upload).toHaveBeenCalled();
      });
    });
  });

  describe('Storage Integration', () => {
    it('uploads to correct bucket (recipe-images)', async () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' }
      });

      await uploadImage(file);

      expect(supabase.storage.from).toHaveBeenCalledWith('recipe-images');
    });

    it('retrieves public URL after upload', async () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const expectedUrl = 'https://storage.example.com/recipe-images/uuid.jpg';

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: expectedUrl }
      });

      const result = await uploadImage(file);

      expect(result).toBe(expectedUrl);
      expect(mockBucket.getPublicUrl).toHaveBeenCalled();
    });

    it('preserves file extension in uploaded filename', async () => {
      const file = createMockFile('myrecipe.png', 1024, 'image/png');

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.png' }
      });

      await uploadImage(file);

      const uploadCall = mockBucket.upload.mock.calls[0];
      expect(uploadCall[0]).toMatch(/\.png$/);
    });
  });

  describe('Concurrent Uploads', () => {
    it('handles multiple simultaneous uploads', async () => {
      const files = [
        createMockFile('image1.jpg', 1024, 'image/jpeg'),
        createMockFile('image2.png', 2048, 'image/png'),
        createMockFile('image3.webp', 3072, 'image/webp'),
      ];

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' }
      });

      const uploads = files.map(file => uploadImage(file));
      const results = await Promise.all(uploads);

      expect(results).toHaveLength(3);
      expect(mockBucket.upload).toHaveBeenCalledTimes(3);
    });

    it('handles mixed success and failure in concurrent uploads', async () => {
      const files = [
        createMockFile('good.jpg', 1024, 'image/jpeg'),
        createMockFile('bad.jpg', 10 * 1024 * 1024, 'image/jpeg'), // Too large
      ];

      mockBucket.upload.mockResolvedValue({ data: {}, error: null });
      mockBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' }
      });

      const results = await Promise.allSettled([
        uploadImage(files[0]),
        uploadImage(files[1]),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });
  });

  describe('Security', () => {
    it('does not allow executable files with image extension', async () => {
      const file = createMockFile('malware.jpg.exe', 1024, 'application/x-msdownload');

      await expect(uploadImage(file)).rejects.toThrow(/must be an image/i);
    });

    it('validates both MIME type and file extension', async () => {
      // File claims to be JPEG but has PDF MIME type
      const file = new File(['fake'], 'image.jpg', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 });

      await expect(uploadImage(file)).rejects.toThrow(/must be an image/i);
    });
  });
});
