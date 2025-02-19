
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon } from "lucide-react";

interface RecipeImportProps {
  recipeUrl: string;
  onUrlChange: (url: string) => void;
  onImport: () => void;
  isImporting: boolean;
}

export const RecipeImport = ({
  recipeUrl,
  onUrlChange,
  onImport,
  isImporting
}: RecipeImportProps) => {
  return (
    <div className="mb-6">
      <Label>Import Recipe from URL</Label>
      <div className="flex gap-2 mt-2">
        <Input
          type="url"
          placeholder="Enter recipe URL"
          value={recipeUrl}
          onChange={(e) => onUrlChange(e.target.value)}
        />
        <Button onClick={onImport} disabled={isImporting}>
          <LinkIcon className="mr-2 h-4 w-4" />
          {isImporting ? "Importing..." : "Import"}
        </Button>
      </div>
    </div>
  );
};
