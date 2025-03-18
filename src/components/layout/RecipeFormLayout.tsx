
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";

interface RecipeFormLayoutProps {
  title: string;
  backUrl: string;
  children: ReactNode;
}

export const RecipeFormLayout = ({ title, backUrl, children }: RecipeFormLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(backUrl)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
      </header>

      <div className="container py-6">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6 animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
};
