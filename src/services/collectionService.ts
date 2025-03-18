
// This file re-exports all collection-related services from their respective files
// to maintain backwards compatibility with existing imports

export {
  fetchCollections,
  fetchCollectionById,
  fetchCollectionRecipes,
  fetchRecipeCollections
} from './collections/collectionFetch';

export {
  createCollection
} from './collections/collectionCreate';

export {
  updateCollection
} from './collections/collectionUpdate';

export {
  deleteCollection
} from './collections/collectionDelete';

export {
  addRecipeToCollection,
  removeRecipeFromCollection
} from './collections/recipeCollectionRelations';
