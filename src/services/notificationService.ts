/**
 * Service for managing browser notifications for workout reminders
 */

export type NotificationPermission = "granted" | "denied" | "default";

/**
 * Request permission to show notifications
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

/**
 * Check if notifications are supported and permitted
 */
export const canShowNotifications = (): boolean => {
  return "Notification" in window && Notification.permission === "granted";
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
};

interface WorkoutNotificationData {
  workoutTitle: string;
  workoutId: string;
  scheduledTime: string;
}

/**
 * Show a workout reminder notification
 */
export const showWorkoutNotification = (data: WorkoutNotificationData): void => {
  if (!canShowNotifications()) {
    console.warn("Notifications are not enabled");
    return;
  }

  const notification = new Notification("Workout Reminder", {
    body: `Time for your workout: ${data.workoutTitle}`,
    icon: "/workout-icon.png", // You can add an icon to your public folder
    badge: "/badge-icon.png",
    tag: `workout-${data.workoutId}`,
    requireInteraction: false,
    silent: false,
  });

  notification.onclick = () => {
    window.focus();
    window.location.href = `/workouts/${data.workoutId}`;
    notification.close();
  };

  // Auto-close after 10 seconds
  setTimeout(() => {
    notification.close();
  }, 10000);
};

/**
 * Schedule a notification to be shown at a specific time
 * Note: Browser notifications don't support scheduling natively,
 * so this uses setTimeout for short-term scheduling
 */
export const scheduleWorkoutNotification = (
  data: WorkoutNotificationData,
  scheduledTime: Date,
  minutesBefore: number = 60
): number | null => {
  if (!canShowNotifications()) {
    console.warn("Notifications are not enabled");
    return null;
  }

  const notificationTime = new Date(scheduledTime);
  notificationTime.setMinutes(notificationTime.getMinutes() - minutesBefore);

  const now = new Date();
  const timeUntilNotification = notificationTime.getTime() - now.getTime();

  // Only schedule if it's in the future and within 24 hours
  if (timeUntilNotification > 0 && timeUntilNotification <= 24 * 60 * 60 * 1000) {
    const timeoutId = window.setTimeout(() => {
      showWorkoutNotification(data);
    }, timeUntilNotification);

    return timeoutId;
  }

  return null;
};

/**
 * Cancel a scheduled notification
 */
export const cancelScheduledNotification = (timeoutId: number): void => {
  clearTimeout(timeoutId);
};

/**
 * Schedule notifications for upcoming workouts
 * This should be called when the app loads or when schedules are updated
 */
export const scheduleUpcomingNotifications = (
  upcomingWorkouts: Array<{
    workout: { id: string; title: string };
    scheduled_for: string;
    time_of_day: string | null;
    reminder_enabled: boolean;
    reminder_minutes_before: number;
  }>
): number[] => {
  const scheduledIds: number[] = [];

  upcomingWorkouts.forEach((schedule) => {
    if (!schedule.reminder_enabled) return;

    // Combine date and time
    const scheduledDateTime = schedule.time_of_day
      ? new Date(`${schedule.scheduled_for}T${schedule.time_of_day}`)
      : new Date(schedule.scheduled_for);

    const timeoutId = scheduleWorkoutNotification(
      {
        workoutTitle: schedule.workout.title,
        workoutId: schedule.workout.id,
        scheduledTime: scheduledDateTime.toISOString(),
      },
      scheduledDateTime,
      schedule.reminder_minutes_before
    );

    if (timeoutId !== null) {
      scheduledIds.push(timeoutId);
    }
  });

  return scheduledIds;
};

/**
 * Test notification - useful for settings page
 */
export const showTestNotification = (): void => {
  if (!canShowNotifications()) {
    console.warn("Notifications are not enabled");
    return;
  }

  const notification = new Notification("Test Notification", {
    body: "Workout reminders are working correctly!",
    icon: "/workout-icon.png",
  });

  setTimeout(() => {
    notification.close();
  }, 5000);
};
