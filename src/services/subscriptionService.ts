import { supabase } from '@/integrations/supabase/client';
import { getMonthlyUsage } from './usageService'; // Assuming usage service is separated

export const createCheckoutSession = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: { userId },
    });
    if (error) throw error;
    return data.url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return null;
  }
};

export const getUserSubscription = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
};

export const isFeatureAvailable = async (
  userId: string,
  feature: 'recipe_adapt'
): Promise<boolean> => {
  const subscription = await getUserSubscription(userId);
  if (subscription && subscription.status === 'active') {
    return true;
  }

  const usage = await getMonthlyUsage(userId, feature);
  return usage < 5; // Free tier limit
};
