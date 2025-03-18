
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collection } from "@/types/collection";
import { Textarea } from "@/components/ui/textarea";

interface CollectionFormProps {
  collection?: Collection;
  onSubmit: (data: Partial<Collection>) => void;
  isSubmitting: boolean;
}

export const CollectionForm = ({
  collection,
  onSubmit,
  isSubmitting
}: CollectionFormProps) => {
  const [formData, setFormData] = useState<Partial<Collection>>({
    name: "",
    description: "",
    cover_image_url: ""
  });

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        description: collection.description || "",
        cover_image_url: collection.cover_image_url || ""
      });
    }
  }, [collection]);

  const handleChange = (field: keyof Collection, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Collection Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e => handleChange("name", e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => handleChange("description", e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <div>
        <Label htmlFor="cover_image_url">Cover Image URL (Optional)</Label>
        <Input
          id="cover_image_url"
          value={formData.cover_image_url}
          onChange={e => handleChange("cover_image_url", e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
        {formData.cover_image_url && (
          <div className="mt-2">
            <img
              src={formData.cover_image_url}
              alt="Preview"
              className="h-20 object-cover rounded"
              onError={(e) => (e.currentTarget.style.display = 'none')}
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
