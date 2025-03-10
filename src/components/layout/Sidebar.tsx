
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  UserCheck, 
  BarChart3, 
  Calendar, 
  Home, 
  Menu, 
  X, 
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Take Attendance', path: '/attendance', icon: UserCheck },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Weekly Schedule', path: '/schedule', icon: Calendar },
];

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Close sidebar on mobile by default
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isMobile]);
  
  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar toggle button for mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed z-50 p-2 rounded-full neo-button",
          "text-primary bg-white shadow-lg border border-primary/10",
          isMobile ? "top-4 right-4" : "top-6 left-6",
          !isMobile && isOpen && "left-[270px]",
          !isMobile && !isOpen && "left-6",
          "transition-all duration-300 ease-in-out"
        )}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen",
          "bg-white glass-morph border-r border-primary/5",
          "transition-all duration-300 ease-in-out",
          "flex flex-col",
          isOpen ? "w-[280px]" : "w-0",
          !isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "w-[280px]",
          isMobile && !isOpen && "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-primary/5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCheck size={18} className="text-primary" />
            </div>
            <h1 className="font-semibold text-lg">AttenTrack</h1>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                  "group transition-all duration-200 neo-button",
                  isActive 
                    ? "bg-primary text-white" 
                    : "hover:bg-primary/5 text-foreground"
                )}
              >
                <item.icon size={18} className={cn(
                  "transition-transform duration-300 ease-out",
                  isActive ? "" : "group-hover:translate-x-1"
                )} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <ChevronRight size={16} className="ml-auto text-white" />
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-primary/5">
          <div className="rounded-lg bg-primary/5 p-3">
            <p className="text-xs text-center text-primary/80">
              Class tracking made simple
            </p>
          </div>
        </div>
      </aside>
      
      {/* Main content wrapper that adjusts based on sidebar state */}
      <div
        className={cn(
          "min-h-screen transition-all duration-300 ease-in-out",
          isOpen && !isMobile ? "ml-[280px]" : "ml-0"
        )}
      />
    </>
  );
};
