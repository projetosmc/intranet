import { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Fuel,
  Shield,
  Search,
  ChevronDown,
  LucideIcon,
  Megaphone,
  FileText,
  HelpCircle,
  Loader2
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';
import { useScreenPermission } from '@/hooks/useScreenPermission';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { MCTechBadge } from './MCTechBadge';

interface DbMenuItem {
  cod_menu_item: string;
  des_nome: string;
  des_caminho: string;
  des_icone: string;
  seq_menu_pai: string | null;
  ind_nova_aba: boolean;
  num_ordem: number;
  ind_admin_only: boolean;
  ind_ativo: boolean;
  des_tags: string[];
}

interface MenuItemType {
  id: string;
  name: string;
  path: string;
  icon: LucideIcon;
  openInNewTab: boolean;
  isAdminOnly: boolean;
  isParent: boolean;
  children?: MenuItemType[];
}

interface SearchResult {
  id: string;
  title: string;
  type: 'menu' | 'announcement' | 'faq';
  path: string;
  icon: 'menu' | 'announcement' | 'faq';
}

interface CachedFaq {
  cod_faq: string;
  des_pergunta: string;
  des_resposta: string;
  des_tags: string[];
}

const MENU_CACHE_KEY = 'mc_hub_menu_cache';
const MENU_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours - only refreshes on login

interface MenuCache {
  items: DbMenuItem[];
  timestamp: number;
}

// Export function to clear cache from other components
export const clearMenuCache = () => {
  localStorage.removeItem(MENU_CACHE_KEY);
  // Dispatch custom event to trigger sidebar refresh
  window.dispatchEvent(new CustomEvent('menu-cache-cleared'));
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const { canAccess, isLoading: permissionsLoading } = useScreenPermission();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allSubmenus, setAllSubmenus] = useState<DbMenuItem[]>([]);
  const [cachedAnnouncements, setCachedAnnouncements] = useState<Array<{cod_comunicado: string; des_titulo: string; des_resumo: string}>>([]);
  const [cachedFaqs, setCachedFaqs] = useState<CachedFaq[]>([]);

  // Carregar comunicados e FAQs para busca
  useEffect(() => {
    const loadSearchData = async () => {
      try {
        const [announcementsRes, faqsRes] = await Promise.all([
          supabase
            .from('tab_comunicado')
            .select('cod_comunicado, des_titulo, des_resumo')
            .eq('ind_ativo', true)
            .limit(50),
          supabase
            .from('tab_faq')
            .select('cod_faq, des_pergunta, des_resposta, des_tags')
            .eq('ind_ativo', true)
            .limit(50)
        ]);
        
        setCachedAnnouncements(announcementsRes.data || []);
        setCachedFaqs((faqsRes.data || []) as CachedFaq[]);
      } catch (error) {
        console.error('Error loading search data:', error);
      }
    };
    loadSearchData();
  }, []);

  useEffect(() => {
    fetchMenuItems();
    
    // Listen for menu cache clear events to refresh instantly
    const handleMenuCacheCleared = () => {
      fetchMenuItems(true); // Force fetch from database
    };
    
    window.addEventListener('menu-cache-cleared', handleMenuCacheCleared);
    return () => {
      window.removeEventListener('menu-cache-cleared', handleMenuCacheCleared);
    };
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

  const fetchMenuItems = async (skipCache = false) => {
    // Try cache first (unless skipping)
    if (!skipCache) {
      const cached = getCachedMenus();
      if (cached) {
        const processedItems = processMenuItems(cached);
        setMenuItems(processedItems);
        setAllSubmenus(cached.filter(item => item.seq_menu_pai));
        autoExpandMenus(processedItems);
        setIsLoading(false);
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from('tab_menu_item')
        .select('*')
        .eq('ind_ativo', true)
        .order('num_ordem');

      if (error) throw error;

      const items: DbMenuItem[] = (data || []).map(d => ({
        cod_menu_item: d.cod_menu_item,
        des_nome: d.des_nome,
        des_caminho: d.des_caminho,
        des_icone: d.des_icone,
        seq_menu_pai: d.seq_menu_pai,
        ind_nova_aba: d.ind_nova_aba,
        num_ordem: d.num_ordem,
        ind_admin_only: d.ind_admin_only,
        ind_ativo: d.ind_ativo,
        des_tags: d.des_tags || [],
      }));
      setCachedMenus(items);
      setAllSubmenus(items.filter(item => item.seq_menu_pai));
      
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
    const parentItems = items.filter(item => !item.seq_menu_pai);
    
    return parentItems.map(parent => {
      const children = items
        .filter(item => item.seq_menu_pai === parent.cod_menu_item)
        .map(child => ({
          id: child.cod_menu_item,
          name: child.des_nome,
          path: child.des_caminho,
          icon: getIconComponent(child.des_icone),
          openInNewTab: child.ind_nova_aba,
          isAdminOnly: child.ind_admin_only,
          isParent: false,
        }));

      return {
        id: parent.cod_menu_item,
        name: parent.des_nome,
        path: parent.des_caminho,
        icon: getIconComponent(parent.des_icone),
        openInNewTab: parent.ind_nova_aba,
        isAdminOnly: parent.ind_admin_only,
        isParent: true,
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

  // Busca instantânea usando useMemo - sem debounce
  // Filtra apenas telas que o usuário tem permissão de acessar
  const searchResults = useMemo(() => {
    // Se ainda está carregando permissões, não mostrar resultados
    if (permissionsLoading) return [];
    if (!searchQuery.trim()) return [];
    
    const results: SearchResult[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    // Buscar em todos os menus (incluindo submenus) - verifica nome e tags
    allSubmenus.forEach(menu => {
      // Check if it's admin only and user is not admin
      if (menu.ind_admin_only && !isAdmin) return;
      
      // Verificar se o usuário tem permissão para acessar esta rota
      if (!canAccess(menu.des_caminho)) return;
      
      const nameMatch = menu.des_nome.toLowerCase().includes(lowerQuery);
      const tagMatch = menu.des_tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
      
      if (nameMatch || tagMatch) {
        results.push({
          id: menu.cod_menu_item,
          title: menu.des_nome,
          type: 'menu',
          path: menu.des_caminho,
          icon: 'menu'
        });
      }
    });

    // Buscar em comunicados (já carregados em memória)
    // Comunicados são acessíveis a todos os usuários autenticados
    cachedAnnouncements.forEach(ann => {
      const titleMatch = ann.des_titulo.toLowerCase().includes(lowerQuery);
      const summaryMatch = ann.des_resumo?.toLowerCase().includes(lowerQuery);
      
      if (titleMatch || summaryMatch) {
        results.push({
          id: ann.cod_comunicado,
          title: ann.des_titulo,
          type: 'announcement',
          path: '/comunicados',
          icon: 'announcement'
        });
      }
    });

    // Buscar em FAQs - verifica pergunta, resposta e tags
    // FAQs são acessíveis via página de suporte
    if (canAccess('/suporte')) {
      cachedFaqs.forEach(faq => {
        const questionMatch = faq.des_pergunta.toLowerCase().includes(lowerQuery);
        const answerMatch = faq.des_resposta?.toLowerCase().includes(lowerQuery);
        const tagMatch = faq.des_tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
        
        if (questionMatch || answerMatch || tagMatch) {
          results.push({
            id: faq.cod_faq,
            title: faq.des_pergunta,
            type: 'faq',
            path: '/suporte',
            icon: 'faq'
          });
        }
      });
    }

    return results.slice(0, 8);
  }, [searchQuery, allSubmenus, cachedAnnouncements, cachedFaqs, isAdmin, canAccess, permissionsLoading]);

  const handleResultClick = useCallback((result: SearchResult) => {
    navigate(result.path);
    setSearchQuery('');
    setShowResults(false);
  }, [navigate]);

  // Special top items (Meu Dia, Comunicados) - shown independently at the top
  const topItemNames = ['Meu Dia', 'Comunicados'];
  const topItems = menuItems.filter(item => topItemNames.includes(item.name) && (!item.isAdminOnly || isAdmin));
  
  // Filter menus based on admin status, excluding top items from regular menu
  const visibleMenuItems = menuItems.filter(item => 
    (!item.isAdminOnly || isAdmin) && !topItemNames.includes(item.name)
  );

  const MenuItem = ({ item, isChild = false }: { item: MenuItemType; isChild?: boolean }) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.path);
    const expanded = isMenuExpanded(item.name);

    // Filter children based on admin status
    const visibleChildren = item.children?.filter(child => !child.isAdminOnly || isAdmin);

    if (hasChildren && visibleChildren && visibleChildren.length > 0) {
      return (
        <div className="space-y-1">
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleMenu(item.name)}
            className={cn(
              "w-full group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 relative overflow-hidden",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <span>{item.name}</span>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" />
            </motion.div>
          </motion.button>
          <motion.div
            initial={false}
            animate={{
              height: expanded ? "auto" : 0,
              opacity: expanded ? 1 : 0
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden pl-2"
          >
            <div className="space-y-1 border-l-2 border-sidebar-border/50 pl-2">
              {visibleChildren.map((child) => (
                <MenuItem key={child.path} item={child} isChild />
              ))}
            </div>
          </motion.div>
        </div>
      );
    }

    // For parent items without visible children - show as category header (not clickable link)
    if (item.isParent && !isChild) {
      return (
        <div
          className={cn(
            "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider",
            "text-sidebar-foreground/70"
          )}
        >
          <span>{item.name}</span>
        </div>
      );
    }

    const linkProps = item.openInNewTab 
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : {};

    return (
      <NavLink
        to={item.path}
        {...linkProps}
        className={({ isActive: routeActive }) => cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative overflow-hidden",
          isChild && "py-1.5 text-sm",
          active || routeActive
            ? "bg-primary/10 text-primary font-semibold" 
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        {({ isActive: routeActive }) => (
          <>
            {(active || routeActive) && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon className={cn(
              "h-5 w-5 shrink-0 transition-all duration-200",
              isChild && "h-4 w-4",
              active ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-primary group-hover:scale-110"
            )} />
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">{item.name}</span>
          </>
        )}
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
            placeholder="Buscar..."
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
        {showResults && permissionsLoading && searchQuery.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg p-3 z-50"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando...</span>
            </div>
          </motion.div>
        )}

        {showResults && !permissionsLoading && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
          >
            {searchResults.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
              >
                {result.type === 'menu' && (
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                )}
                {result.type === 'announcement' && (
                  <Megaphone className="h-4 w-4 text-primary shrink-0" />
                )}
                {result.type === 'faq' && (
                  <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                )}
                <div className="truncate">
                  <span className="font-medium text-foreground">{result.title}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    ({result.type === 'menu' ? 'Menu' : result.type === 'announcement' ? 'Comunicado' : 'FAQ'})
                  </span>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {showResults && !permissionsLoading && searchQuery.length > 0 && searchResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg p-3 z-50"
          >
            <p className="text-sm text-muted-foreground text-center">
              Nenhum resultado encontrado
            </p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 mt-2 space-y-1 scrollbar-thin">
        {isLoading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <>
            {/* Top items (Meu Dia, Comunicados) */}
            {topItems.map((item) => (
              <MenuItem key={item.id} item={{ ...item, isParent: false }} isChild />
            ))}
            
            {/* Separator if there are top items */}
            {topItems.length > 0 && visibleMenuItems.length > 0 && (
              <div className="my-3 border-t border-sidebar-border" />
            )}
            
            {/* Regular menu items */}
            {visibleMenuItems.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* Footer with MCTechBadge */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <MCTechBadge />
          <span className="text-xs text-sidebar-foreground/40">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}