import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Dumbbell, ShoppingCart, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export const MainNav = () => {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Recipes", icon: Home },
    { path: "/workouts", label: "Workouts", icon: Dumbbell },
    { path: "/collections", label: "Collections", icon: BookOpen },
    { path: "/grocery-list", label: "Grocery List", icon: ShoppingCart },
  ];

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "flex items-center gap-2",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
