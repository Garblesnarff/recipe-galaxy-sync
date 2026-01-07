/**
 * Meal Planning Page
 * Main page for weekly meal planning interface
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Plus, ShoppingCart, Clock, Users, ChefHat } from "lucide-react";
import { toast } from "sonner";
import { WeeklyMealPlan } from "@/components/meal-planning/WeeklyMealPlan";
import { MealPlanCalendar } from "@/components/meal-planning/MealPlanCalendar";
import { MealPlanGroceryGenerator } from "@/components/meal-planning/MealPlanGroceryGenerator";
import { MealPlanSummary } from "@/components/meal-planning/MealPlanSummary";
import { CreateMealPlanDialog } from "@/components/meal-planning/CreateMealPlanDialog";
import { useMealPlanning } from "@/hooks/useMealPlanning";
import { MealPlan } from "@/types/mealPlanning";

const MealPlanning = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("weekly");
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const {
    mealPlans,
    currentPlan,
    isLoading,
    createMealPlan,
    selectMealPlan,
    refreshMealPlans
  } = useMealPlanning();

  // Auto-select the first active plan or create one if none exists
  useEffect(() => {
    if (mealPlans.length > 0 && !currentPlan) {
      const activePlan = mealPlans.find(plan => plan.status === 'active') || mealPlans[0];
      selectMealPlan(activePlan.id);
      setSelectedMealPlan(activePlan);
    }
  }, [mealPlans, currentPlan, selectMealPlan]);

  const handleCreatePlan = async (planData: { name: string; week_start_date: string; notes?: string }) => {
    try {
      const newPlan = await createMealPlan(planData);
      setIsCreateDialogOpen(false);
      toast.success("Meal plan created successfully!");
      navigate(`/meal-planning?plan=${newPlan.id}`);
    } catch (error) {
      console.error('Error creating meal plan:', error);
      toast.error("Failed to create meal plan");
    }
  };

  const handlePlanSelect = (plan: MealPlan) => {
    setSelectedMealPlan(plan);
    selectMealPlan(plan.id);
    navigate(`/meal-planning?plan=${plan.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 animate-pulse rounded" />
          <div className="grid gap-6 md:grid-cols-7">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meal Planning</h1>
          <p className="text-gray-600 mt-1">Plan your weekly meals and generate grocery lists</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Meal Plan
        </Button>
      </div>

      {/* Meal Plan Selector */}
      {mealPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Meal Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mealPlans.map((plan) => (
                <Badge
                  key={plan.id}
                  variant={selectedMealPlan?.id === plan.id ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1"
                  onClick={() => handlePlanSelect(plan)}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {plan.name}
                  <span className="ml-2 text-xs opacity-75">
                    {new Date(plan.week_start_date).toLocaleDateString()}
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Meal Plans State */}
      {mealPlans.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ChefHat className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No meal plans yet</h3>
            <p className="text-gray-600 mb-4">Create your first meal plan to get started with weekly meal planning</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Meal Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {selectedMealPlan && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <MealPlanSummary mealPlanId={selectedMealPlan.id} />
          </div>

          {/* Main Interface Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekly" className="gap-2">
                <Calendar className="h-4 w-4" />
                Weekly View
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Clock className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="grocery" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Grocery List
              </TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="space-y-6">
              <WeeklyMealPlan
                mealPlan={selectedMealPlan}
                onRefresh={refreshMealPlans}
              />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <MealPlanCalendar
                mealPlan={selectedMealPlan}
                onRefresh={refreshMealPlans}
              />
            </TabsContent>

            <TabsContent value="grocery" className="space-y-6">
              <MealPlanGroceryGenerator
                mealPlan={selectedMealPlan}
                onRefresh={refreshMealPlans}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Create Meal Plan Dialog */}
      <CreateMealPlanDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreate={handleCreatePlan}
      />
    </div>
  );
};

export default MealPlanning;
