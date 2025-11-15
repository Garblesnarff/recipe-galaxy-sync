import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Repeat } from "lucide-react";
import { useCreateSchedule, useCurrentUser } from "@/hooks/useWorkoutSchedule";

interface ScheduleWorkoutDialogProps {
  workoutId: string;
  workoutTitle: string;
  open: boolean;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

const REMINDER_OPTIONS = [
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "120", label: "2 hours before" },
  { value: "1440", label: "1 day before" },
];

export const ScheduleWorkoutDialog = ({
  workoutId,
  workoutTitle,
  open,
  onClose,
}: ScheduleWorkoutDialogProps) => {
  const [scheduleType, setScheduleType] = useState<"recurring" | "one-time">(
    "recurring"
  );
  const [selectedDay, setSelectedDay] = useState<string>("1"); // Monday default
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>("09:00");
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
  const [reminderMinutes, setReminderMinutes] = useState<string>("60");

  const { data: user } = useCurrentUser();
  const createScheduleMutation = useCreateSchedule();

  const handleSchedule = async () => {
    if (!user) return;

    const scheduleData =
      scheduleType === "recurring"
        ? {
            workout_id: workoutId,
            day_of_week: parseInt(selectedDay),
            time_of_day: time,
            reminder_enabled: reminderEnabled,
            reminder_minutes_before: parseInt(reminderMinutes),
          }
        : {
            workout_id: workoutId,
            scheduled_date: selectedDate?.toISOString().split("T")[0],
            time_of_day: time,
            reminder_enabled: reminderEnabled,
            reminder_minutes_before: parseInt(reminderMinutes),
          };

    await createScheduleMutation.mutateAsync({
      userId: user.id,
      scheduleData,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Workout</DialogTitle>
          <DialogDescription>
            Schedule "{workoutTitle}" for a specific time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Schedule Type Selection */}
          <div className="space-y-3">
            <Label>Schedule Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={scheduleType === "recurring" ? "default" : "outline"}
                className="justify-start"
                onClick={() => setScheduleType("recurring")}
              >
                <Repeat className="mr-2 h-4 w-4" />
                Recurring
              </Button>
              <Button
                type="button"
                variant={scheduleType === "one-time" ? "default" : "outline"}
                className="justify-start"
                onClick={() => setScheduleType("one-time")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                One-time
              </Button>
            </div>
          </div>

          {/* Day/Date Selection */}
          {scheduleType === "recurring" ? (
            <div className="space-y-2">
              <Label htmlFor="day-select">Day of Week</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger id="day-select">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md border"
              />
            </div>
          )}

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time-input" className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Time
            </Label>
            <Input
              id="time-input"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          {/* Reminder Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="reminder-toggle">Enable Reminder</Label>
              <Switch
                id="reminder-toggle"
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>

            {reminderEnabled && (
              <div className="space-y-2">
                <Label htmlFor="reminder-time">Reminder Time</Label>
                <Select
                  value={reminderMinutes}
                  onValueChange={setReminderMinutes}
                >
                  <SelectTrigger id="reminder-time">
                    <SelectValue placeholder="Select reminder time" />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={
              createScheduleMutation.isPending ||
              (scheduleType === "one-time" && !selectedDate)
            }
          >
            {createScheduleMutation.isPending ? "Scheduling..." : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
