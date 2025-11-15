
import { useParams } from "react-router-dom";
import { useEditWorkoutForm } from "@/hooks/useEditWorkoutForm";
import { EditWorkoutForm } from "@/components/workout/EditWorkoutForm";
import { WorkoutFormLayout } from "@/components/layout/WorkoutFormLayout";

export const EditWorkout = () => {
  const { id } = useParams<{ id: string }>();

  const {
    formData,
    setFormData,
    isSubmitting,
    isLoading,
    imagePreview,
    handleImageChange,
    handleSubmit,
    addExercise,
    removeExercise,
    updateExercise,
  } = useEditWorkoutForm(id || '');

  return (
    <WorkoutFormLayout title="Edit Workout" backUrl={`/workouts/${id}`}>
      <EditWorkoutForm
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        isLoading={isLoading}
        imagePreview={imagePreview}
        handleImageChange={handleImageChange}
        handleSubmit={handleSubmit}
        onAddExercise={addExercise}
        onRemoveExercise={removeExercise}
        onUpdateExercise={updateExercise}
        workoutId={id || ''}
      />
    </WorkoutFormLayout>
  );
};

export default EditWorkout;
