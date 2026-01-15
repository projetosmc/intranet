/**
 * 🎨 Theme Configuration - Monte Carlo Hub Design System
 * 
 * Este arquivo contém todas as variáveis de tema do projeto para fácil
 * importação e replicação em outros projetos.
 * 
 * @usage
 * import { theme, cssVariables, tailwindExtend } from '@/config/theme.config';
 */

// ============================================================================
// 📐 DESIGN TOKENS
// ============================================================================

export const theme = {
  // Fontes
  fonts: {
    sans: ['Inter', 'Figtree', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
  },

  // Tamanho base da fonte
  baseFontSize: '14px',

  // Border Radius
  radius: {
    sm: 'calc(var(--radius) - 4px)',
    md: 'calc(var(--radius) - 2px)',
    lg: 'var(--radius)',
    xl: 'calc(var(--radius) + 4px)',
    '2xl': 'calc(var(--radius) + 4px)',
    '3xl': 'calc(var(--radius) + 8px)',
    full: '9999px',
  },

  // Sidebar
  sidebar: {
    width: '288px', // w-72
    headerHeight: '65px',
  },
} as const;

// ============================================================================
// 🎨 CSS VARIABLES (para index.css)
// ============================================================================

export const cssVariables = {
  light: {
    // Cores Base
    '--background': '210 20% 98%',
    '--foreground': '222 47% 11%',

    // Cards e Popovers
    '--card': '0 0% 100%',
    '--card-foreground': '222 47% 11%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '222 47% 11%',

    // Cor Primária (Teal/Cyan)
    '--primary': '195 100% 44%',
    '--primary-foreground': '0 0% 100%',

    // Secundária e Muted
    '--secondary': '215 20% 95%',
    '--secondary-foreground': '222 47% 11%',
    '--muted': '215 20% 95%',
    '--muted-foreground': '215 16% 47%',

    // Accent
    '--accent': '195 100% 44%',
    '--accent-foreground': '0 0% 100%',

    // Destrutivo
    '--destructive': '0 84% 60%',
    '--destructive-foreground': '0 0% 100%',

    // Status Colors
    '--success': '142 76% 36%',
    '--success-foreground': '0 0% 100%',
    '--warning': '43 96% 56%',
    '--warning-foreground': '0 0% 100%',
    '--info': '217 91% 60%',
    '--info-foreground': '0 0% 100%',

    // Status Específicos
    '--status-pending': '43 96% 56%',
    '--status-approved': '142 76% 36%',
    '--status-rejected': '0 84% 60%',
    '--status-awaiting': '217 91% 60%',
    '--status-late': '25 95% 53%',

    // Bordas e Input
    '--border': '214 32% 91%',
    '--input': '214 32% 91%',
    '--ring': '195 81% 60%',

    // Border Radius
    '--radius': '1.5rem',

    // Sidebar (Deep Navy)
    '--sidebar-background': '210 30% 12%',
    '--sidebar-foreground': '210 40% 98%',
    '--sidebar-primary': '0 0% 98%',
    '--sidebar-primary-foreground': '195 100% 44%',
    '--sidebar-accent': '0 0% 30%',
    '--sidebar-accent-foreground': '0 0% 98%',
    '--sidebar-border': '210 30% 18%',
    '--sidebar-ring': '195 81% 60%',

    // Gradientes
    '--gradient-primary': 'linear-gradient(135deg, hsl(195 100% 44%) 0%, hsl(195 100% 35%) 100%)',
    '--gradient-card': 'linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(210 20% 98%) 100%)',
    '--gradient-sidebar': 'linear-gradient(180deg, hsl(210 30% 12%) 0%, hsl(210 30% 8%) 100%)',
    '--gradient-hero': 'linear-gradient(135deg, hsl(195 100% 44% / 0.1) 0%, hsl(217 91% 60% / 0.1) 100%)',

    // Sombras
    '--shadow-sm': '0 1px 2px 0 hsl(222 47% 11% / 0.05)',
    '--shadow-md': '0 4px 6px -1px hsl(222 47% 11% / 0.1), 0 2px 4px -2px hsl(222 47% 11% / 0.1)',
    '--shadow-lg': '0 10px 15px -3px hsl(222 47% 11% / 0.1), 0 4px 6px -4px hsl(222 47% 11% / 0.1)',
    '--shadow-xl': '0 20px 25px -5px hsl(222 47% 11% / 0.1), 0 8px 10px -6px hsl(222 47% 11% / 0.1)',
    '--shadow-glow': '0 0 20px hsl(195 100% 44% / 0.3)',
  },

  dark: {
    '--background': '222 47% 5%',
    '--foreground': '210 40% 98%',

    '--card': '222 47% 8%',
    '--card-foreground': '210 40% 98%',

    '--popover': '222 47% 8%',
    '--popover-foreground': '210 40% 98%',

    '--primary': '195 100% 44%',
    '--primary-foreground': '0 0% 100%',

    '--secondary': '217 33% 17%',
    '--secondary-foreground': '210 40% 98%',
    '--muted': '217 33% 17%',
    '--muted-foreground': '215 20% 65%',

    '--accent': '195 100% 44%',
    '--accent-foreground': '0 0% 100%',

    '--destructive': '0 62% 30%',
    '--destructive-foreground': '210 40% 98%',

    '--border': '217 33% 17%',
    '--input': '217 33% 17%',
    '--ring': '195 81% 60%',

    '--sidebar-background': '222 47% 8%',
    '--sidebar-foreground': '210 40% 98%',
    '--sidebar-primary': '195 100% 44%',
    '--sidebar-primary-foreground': '0 0% 100%',
    '--sidebar-accent': '217 33% 17%',
    '--sidebar-accent-foreground': '210 40% 98%',
    '--sidebar-border': '217 33% 20%',
    '--sidebar-ring': '195 81% 60%',

    '--gradient-card': 'linear-gradient(135deg, hsl(217 33% 17% / 0.9) 0%, hsl(222 47% 11% / 0.8) 100%)',
  },
} as const;

// ============================================================================
// 🔧 TAILWIND EXTEND CONFIG
// ============================================================================

export const tailwindExtend = {
  fontFamily: {
    sans: theme.fonts.sans,
    mono: theme.fonts.mono,
  },

  colors: {
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))',
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    primary: {
      DEFAULT: 'hsl(var(--primary))',
      foreground: 'hsl(var(--primary-foreground))',
    },
    secondary: {
      DEFAULT: 'hsl(var(--secondary))',
      foreground: 'hsl(var(--secondary-foreground))',
    },
    destructive: {
      DEFAULT: 'hsl(var(--destructive))',
      foreground: 'hsl(var(--destructive-foreground))',
    },
    success: {
      DEFAULT: 'hsl(var(--success))',
      foreground: 'hsl(var(--success-foreground))',
    },
    warning: {
      DEFAULT: 'hsl(var(--warning))',
      foreground: 'hsl(var(--warning-foreground))',
    },
    info: {
      DEFAULT: 'hsl(var(--info))',
      foreground: 'hsl(var(--info-foreground))',
    },
    muted: {
      DEFAULT: 'hsl(var(--muted))',
      foreground: 'hsl(var(--muted-foreground))',
    },
    accent: {
      DEFAULT: 'hsl(var(--accent))',
      foreground: 'hsl(var(--accent-foreground))',
    },
    popover: {
      DEFAULT: 'hsl(var(--popover))',
      foreground: 'hsl(var(--popover-foreground))',
    },
    card: {
      DEFAULT: 'hsl(var(--card))',
      foreground: 'hsl(var(--card-foreground))',
    },
    sidebar: {
      DEFAULT: 'hsl(var(--sidebar-background))',
      foreground: 'hsl(var(--sidebar-foreground))',
      primary: 'hsl(var(--sidebar-primary))',
      'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
      accent: 'hsl(var(--sidebar-accent))',
      'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
      border: 'hsl(var(--sidebar-border))',
      ring: 'hsl(var(--sidebar-ring))',
    },
    status: {
      pending: 'hsl(var(--status-pending))',
      approved: 'hsl(var(--status-approved))',
      rejected: 'hsl(var(--status-rejected))',
      awaiting: 'hsl(var(--status-awaiting))',
      late: 'hsl(var(--status-late))',
    },
  },

  borderRadius: {
    lg: 'var(--radius)',
    md: 'calc(var(--radius) - 2px)',
    sm: 'calc(var(--radius) - 4px)',
    '2xl': 'calc(var(--radius) + 4px)',
    '3xl': 'calc(var(--radius) + 8px)',
  },

  boxShadow: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
    glow: 'var(--shadow-glow)',
  },

  keyframes: {
    'accordion-down': {
      from: { height: '0', opacity: '0' },
      to: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
    },
    'accordion-up': {
      from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
      to: { height: '0', opacity: '0' },
    },
    'fade-in': {
      '0%': { opacity: '0', transform: 'translateY(10px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    'fade-out': {
      '0%': { opacity: '1', transform: 'translateY(0)' },
      '100%': { opacity: '0', transform: 'translateY(10px)' },
    },
    'scale-in': {
      '0%': { transform: 'scale(0.95)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' },
    },
    'scale-out': {
      from: { transform: 'scale(1)', opacity: '1' },
      to: { transform: 'scale(0.95)', opacity: '0' },
    },
    'slide-in-right': {
      '0%': { transform: 'translateX(100%)' },
      '100%': { transform: 'translateX(0)' },
    },
    'slide-out-right': {
      '0%': { transform: 'translateX(0)' },
      '100%': { transform: 'translateX(100%)' },
    },
    float: {
      '0%, 100%': { transform: 'translateY(0px)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    'glow-pulse': {
      '0%, 100%': { boxShadow: '0 0 10px hsl(195 100% 44% / 0.2)' },
      '50%': { boxShadow: 'var(--shadow-glow)' },
    },
  },

  animation: {
    'accordion-down': 'accordion-down 0.2s ease-out',
    'accordion-up': 'accordion-up 0.2s ease-out',
    'fade-in': 'fade-in 0.3s ease-out',
    'fade-out': 'fade-out 0.3s ease-out',
    'scale-in': 'scale-in 0.2s ease-out',
    'scale-out': 'scale-out 0.2s ease-out',
    'slide-in-right': 'slide-in-right 0.3s ease-out',
    'slide-out-right': 'slide-out-right 0.3s ease-out',
    float: 'float 6s ease-in-out infinite',
    'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
    enter: 'fade-in 0.3s ease-out, scale-in 0.2s ease-out',
    exit: 'fade-out 0.3s ease-out, scale-out 0.2s ease-out',
  },
} as const;

// ============================================================================
// 🎭 UTILITY CLASSES (para adicionar no index.css)
// ============================================================================

export const utilityClasses = {
  // Glass Card Effect
  glassCard: 'bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl shadow-md',

  // Gradient Text
  gradientText: 'bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70',

  // Shadow Glow
  shadowGlow: 'shadow-[0_0_20px_hsl(195_100%_44%_/_0.3)]',

  // Hover Lift
  hoverLift: 'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg',

  // Skeleton Loading
  skeleton: 'animate-pulse bg-muted rounded-lg',

  // Status Badges
  statusBadge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  statusPending: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  statusApproved: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
  statusRejected: 'bg-red-500/10 text-red-500 border border-red-500/20',
  statusAwaiting: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
  statusLate: 'bg-orange-500/10 text-orange-500 border border-orange-500/20',

  // Scrollbar
  scrollbarThin: 'scrollbar-thin',
} as const;

// ============================================================================
// 📏 SIDEBAR TYPOGRAPHY
// ============================================================================

export const sidebarTypography = {
  // Depth 0-1: Headers/Categorias
  header: 'text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70',

  // Depth 2+: Itens clicáveis
  item: 'text-sm font-medium text-sidebar-foreground/70',

  // Item ativo
  itemActive: 'text-sidebar-foreground font-semibold',

  // Item hover
  itemHover: 'hover:text-sidebar-foreground',

  // Ícone inativo
  iconInactive: 'text-sidebar-foreground/50',

  // Ícone ativo
  iconActive: 'text-primary',

  // Ícone hover
  iconHover: 'group-hover:text-sidebar-foreground',
} as const;

// ============================================================================
// 🌈 HEX COLOR REFERENCE (para design tools)
// ============================================================================

export const hexColors = {
  // Cores Primárias
  primary: '#00A0C6',        // Teal vibrante
  primaryDark: '#008AAD',    // Teal escuro

  // Backgrounds
  backgroundLight: '#F7F9FB',  // Cinza azulado claro
  backgroundDark: '#0A0D12',   // Quase preto

  // Sidebar
  sidebarBg: '#16202A',       // Deep Navy
  sidebarBgDark: '#0D1117',   // Mais escuro ainda

  // Cards
  cardLight: '#FFFFFF',
  cardDark: '#141B24',

  // Texto
  textLight: '#1A2332',       // Azul muito escuro
  textDark: '#F5F7FA',        // Branco azulado

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Bordas
  borderLight: '#E2E8F0',
  borderDark: '#283548',
} as const;

// ============================================================================
// 📤 EXPORTS ADICIONAIS
// ============================================================================

// Google Fonts link para index.html
export const googleFontsLink = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">`;

// Dependências necessárias
export const dependencies = [
  'framer-motion',
  'tailwindcss-animate',
  'lucide-react',
  'class-variance-authority',
  'clsx',
  'tailwind-merge',
] as const;

// Default export com tudo
const themeConfig = {
  theme,
  cssVariables,
  tailwindExtend,
  utilityClasses,
  sidebarTypography,
  hexColors,
  googleFontsLink,
  dependencies,
};

export default themeConfig;
