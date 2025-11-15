import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import {
  ExerciseFilters,
  EXERCISE_CATEGORIES,
  MUSCLE_GROUPS,
  EQUIPMENT_TYPES,
  DIFFICULTY_LEVELS
} from "@/types/workout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

interface ExerciseFiltersProps {
  filters: ExerciseFilters;
  onFiltersChange: (filters: ExerciseFilters) => void;
}

export const ExerciseFilterBar = ({
  filters,
  onFiltersChange,
}: ExerciseFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("categories");

  const handleClearFilters = () => {
    onFiltersChange({
      searchQuery: "",
      categories: [],
      muscle_groups: [],
      equipment: [],
      difficulty: null,
      custom_only: false,
      has_video: false
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.muscle_groups.length > 0) count++;
    if (filters.equipment.length > 0) count++;
    if (filters.difficulty) count++;
    if (filters.custom_only) count++;
    if (filters.has_video) count++;
    return count;
  };

  const toggleArrayFilter = (
    field: 'categories' | 'muscle_groups' | 'equipment',
    value: string
  ) => {
    const currentValues = filters[field];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    onFiltersChange({
      ...filters,
      [field]: newValues
    });
  };

  const handleDifficultyChange = (value: string) => {
    onFiltersChange({
      ...filters,
      difficulty: value === "null" ? null : value
    });
  };

  const handleCustomToggle = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      custom_only: checked
    });
  };

  return (
    <div className="mb-6 space-y-3 bg-white rounded-xl shadow-sm p-4">
      {/* Search and filter toggle */}
      <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3 md:items-center">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search exercises..."
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

          {filters.muscle_groups.map(muscle => (
            <Badge key={muscle} variant="outline" className="flex items-center gap-1">
              {muscle}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleArrayFilter('muscle_groups', muscle)}
              />
            </Badge>
          ))}

          {filters.equipment.map(equip => (
            <Badge key={equip} variant="outline" className="flex items-center gap-1">
              {equip}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleArrayFilter('equipment', equip)}
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

          {filters.custom_only && (
            <Badge variant="outline" className="flex items-center gap-1">
              Custom Only
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleCustomToggle(false)}
              />
            </Badge>
          )}

          {filters.has_video && (
            <Badge variant="outline" className="flex items-center gap-1">
              Has Video Demo
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, has_video: false })}
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
          <div className="flex border-b mb-3">
            <button
              className={`px-4 py-2 ${selectedTab === 'categories' ? 'border-b-2 border-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setSelectedTab('categories')}
            >
              Categories
            </button>
            <button
              className={`px-4 py-2 ${selectedTab === 'muscles' ? 'border-b-2 border-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setSelectedTab('muscles')}
            >
              Muscle Groups
            </button>
            <button
              className={`px-4 py-2 ${selectedTab === 'equipment' ? 'border-b-2 border-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setSelectedTab('equipment')}
            >
              Equipment
            </button>
            <button
              className={`px-4 py-2 ${selectedTab === 'other' ? 'border-b-2 border-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setSelectedTab('other')}
            >
              Other
            </button>
          </div>

          {selectedTab === 'categories' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {EXERCISE_CATEGORIES.map((category) => (
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
          )}

          {selectedTab === 'muscles' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {MUSCLE_GROUPS.map((muscle) => (
                <div key={muscle} className="flex items-center space-x-2">
                  <Checkbox
                    id={`muscle-${muscle}`}
                    checked={filters.muscle_groups.includes(muscle)}
                    onCheckedChange={() => toggleArrayFilter('muscle_groups', muscle)}
                  />
                  <label
                    htmlFor={`muscle-${muscle}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {muscle}
                  </label>
                </div>
              ))}
            </div>
          )}

          {selectedTab === 'equipment' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {EQUIPMENT_TYPES.map((equip) => (
                <div key={equip} className="flex items-center space-x-2">
                  <Checkbox
                    id={`equip-${equip}`}
                    checked={filters.equipment.includes(equip)}
                    onCheckedChange={() => toggleArrayFilter('equipment', equip)}
                  />
                  <label
                    htmlFor={`equip-${equip}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {equip}
                  </label>
                </div>
              ))}
            </div>
          )}

          {selectedTab === 'other' && (
            <div className="space-y-4">
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
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="custom-only"
                  checked={filters.custom_only}
                  onCheckedChange={handleCustomToggle}
                />
                <Label htmlFor="custom-only">Custom Exercises Only</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="has-video"
                  checked={filters.has_video || false}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, has_video: checked })
                  }
                />
                <Label htmlFor="has-video">Has Video Demo</Label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
