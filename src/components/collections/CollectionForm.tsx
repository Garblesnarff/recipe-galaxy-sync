
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collection } from "@/types/collection";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { collectionSchema } from "@/lib/validation";
import { z } from "zod";
import { toast } from "sonner";

interface CollectionFormProps {
  collection?: Collection;
  onSubmit: (data: Partial<Collection>) => void;
  isSubmitting: boolean;
}

type CollectionFormData = z.infer<typeof collectionSchema>;

export const CollectionForm = ({
  collection,
  onSubmit,
  isSubmitting
}: CollectionFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      description: "",
      cover_image_url: ""
    }
  });

  useEffect(() => {
    if (collection) {
      reset({
        name: collection.name,
        description: collection.description || "",
        cover_image_url: collection.cover_image_url || ""
      });
    }
  }, [collection, reset]);

  const onSubmitForm = (data: CollectionFormData) => {
    onSubmit(data);
  };

  const coverImageUrl = watch("cover_image_url");

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div>
        <Label htmlFor="name">Collection Name</Label>
        <Input
          id="name"
          {...register("name")}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          {...register("description")}
          className={`min-h-[100px] ${errors.description ? "border-red-500" : ""}`}
        />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="cover_image_url">Cover Image URL (Optional)</Label>
        <Input
          id="cover_image_url"
          {...register("cover_image_url")}
          placeholder="https://example.com/image.jpg"
          className={errors.cover_image_url ? "border-red-500" : ""}
        />
        {errors.cover_image_url && (
          <p className="text-sm text-red-500 mt-1">{errors.cover_image_url.message}</p>
        )}
        {coverImageUrl && !errors.cover_image_url && (
          <div className="mt-2">
            <img
              src={coverImageUrl}
              alt="Preview"
              className="h-20 object-cover rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                toast.error("Failed to load image preview");
              }}
            />
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : collection ? "Update Collection" : "Create Collection"}
      </Button>
    </form>
  );
};
