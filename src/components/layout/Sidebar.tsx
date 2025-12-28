import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Grid3X3, 
  Megaphone, 
  Activity, 
  HelpCircle, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Fuel
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { name: 'Meu Dia', path: '/', icon: Home },
  { name: 'Ferramentas', path: '/ferramentas', icon: Grid3X3 },
  { name: 'Comunicados', path: '/comunicados', icon: Megaphone },
  { name: 'Status', path: '/status', icon: Activity },
  { name: 'Suporte', path: '/suporte', icon: HelpCircle },
];

const adminItems = [
  { name: 'Admin Ferramentas', path: '/admin/ferramentas', icon: Settings },
  { name: 'Admin Comunicados', path: '/admin/comunicados', icon: Megaphone },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { isAdmin } = useUser();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const MenuItem = ({ item }: { item: typeof menuItems[0] }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    const content = (
      <NavLink
        to={item.path}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
          active 
            ? "bg-sidebar-accent text-sidebar-primary" 
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        {active && (
          <motion.div
            layoutId="sidebar-indicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
        <Icon className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          active ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-primary"
        )} />
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {item.name}
          </motion.span>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.name}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <Fuel className="h-6 w-6 text-primary" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            <span className="font-bold text-sidebar-foreground">MC Hub</span>
            <span className="text-xs text-sidebar-foreground/50">Monte Carlo</span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
        {menuItems.map((item) => (
          <MenuItem key={item.path} item={item} />
        ))}

        {isAdmin && (
          <>
            <div className="my-4 border-t border-sidebar-border" />
            {adminItems.map((item) => (
              <MenuItem key={item.path} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* Toggle Button */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          className="w-full h-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </motion.aside>
  );
}
