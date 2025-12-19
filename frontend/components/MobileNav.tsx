
import React from 'react';
import { LogOut } from 'lucide-react';
import { cn } from './ui';
import { useLocation, useNavigate } from 'react-router-dom';

export interface MobileNavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface MobileNavProps {
  items: MobileNavItem[];
  onLogout: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ items, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-40 flex items-center justify-around pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors h-full w-full",
              isActive 
                ? 'text-primary' 
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            <item.icon 
              className={cn("w-6 h-6 transition-all", isActive ? "scale-110" : "scale-100")} 
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
      
      {/* Sign Out Button Always Present */}
      <button
        onClick={onLogout}
        className="flex flex-col items-center justify-center gap-1 transition-colors h-full w-full text-destructive/80 hover:text-destructive hover:bg-muted/50"
      >
        <LogOut className="w-6 h-6 scale-100" strokeWidth={2} />
        <span className="text-[10px] font-medium">Log out</span>
      </button>
    </div>
  );
};
