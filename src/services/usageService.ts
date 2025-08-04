import { supabase } from '@/integrations/supabase/client';

export const trackUsage = async (userId: string, actionType: 'recipe_import' | 'recipe_adapt', recipeId?: string) => {
  try {
    const { error } = await supabase.from('user_usage').insert([
      {
        user_id: userId,
        action_type: actionType,
        recipe_id: recipeId,
      },
    ]);
    if (error) throw error;
  } catch (error) {
    console.error(`Error tracking usage for ${actionType}:`, error);
  }
};

export const getMonthlyUsage = async (userId: string, actionType: string): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('get_monthly_usage', {
      p_user_id: userId,
      p_action_type: actionType,
    });

    if (error) throw error;
    return data ?? 0;
  } catch (error) {
    console.error(`Error getting monthly usage for ${actionType}:`, error);
    return 0;
  }
};

export const checkUsageLimit = async (userId: string, actionType: string, limit: number): Promise<boolean> => {
  const usage = await getMonthlyUsage(userId, actionType);
  return usage < limit;
};
