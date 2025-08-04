import { useState, useEffect } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { getUserSubscription, createCheckoutSession } from '@/services/subscriptionService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Billing = () => {
  const { session } = useAuthSession();
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (session?.user.id) {
        const sub = await getUserSubscription(session.user.id);
        setSubscription(sub);
        setIsLoading(false);
      }
    };
    fetchSubscription();
  }, [session]);

  const handleUpgrade = async () => {
    if (!session?.user.id) return;
    const checkoutUrl = await createCheckoutSession(session.user.id);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-3xl font-bold mb-4">Billing</h1>
      <Card>
        <CardHeader>
          <CardTitle>Your Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div>
              <p>Status: {subscription.status}</p>
              <p>Current period end: {new Date(subscription.current_period_end).toLocaleDateString()}</p>
            </div>
          ) : (
            <div>
              <p>You are on the free plan.</p>
              <Button onClick={handleUpgrade}>Upgrade to Pro</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
