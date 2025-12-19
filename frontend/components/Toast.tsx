import React, { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import { cn } from './ui';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message && !isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-foreground text-background px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ease-in-out max-w-sm w-full",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      )}
    >
      <Info className="h-5 w-5 shrink-0 text-primary-foreground" />
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={() => setIsVisible(false)} className="text-background/80 hover:text-background">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};