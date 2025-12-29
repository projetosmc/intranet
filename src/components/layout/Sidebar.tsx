import { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
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

interface CachedKBArticle {
  cod_artigo: string;
  des_titulo: string;
  des_resumo: string;
  arr_sinonimos: string[];
  des_sistema: string | null;
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
  const [allMenuItems, setAllMenuItems] = useState<DbMenuItem[]>([]);
  const [cachedAnnouncements, setCachedAnnouncements] = useState<Array<{cod_comunicado: string; des_titulo: string; des_resumo: string}>>([]);
  const [cachedFaqs, setCachedFaqs] = useState<CachedFaq[]>([]);
  const [cachedKBArticles, setCachedKBArticles] = useState<CachedKBArticle[]>([]);

  // Carregar comunicados, FAQs e artigos KB para busca
  useEffect(() => {
    const loadSearchData = async () => {
      try {
        const [announcementsRes, faqsRes, kbRes] = await Promise.all([
          supabase
            .from('tab_comunicado')
            .select('cod_comunicado, des_titulo, des_resumo')
            .eq('ind_ativo', true)
            .limit(50),
          supabase
            .from('tab_faq')
            .select('cod_faq, des_pergunta, des_resposta, des_tags')
            .eq('ind_ativo', true)
            .limit(50),
          supabase
            .from('tab_kb_artigo')
            .select('cod_artigo, des_titulo, des_resumo, arr_sinonimos, des_sistema')
            .eq('ind_ativo', true)
            .eq('ind_status', 'PUBLICADO')
            .limit(100)
        ]);
        
        setCachedAnnouncements(announcementsRes.data || []);
        setCachedFaqs((faqsRes.data || []) as CachedFaq[]);
        setCachedKBArticles((kbRes.data || []) as CachedKBArticle[]);
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
        setAllMenuItems(cached);
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
      setAllMenuItems(items);
      
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

  // Processa items de menu recursivamente para suportar N níveis
  const processMenuItems = (items: DbMenuItem[]): MenuItemType[] => {
    const buildMenuTree = (parentId: string | null): MenuItemType[] => {
      return items
        .filter(item => item.seq_menu_pai === parentId)
        .map(item => {
          const children = buildMenuTree(item.cod_menu_item);
          return {
            id: item.cod_menu_item,
            name: item.des_nome,
            path: item.des_caminho,
            icon: getIconComponent(item.des_icone),
            openInNewTab: item.ind_nova_aba,
            isAdminOnly: item.ind_admin_only,
            isParent: !item.seq_menu_pai, // Top-level items are parents
            children: children.length > 0 ? children : undefined,
          };
        });
    };

    return buildMenuTree(null);
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

  // Fuse.js instances for fuzzy search
  const fuseMenuItems = useMemo(() => {
    const searchableItems = allMenuItems.filter(menu => {
      if (menu.ind_admin_only && !isAdmin) return false;
      if (!canAccess(menu.des_caminho)) return false;
      // Ignora menus pai que são apenas categorias
      const isParentCategory = !menu.seq_menu_pai && allMenuItems.some(m => m.seq_menu_pai === menu.cod_menu_item);
      if (isParentCategory) return false;
      return true;
    });

    return new Fuse(searchableItems, {
      keys: ['des_nome', 'des_tags'],
      threshold: 0.4, // 0.0 = exact match, 1.0 = match anything
      distance: 100,
      includeScore: true,
    });
  }, [allMenuItems, isAdmin, canAccess]);

  const fuseKBArticles = useMemo(() => {
    return new Fuse(cachedKBArticles, {
      keys: ['des_titulo', 'des_resumo', 'arr_sinonimos', 'des_sistema'],
      threshold: 0.4,
      distance: 100,
      includeScore: true,
    });
  }, [cachedKBArticles]);

  const fuseAnnouncements = useMemo(() => {
    return new Fuse(cachedAnnouncements, {
      keys: ['des_titulo', 'des_resumo'],
      threshold: 0.4,
      distance: 100,
      includeScore: true,
    });
  }, [cachedAnnouncements]);

  const fuseFaqs = useMemo(() => {
    return new Fuse(cachedFaqs, {
      keys: ['des_pergunta', 'des_resposta', 'des_tags'],
      threshold: 0.4,
      distance: 100,
      includeScore: true,
    });
  }, [cachedFaqs]);

  // Busca fuzzy usando Fuse.js
  const searchResults = useMemo(() => {
    if (permissionsLoading) return [];
    if (!searchQuery.trim()) return [];
    
    const results: SearchResult[] = [];

    // Buscar em menus com fuzzy search
    const menuResults = fuseMenuItems.search(searchQuery);
    menuResults.slice(0, 5).forEach(result => {
      results.push({
        id: result.item.cod_menu_item,
        title: result.item.des_nome,
        type: 'menu',
        path: result.item.des_caminho,
        icon: 'menu'
      });
    });

    // Buscar em artigos KB com fuzzy search
    const kbResults = fuseKBArticles.search(searchQuery);
    kbResults.slice(0, 3).forEach(result => {
      results.push({
        id: result.item.cod_artigo,
        title: result.item.des_titulo,
        type: 'faq' as const,
        path: `/base-conhecimento-ti/${result.item.cod_artigo}`,
        icon: 'faq'
      });
    });

    // Buscar em comunicados com fuzzy search
    const annResults = fuseAnnouncements.search(searchQuery);
    annResults.slice(0, 3).forEach(result => {
      results.push({
        id: result.item.cod_comunicado,
        title: result.item.des_titulo,
        type: 'announcement',
        path: '/comunicados',
        icon: 'announcement'
      });
    });

    // Buscar em FAQs com fuzzy search
    if (canAccess('/suporte')) {
      const faqResults = fuseFaqs.search(searchQuery);
      faqResults.slice(0, 3).forEach(result => {
        results.push({
          id: result.item.cod_faq,
          title: result.item.des_pergunta,
          type: 'faq',
          path: '/suporte',
          icon: 'faq'
        });
      });
    }

    return results.slice(0, 10);
  }, [searchQuery, fuseMenuItems, fuseKBArticles, fuseAnnouncements, fuseFaqs, canAccess, permissionsLoading]);

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

  // Função recursiva para verificar se um item ou seus descendentes são visíveis
  const hasVisibleDescendants = useCallback((menuItem: MenuItemType): boolean => {
    // Se não tem filhos, verifica se o próprio item é acessível
    if (!menuItem.children || menuItem.children.length === 0) {
      if (menuItem.isAdminOnly && !isAdmin) return false;
      // URLs externas (Fluig, etc.) são sempre acessíveis - não passam por permissões de tela
      if (menuItem.path.startsWith('http')) return true;
      return canAccess(menuItem.path);
    }
    
    // Se tem filhos, verifica se pelo menos um descendente é visível
    return menuItem.children.some(child => {
      if (child.isAdminOnly && !isAdmin) return false;
      return hasVisibleDescendants(child);
    });
  }, [isAdmin, canAccess]);

  // Componente recursivo para renderizar menus de N níveis
  const MenuItem = ({ item, depth = 0 }: { item: MenuItemType; depth?: number }) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.path);
    const expanded = isMenuExpanded(item.name);
    const isChild = depth > 0;
    const isSubChild = depth > 1;
    const isDeepChild = depth > 2;

    // Filter children based on admin status AND visibility of descendants
    const visibleChildren = item.children?.filter(child => {
      if (child.isAdminOnly && !isAdmin) return false;
      // Um submenu é visível se tiver pelo menos um descendente visível
      return hasVisibleDescendants(child);
    });

    // Menu com filhos - renderiza como dropdown expansível
    if (hasChildren && visibleChildren && visibleChildren.length > 0) {
      return (
        <div className={cn(
          depth === 1 && "ml-2",
          depth >= 2 && "ml-1"
        )}>
          <button
            onClick={() => toggleMenu(item.name)}
            className={cn(
              "w-full ripple-container group flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-all duration-200 relative overflow-hidden",
              depth === 0 && "text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70",
              depth === 1 && "text-sm font-medium text-sidebar-foreground/90 pl-4",
              depth >= 2 && "text-xs font-medium text-sidebar-foreground/80 pl-3",
              "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              {depth > 0 && (
                <Icon className={cn(
                  "shrink-0 transition-colors",
                  depth === 1 ? "h-4 w-4" : "h-3.5 w-3.5",
                  "text-sidebar-foreground/50 group-hover:text-primary"
                )} />
              )}
              <span className="truncate">{item.name}</span>
            </div>
            <ChevronDown className={cn(
              "h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40 transition-transform duration-200",
              expanded && "rotate-180 text-primary"
            )} />
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              depth === 0 && "space-y-0.5 mt-1",
              depth === 1 && "space-y-0.5 ml-4 mt-1 border-l-2 border-sidebar-border/30 pl-2",
              depth >= 2 && "space-y-0.5 ml-3 mt-0.5 border-l border-sidebar-border/20 pl-2",
              expanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            {visibleChildren.map((child) => (
              <MenuItem key={child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      );
    }

    // Menu pai sem filhos visíveis - mostra como header
    if (item.isParent && depth === 0) {
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

    // Item clicável (folha ou submenu sem filhos visíveis)
    const linkProps = item.openInNewTab 
      ? { target: '_blank' as const, rel: 'noopener noreferrer' }
      : {};

    return (
      <NavLink
        to={item.path}
        {...linkProps}
        className={cn(
          "ripple-container group flex items-center gap-2 rounded-lg transition-all duration-200 relative overflow-hidden",
          // Padding e tamanho baseado na profundidade
          depth === 0 && "px-3 py-2 text-sm font-medium",
          depth === 1 && "px-3 py-1.5 ml-2 text-sm font-medium",
          depth === 2 && "px-2.5 py-1.5 ml-1 text-xs font-medium",
          depth >= 3 && "px-2 py-1 ml-1 text-xs",
          // Estados ativo/inativo
          active 
            ? "bg-primary/10 text-primary font-semibold" 
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        {/* Indicador de item ativo */}
        {active && (
          <motion.div
            layoutId="activeIndicator"
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 bg-primary rounded-r-full",
              depth <= 1 ? "w-1 h-5" : "w-0.5 h-4"
            )}
          />
        )}
        
        {/* Ícone */}
        <Icon className={cn(
          "shrink-0 transition-colors",
          depth <= 1 ? "h-4 w-4" : "h-3.5 w-3.5",
          active ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-primary"
        )} />
        
        {/* Texto */}
        <span className="truncate">{item.name}</span>
        
        {/* Indicador de link externo */}
        {item.openInNewTab && (
          <LucideIcons.ExternalLink className="h-3 w-3 ml-auto text-sidebar-foreground/30" />
        )}
      </NavLink>
    );
  };

  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen w-72 flex flex-col"
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
              <MenuItem key={item.id} item={{ ...item, isParent: false }} depth={1} />
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