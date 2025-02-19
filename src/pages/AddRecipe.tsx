import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AddRecipe = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [recipeUrl, setRecipeUrl] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cookTime: "",
    difficulty: "Easy",
    instructions: "",
    ingredients: [] as string[],
    currentIngredient: "",
    imageUrl: "",
    source_url: "",
    recipe_type: "manual" as "manual" | "imported",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const importRecipe = async () => {
    if (!recipeUrl) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-recipe', {
        body: { url: recipeUrl }
      });

      if (error) throw error;

      // Update form with scraped data
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        cookTime: data.cook_time || prev.cookTime,
        difficulty: data.difficulty || prev.difficulty,
        instructions: data.instructions || prev.instructions,
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : prev.ingredients,
        imageUrl: data.image_url || prev.imageUrl,
        source_url: data.source_url,
        recipe_type: "imported"
      }));

      if (data.image_url) {
        setImagePreview(data.image_url);
      }

      toast.success("Recipe imported successfully!");
    } catch (error) {
      console.error('Error importing recipe:', error);
      toast.error("Failed to import recipe. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase.from("recipes").insert({
        title: formData.title,
        description: formData.description,
        cook_time: formData.cookTime,
        difficulty: formData.difficulty,
        instructions: formData.instructions,
        ingredients: formData.ingredients,
        recipe_type: formData.recipe_type,
        image_url: imageUrl,
        source_url: formData.source_url,
      });

      if (error) throw error;

      toast.success("Recipe added successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error adding recipe:", error);
      toast.error("Failed to add recipe");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.currentIngredient.trim()) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, prev.currentIngredient.trim()],
        currentIngredient: "",
      }));
    }
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>

        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-semibold mb-6">Add New Recipe</h1>

          <div className="mb-6">
            <Label>Import Recipe from URL</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="url"
                placeholder="Enter recipe URL"
                value={recipeUrl}
                onChange={(e) => setRecipeUrl(e.target.value)}
              />
              <Button 
                onClick={importRecipe}
                disabled={isImporting}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                {isImporting ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="image">Recipe Image</Label>
              <div className="mt-2 space-y-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image')?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
                {(imagePreview || formData.imageUrl) && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={imagePreview || formData.imageUrl}
                      alt="Recipe preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                required
                className="w-full min-h-[100px] rounded-md border border-input px-3 py-2"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cookTime">Cook Time</Label>
                <Input
                  id="cookTime"
                  placeholder="e.g., 30 mins"
                  value={formData.cookTime}
                  onChange={e => setFormData(prev => ({ ...prev, cookTime: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  className="w-full rounded-md border border-input px-3 py-2"
                  value={formData.difficulty}
                  onChange={e => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Ingredients</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={formData.currentIngredient}
                  onChange={e => setFormData(prev => ({ ...prev, currentIngredient: e.target.value }))}
                  placeholder="Add an ingredient"
                />
                <Button type="button" onClick={addIngredient}>Add</Button>
              </div>
              <ul className="space-y-2">
                {formData.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    {ingredient}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <textarea
                id="instructions"
                required
                className="w-full min-h-[200px] rounded-md border border-input px-3 py-2"
                value={formData.instructions}
                onChange={e => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding Recipe..." : "Add Recipe"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddRecipe;
