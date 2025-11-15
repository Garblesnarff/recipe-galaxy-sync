import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Plus, Edit2, Trash2 } from "lucide-react";

interface SetLog {
  setNumber: number;
  repsAchieved: number;
  weightUsed: number;
  completed: boolean;
}

interface SetLoggerProps {
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  onComplete?: (logs: SetLog[]) => void;
}

export const SetLogger = ({
  exerciseName,
  targetSets,
  targetReps,
  targetWeight,
  onComplete,
}: SetLoggerProps) => {
  const [logs, setLogs] = useState<SetLog[]>([]);
  const [currentSet, setCurrentSet] = useState(1);
  const [reps, setReps] = useState(targetReps);
  const [weight, setWeight] = useState(targetWeight);

  const logSet = () => {
    const newLog: SetLog = {
      setNumber: currentSet,
      repsAchieved: reps,
      weightUsed: weight,
      completed: true,
    };

    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);

    if (currentSet >= targetSets) {
      // All sets completed
      if (onComplete) {
        onComplete(updatedLogs);
      }
    } else {
      setCurrentSet(currentSet + 1);
    }
  };

  const editSet = (setNumber: number) => {
    const log = logs.find(l => l.setNumber === setNumber);
    if (log) {
      setReps(log.repsAchieved);
      setWeight(log.weightUsed);
      setCurrentSet(setNumber);
      setLogs(logs.filter(l => l.setNumber !== setNumber));
    }
  };

  const deleteSet = (setNumber: number) => {
    const filtered = logs.filter(l => l.setNumber !== setNumber);
    setLogs(filtered);
    if (currentSet > filtered.length + 1) {
      setCurrentSet(filtered.length + 1);
    }
  };

  const resetLogger = () => {
    setLogs([]);
    setCurrentSet(1);
    setReps(targetReps);
    setWeight(targetWeight);
  };

  const allSetsCompleted = logs.length >= targetSets;
  const completedSets = logs.length;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="font-semibold text-lg mb-1">{exerciseName}</h3>
          <p className="text-sm text-gray-600">
            Target: {targetSets} sets × {targetReps} reps @ {targetWeight} kg
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2">
          {Array.from({ length: targetSets }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full ${
                logs.some(l => l.setNumber === i + 1)
                  ? 'bg-green-500'
                  : i + 1 === currentSet
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Completed Sets List */}
        {logs.length > 0 && (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.setNumber}
                className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold">Set {log.setNumber}</p>
                    <p className="text-xs text-gray-600">
                      {log.repsAchieved} reps × {log.weightUsed} kg
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editSet(log.setNumber)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSet(log.setNumber)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current Set Input */}
        {!allSetsCompleted && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Circle className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">
                Set {currentSet} of {targetSets}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="reps" className="text-sm">Reps</Label>
                <Input
                  id="reps"
                  type="number"
                  min="0"
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="weight" className="text-sm">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>

            <Button
              onClick={logSet}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Set {currentSet}
            </Button>
          </div>
        )}

        {/* Completion Status */}
        {allSetsCompleted && (
          <div className="space-y-3">
            <div className="p-4 bg-green-100 border border-green-300 rounded-md text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-bold">All Sets Completed!</p>
              <p className="text-sm text-green-700 mt-1">
                {completedSets}/{targetSets} sets logged
              </p>
            </div>

            <Button
              onClick={resetLogger}
              variant="outline"
              className="w-full"
            >
              Reset Logger
            </Button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-gray-600">Sets</p>
            <p className="font-bold text-gray-800">{completedSets}/{targetSets}</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-gray-600">Total Reps</p>
            <p className="font-bold text-gray-800">
              {logs.reduce((sum, log) => sum + log.repsAchieved, 0)}
            </p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-gray-600">Avg Weight</p>
            <p className="font-bold text-gray-800">
              {logs.length > 0
                ? (logs.reduce((sum, log) => sum + log.weightUsed, 0) / logs.length).toFixed(1)
                : 0} kg
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
