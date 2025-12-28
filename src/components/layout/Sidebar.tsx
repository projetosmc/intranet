import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid3X3, 
  Fuel,
  Shield,
  Search,
  ChevronDown,
  LucideIcon
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';
import { Input } from '@/components/ui/input';
import { useTools } from '@/hooks/useTools';
import { supabase } from '@/integrations/supabase/client';

interface DbMenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  parent_id: string | null;
  open_in_new_tab: boolean;
  sort_order: number;
  is_admin_only: boolean;
  active: boolean;
}

interface MenuItemType {
  id: string;
  name: string;
  path: string;
  icon: LucideIcon;
  openInNewTab: boolean;
  isAdminOnly: boolean;
  children?: MenuItemType[];
}

const MENU_CACHE_KEY = 'mc_hub_menu_cache';
const MENU_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface MenuCache {
  items: DbMenuItem[];
  timestamp: number;
}

export function Sidebar() {
  const location = useLocation();
  const { isAdmin } = useUser();
  const { tools } = useTools();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const getCachedMenus = (): DbMenuItem[] | null => {
    try {
      const cached = localStorage.getItem(MENU_CACHE_KEY);
      if (cached) {
        const parsed: MenuCache = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < MENU_CACHE_DURATION) {
          return parsed.items;
        }
        localStorage.removeItem(MENU_CACHE_KEY);
      }
    } catch {
      localStorage.removeItem(MENU_CACHE_KEY);
    }
    return null;
  };

  const setCachedMenus = (items: DbMenuItem[]) => {
    try {
      const cache: MenuCache = { items, timestamp: Date.now() };
      localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore storage errors
    }
  };

  const fetchMenuItems = async () => {
    // Try cache first
    const cached = getCachedMenus();
    if (cached) {
      const processedItems = processMenuItems(cached);
      setMenuItems(processedItems);
      autoExpandMenus(processedItems);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('active', true)
        .order('sort_order');

      if (error) throw error;

      const items = data as DbMenuItem[];
      setCachedMenus(items);
      
      const processedItems = processMenuItems(items);
      setMenuItems(processedItems);
      autoExpandMenus(processedItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const autoExpandMenus = (items: MenuItemType[]) => {
    const menusWithChildren = items
      .filter(item => item.children && item.children.length > 0)
      .map(item => item.name);
    setExpandedMenus(menusWithChildren);
  };

  const getIconComponent = (iconName: string): LucideIcon => {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    const Icon = icons[iconName];
    return Icon || LucideIcons.Circle;
  };

  const processMenuItems = (items: DbMenuItem[]): MenuItemType[] => {
    const parentItems = items.filter(item => !item.parent_id);
    
    return parentItems.map(parent => {
      const children = items
        .filter(item => item.parent_id === parent.id)
        .map(child => ({
          id: child.id,
          name: child.name,
          path: child.path,
          icon: getIconComponent(child.icon),
          openInNewTab: child.open_in_new_tab,
          isAdminOnly: child.is_admin_only,
        }));

      return {
        id: parent.id,
        name: parent.name,
        path: parent.path,
        icon: getIconComponent(parent.icon),
        openInNewTab: parent.open_in_new_tab,
        isAdminOnly: parent.is_admin_only,
        children: children.length > 0 ? children : undefined,
      };
    });
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isMenuExpanded = (name: string) => expandedMenus.includes(name);

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const handleToolClick = (url: string) => {
    window.open(url, '_blank');
    setSearchQuery('');
    setShowResults(false);
  };

  // Filter menus based on admin status
  const visibleMenuItems = menuItems.filter(item => !item.isAdminOnly || isAdmin);

  const MenuItem = ({ item, isChild = false }: { item: MenuItemType; isChild?: boolean }) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.path);
    const expanded = isMenuExpanded(item.name);

    // Filter children based on admin status
    const visibleChildren = item.children?.filter(child => !child.isAdminOnly || isAdmin);

    if (hasChildren && visibleChildren && visibleChildren.length > 0) {
      return (
        <div>
          <button
            onClick={() => toggleMenu(item.name)}
            className={cn(
              "w-full ripple-container group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 relative overflow-hidden",
              "text-sidebar-foreground/70 hover:bg-gray-100 dark:hover:bg-gray-100 hover:text-gray-700 dark:hover:text-gray-700"
            )}
          >
            <span>{item.name}</span>
            <ChevronDown className={cn(
              "h-4 w-4 text-sidebar-foreground/50 transition-transform",
              expanded && "rotate-180"
            )} />
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 overflow-hidden"
              >
                {visibleChildren.map((child) => (
                  <MenuItem key={child.path} item={child} isChild />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // For items without children but that are category headers (have children defined but all filtered)
    if (hasChildren) {
      return null;
    }

    const linkProps = item.openInNewTab 
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : {};

    return (
      <NavLink
        to={item.path}
        {...linkProps}
        className={cn(
          "ripple-container group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative overflow-hidden",
          isChild && "py-1.5 text-sm",
          active 
            ? "bg-gray-100 dark:bg-gray-100 text-primary dark:text-primary font-semibold" 
            : "text-sidebar-foreground hover:bg-gray-100 dark:hover:bg-gray-100 hover:text-gray-700 dark:hover:text-gray-700"
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
          isChild && "h-4 w-4",
          active ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-primary"
        )} />
        <span>{item.name}</span>
      </NavLink>
    );
  };

  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col"
      style={{ background: 'var(--gradient-sidebar)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 h-[65px] bg-card border-b border-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <Fuel className="h-6 w-6 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-foreground">MC Hub</span>
          <span className="text-xs text-muted-foreground">Monte Carlo</span>
        </div>
      </div>

      {/* Admin Badge */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Administrador
            </span>
          </div>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="mx-4 mt-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar ferramentas..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(e.target.value.length > 0);
            }}
            onFocus={() => searchQuery.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="pl-9 bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 text-sm h-9"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && filteredTools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
          >
            {filteredTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.url)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Grid3X3 className="h-4 w-4 text-primary shrink-0" />
                <div className="truncate">
                  <span className="font-medium text-foreground">{tool.name}</span>
                  {tool.area && (
                    <span className="text-muted-foreground ml-2 text-xs">({tool.area})</span>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {showResults && searchQuery.length > 0 && filteredTools.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg p-3 z-50"
          >
            <p className="text-sm text-muted-foreground text-center">
              Nenhuma ferramenta encontrada
            </p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 mt-2 space-y-1 scrollbar-thin">
        {isLoading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Carregando...</div>
        ) : (
          visibleMenuItems.map((item) => (
            <MenuItem key={item.id} item={item} />
          ))
        )}
      </nav>

      {/* Footer with version */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="text-center text-xs text-sidebar-foreground/50">
          v1.0.0
        </div>
      </div>
    </aside>
  );
}