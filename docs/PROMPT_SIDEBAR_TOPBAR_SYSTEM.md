# Prompt: Sistema de Navegação Completo (Sidebar + Topbar + Notificações)

> **IMPORTANTE**: Este prompt contém TODAS as configurações visuais e CSS necessárias para replicar exatamente o visual do sistema de navegação. Copie também as variáveis CSS e as configurações do Tailwind.

---

## 🎨 PASSO 1: CONFIGURAR CSS VARIABLES (OBRIGATÓRIO)

Adicione estas variáveis no seu arquivo `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Cores Base - Light Mode */
    --background: 210 20% 98%;
    --foreground: 222 47% 11%;

    /* Cards e Popovers */
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;

    /* Cor Primária (Teal/Cyan) */
    --primary: 195 100% 44%;
    --primary-foreground: 0 0% 100%;

    /* Secundária e Muted */
    --secondary: 215 20% 95%;
    --secondary-foreground: 222 47% 11%;
    --muted: 215 20% 95%;
    --muted-foreground: 215 16% 47%;

    /* Accent */
    --accent: 195 100% 44%;
    --accent-foreground: 0 0% 100%;

    /* Destrutivo */
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;

    /* Bordas e Input */
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 195 81% 60%;

    /* Border Radius */
    --radius: 1.5rem;

    /* ========== SIDEBAR (CRÍTICO) ========== */
    --sidebar-background: 210 30% 12%;
    --sidebar-foreground: 210 40% 98%;
    --sidebar-primary: 0 0% 98%;
    --sidebar-primary-foreground: 195 100% 44%;
    --sidebar-accent: 0 0% 30%;
    --sidebar-accent-foreground: 0 0% 98%;
    --sidebar-border: 210 30% 18%;
    --sidebar-ring: 195 81% 60%;

    /* ========== GRADIENTES (CRÍTICO PARA SIDEBAR) ========== */
    --gradient-primary: linear-gradient(135deg, hsl(195 100% 44%) 0%, hsl(195 100% 35%) 100%);
    --gradient-card: linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(210 20% 98%) 100%);
    --gradient-sidebar: linear-gradient(180deg, hsl(210 30% 12%) 0%, hsl(210 30% 8%) 100%);
    --gradient-hero: linear-gradient(135deg, hsl(195 100% 44% / 0.1) 0%, hsl(217 91% 60% / 0.1) 100%);

    /* Sombras */
    --shadow-sm: 0 1px 2px 0 hsl(222 47% 11% / 0.05);
    --shadow-md: 0 4px 6px -1px hsl(222 47% 11% / 0.1), 0 2px 4px -2px hsl(222 47% 11% / 0.1);
    --shadow-lg: 0 10px 15px -3px hsl(222 47% 11% / 0.1), 0 4px 6px -4px hsl(222 47% 11% / 0.1);
    --shadow-glow: 0 0 20px hsl(195 100% 44% / 0.3);
  }

  .dark {
    --background: 222 47% 5%;
    --foreground: 210 40% 98%;

    --card: 222 47% 8%;
    --card-foreground: 210 40% 98%;

    --popover: 222 47% 8%;
    --popover-foreground: 210 40% 98%;

    --primary: 195 100% 44%;
    --primary-foreground: 0 0% 100%;

    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;

    --accent: 195 100% 44%;
    --accent-foreground: 0 0% 100%;

    --destructive: 0 62% 30%;
    --destructive-foreground: 210 40% 98%;

    --border: 217 33% 17%;
    --input: 217 33% 17%;
    --ring: 195 81% 60%;

    /* Sidebar Dark Mode */
    --sidebar-background: 222 47% 8%;
    --sidebar-foreground: 210 40% 98%;
    --sidebar-primary: 195 100% 44%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 217 33% 17%;
    --sidebar-accent-foreground: 210 40% 98%;
    --sidebar-border: 217 33% 20%;
    --sidebar-ring: 195 81% 60%;

    --gradient-card: linear-gradient(135deg, hsl(217 33% 17% / 0.9) 0%, hsl(222 47% 11% / 0.8) 100%);
  }
}

@layer base {
  * {
    @apply border-border;
  }

  html {
    font-size: 14px;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-family: 'Inter', 'Figtree', ui-sans-serif, system-ui, sans-serif;
  }

  /* Scrollbar customizada (IMPORTANTE para sidebar) */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-transparent;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-border rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/30;
  }
}

@layer utilities {
  /* Scrollbar thin (usada no nav do sidebar) */
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted)) transparent;
  }

  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    @apply bg-transparent;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    @apply bg-muted rounded-full;
  }
}

/* View Transitions API (para theme toggle) */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
```

---

## 🎨 PASSO 2: CONFIGURAR TAILWIND (OBRIGATÓRIO)

Adicione estas cores no seu `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // ========== SIDEBAR COLORS (CRÍTICO) ==========
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

---

## 📐 PASSO 3: ESTRUTURA DE LAYOUT

### MainLayout.tsx

```tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Conteúdo com margem esquerda de 288px (w-72) */}
      <div className="flex flex-col min-h-screen" style={{ marginLeft: 288 }}>
        <Topbar />
        
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

---

## 🎯 PASSO 4: SIDEBAR COMPLETO

### Sidebar.tsx - Estrutura Principal

```tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { 
  Shield, Search, ChevronDown, LucideIcon,
  Megaphone, FileText, HelpCircle, Loader2, Circle
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

// ============ INTERFACES ============
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
  isContainer: boolean;
  children?: MenuItemType[];
}

interface SearchResult {
  id: string;
  title: string;
  type: 'menu' | 'announcement' | 'faq';
  path: string;
}

// ============ HELPER: PEGAR ÍCONE ============
const getIconComponent = (iconName: string): LucideIcon => {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[iconName] || Circle;
};

// ============ COMPONENTE PRINCIPAL ============
export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Substitua por seu hook de admin
  const isAdmin = false; // useUser().isAdmin

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

  // ============ COMPONENTE RECURSIVO MENU ITEM ============
  const MenuItem = ({ item, depth = 0 }: { item: MenuItemType; depth?: number }) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.path);
    const expanded = isMenuExpanded(item.name);
    const visibleChildren = item.children;

    // Menu com filhos - dropdown expansível
    if (hasChildren && visibleChildren && visibleChildren.length > 0) {
      return (
        <div className={cn(
          depth === 1 && "ml-2",
          depth >= 2 && "ml-1"
        )}>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggleMenu(item.name); }}
            className={cn(
              "w-full group flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-all duration-200 relative overflow-hidden",
              (depth === 0 || depth === 1) && "text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70",
              depth >= 2 && "text-sm font-medium text-sidebar-foreground/80 pl-3",
              "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              {depth >= 2 && !item.isContainer && (
                <Icon className="shrink-0 transition-colors h-4 w-4 text-sidebar-foreground/50 group-hover:text-primary" />
              )}
              <span className="truncate">{depth <= 1 ? item.name.toUpperCase() : item.name}</span>
            </div>
            <ChevronDown className={cn(
              "h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40 transition-transform duration-200",
              expanded && "rotate-180 text-primary"
            )} />
          </button>
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            depth === 0 && "space-y-0.5 mt-1",
            depth === 1 && "space-y-0.5 ml-4 mt-1 border-l-2 border-sidebar-border/30 pl-2",
            depth >= 2 && "space-y-0.5 ml-3 mt-0.5 border-l border-sidebar-border/20 pl-2",
            expanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          )}>
            {visibleChildren.map((child) => (
              <MenuItem key={child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      );
    }

    // Container sem filhos - header não clicável
    if (item.isContainer) {
      return (
        <div className={cn(
          "w-full flex items-center gap-2 rounded-lg px-3 py-2",
          depth === 0 && "text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70",
          depth === 1 && "text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70 ml-2",
          depth >= 2 && "text-sm font-medium text-sidebar-foreground/60 ml-1 pl-3"
        )}>
          <span className="truncate">{depth <= 1 ? item.name.toUpperCase() : item.name}</span>
        </div>
      );
    }

    // Item clicável (folha)
    const linkProps = item.openInNewTab 
      ? { target: '_blank' as const, rel: 'noopener noreferrer' }
      : {};

    return (
      <NavLink
        to={item.path}
        {...linkProps}
        className={cn(
          "group flex items-center gap-2 rounded-lg transition-all duration-200 relative overflow-hidden",
          depth === 0 && "px-3 py-2 text-sm font-medium",
          depth === 1 && "px-3 py-1.5 ml-2 text-sm font-medium",
          depth === 2 && "px-2.5 py-1.5 ml-1 text-sm font-medium",
          depth >= 3 && "px-2 py-1.5 ml-1 text-sm",
          active 
            ? "bg-sidebar-accent text-sidebar-foreground font-semibold hover:bg-sidebar-accent/80" 
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        {/* Indicador de item ativo - barra primária à esquerda */}
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
        {!item.isContainer && (
          <Icon className={cn(
            "shrink-0 transition-colors h-4 w-4",
            active ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
          )} />
        )}
        
        <span className="truncate">{item.name}</span>
        
        {/* Indicador de link externo */}
        {item.openInNewTab && (
          <LucideIcons.ExternalLink className="h-3 w-3 ml-auto text-sidebar-foreground/30" />
        )}
      </NavLink>
    );
  };

  // ============ RENDER PRINCIPAL ============
  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen w-72 flex flex-col"
      style={{ background: 'var(--gradient-sidebar)' }}
    >
      {/* ========== HEADER COM LOGO ========== */}
      <div className="flex items-center justify-center px-6 h-[65px] bg-card border-b border-border">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="h-12 w-auto object-contain"
        />
      </div>

      {/* ========== BADGE ADMIN ========== */}
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

      {/* ========== BARRA DE BUSCA ========== */}
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

        {/* Dropdown de resultados */}
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
          >
            {/* Renderize seus resultados aqui */}
          </motion.div>
        )}
      </div>

      {/* ========== NAVEGAÇÃO ========== */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 mt-2 space-y-1 scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando...</span>
          </div>
        ) : (
          <>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && (
                  <div className="my-2 mx-2 border-t border-sidebar-border/40" />
                )}
                <MenuItem item={item} />
              </React.Fragment>
            ))}
          </>
        )}
      </nav>

      {/* ========== FOOTER ========== */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-sidebar-foreground/60">Powered by You</span>
          <span className="text-xs text-sidebar-foreground/40">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
```

---

## 📱 PASSO 5: TOPBAR

### Topbar.tsx

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, RefreshCw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedThemeToggler } from './AnimatedThemeToggler';

export function Topbar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-20 h-[65px] border-b border-border bg-background px-6 flex items-center justify-end gap-4"
    >
      {/* Theme Toggle */}
      <AnimatedThemeToggler />

      {/* Notificações */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
          3
        </span>
      </Button>

      {/* Dropdown do Usuário */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                US
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium">Usuário</span>
              <span className="text-xs text-muted-foreground">usuario@email.com</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.header>
  );
}
```

---

## 🌓 PASSO 6: ANIMATED THEME TOGGLER

### AnimatedThemeToggler.tsx

```tsx
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AnimatedThemeToggler() {
  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    
    // Verifica suporte a View Transitions API
    if (!document.startViewTransition) {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', newTheme);
      return;
    }

    // Coordenadas do clique para animação circular
    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', newTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];

      document.documentElement.animate(
        { clipPath: isDark ? clipPath : clipPath.reverse() },
        {
          duration: 400,
          easing: 'ease-in-out',
          pseudoElement: isDark 
            ? '::view-transition-new(root)' 
            : '::view-transition-old(root)',
        }
      );
    });
  };

  const isDark = typeof window !== 'undefined' 
    && document.documentElement.classList.contains('dark');

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative"
    >
      <Sun className={`h-5 w-5 transition-transform ${isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
      <Moon className={`absolute h-5 w-5 transition-transform ${isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
    </Button>
  );
}
```

---

## 📦 DEPENDÊNCIAS NECESSÁRIAS

```bash
npm install framer-motion fuse.js date-fns lucide-react
npm install @radix-ui/react-dropdown-menu @radix-ui/react-popover 
npm install @radix-ui/react-avatar @radix-ui/react-scroll-area
npm install tailwindcss-animate
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

1. [ ] Copiar variáveis CSS para `src/index.css`
2. [ ] Configurar cores do sidebar no `tailwind.config.ts`
3. [ ] Criar `MainLayout.tsx` com estrutura fixa
4. [ ] Criar `Sidebar.tsx` com gradient background
5. [ ] Criar `Topbar.tsx` com theme toggle e notificações
6. [ ] Criar `AnimatedThemeToggler.tsx`
7. [ ] Instalar dependências
8. [ ] Testar em light e dark mode

---

## 🎨 PONTOS CRÍTICOS VISUAIS

### Sidebar
- **Background**: Usa `var(--gradient-sidebar)` diretamente no style
- **Largura fixa**: `w-72` (288px)
- **Header**: `h-[65px]` com `bg-card border-b border-border`
- **Scrollbar**: Classe `scrollbar-thin` customizada
- **Cores de texto**: `text-sidebar-foreground/70` para items inativos
- **Hover**: `hover:bg-sidebar-accent/50`
- **Item ativo**: `bg-sidebar-accent` + barra primária à esquerda

### Topbar
- **Altura**: `h-[65px]`
- **Posição**: `sticky top-0 z-20`
- **Background**: `bg-background border-b border-border`

### Cores que NÃO PODEM FALTAR
- `sidebar-background`, `sidebar-foreground`, `sidebar-accent`, `sidebar-border`
- `--gradient-sidebar` no CSS
- Classes Tailwind: `bg-sidebar-accent/50`, `text-sidebar-foreground/70`, `border-sidebar-border`

---

## 🗄️ TABELAS DO BANCO DE DADOS

### tab_menu_item
```sql
CREATE TABLE tab_menu_item (
  cod_menu_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  des_nome TEXT NOT NULL,
  des_caminho TEXT NOT NULL,
  des_icone TEXT,
  seq_menu_pai UUID REFERENCES tab_menu_item(cod_menu_item),
  ind_nova_aba BOOLEAN DEFAULT false,
  num_ordem INTEGER DEFAULT 0,
  ind_admin_only BOOLEAN DEFAULT false,
  ind_ativo BOOLEAN DEFAULT true,
  des_tags TEXT[],
  dta_cadastro TIMESTAMPTZ DEFAULT now(),
  dta_atualizacao TIMESTAMPTZ DEFAULT now()
);
```

### tab_notificacao
```sql
CREATE TABLE tab_notificacao (
  cod_notificacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_usuario UUID NOT NULL,
  seq_usuario_origem UUID,
  des_tipo TEXT NOT NULL,
  des_titulo TEXT NOT NULL,
  des_mensagem TEXT NOT NULL,
  des_link TEXT,
  ind_lida BOOLEAN DEFAULT false,
  dta_cadastro TIMESTAMPTZ DEFAULT now()
);
```

### tab_perfil_usuario
```sql
CREATE TABLE tab_perfil_usuario (
  cod_usuario UUID PRIMARY KEY,
  des_nome_completo TEXT,
  des_email TEXT,
  des_avatar_url TEXT,
  des_cargo TEXT,
  des_departamento TEXT,
  des_unidade TEXT,
  ind_ativo BOOLEAN DEFAULT true,
  dta_cadastro TIMESTAMPTZ DEFAULT now(),
  dta_atualizacao TIMESTAMPTZ DEFAULT now()
);
```

---

## ⚡ FUNCIONALIDADES PRINCIPAIS

1. **Menu Dinâmico**: Carregado do banco, com cache e realtime updates
2. **Busca Fuzzy**: Pesquisa em menus, comunicados, FAQs e KB
3. **Notificações Real-time**: Subscription Supabase para atualizações instantâneas
4. **Theme Toggle Animado**: Efeito circular com View Transitions API
5. **Permissões**: Menus filtrados por role/permissão do usuário
6. **N Níveis de Menu**: Suporte hierárquico ilimitado
7. **Indicadores Visuais**: Item ativo, links externos, contador de notificações
