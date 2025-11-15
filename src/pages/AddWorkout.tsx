
import { useWorkoutForm } from "@/hooks/useWorkoutForm";
import { AddWorkoutForm } from "@/components/workout/AddWorkoutForm";
import { WorkoutFormLayout } from "@/components/layout/WorkoutFormLayout";
import { useAuthSession } from "@/hooks/useAuthSession";

export const AddWorkout = () => {
  const { userId } = useAuthSession();

  const {
    formData,
    setFormData,
    isSubmitting,
    imagePreview,
    handleImageChange,
    handleSubmit,
    addExercise,
    removeExercise,
    updateExercise,
  } = useWorkoutForm(userId);

  return (
    <WorkoutFormLayout title="Add New Workout" backUrl="/workouts">
      <AddWorkoutForm
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        imagePreview={imagePreview}
        handleImageChange={handleImageChange}
        handleSubmit={handleSubmit}
        onAddExercise={addExercise}
        onRemoveExercise={removeExercise}
        onUpdateExercise={updateExercise}
      />
    </WorkoutFormLayout>
  );
};

export default AddWorkout;
