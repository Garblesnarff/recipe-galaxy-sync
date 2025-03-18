
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, ShoppingCart, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";

export const BottomNavigation = () => {
  const location = useLocation();
  const [path, setPath] = useState(location.pathname);

  useEffect(() => {
    setPath(location.pathname);
  }, [location]);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 border-t bg-white z-10 md:hidden">
      <div className="container h-full">
        <div className="flex h-full items-center justify-around">
          <Link
            to="/"
            className={cn(
              "flex flex-col items-center justify-center w-20 h-full text-gray-500",
              path === "/" && "text-recipe-green"
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link
            to="/recipe-book"
            className={cn(
              "flex flex-col items-center justify-center w-20 h-full text-gray-500",
              path === "/recipe-book" && "text-recipe-green"
            )}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-xs mt-1">Books</span>
          </Link>
          <Link
            to="/collections"
            className={cn(
              "flex flex-col items-center justify-center w-20 h-full text-gray-500",
              path.startsWith("/collections") && "text-recipe-green"
            )}
          >
            <BookMarked className="h-5 w-5" />
            <span className="text-xs mt-1">Collections</span>
          </Link>
          <Link
            to="/grocery-list"
            className={cn(
              "flex flex-col items-center justify-center w-20 h-full text-gray-500",
              path === "/grocery-list" && "text-recipe-green"
            )}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="text-xs mt-1">Grocery</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
