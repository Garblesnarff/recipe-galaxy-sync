
import React, { useState } from 'react';
import { BookHeart, Settings, ShoppingCart, Utensils } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeRipple, setActiveRipple] = useState<number | null>(null);
  
  const isActive = (path: string) => location.pathname === path;

  const handleButtonClick = (index: number, path: string) => {
    setActiveRipple(index);
    setTimeout(() => setActiveRipple(null), 600);
    navigate(path);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-2 z-50 shadow-lg">
      <div className="flex justify-around max-w-lg mx-auto">
        <button 
          className={`nav-button ${isActive('/') ? 'nav-button-active' : ''}`}
          onClick={() => handleButtonClick(0, '/')}
          style={{ 
            animation: activeRipple === 0 ? 'button-press 0.4s ease' : 'none'
          }}
        >
          <Utensils className="h-6 w-6" />
          <span>Recipes</span>
        </button>
        
        <button 
          className={`nav-button ${isActive('/grocery-list') ? 'nav-button-active' : ''}`}
          onClick={() => handleButtonClick(1, '/grocery-list')}
          style={{ 
            animation: activeRipple === 1 ? 'button-press 0.4s ease' : 'none'
          }}
        >
          <ShoppingCart className="h-6 w-6" />
          <span>Groceries</span>
        </button>
        
        <button 
          className={`nav-button ${isActive('/favorites') ? 'nav-button-active' : ''}`}
          onClick={() => handleButtonClick(2, '/favorites')}
          style={{ 
            animation: activeRipple === 2 ? 'button-press 0.4s ease' : 'none'
          }}
        >
          <BookHeart className="h-6 w-6" />
          <span>Favorites</span>
        </button>
        
        <button 
          className={`nav-button ${isActive('/settings') ? 'nav-button-active' : ''}`}
          onClick={() => handleButtonClick(3, '/settings')}
          style={{ 
            animation: activeRipple === 3 ? 'button-press 0.4s ease' : 'none'
          }}
        >
          <Settings className="h-6 w-6" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
