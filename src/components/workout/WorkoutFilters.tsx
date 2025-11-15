import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import {
  WorkoutFilters,
  WORKOUT_TYPES,
  DIFFICULTY_LEVELS,
  MUSCLE_GROUPS,
  EQUIPMENT_TYPES,
  WorkoutSortOption,
  WORKOUT_SORT_OPTIONS
} from "@/types/workout";
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

interface WorkoutFiltersProps {
  filters: WorkoutFilters;
  onFiltersChange: (filters: WorkoutFilters) => void;
  sortOption: WorkoutSortOption;
  onSortChange: (option: WorkoutSortOption) => void;
}

export const WorkoutFilterBar = ({
  filters,
  onFiltersChange,
  sortOption,
  onSortChange,
}: WorkoutFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("types");

  const handleClearFilters = () => {
    onFiltersChange({
      searchQuery: "",
      workout_types: [],
      difficulty: null,
      target_muscle_groups: [],
      equipment_needed: [],
      favorite_only: false,
      template_only: false
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.workout_types.length > 0) count++;
    if (filters.difficulty) count++;
    if (filters.target_muscle_groups.length > 0) count++;
    if (filters.equipment_needed.length > 0) count++;
    if (filters.favorite_only) count++;
    if (filters.template_only) count++;
    return count;
  };

  const toggleArrayFilter = (
    field: 'workout_types' | 'target_muscle_groups' | 'equipment_needed',
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

  const handleFavoriteToggle = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      favorite_only: checked
    });
  };

  const handleTemplateToggle = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      template_only: checked
    });
  };

  return (
    <div className="mb-6 space-y-3 bg-white rounded-xl shadow-sm p-4">
      {/* Search and filter toggle */}
      <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3 md:items-center">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search workouts..."
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
                {WORKOUT_SORT_OPTIONS.map((option) => (
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
          {filters.workout_types.map(type => (
            <Badge key={type} variant="outline" className="flex items-center gap-1">
              {type}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleArrayFilter('workout_types', type)}
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

          {filters.target_muscle_groups.map(muscle => (
            <Badge key={muscle} variant="outline" className="flex items-center gap-1">
              {muscle}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleArrayFilter('target_muscle_groups', muscle)}
              />
            </Badge>
          ))}

          {filters.equipment_needed.map(equip => (
            <Badge key={equip} variant="outline" className="flex items-center gap-1">
              {equip}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleArrayFilter('equipment_needed', equip)}
              />
            </Badge>
          ))}

          {filters.favorite_only && (
            <Badge variant="outline" className="flex items-center gap-1">
              Favorites Only
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFavoriteToggle(false)}
              />
            </Badge>
          )}

          {filters.template_only && (
            <Badge variant="outline" className="flex items-center gap-1">
              Templates Only
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleTemplateToggle(false)}
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
              className={`px-4 py-2 ${selectedTab === 'types' ? 'border-b-2 border-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setSelectedTab('types')}
            >
              Workout Types
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

          {selectedTab === 'types' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {WORKOUT_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.workout_types.includes(type)}
                    onCheckedChange={() => toggleArrayFilter('workout_types', type)}
                  />
                  <label
                    htmlFor={`type-${type}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {type}
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
                    checked={filters.target_muscle_groups.includes(muscle)}
                    onCheckedChange={() => toggleArrayFilter('target_muscle_groups', muscle)}
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
                    checked={filters.equipment_needed.includes(equip)}
                    onCheckedChange={() => toggleArrayFilter('equipment_needed', equip)}
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
                  id="favorite-only"
                  checked={filters.favorite_only}
                  onCheckedChange={handleFavoriteToggle}
                />
                <Label htmlFor="favorite-only">Favorites Only</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="template-only"
                  checked={filters.template_only}
                  onCheckedChange={handleTemplateToggle}
                />
                <Label htmlFor="template-only">Templates Only</Label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
