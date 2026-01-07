/**
 * Create Meal Plan Dialog
 * Dialog component for creating new meal plans
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus } from "lucide-react";

interface CreateMealPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (planData: { name: string; week_start_date: string; notes?: string }) => void;
}

export const CreateMealPlanDialog = ({ isOpen, onClose, onCreate }: CreateMealPlanDialogProps) => {
  const [name, setName] = useState('');
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + (1 - nextMonday.getDay() + 7) % 7);
    return nextMonday.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    onCreate({
      name: name.trim(),
      week_start_date: weekStartDate,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setName('');
    setNotes('');
  };

  const handleClose = () => {
    setName('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Meal Plan
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="plan-name">Plan Name</Label>
            <Input
              id="plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Family Dinners This Week"
              required
            />
          </div>

          <div>
            <Label htmlFor="week-start">Week Starting</Label>
            <Input
              id="week-start"
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="plan-notes">Notes (Optional)</Label>
            <Textarea
              id="plan-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special notes or themes for this meal plan..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!name.trim()}>
              Create Plan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
