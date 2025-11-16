// High-level Offline Storage API for Recipe Galaxy Sync
// Provides convenient methods for storing and retrieving offline data

import {
  getAll,
  getById,
  add,
  update,
  remove,
  addToSyncQueue,
  getPendingSyncQueue,
} from './indexedDB';

// Workout Operations

export async function saveWorkoutOffline(workout: any): Promise<string> {
  const workoutData = {
    ...workout,
    id: workout.id || crypto.randomUUID(),
    offline: true,
    created_at: workout.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await add('workouts', workoutData);

  // Add to sync queue
  await addToSyncQueue({
    operation: 'insert',
    tableName: 'workouts',
    data: workoutData,
  });

  return workoutData.id;
}

export async function getOfflineWorkouts(): Promise<any[]> {
  return getAll('workouts');
}

export async function getOfflineWorkoutById(id: string): Promise<any | undefined> {
  return getById('workouts', id);
}

export async function updateWorkoutOffline(id: string, updates: any): Promise<void> {
  const updatedData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await update('workouts', id, updatedData);

  // Add to sync queue
  await addToSyncQueue({
    operation: 'update',
    tableName: 'workouts',
    data: { id, ...updatedData },
  });
}

export async function deleteWorkoutOffline(id: string): Promise<void> {
  await remove('workouts', id);

  // Add to sync queue
  await addToSyncQueue({
    operation: 'delete',
    tableName: 'workouts',
    data: { id },
  });
}

// Exercise Operations

export async function saveExerciseOffline(exercise: any): Promise<string> {
  const exerciseData = {
    ...exercise,
    id: exercise.id || crypto.randomUUID(),
    offline: true,
    created_at: exercise.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await add('exercises', exerciseData);

  await addToSyncQueue({
    operation: 'insert',
    tableName: 'exercises',
    data: exerciseData,
  });

  return exerciseData.id;
}

export async function getOfflineExercises(): Promise<any[]> {
  return getAll('exercises');
}

export async function getOfflineExerciseById(id: string): Promise<any | undefined> {
  return getById('exercises', id);
}

export async function updateExerciseOffline(id: string, updates: any): Promise<void> {
  const updatedData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await update('exercises', id, updatedData);

  await addToSyncQueue({
    operation: 'update',
    tableName: 'exercises',
    data: { id, ...updatedData },
  });
}

export async function deleteExerciseOffline(id: string): Promise<void> {
  await remove('exercises', id);

  await addToSyncQueue({
    operation: 'delete',
    tableName: 'exercises',
    data: { id },
  });
}

// Recipe Operations

export async function saveRecipeOffline(recipe: any): Promise<string> {
  const recipeData = {
    ...recipe,
    id: recipe.id || crypto.randomUUID(),
    offline: true,
    created_at: recipe.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await add('recipes', recipeData);

  await addToSyncQueue({
    operation: 'insert',
    tableName: 'recipes',
    data: recipeData,
  });

  return recipeData.id;
}

export async function getOfflineRecipes(): Promise<any[]> {
  return getAll('recipes');
}

export async function getOfflineRecipeById(id: string): Promise<any | undefined> {
  return getById('recipes', id);
}

export async function updateRecipeOffline(id: string, updates: any): Promise<void> {
  const updatedData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await update('recipes', id, updatedData);

  await addToSyncQueue({
    operation: 'update',
    tableName: 'recipes',
    data: { id, ...updatedData },
  });
}

export async function deleteRecipeOffline(id: string): Promise<void> {
  await remove('recipes', id);

  await addToSyncQueue({
    operation: 'delete',
    tableName: 'recipes',
    data: { id },
  });
}

// Meal Plan Operations

export async function saveMealPlanOffline(mealPlan: any): Promise<string> {
  const mealPlanData = {
    ...mealPlan,
    id: mealPlan.id || crypto.randomUUID(),
    offline: true,
    created_at: mealPlan.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await add('mealPlans', mealPlanData);

  await addToSyncQueue({
    operation: 'insert',
    tableName: 'meal_plans',
    data: mealPlanData,
  });

  return mealPlanData.id;
}

export async function getOfflineMealPlans(): Promise<any[]> {
  return getAll('mealPlans');
}

export async function updateMealPlanOffline(id: string, updates: any): Promise<void> {
  const updatedData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await update('mealPlans', id, updatedData);

  await addToSyncQueue({
    operation: 'update',
    tableName: 'meal_plans',
    data: { id, ...updatedData },
  });
}

export async function deleteMealPlanOffline(id: string): Promise<void> {
  await remove('mealPlans', id);

  await addToSyncQueue({
    operation: 'delete',
    tableName: 'meal_plans',
    data: { id },
  });
}

// Utility Functions

export async function hasOfflineData(): Promise<boolean> {
  const workouts = await getOfflineWorkouts();
  const exercises = await getOfflineExercises();
  const recipes = await getOfflineRecipes();
  const mealPlans = await getOfflineMealPlans();

  return (
    workouts.length > 0 ||
    exercises.length > 0 ||
    recipes.length > 0 ||
    mealPlans.length > 0
  );
}

export async function getOfflineDataStats(): Promise<{
  workouts: number;
  exercises: number;
  recipes: number;
  mealPlans: number;
  pendingSync: number;
}> {
  const workouts = await getOfflineWorkouts();
  const exercises = await getOfflineExercises();
  const recipes = await getOfflineRecipes();
  const mealPlans = await getOfflineMealPlans();
  const syncQueue = await getPendingSyncQueue();

  return {
    workouts: workouts.length,
    exercises: exercises.length,
    recipes: recipes.length,
    mealPlans: mealPlans.length,
    pendingSync: syncQueue.length,
  };
}

// Merge online and offline data
export async function mergeWorkouts(onlineWorkouts: any[]): Promise<any[]> {
  const offlineWorkouts = await getOfflineWorkouts();

  // Create a map of online workouts by ID
  const onlineMap = new Map(onlineWorkouts.map((w) => [w.id, w]));

  // Add offline workouts that don't exist online
  const mergedWorkouts = [...onlineWorkouts];

  offlineWorkouts.forEach((offlineWorkout) => {
    if (!onlineMap.has(offlineWorkout.id)) {
      mergedWorkouts.push(offlineWorkout);
    } else {
      // If exists in both, prefer the newer one
      const onlineWorkout = onlineMap.get(offlineWorkout.id);
      const offlineDate = new Date(offlineWorkout.updated_at);
      const onlineDate = new Date(onlineWorkout.updated_at);

      if (offlineDate > onlineDate) {
        // Replace with offline version
        const index = mergedWorkouts.findIndex((w) => w.id === offlineWorkout.id);
        if (index !== -1) {
          mergedWorkouts[index] = offlineWorkout;
        }
      }
    }
  });

  return mergedWorkouts;
}

// Similar merge functions for other data types
export async function mergeExercises(onlineExercises: any[]): Promise<any[]> {
  const offlineExercises = await getOfflineExercises();
  const onlineMap = new Map(onlineExercises.map((e) => [e.id, e]));
  const mergedExercises = [...onlineExercises];

  offlineExercises.forEach((offlineExercise) => {
    if (!onlineMap.has(offlineExercise.id)) {
      mergedExercises.push(offlineExercise);
    } else {
      const onlineExercise = onlineMap.get(offlineExercise.id);
      const offlineDate = new Date(offlineExercise.updated_at);
      const onlineDate = new Date(onlineExercise.updated_at);

      if (offlineDate > onlineDate) {
        const index = mergedExercises.findIndex((e) => e.id === offlineExercise.id);
        if (index !== -1) {
          mergedExercises[index] = offlineExercise;
        }
      }
    }
  });

  return mergedExercises;
}

export async function mergeRecipes(onlineRecipes: any[]): Promise<any[]> {
  const offlineRecipes = await getOfflineRecipes();
  const onlineMap = new Map(onlineRecipes.map((r) => [r.id, r]));
  const mergedRecipes = [...onlineRecipes];

  offlineRecipes.forEach((offlineRecipe) => {
    if (!onlineMap.has(offlineRecipe.id)) {
      mergedRecipes.push(offlineRecipe);
    } else {
      const onlineRecipe = onlineMap.get(offlineRecipe.id);
      const offlineDate = new Date(offlineRecipe.updated_at);
      const onlineDate = new Date(onlineRecipe.updated_at);

      if (offlineDate > onlineDate) {
        const index = mergedRecipes.findIndex((r) => r.id === offlineRecipe.id);
        if (index !== -1) {
          mergedRecipes[index] = offlineRecipe;
        }
      }
    }
  });

  return mergedRecipes;
}
