# KitchenSync Monetization Implementation Plan

## Overview
Transform KitchenSync from a feature-complete app to a revenue-generating product by connecting existing dietary substitution features and adding Stripe payments.

## Current State
- ✅ Recipe importing from URLs
- ✅ Dietary restriction system
- ✅ Ingredient substitutions in database
- ✅ User authentication (Supabase)
- ❌ No "Quick Convert" flow
- ❌ No payment processing
- ❌ No usage limits

## Phase 1: Connect Recipe Conversion Flow (Days 1-3)

### Task 1.1: Add "Adapt Recipe" Button to Recipe Detail Page
**File:** `src/pages/RecipeDetail.tsx`

1. Add new button in the recipe actions section:
```tsx
<Button 
  onClick={handleAdaptRecipe} 
  variant="default"
  className="bg-green-600 hover:bg-green-700"
>
  <ChefHat className="mr-2 h-4 w-4" />
  Adapt for My Diet
</Button>
```

2. Create `handleAdaptRecipe` function that:
   - Checks if user has dietary restrictions set
   - If not, prompts to set them first
   - If yes, navigates to new adaptation page

### Task 1.2: Create Recipe Adaptation Page
**New File:** `src/pages/AdaptRecipe.tsx`

```tsx
// Core functionality:
// 1. Load original recipe
// 2. Get user's dietary restrictions
// 3. For each ingredient:
//    - Check against ingredient_classifications
//    - If conflicts with user restrictions, get substitutions
//    - Show original vs adapted side-by-side
// 4. Allow user to accept/reject each substitution
// 5. Save adapted version as new recipe
```

### Task 1.3: Create Adaptation Service
**New File:** `src/services/adaptationService.ts`

```typescript
export const adaptRecipeForDiet = async (
  recipeId: string,
  userRestrictions: DietaryRestriction[]
) => {
  // 1. Fetch recipe details
  // 2. Parse ingredients
  // 3. For each ingredient:
  //    - Check classifications
  //    - Get substitutions if needed
  // 4. Generate adapted instructions
  // 5. Return adapted recipe object
};
```

### Task 1.4: Add Route
**File:** `src/App.tsx`
```tsx
<Route path="/adapt-recipe/:id" element={<PrivateRoute><AdaptRecipe /></PrivateRoute>} />
```

## Phase 2: Add Usage Tracking (Days 4-5)

### Task 2.1: Create Usage Tracking Table
**New Migration:** `supabase/migrations/[timestamp]_add_usage_tracking.sql`

```sql
CREATE TABLE user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'recipe_import', 'recipe_adapt'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX idx_user_usage_created_at ON user_usage(created_at);

-- Function to count monthly usage
CREATE OR REPLACE FUNCTION get_monthly_usage(p_user_id UUID, p_action_type TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN COUNT(*)
  FROM user_usage
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND created_at >= date_trunc('month', CURRENT_DATE)
    AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;
```

### Task 2.2: Add Usage Tracking Hook
**New File:** `src/hooks/useUsageTracking.ts`

```typescript
export const useUsageTracking = () => {
  const trackUsage = async (actionType: 'recipe_import' | 'recipe_adapt', recipeId?: string) => {
    // Insert into user_usage table
  };

  const getMonthlyUsage = async (actionType: string) => {
    // Call get_monthly_usage function
  };

  const checkUsageLimit = async (actionType: string, limit: number) => {
    // Return true if under limit
  };

  return { trackUsage, getMonthlyUsage, checkUsageLimit };
};
```

## Phase 3: Implement Stripe Payments (Days 6-8)

### Task 3.1: Set Up Stripe
1. Create Stripe account
2. Get test API keys
3. Create products:
   - Free tier: $0/month (5 adaptations)
   - Pro tier: $9.99/month (unlimited)

### Task 3.2: Add Stripe Environment Variables
**File:** `.env.local`
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_... (for backend)
VITE_STRIPE_PRICE_ID=price_...
```

### Task 3.3: Install Stripe Dependencies
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Task 3.4: Create Subscription Table
**New Migration:** `supabase/migrations/[timestamp]_add_subscriptions.sql`

```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due'
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### Task 3.5: Create Subscription Service
**New File:** `src/services/subscriptionService.ts`

```typescript
export const createCheckoutSession = async (userId: string) => {
  // Create Stripe checkout session
  // Return checkout URL
};

export const getUserSubscription = async (userId: string) => {
  // Check subscription status
};

export const isFeatureAvailable = async (
  userId: string, 
  feature: 'recipe_adapt'
) => {
  // Check if user has subscription OR is under free limit
};
```

### Task 3.6: Add Paywall Component
**New File:** `src/components/subscription/PaywallModal.tsx`

```tsx
export const PaywallModal = ({ 
  isOpen, 
  onClose, 
  feature 
}: PaywallModalProps) => {
  // Show upgrade prompt
  // Current usage: X/5 free adaptations
  // Button to upgrade
};
```

### Task 3.7: Integrate Paywall into Adaptation Flow
**Update:** `src/pages/AdaptRecipe.tsx`

```tsx
// Before adapting:
const canAdapt = await isFeatureAvailable(userId, 'recipe_adapt');
if (!canAdapt) {
  setShowPaywall(true);
  return;
}
```

## Phase 4: Add Billing Page (Days 9-10)

### Task 4.1: Create Billing Page
**New File:** `src/pages/Billing.tsx`

Features:
- Current plan display
- Usage statistics
- Upgrade/downgrade buttons
- Cancel subscription
- Billing history

### Task 4.2: Add Stripe Webhook Handler
**New Edge Function:** `supabase/functions/stripe-webhook/index.ts`

Handle events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Phase 5: Update Landing Page (Day 11)

### Task 5.1: Add Pricing Section
**Update:** `src/pages/LandingPage.tsx`

```tsx
<section className="container py-16">
  <h2>Simple, Transparent Pricing</h2>
  <div className="grid md:grid-cols-2 gap-8">
    <PricingCard 
      title="Free"
      price="$0"
      features={[
        "5 recipe adaptations/month",
        "Unlimited recipe imports",
        "Basic shopping lists"
      ]}
    />
    <PricingCard 
      title="Pro"
      price="$9.99/month"
      features={[
        "Unlimited adaptations",
        "Grocery sale matching",
        "Priority support",
        "Export to PDF"
      ]}
      highlighted={true}
    />
  </div>
</section>
```

## Phase 6: Launch Checklist (Days 12-14)

### Task 6.1: Testing
- [ ] Test free user flow (5 adaptations then paywall)
- [ ] Test Stripe checkout
- [ ] Test subscription management
- [ ] Test webhook handling

### Task 6.2: Production Setup
- [ ] Add production Stripe keys
- [ ] Enable Stripe webhooks
- [ ] Set up error tracking (Sentry)
- [ ] Add analytics (Plausible/Mixpanel)

### Task 6.3: Deployment
- [ ] Deploy to Vercel
- [ ] Set environment variables
- [ ] Test production payment flow

## Implementation Notes for AI Assistant

1. **Start with Phase 1** - This provides immediate value without payment complexity
2. **Use existing patterns** - Copy patterns from existing pages/components
3. **Test incrementally** - Test each phase before moving to next
4. **Keep it simple** - Don't over-engineer; we can refine later
5. **Preserve existing work** - Don't modify existing features, only add new ones

## Success Metrics
- [ ] User can adapt any recipe for their dietary needs
- [ ] Free users hit paywall after 5 adaptations
- [ ] Users can subscribe via Stripe
- [ ] Subscriptions auto-renew
- [ ] Users can manage billing

## Questions for Rob
1. Stripe account created? (Needed for API keys)
2. Pricing confirmation: $9.99/month?
3. Free tier: 5 adaptations/month good?
4. Want annual billing option? (e.g., $79/year)

## Next Steps
1. Copy this file to your project root
2. Open in Claude Code or Gemini CLI
3. Say: "Implement Phase 1 of the KitchenSync monetization plan"
4. Test each phase before proceeding
