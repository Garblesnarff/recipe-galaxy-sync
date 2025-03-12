
import React from 'react';
import { BookHeart, Settings, ShoppingCart, Utensils } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    
    // Clear any existing ripples
    const ripples = button.getElementsByClassName('ripple');
    Array.from(ripples).forEach(r => r.remove());
    
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    
    circle.style.width = `${diameter}px`;
    circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - diameter/2}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - diameter/2}px`;
    circle.classList.add('ripple');
    
    button.appendChild(circle);
    
    // Remove the ripple after animation completes
    setTimeout(() => circle.remove(), 600);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-2 z-50 shadow-lg">
      <div className="flex justify-around max-w-lg mx-auto">
        <button 
          className={`bottom-nav-btn ${isActive('/') ? 'active' : ''}`}
          onClick={(e) => {
            createRipple(e);
            navigate('/');
          }}
        >
          <Utensils className="h-6 w-6" />
          <span>Recipes</span>
        </button>
        
        <button 
          className={`bottom-nav-btn ${isActive('/grocery-list') ? 'active' : ''}`}
          onClick={(e) => {
            createRipple(e);
            navigate('/grocery-list');
          }}
        >
          <ShoppingCart className="h-6 w-6" />
          <span>Groceries</span>
        </button>
        
        <button 
          className={`bottom-nav-btn ${isActive('/favorites') ? 'active' : ''}`}
          onClick={(e) => {
            createRipple(e);
            navigate('/favorites');
          }}
        >
          <BookHeart className="h-6 w-6" />
          <span>Favorites</span>
        </button>
        
        <button 
          className={`bottom-nav-btn ${isActive('/settings') ? 'active' : ''}`}
          onClick={(e) => {
            createRipple(e);
            navigate('/settings');
          }}
        >
          <Settings className="h-6 w-6" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
