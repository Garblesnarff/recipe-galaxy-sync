
import { supabase } from "@/integrations/supabase/client";
import { imageFileSchema } from "@/lib/validation";
import { z } from "zod";

/**
 * Uploads an image to Supabase storage and returns the public URL
 * Validates file type and size before uploading
 */
export const uploadImage = async (file: File): Promise<string> => {
  try {
    // Validate file using Zod schema
    imageFileSchema.parse(file);

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return user-friendly validation error
      throw new Error(error.errors[0].message);
    }
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};
