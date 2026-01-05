

import React, { useMemo } from 'react';
import { LayoutDashboard, Users, GraduationCap, School, LogOut, User as UserIcon, Globe, ChevronLeft, ChevronRight, ClipboardList, FileText, CalendarDays, MapPin, Settings } from 'lucide-react';
import { User } from '../types';
import { TRANSLATIONS } from '../constants';
import { Button, cn } from './ui';
import { MobileNav, MobileNavItem } from './MobileNav';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationProps {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  user: User;
  lang: 'en' | 'zh';
  toggleLang: () => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  isSidebarCollapsed,
  toggleSidebar,
  user,
  lang, 
  toggleLang,
  onLogout
}) => {
  const t = TRANSLATIONS[lang];
  const location = useLocation();
  const navigate = useNavigate();
  
  // Generate Navigation Items based on Role with Paths
  const navItems: MobileNavItem[] = useMemo(() => {
    switch (user.role) {
      case 'HQ':
        return [
          { path: '/dashboard', label: t.dashboard, icon: LayoutDashboard },
          { path: '/teachers', label: t.teachers, icon: Users },
          { path: '/students', label: t.students, icon: GraduationCap },
          { path: '/classes', label: t.classes, icon: School },
          { path: '/locations', label: t.locations, icon: MapPin },
          { path: '/settings', label: t.settings, icon: Settings },
        ];
      case 'TEACHER':
        return [
          { path: '/teacher/classes', label: t.classes, icon: CalendarDays },
          { path: '/input', label: t.input, icon: ClipboardList },
          { path: '/reports', label: t.reports, icon: FileText },
        ];
      case 'PARENT':
        return [
          { path: '/reports', label: t.reports, icon: FileText },
        ];
      default:
        return [];
    }
  }, [user.role, t]);

  return (
    <>
      {/* Desktop Sidebar (For ALL Roles) */}
      <aside 
        className={cn(
          "hidden md:flex flex-col h-screen border-r bg-card fixed left-0 top-0 z-20 transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className={cn("flex items-center h-16 border-b transition-all duration-300", isSidebarCollapsed ? "justify-center px-0" : "px-6")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm shrink-0">
            I
          </div>
          <span className={cn("font-bold text-lg tracking-tight ml-3 overflow-hidden transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
            Insight EDU
          </span>
        </div>
        
        {/* Nav Items */}
        <div className="flex-1 py-6 px-3 space-y-1 overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center w-full py-2 rounded-md transition-colors group relative",
                  isSidebarCollapsed ? "justify-center px-2" : "px-3",
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0 transition-all", isSidebarCollapsed ? "mr-0 h-5 w-5" : "mr-3")} />
                <span className={cn("whitespace-nowrap transition-all duration-300", isSidebarCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block")}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer / User Profile */}
        <div className="border-t bg-muted/20">
            {/* Collapse Toggle */}
           <button 
             onClick={toggleSidebar}
             className={cn(
               "flex items-center w-full p-3 hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border/50 focus:outline-none",
               isSidebarCollapsed ? "justify-center" : "justify-start px-3"
             )}
             title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
           >
             {isSidebarCollapsed ? (
               <ChevronRight className="h-4 w-4 text-muted-foreground" />
             ) : (
               <>
                 <ChevronLeft className="h-4 w-4 text-muted-foreground mr-3" />
                 <span className="text-sm font-medium text-muted-foreground">Collapse Sidebar</span>
               </>
             )}
           </button>

           <div className={cn("p-4 transition-all duration-300", isSidebarCollapsed ? "flex flex-col items-center space-y-4 px-2" : "block")}>
               {!isSidebarCollapsed ? (
                 <>
                   <div className="flex items-center gap-3 mb-4 px-2">
                     <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center border shadow-sm shrink-0">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                     </div>
                     <div className="overflow-hidden">
                       <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                       <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-2">
                     <Button variant="outline" size="sm" onClick={toggleLang} className="w-full justify-start px-2 h-8">
                       <Globe className="mr-2 h-3 w-3" />
                       {lang === 'en' ? 'EN' : 'ZH'}
                     </Button>
                     <Button variant="ghost" size="sm" onClick={onLogout} className="w-full justify-start px-2 h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                       <LogOut className="mr-2 h-3 w-3" />
                       {t.logout}
                     </Button>
                   </div>
                 </>
               ) : (
                 // Collapsed Footer View
                 <>
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center border shadow-sm" title={user.name}>
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={toggleLang} title="Switch Language" className="h-8 w-8">
                       <Globe className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onLogout} title="Logout" className="h-8 w-8 text-destructive hover:text-destructive">
                       <LogOut className="h-4 w-4" />
                    </Button>
                 </>
               )}
           </div>
        </div>
      </aside>

      {/* Mobile Top Header (Simple branding) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b z-30 flex items-center px-4 shadow-sm">
        <div className="flex items-center gap-2">
           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">I</div>
           <span className="font-bold text-foreground">Insight EDU</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
             <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center border shadow-sm text-xs font-bold text-muted-foreground">
                 {user.name.charAt(0)}
             </div>
             <Button variant="ghost" size="sm" onClick={toggleLang} className="mr-0 px-2">
                 {lang === 'en' ? 'EN' : 'ZH'}
             </Button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav 
        items={navItems} 
        onLogout={onLogout} 
      />
    </>
  );
};
