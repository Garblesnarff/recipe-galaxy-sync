import { createContext, useContext, ReactNode } from "react";
import { IngredientSale } from "@/services/sales/types";
import { useBatchedSalesData } from "@/hooks/useBatchedSalesData";

/**
 * Sales data context value
 */
interface SalesDataContextValue {
  /**
   * Get sales data for a specific recipe ID
   */
  getSalesData: (recipeId: string) => IngredientSale[];

  /**
   * Whether sales data is currently loading
   */
  isLoading: boolean;

  /**
   * Error if sales data fetch failed
   */
  error: Error | null;
}

/**
 * Sales data context
 */
const SalesDataContext = createContext<SalesDataContextValue | undefined>(undefined);

/**
 * Props for SalesDataProvider
 */
interface SalesDataProviderProps {
  /**
   * Recipe IDs to fetch sales data for
   */
  recipeIds: string[];

  /**
   * Child components
   */
  children: ReactNode;

  /**
   * Whether to enable fetching (default: true)
   */
  enabled?: boolean;
}

/**
 * Provider component that fetches batched sales data and makes it available to children
 *
 * Usage:
 * ```tsx
 * <SalesDataProvider recipeIds={visibleRecipeIds}>
 *   <RecipeGrid recipes={recipes} />
 * </SalesDataProvider>
 * ```
 *
 * Child components can access sales data using `useSalesDataFromContext(recipeId)`
 */
export const SalesDataProvider = ({
  recipeIds,
  children,
  enabled = true,
}: SalesDataProviderProps) => {
  const { salesByRecipeId, isLoading, error } = useBatchedSalesData(recipeIds, enabled);

  const getSalesData = (recipeId: string): IngredientSale[] => {
    return salesByRecipeId.get(recipeId) || [];
  };

  return (
    <SalesDataContext.Provider value={{ getSalesData, isLoading, error }}>
      {children}
    </SalesDataContext.Provider>
  );
};

/**
 * Hook to access sales data from context for a specific recipe
 *
 * Usage:
 * ```tsx
 * const { salesData, isLoading, hasError } = useSalesDataFromContext(recipeId);
 * ```
 *
 * @param recipeId - The recipe ID to get sales data for
 * @returns Sales data, loading state, and error state for the recipe
 */
export const useSalesDataFromContext = (recipeId: string) => {
  const context = useContext(SalesDataContext);

  if (context === undefined) {
    throw new Error(
      "useSalesDataFromContext must be used within a SalesDataProvider"
    );
  }

  return {
    salesData: context.getSalesData(recipeId),
    isLoading: context.isLoading,
    hasError: context.error !== null,
  };
};

/**
 * Hook to access raw context value (for advanced use cases)
 */
export const useSalesDataContext = () => {
  const context = useContext(SalesDataContext);

  if (context === undefined) {
    throw new Error(
      "useSalesDataContext must be used within a SalesDataProvider"
    );
  }

  return context;
};
