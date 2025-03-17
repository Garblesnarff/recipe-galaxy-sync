
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RecipeFormData,
  CUISINE_TYPES,
  COOKING_METHODS,
  CATEGORY_OPTIONS,
  DIET_TAG_OPTIONS,
  SEASON_OCCASION_OPTIONS
} from "@/types/recipe";

interface RecipeCategoriesProps {
  formData: RecipeFormData;
  onChange: (field: keyof RecipeFormData, value: string | string[] | number) => void;
}

export const RecipeCategories = ({ formData, onChange }: RecipeCategoriesProps) => {
  const handleArrayToggle = (field: 'categories' | 'diet_tags' | 'season_occasion', value: string) => {
    const array = formData[field] || [];
    const newArray = array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
    
    onChange(field, newArray);
  };

  return (
    <div className="space-y-6 border p-4 rounded-md">
      <h3 className="text-lg font-semibold">Recipe Organization</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="servings">Servings</Label>
          <Input
            id="servings"
            type="number"
            min="1"
            value={formData.servings || ""}
            onChange={(e) => onChange('servings', parseInt(e.target.value) || 1)}
          />
        </div>
        <div>
          <Label htmlFor="prep_time">Preparation Time</Label>
          <Input
            id="prep_time"
            placeholder="e.g., 15 minutes"
            value={formData.prep_time || ""}
            onChange={(e) => onChange('prep_time', e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="cuisine_type">Cuisine Type</Label>
        <Select
          value={formData.cuisine_type || ""}
          onValueChange={(value) => onChange('cuisine_type', value)}
        >
          <SelectTrigger id="cuisine_type">
            <SelectValue placeholder="Select cuisine type" />
          </SelectTrigger>
          <SelectContent>
            {CUISINE_TYPES.map((cuisine) => (
              <SelectItem key={cuisine} value={cuisine}>
                {cuisine}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="cooking_method">Cooking Method</Label>
        <Select
          value={formData.cooking_method || ""}
          onValueChange={(value) => onChange('cooking_method', value)}
        >
          <SelectTrigger id="cooking_method">
            <SelectValue placeholder="Select cooking method" />
          </SelectTrigger>
          <SelectContent>
            {COOKING_METHODS.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="block mb-2">Categories</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.categories?.map(category => (
            <Badge key={category} variant="outline" className="flex items-center gap-1">
              {category}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleArrayToggle('categories', category)}
              />
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {CATEGORY_OPTIONS.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox 
                id={`category-${category}`}
                checked={formData.categories?.includes(category) || false}
                onCheckedChange={() => handleArrayToggle('categories', category)}
              />
              <label 
                htmlFor={`category-${category}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <Label className="block mb-2">Dietary Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.diet_tags?.map(tag => (
            <Badge key={tag} variant="outline" className="flex items-center gap-1">
              {tag}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleArrayToggle('diet_tags', tag)}
              />
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {DIET_TAG_OPTIONS.map((tag) => (
            <div key={tag} className="flex items-center space-x-2">
              <Checkbox 
                id={`diet-${tag}`}
                checked={formData.diet_tags?.includes(tag) || false}
                onCheckedChange={() => handleArrayToggle('diet_tags', tag)}
              />
              <label 
                htmlFor={`diet-${tag}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {tag}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <Label className="block mb-2">Season/Occasion</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.season_occasion?.map(season => (
            <Badge key={season} variant="outline" className="flex items-center gap-1">
              {season}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleArrayToggle('season_occasion', season)}
              />
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SEASON_OCCASION_OPTIONS.map((season) => (
            <div key={season} className="flex items-center space-x-2">
              <Checkbox 
                id={`season-${season}`}
                checked={formData.season_occasion?.includes(season) || false}
                onCheckedChange={() => handleArrayToggle('season_occasion', season)}
              />
              <label 
                htmlFor={`season-${season}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {season}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
