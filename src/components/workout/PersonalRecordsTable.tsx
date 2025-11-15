import { useMemo } from "react";
import { Trophy, TrendingUp, Calendar, Weight, Hash, Timer } from "lucide-react";
import { format } from "date-fns";
import type { PersonalRecord } from "@/types/workout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PersonalRecordsTableProps {
  records: PersonalRecord[];
  isLoading?: boolean;
}

interface GroupedPRs {
  exerciseName: string;
  maxWeight?: PersonalRecord;
  maxReps?: PersonalRecord;
  maxDuration?: PersonalRecord;
  totalPRs: number;
  latestDate: string;
}

export const PersonalRecordsTable = ({ records, isLoading }: PersonalRecordsTableProps) => {
  // Group PRs by exercise
  const groupedPRs = useMemo(() => {
    const grouped = records.reduce((acc, record) => {
      const exerciseName = record.exercise_name;

      if (!acc[exerciseName]) {
        acc[exerciseName] = {
          exerciseName,
          totalPRs: 0,
          latestDate: record.achieved_at,
        };
      }

      // Track the record by type
      if (record.record_type === 'max_weight') {
        acc[exerciseName].maxWeight = record;
      } else if (record.record_type === 'max_reps') {
        acc[exerciseName].maxReps = record;
      } else if (record.record_type === 'max_duration') {
        acc[exerciseName].maxDuration = record;
      }

      acc[exerciseName].totalPRs += 1;

      // Keep the latest date
      if (new Date(record.achieved_at) > new Date(acc[exerciseName].latestDate)) {
        acc[exerciseName].latestDate = record.achieved_at;
      }

      return acc;
    }, {} as Record<string, GroupedPRs>);

    // Convert to array and sort by latest date
    return Object.values(grouped).sort(
      (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
    );
  }, [records]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Personal Records
          </CardTitle>
          <CardDescription>Loading your personal records...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (groupedPRs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Personal Records
          </CardTitle>
          <CardDescription>Track your best performances for each exercise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Personal Records Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Start logging your workouts to track your personal records. Each time you beat your previous best,
              it will be automatically recorded here!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Personal Records
        </CardTitle>
        <CardDescription>
          Your best performances across {groupedPRs.length} exercise{groupedPRs.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Exercise</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Weight className="h-4 w-4" />
                    <span>Max Weight</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Hash className="h-4 w-4" />
                    <span>Max Reps</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Timer className="h-4 w-4" />
                    <span>Best Time</span>
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Latest PR</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedPRs.map((group) => (
                <TableRow key={group.exerciseName}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>{group.exerciseName}</span>
                      {group.totalPRs > 1 && (
                        <Badge variant="secondary" className="ml-1">
                          {group.totalPRs} PRs
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {group.maxWeight ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                          {group.maxWeight.value} kg
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(group.maxWeight.achieved_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {group.maxReps ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                          {group.maxReps.value} reps
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(group.maxReps.achieved_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {group.maxDuration ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                          {group.maxDuration.value}s
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(group.maxDuration.achieved_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {format(new Date(group.latestDate), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
