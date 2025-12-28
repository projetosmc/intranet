import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Grid3X3, 
  Megaphone, 
  Activity, 
  HelpCircle, 
  Settings,
  Fuel,
  Shield,
  Search,
  Monitor,
  ChevronDown,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';
import { Input } from '@/components/ui/input';
import { useTools } from '@/hooks/useTools';

interface MenuItemType {
  name: string;
  path: string;
  icon: any;
  children?: MenuItemType[];
}

const menuItems: MenuItemType[] = [
  { name: 'Meu Dia', path: '/', icon: Home },
  { name: 'Comunicados', path: '/comunicados', icon: Megaphone },
  { 
    name: 'Tecnologia', 
    path: '/tecnologia', 
    icon: Monitor,
    children: [
      { name: 'Status Sistemas', path: '/status', icon: Activity },
    ]
  },
  { name: 'Suporte', path: '/suporte', icon: HelpCircle },
];

const adminItems: MenuItemType[] = [
  { name: 'Configurações Gerais', path: '/admin/configuracoes', icon: Settings },
  { name: 'Comunicados', path: '/admin/comunicados', icon: Megaphone },
  { name: 'Usuários', path: '/admin/usuarios', icon: Shield },
  { name: 'Logs de Auditoria', path: '/admin/auditoria', icon: FileText },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const { tools } = useTools();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Tecnologia']);

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

  const MenuItem = ({ item, isChild = false }: { item: MenuItemType; isChild?: boolean }) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.path);
    const expanded = isMenuExpanded(item.name);

    if (hasChildren) {
      return (
        <div>
          <button
            onClick={() => toggleMenu(item.name)}
            className={cn(
              "w-full ripple-container group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative overflow-hidden",
              "text-sidebar-foreground hover:bg-gray-100 dark:hover:bg-gray-100 hover:text-gray-700 dark:hover:text-gray-700"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 shrink-0 text-sidebar-foreground/50 group-hover:text-primary transition-colors" />
              <span>{item.name}</span>
            </div>
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
                className="ml-4 space-y-1 overflow-hidden"
              >
                {item.children?.map((child) => (
                  <MenuItem key={child.path} item={child} isChild />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <NavLink
        to={item.path}
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
        {menuItems.map((item) => (
          <MenuItem key={item.path} item={item} />
        ))}

        {isAdmin && (
          <>
            <div className="my-4 px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
                Configurações
              </span>
              <div className="mt-2 border-t border-sidebar-border" />
            </div>
            {adminItems.map((item) => (
              <MenuItem key={item.path} item={item} />
            ))}
          </>
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
