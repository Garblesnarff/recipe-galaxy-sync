/**
 * Subscription-related types
 */

export interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  current_period_end: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionFeature {
  name: string;
  limit: number | null; // null means unlimited
  available: boolean;
}
