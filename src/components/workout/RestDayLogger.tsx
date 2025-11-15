import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Moon, Activity, Bed, Zap, Calendar } from "lucide-react";
import { RestDayData } from "@/services/workout/recovery";

interface RestDayLoggerProps {
  onSubmit: (data: RestDayData) => Promise<void>;
  initialData?: RestDayData;
  isLoading?: boolean;
}

export const RestDayLogger = ({
  onSubmit,
  initialData,
  isLoading = false,
}: RestDayLoggerProps) => {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(initialData?.date || today);
  const [recoveryType, setRecoveryType] = useState<
    "active" | "passive" | "complete" | ""
  >(initialData?.recovery_type || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [sleepHours, setSleepHours] = useState(
    initialData?.sleep_hours?.toString() || "7"
  );
  const [sorenessLevel, setSorenessLevel] = useState([
    initialData?.soreness_level || 5,
  ]);
  const [energyLevel, setEnergyLevel] = useState([
    initialData?.energy_level || 5,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: RestDayData = {
      date,
      recovery_type: recoveryType || undefined,
      notes: notes || undefined,
      sleep_hours: parseFloat(sleepHours),
      soreness_level: sorenessLevel[0],
      energy_level: energyLevel[0],
    };

    await onSubmit(data);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Moon className="h-6 w-6 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-800">Log Rest Day</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date
          </Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            required
          />
        </div>

        {/* Recovery Type */}
        <div className="space-y-2">
          <Label htmlFor="recovery-type" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recovery Type
          </Label>
          <Select value={recoveryType} onValueChange={(value: any) => setRecoveryType(value)}>
            <SelectTrigger id="recovery-type">
              <SelectValue placeholder="Select recovery type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="complete">Complete Rest - No activity</SelectItem>
              <SelectItem value="passive">Passive Recovery - Light stretching, walking</SelectItem>
              <SelectItem value="active">Active Recovery - Yoga, swimming, cycling</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sleep Hours */}
        <div className="space-y-2">
          <Label htmlFor="sleep-hours" className="flex items-center gap-2">
            <Bed className="h-4 w-4" />
            Sleep Hours
          </Label>
          <Input
            id="sleep-hours"
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            required
          />
          <p className="text-xs text-gray-500">
            How many hours did you sleep last night?
          </p>
        </div>

        {/* Soreness Level */}
        <div className="space-y-3">
          <Label className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Soreness Level
            </span>
            <span className="text-sm font-semibold text-gray-700">
              {sorenessLevel[0]}/10
            </span>
          </Label>
          <Slider
            value={sorenessLevel}
            onValueChange={setSorenessLevel}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>No soreness</span>
            <span>Very sore</span>
          </div>
        </div>

        {/* Energy Level */}
        <div className="space-y-3">
          <Label className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Energy Level
            </span>
            <span className="text-sm font-semibold text-gray-700">
              {energyLevel[0]}/10
            </span>
          </Label>
          <Slider
            value={energyLevel}
            onValueChange={setEnergyLevel}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Exhausted</span>
            <span>Energized</span>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="How are you feeling? Any specific areas of soreness?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Logging..." : "Log Rest Day"}
        </Button>
      </form>
    </Card>
  );
};
