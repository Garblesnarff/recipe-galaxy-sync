/**
 * Meal Plan Summary
 * Component displaying summary statistics for a meal plan
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Utensils, Clock } from "lucide-react";
import { getMealPlanSummary } from "@/services/mealPlanningService";

interface MealPlanSummaryProps {
  mealPlanId: string;
}

export const MealPlanSummary = ({ mealPlanId }: MealPlanSummaryProps) => {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["mealPlanSummary", mealPlanId],
    queryFn: async () => {
      // For now, simulate user ID - in real app get from auth context
      const userId = 'current-user-id';
      return await getMealPlanSummary(mealPlanId, userId);
    },
    enabled: !!mealPlanId,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const summaryCards = [
    {
      title: "Total Recipes",
      value: summary.total_recipes,
      icon: Utensils,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Unique Recipes",
      value: summary.unique_recipes,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Servings",
      value: summary.total_servings,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Days Covered",
      value: Math.min(7, Math.ceil(summary.total_recipes / 3)), // Assuming 3 meals per day
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <>
      {summaryCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
};
