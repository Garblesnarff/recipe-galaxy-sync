
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DietaryRestriction } from "@/types/dietary";
import { getUserDietaryRestrictions, updateUserDietaryRestrictions } from "@/services/dietaryService";
import { toast } from "sonner";

export const DietaryPreferences = () => {
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadUserPreferences = async () => {
      setIsLoading(true);
      try {
        const userRestrictions = await getUserDietaryRestrictions();
        setRestrictions(userRestrictions);
      } catch (error) {
        console.error("Error loading dietary preferences:", error);
        toast.error("Failed to load your dietary preferences");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserPreferences();
  }, []);

  const handleToggleRestriction = (restriction: DietaryRestriction) => {
    setRestrictions(prev => 
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      const success = await updateUserDietaryRestrictions(restrictions);
      if (success) {
        toast.success("Dietary preferences saved successfully");
      }
    } catch (error) {
      console.error("Error saving dietary preferences:", error);
      toast.error("Failed to save dietary preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const restrictionOptions: { value: DietaryRestriction; label: string; description: string }[] = [
    { 
      value: 'gluten-free', 
      label: 'Gluten-Free', 
      description: 'Excludes wheat, barley, rye, and their derivatives' 
    },
    { 
      value: 'dairy-free', 
      label: 'Dairy-Free', 
      description: 'Excludes milk and milk products' 
    },
    { 
      value: 'egg-free', 
      label: 'Egg-Free', 
      description: 'Excludes eggs and egg-containing foods' 
    },
    { 
      value: 'nut-free', 
      label: 'Nut-Free', 
      description: 'Excludes tree nuts and peanuts' 
    },
    { 
      value: 'soy-free', 
      label: 'Soy-Free', 
      description: 'Excludes soybeans and soy-derived products' 
    },
    { 
      value: 'vegetarian', 
      label: 'Vegetarian', 
      description: 'Excludes animal flesh but may include eggs and dairy' 
    },
    { 
      value: 'vegan', 
      label: 'Vegan', 
      description: 'Excludes all animal products and by-products' 
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dietary Preferences</CardTitle>
        <CardDescription>
          Select your dietary restrictions to get personalized recipe recommendations
          and ingredient substitution suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center">Loading your preferences...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {restrictionOptions.map(({ value, label, description }) => (
                <div key={value} className="flex items-start space-x-2">
                  <Checkbox
                    id={`restriction-${value}`}
                    checked={restrictions.includes(value)}
                    onCheckedChange={() => handleToggleRestriction(value)}
                  />
                  <div>
                    <Label
                      htmlFor={`restriction-${value}`}
                      className="font-medium cursor-pointer"
                    >
                      {label}
                    </Label>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={handleSavePreferences} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
