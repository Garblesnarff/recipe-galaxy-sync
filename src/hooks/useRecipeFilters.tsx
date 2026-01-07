
import { useState, useEffect } from 'react';
import { RecipeFilters, SortOption, SORT_OPTIONS } from '@/types/recipe';
import { useSearchParams, useLocation } from 'react-router-dom';

export const useRecipeFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Handle navigation state from tag clicks
  useEffect(() => {
    if (location.state?.filterType && location.state?.filterValue) {
      const { filterType, filterValue } = location.state;

      // Clear the navigation state to prevent re-application
      window.history.replaceState({}, '', location.pathname + location.search);

      // Apply the filter based on tag type
      let newFilters: RecipeFilters = {
        searchQuery: searchParams.get('q') || '',
        categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
        cuisine_type: searchParams.get('cuisine') || null,
        diet_tags: searchParams.get('diet')?.split(',').filter(Boolean) || [],
        cooking_method: searchParams.get('method') || null,
        season_occasion: searchParams.get('season')?.split(',').filter(Boolean) || [],
        difficulty: searchParams.get('difficulty') || null,
        favorite_only: searchParams.get('favorite') === 'true'
      };

      switch (filterType) {
        case 'cuisine_type':
          newFilters.cuisine_type = filterValue;
          break;
        case 'category':
          newFilters.categories = [...new Set([...newFilters.categories, filterValue])];
          break;
        case 'diet_tag':
          newFilters.diet_tags = [...new Set([...newFilters.diet_tags, filterValue])];
          break;
        case 'cooking_method':
          newFilters.cooking_method = filterValue;
          break;
        case 'season_occasion':
          newFilters.season_occasion = [...new Set([...newFilters.season_occasion, filterValue])];
          break;
      }

      setFilters(newFilters);

      // Update URL params
      const params = new URLSearchParams(searchParams);
      if (filterType === 'cuisine_type') params.set('cuisine', filterValue);
      else if (filterType === 'category') {
        const categories = params.get('categories')?.split(',').filter(Boolean) || [];
        categories.push(filterValue);
        params.set('categories', [...new Set(categories)].join(','));
      }
      else if (filterType === 'diet_tag') {
        const dietTags = params.get('diet')?.split(',').filter(Boolean) || [];
        dietTags.push(filterValue);
        params.set('diet', [...new Set(dietTags)].join(','));
      }
      else if (filterType === 'cooking_method') params.set('method', filterValue);
      else if (filterType === 'season_occasion') {
        const seasonOccasion = params.get('season')?.split(',').filter(Boolean) || [];
        seasonOccasion.push(filterValue);
        params.set('season', [...new Set(seasonOccasion)].join(','));
      }

      setSearchParams(params);
    }
  }, [location.state, searchParams, setSearchParams]);

  // Initialize filters from URL params
  const initialFilters: RecipeFilters = {
    searchQuery: searchParams.get('q') || '',
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    cuisine_type: searchParams.get('cuisine') || null,
    diet_tags: searchParams.get('diet')?.split(',').filter(Boolean) || [],
    cooking_method: searchParams.get('method') || null,
    season_occasion: searchParams.get('season')?.split(',').filter(Boolean) || [],
    difficulty: searchParams.get('difficulty') || null,
    favorite_only: searchParams.get('favorite') === 'true'
  };

  // Initialize sort option from URL params
  const sortParam = searchParams.get('sort') || 'created_at';
  const directionParam = searchParams.get('direction') || 'desc';
  const initialSortOption = SORT_OPTIONS.find(
    option => option.value === sortParam && option.direction === directionParam
  ) || SORT_OPTIONS[0];

  const [filters, setFilters] = useState<RecipeFilters>(initialFilters);
  const [sortOption, setSortOption] = useState<SortOption>(initialSortOption);

  // Update URL when filters or sort option change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.searchQuery) params.set('q', filters.searchQuery);
    if (filters.categories.length > 0) params.set('categories', filters.categories.join(','));
    if (filters.cuisine_type) params.set('cuisine', filters.cuisine_type);
    if (filters.diet_tags.length > 0) params.set('diet', filters.diet_tags.join(','));
    if (filters.cooking_method) params.set('method', filters.cooking_method);
    if (filters.season_occasion.length > 0) params.set('season', filters.season_occasion.join(','));
    if (filters.difficulty) params.set('difficulty', filters.difficulty);
    if (filters.favorite_only) params.set('favorite', 'true');

    params.set('sort', sortOption.value);
    params.set('direction', sortOption.direction);

    setSearchParams(params);
  }, [filters, sortOption, setSearchParams]);

  return {
    filters,
    setFilters,
    sortOption,
    setSortOption
  };
};
