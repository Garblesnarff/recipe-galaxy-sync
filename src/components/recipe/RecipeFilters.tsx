
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, X, Filter, SlidersHorizontal } from "lucide-react";
import {
  RecipeFilters,
  CUISINE_TYPES,
  COOKING_METHODS,
  CATEGORY_OPTIONS,
  DIET_TAG_OPTIONS,
  SEASON_OCCASION_OPTIONS,
  SortOption,
  SORT_OPTIONS
} from "@/types/recipe";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

interface RecipeFiltersProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
}

export const RecipeFilterBar = ({
  filters,
  onFiltersChange,
  sortOption,
  onSortChange,
}: RecipeFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("categories");

  const handleClearFilters = () => {
    onFiltersChange({
      searchQuery: "",
      categories: [],
      cuisine_type: null,
      diet_tags: [],
      cooking_method: null,
      season_occasion: [],
      difficulty: null,
      favorite_only: false
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.cuisine_type) count++;
    if (filters.diet_tags.length > 0) count++;
    if (filters.cooking_method) count++;
    if (filters.season_occasion.length > 0) count++;
    if (filters.difficulty) count++;
    if (filters.favorite_only) count++;
    return count;
  };

  const toggleArrayFilter = (field: 'categories' | 'diet_tags' | 'season_occasion', value: string) => {
    const currentValues = filters[field];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({
      ...filters,
      [field]: newValues
    });
  };

  const handleCuisineChange = (value: string) => {
    onFiltersChange({
      ...filters,
      cuisine_type: value === "null" ? null : value
    });
  };

  const handleCookingMethodChange = (value: string) => {
    onFiltersChange({
      ...filters,
      cooking_method: value === "null" ? null : value
    });
  };

  const handleDifficultyChange = (value: string) => {
    onFiltersChange({
      ...filters,
      difficulty: value === "null" ? null : value
    });
  };

  const handleFavoriteToggle = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      favorite_only: checked
    });
  };

  return (
    <div className="mb-6 space-y-3 bg-white rounded-xl shadow-sm p-4">
      {/* Search and filter toggle */}
      <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3 md:items-center">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search recipes..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            className="pl-10 w-full"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                <span>Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuGroup>
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={`${option.value}-${option.direction}`}
                    className={sortOption.value === option.value && sortOption.direction === option.direction ? "bg-accent" : ""}
                    onClick={() => onSortChange(option)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="mr-2 h-4 w-4" />
            <span>Filter</span>
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {getActiveFilterCount()}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Applied filters */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2 py-2">
          {filters.categories.map(category => (
            <Badge key={category} variant="outline" className="flex items-center gap-1">
              {category}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('categories', category)}
              />
            </Badge>
          ))}
          
          {filters.cuisine_type && (
            <Badge variant="outline" className="flex items-center gap-1">
              {filters.cuisine_type}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleCuisineChange("null")}
              />
            </Badge>
          )}
          
          {filters.diet_tags.map(tag => (
            <Badge key={tag} variant="outline" className="flex items-center gap-1">
              {tag}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('diet_tags', tag)}
              />
            </Badge>
          ))}
          
          {filters.cooking_method && (
            <Badge variant="outline" className="flex items-center gap-1">
              {filters.cooking_method}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleCookingMethodChange("null")}
              />
            </Badge>
          )}
          
          {filters.season_occasion.map(season => (
            <Badge key={season} variant="outline" className="flex items-center gap-1">
              {season}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('season_occasion', season)}
              />
            </Badge>
          ))}
          
          {filters.difficulty && (
            <Badge variant="outline" className="flex items-center gap-1">
              {filters.difficulty}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleDifficultyChange("null")}
              />
            </Badge>
          )}
          
          {filters.favorite_only && (
            <Badge variant="outline" className="flex items-center gap-1">
              Favorites Only
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFavoriteToggle(false)}
              />
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearFilters}
            className="text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <div className="border-t pt-3 animate-in fade-in">
          <div className="flex border-b mb-3" role="tablist" aria-label="Filter categories">
            <button
              role="tab"
              aria-selected={selectedTab === 'categories'}
              aria-controls="categories-panel"
              id="categories-tab"
              className={`px-4 py-2 ${selectedTab === 'categories' ? 'border-b-2 border-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setSelectedTab('categories')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  setSelectedTab('cuisine');
                  e.preventDefault();
                }
              }}
            >
              Categories
            </button>
            <button
              role="tab"
              aria-selected={selectedTab === 'cuisine'}
              aria-controls="cuisine-panel"
              id="cuisine-tab"
              className={`px-4 py-2 ${selectedTab === 'cuisine' ? 'border-b-2 border-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setSelectedTab('cuisine')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  setSelectedTab('dietary');
                  e.preventDefault();
                } else if (e.key === 'ArrowLeft') {
                  setSelectedTab('categories');
                  e.preventDefault();
                }
              }}
            >
              Cuisine
            </button>
            <button
              role="tab"
              aria-selected={selectedTab === 'dietary'}
              aria-controls="dietary-panel"
              id="dietary-tab"
              className={`px-4 py-2 ${selectedTab === 'dietary' ? 'border-b-2 border-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setSelectedTab('dietary')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  setSelectedTab('other');
                  e.preventDefault();
                } else if (e.key === 'ArrowLeft') {
                  setSelectedTab('cuisine');
                  e.preventDefault();
                }
              }}
            >
              Dietary
            </button>
            <button
              role="tab"
              aria-selected={selectedTab === 'other'}
              aria-controls="other-panel"
              id="other-tab"
              className={`px-4 py-2 ${selectedTab === 'other' ? 'border-b-2 border-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setSelectedTab('other')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                  setSelectedTab('dietary');
                  e.preventDefault();
                }
              }}
            >
              Other
            </button>
          </div>

          {selectedTab === 'categories' && (
            <div role="tabpanel" id="categories-panel" aria-labelledby="categories-tab">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {CATEGORY_OPTIONS.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={filters.categories.includes(category)}
                      onCheckedChange={() => toggleArrayFilter('categories', category)}
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
          )}

          {selectedTab === 'cuisine' && (
            <div role="tabpanel" id="cuisine-panel" aria-labelledby="cuisine-tab" className="space-y-4">
              <div>
                <Label htmlFor="cuisine-type">Cuisine Type</Label>
                <Select
                  value={filters.cuisine_type || "null"}
                  onValueChange={handleCuisineChange}
                >
                  <SelectTrigger id="cuisine-type">
                    <SelectValue placeholder="Select cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Any Cuisine</SelectItem>
                    {CUISINE_TYPES.map((cuisine) => (
                      <SelectItem key={cuisine} value={cuisine}>
                        {cuisine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="cooking-method">Cooking Method</Label>
                <Select
                  value={filters.cooking_method || "null"}
                  onValueChange={handleCookingMethodChange}
                >
                  <SelectTrigger id="cooking-method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Any Method</SelectItem>
                    {COOKING_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {selectedTab === 'dietary' && (
            <div role="tabpanel" id="dietary-panel" aria-labelledby="dietary-tab" className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {DIET_TAG_OPTIONS.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`diet-${tag}`}
                    checked={filters.diet_tags.includes(tag)}
                    onCheckedChange={() => toggleArrayFilter('diet_tags', tag)}
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
          )}

          {selectedTab === 'other' && (
            <div role="tabpanel" id="other-panel" aria-labelledby="other-tab" className="space-y-4">
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={filters.difficulty || "null"}
                  onValueChange={handleDifficultyChange}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Any Difficulty</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Season/Occasion</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SEASON_OCCASION_OPTIONS.slice(0, 9).map((season) => (
                    <div key={season} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`season-${season}`}
                        checked={filters.season_occasion.includes(season)}
                        onCheckedChange={() => toggleArrayFilter('season_occasion', season)}
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
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="favorite-only"
                  checked={filters.favorite_only}
                  onCheckedChange={handleFavoriteToggle}
                />
                <Label htmlFor="favorite-only">Favorites Only</Label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
