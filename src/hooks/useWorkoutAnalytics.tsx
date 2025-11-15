import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getWeightProgressionChart,
  getVolumeProgression,
  getMuscleGroupBalance,
  getStrengthScore,
  getWorkoutFrequencyStats,
  getConsistencyScore,
  getDailyWorkoutFrequency,
} from "@/services/workout/analytics";

export type DateRange = "4weeks" | "12weeks" | "year" | "all";

export const useWorkoutAnalytics = (
  exerciseName?: string,
  initialRange: DateRange = "12weeks"
) => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>(initialRange);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Analytics data states
  const [weightProgression, setWeightProgression] = useState<any[]>([]);
  const [volumeProgression, setVolumeProgression] = useState<any[]>([]);
  const [muscleGroupBalance, setMuscleGroupBalance] = useState<any[]>([]);
  const [strengthScore, setStrengthScore] = useState<any>(null);
  const [frequencyStats, setFrequencyStats] = useState<any>(null);
  const [consistencyScore, setConsistencyScore] = useState<any>(null);
  const [dailyFrequency, setDailyFrequency] = useState<any[]>([]);

  // Convert date range to weeks/days
  const getWeeksFromRange = (range: DateRange): number => {
    switch (range) {
      case "4weeks":
        return 4;
      case "12weeks":
        return 12;
      case "year":
        return 52;
      case "all":
        return 520; // ~10 years
      default:
        return 12;
    }
  };

  const getDaysFromRange = (range: DateRange): number => {
    switch (range) {
      case "4weeks":
        return 28;
      case "12weeks":
        return 84;
      case "year":
        return 365;
      case "all":
        return 3650; // ~10 years
      default:
        return 365;
    }
  };

  // Fetch all analytics data
  const fetchAnalytics = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const weeks = getWeeksFromRange(dateRange);
      const days = getDaysFromRange(dateRange);

      const [
        weightData,
        volumeData,
        muscleData,
        strengthData,
        frequencyData,
        consistencyData,
        dailyData,
      ] = await Promise.all([
        exerciseName
          ? getWeightProgressionChart(user.id, exerciseName, weeks)
          : Promise.resolve([]),
        getVolumeProgression(user.id, weeks),
        getMuscleGroupBalance(user.id),
        getStrengthScore(user.id),
        getWorkoutFrequencyStats(user.id, weeks),
        getConsistencyScore(user.id),
        getDailyWorkoutFrequency(user.id, days),
      ]);

      setWeightProgression(weightData);
      setVolumeProgression(volumeData);
      setMuscleGroupBalance(muscleData);
      setStrengthScore(strengthData);
      setFrequencyStats(frequencyData);
      setConsistencyScore(consistencyData);
      setDailyFrequency(dailyData);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when user or date range changes
  useEffect(() => {
    fetchAnalytics();
  }, [user?.id, dateRange, exerciseName]);

  // Refresh function
  const refresh = () => {
    fetchAnalytics();
  };

  return {
    // Data
    weightProgression,
    volumeProgression,
    muscleGroupBalance,
    strengthScore,
    frequencyStats,
    consistencyScore,
    dailyFrequency,

    // State
    isLoading,
    error,
    dateRange,

    // Actions
    setDateRange,
    refresh,
  };
};
