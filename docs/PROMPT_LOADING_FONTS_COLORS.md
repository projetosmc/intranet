# Prompt para Replicar Sistema de Loading, Fontes e Cores

Use este prompt para aplicar o mesmo design system em outro projeto Lovable.

---

## 📋 PROMPT COMPLETO

```
Implemente um design system completo com sistema de loading global, paleta de cores com suporte a dark mode e configuração de fontes seguindo estas especificações:

## 1. SISTEMA DE LOADING GLOBAL

### Arquitetura
- Context Provider (GlobalLoadingContext) envolvendo toda a aplicação
- Hook useLoadingState para gerenciar múltiplos estados de loading
- Componentes visuais: barra de progresso, spinner e ícone inline

### GlobalLoadingContext

Interface do contexto:
```typescript
interface GlobalLoadingContextType {
  isLoading: boolean;
  isLoadingKey: (key: string) => boolean;
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
  withLoading: <T>(fn: () => Promise<T>, key?: string) => Promise<T>;
  loadingKeys: string[];
}
```

### useLoadingState Hook

Funcionalidades:
- `startLoading(key?)`: inicia loading para uma chave específica ou 'default'
- `stopLoading(key?)`: para loading para uma chave
- `isLoadingKey(key)`: verifica se uma chave específica está carregando
- `withLoading(fn, key?)`: wrapper async que gerencia loading automaticamente
- `loadingKeys`: array com todas as chaves em loading
- `isLoading`: boolean global (true se qualquer chave está carregando)

### GlobalLoadingIndicator (Barra de Progresso)

Estrutura visual:
- Posição: fixed, top-0, left-0, right-0, z-[100], h-1
- Animação com framer-motion AnimatePresence
- Background track: bg-primary/20
- Barra animada: bg-primary
- Efeito shimmer: gradient via-white/30

Animação da barra:
```typescript
animate={{
  width: ["0%", "40%", "70%", "100%"],
  x: ["0%", "0%", "0%", "0%"],
}}
transition={{
  duration: 2,
  ease: "easeInOut",
  repeat: Infinity,
  repeatType: "loop",
}}
```

Efeito shimmer:
```typescript
initial={{ x: "-100%" }}
animate={{ x: "500%" }}
transition={{
  duration: 1.5,
  ease: "easeInOut",
  repeat: Infinity,
  repeatDelay: 0.5,
}}
```

### GlobalLoadingSpinner (Alternativo com Ícone)

Estrutura:
- Posição: fixed top-4 right-4 z-[100]
- Container: pill shape com bg-card border shadow-lg
- Ícone customizado (loading-icon.png) com animação
- Texto "Carregando..."

Animação do ícone:
```typescript
animate={{
  opacity: [0.4, 1, 0.4],
  scale: [0.9, 1.1, 0.9],
}}
transition={{
  duration: 1.5,
  ease: "easeInOut",
  repeat: Infinity,
}}
```

### LoadingIcon (Inline)

Props:
- size: 'sm' | 'md' | 'lg'
- className: string

Tamanhos:
- sm: w-4 h-4
- md: w-6 h-6
- lg: w-8 h-8

---

## 2. FONTES

### Google Fonts
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Figtree:wght@400;500;600;700&display=swap">
```

### Configuração CSS
```css
body {
  font-family: 'Inter', 'Figtree', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

html {
  font-size: 14px;
}
```

### Tailwind Config
```typescript
fontFamily: {
  sans: ['Inter', 'Figtree', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
}
```

---

## 3. PALETA DE CORES (Light Mode)

### Cores Base
```css
:root {
  --background: 210 20% 98%;        /* Cinza muito claro azulado */
  --foreground: 222 47% 11%;        /* Azul escuro quase preto */
}
```

### Cards e Popovers
```css
:root {
  --card: 0 0% 100%;                /* Branco puro */
  --card-foreground: 222 47% 11%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
}
```

### Cor Primária (Teal/Cyan)
```css
:root {
  --primary: 195 100% 44%;          /* #00A0C6 - Teal vibrante */
  --primary-foreground: 0 0% 100%;  /* Branco */
}
```

### Secundária e Muted
```css
:root {
  --secondary: 215 20% 95%;
  --secondary-foreground: 222 47% 11%;
  --muted: 215 20% 95%;
  --muted-foreground: 215 16% 47%;
}
```

### Accent
```css
:root {
  --accent: 195 100% 44%;           /* Mesmo que primary */
  --accent-foreground: 0 0% 100%;
}
```

### Destrutivo
```css
:root {
  --destructive: 0 84% 60%;         /* Vermelho */
  --destructive-foreground: 0 0% 100%;
}
```

### Status Colors
```css
:root {
  --success: 142 76% 36%;           /* Verde */
  --success-foreground: 0 0% 100%;
  --warning: 43 96% 56%;            /* Amarelo/Âmbar */
  --warning-foreground: 0 0% 100%;
  --info: 217 91% 60%;              /* Azul */
  --info-foreground: 0 0% 100%;
  
  /* Status específicos */
  --status-pending: 43 96% 56%;     /* Amarelo */
  --status-approved: 142 76% 36%;   /* Verde */
  --status-rejected: 0 84% 60%;     /* Vermelho */
  --status-awaiting: 217 91% 60%;   /* Azul */
  --status-late: 25 95% 53%;        /* Laranja */
}
```

### Bordas e Input
```css
:root {
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 195 81% 60%;              /* Teal mais claro para focus */
}
```

### Border Radius
```css
:root {
  --radius: 1.5rem;                 /* 24px - bem arredondado */
}
```

### Sidebar (Deep Navy)
```css
:root {
  --sidebar-background: 210 30% 12%;
  --sidebar-foreground: 210 40% 98%;
  --sidebar-primary: 0 0% 98%;
  --sidebar-primary-foreground: 195 100% 44%;
  --sidebar-accent: 0 0% 30%;
  --sidebar-accent-foreground: 0 0% 98%;
  --sidebar-border: 210 30% 18%;
  --sidebar-ring: 195 81% 60%;
}
```

### Gradientes
```css
:root {
  --gradient-primary: linear-gradient(135deg, hsl(195 100% 44%) 0%, hsl(195 100% 35%) 100%);
  --gradient-card: linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(210 20% 98%) 100%);
  --gradient-sidebar: linear-gradient(180deg, hsl(210 30% 12%) 0%, hsl(210 30% 8%) 100%);
  --gradient-hero: linear-gradient(135deg, hsl(195 100% 44% / 0.1) 0%, hsl(217 91% 60% / 0.1) 100%);
}
```

### Sombras
```css
:root {
  --shadow-sm: 0 1px 2px 0 hsl(222 47% 11% / 0.05);
  --shadow-md: 0 4px 6px -1px hsl(222 47% 11% / 0.1), 0 2px 4px -2px hsl(222 47% 11% / 0.1);
  --shadow-lg: 0 10px 15px -3px hsl(222 47% 11% / 0.1), 0 4px 6px -4px hsl(222 47% 11% / 0.1);
  --shadow-xl: 0 20px 25px -5px hsl(222 47% 11% / 0.1), 0 8px 10px -6px hsl(222 47% 11% / 0.1);
  --shadow-glow: 0 0 20px hsl(195 100% 44% / 0.3);
}
```

---

## 4. PALETA DE CORES (Dark Mode)

```css
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
```

---

## 5. CLASSES UTILITÁRIAS CSS

### Glass Card
```css
.glass-card {
  @apply bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl;
  box-shadow: var(--shadow-md);
}
```

### Gradient Text
```css
.gradient-text {
  @apply bg-clip-text text-transparent;
  background-image: var(--gradient-primary);
}
```

### Shadow Glow
```css
.shadow-glow {
  box-shadow: var(--shadow-glow);
}
```

### Status Badges
```css
.status-badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.status-pending {
  @apply bg-amber-500/10 text-amber-500 border border-amber-500/20;
}

.status-approved {
  @apply bg-emerald-500/10 text-emerald-500 border border-emerald-500/20;
}

.status-rejected {
  @apply bg-red-500/10 text-red-500 border border-red-500/20;
}

.status-awaiting {
  @apply bg-blue-500/10 text-blue-500 border border-blue-500/20;
}

.status-late {
  @apply bg-orange-500/10 text-orange-500 border border-orange-500/20;
}
```

### Hover Lift Effect
```css
.hover-lift {
  @apply transition-all duration-300 ease-out;
}

.hover-lift:hover {
  @apply -translate-y-1;
  box-shadow: var(--shadow-lg);
}
```

### Skeleton Loading
```css
.skeleton {
  @apply animate-pulse bg-muted rounded-lg;
}
```

### Custom Scrollbar
```css
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted)) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  @apply bg-muted rounded-full;
}
```

---

## 6. ANIMAÇÕES CSS

### Keyframes
```css
@keyframes ripple-effect {
  0% { transform: scale(0); opacity: 0.4; }
  100% { transform: scale(4); opacity: 0; }
}

@keyframes animate-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 10px hsl(195 100% 44% / 0.2); }
  50% { box-shadow: var(--shadow-glow); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

### Classes de Animação
```css
.animate-in { animation: animate-in 0.3s ease-out; }
.animate-slide-in-left { animation: slide-in-left 0.3s ease-out; }
.animate-float { animation: float 6s ease-in-out infinite; }
.animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }
.animate-fade-in { animation: fade-in 0.3s ease-out; }
.animate-scale-in { animation: scale-in 0.2s ease-out; }
```

---

## 7. TAILWIND CONFIG - CORES ESTENDIDAS

```typescript
colors: {
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))",
  },
  success: {
    DEFAULT: "hsl(var(--success))",
    foreground: "hsl(var(--success-foreground))",
  },
  warning: {
    DEFAULT: "hsl(var(--warning))",
    foreground: "hsl(var(--warning-foreground))",
  },
  info: {
    DEFAULT: "hsl(var(--info))",
    foreground: "hsl(var(--info-foreground))",
  },
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))",
  },
  accent: {
    DEFAULT: "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))",
  },
  popover: {
    DEFAULT: "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))",
  },
  card: {
    DEFAULT: "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))",
  },
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
  status: {
    pending: "hsl(var(--status-pending))",
    approved: "hsl(var(--status-approved))",
    rejected: "hsl(var(--status-rejected))",
    awaiting: "hsl(var(--status-awaiting))",
    late: "hsl(var(--status-late))",
  },
}
```

---

## 8. TAILWIND CONFIG - BORDER RADIUS

```typescript
borderRadius: {
  lg: "var(--radius)",
  md: "calc(var(--radius) - 2px)",
  sm: "calc(var(--radius) - 4px)",
  "2xl": "calc(var(--radius) + 4px)",
  "3xl": "calc(var(--radius) + 8px)",
}
```

---

## 9. TAILWIND CONFIG - BOX SHADOWS

```typescript
boxShadow: {
  'sm': 'var(--shadow-sm)',
  'md': 'var(--shadow-md)',
  'lg': 'var(--shadow-lg)',
  'xl': 'var(--shadow-xl)',
  'glow': 'var(--shadow-glow)',
}
```

---

## 10. TAILWIND CONFIG - ANIMAÇÕES

```typescript
keyframes: {
  "accordion-down": {
    from: { height: "0", opacity: "0" },
    to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
  },
  "accordion-up": {
    from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
    to: { height: "0", opacity: "0" },
  },
  "fade-in": {
    "0%": { opacity: "0", transform: "translateY(10px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
  "fade-out": {
    "0%": { opacity: "1", transform: "translateY(0)" },
    "100%": { opacity: "0", transform: "translateY(10px)" },
  },
  "scale-in": {
    "0%": { transform: "scale(0.95)", opacity: "0" },
    "100%": { transform: "scale(1)", opacity: "1" },
  },
  "scale-out": {
    from: { transform: "scale(1)", opacity: "1" },
    to: { transform: "scale(0.95)", opacity: "0" },
  },
  "slide-in-right": {
    "0%": { transform: "translateX(100%)" },
    "100%": { transform: "translateX(0)" },
  },
  "slide-out-right": {
    "0%": { transform: "translateX(0)" },
    "100%": { transform: "translateX(100%)" },
  },
  "float": {
    "0%, 100%": { transform: "translateY(0px)" },
    "50%": { transform: "translateY(-10px)" },
  },
  "glow-pulse": {
    "0%, 100%": { boxShadow: "0 0 10px hsl(195 100% 44% / 0.2)" },
    "50%": { boxShadow: "var(--shadow-glow)" },
  },
},
animation: {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
  "fade-in": "fade-in 0.3s ease-out",
  "fade-out": "fade-out 0.3s ease-out",
  "scale-in": "scale-in 0.2s ease-out",
  "scale-out": "scale-out 0.2s ease-out",
  "slide-in-right": "slide-in-right 0.3s ease-out",
  "slide-out-right": "slide-out-right 0.3s ease-out",
  "float": "float 6s ease-in-out infinite",
  "glow-pulse": "glow-pulse 2s ease-in-out infinite",
  "enter": "fade-in 0.3s ease-out, scale-in 0.2s ease-out",
  "exit": "fade-out 0.3s ease-out, scale-out 0.2s ease-out",
}
```

---

## 📦 DEPENDÊNCIAS

```bash
npm install framer-motion tailwindcss-animate
```

---

## 📁 ESTRUTURA DE ARQUIVOS

```
src/
├── assets/
│   └── loading-icon.png          # Ícone customizado para loading
├── components/
│   └── layout/
│       └── GlobalLoadingIndicator.tsx
├── contexts/
│   └── GlobalLoadingContext.tsx
├── hooks/
│   └── useLoadingState.ts
└── index.css                      # Variáveis CSS e classes utilitárias
```

---

## 🎨 RESUMO DA IDENTIDADE VISUAL

| Elemento | Valor |
|----------|-------|
| Cor Primária | Teal #00A0C6 (195 100% 44%) |
| Background Light | Cinza azulado claro |
| Background Dark | Azul muito escuro |
| Sidebar | Deep Navy com gradiente |
| Fontes | Inter + Figtree |
| Border Radius | 24px (muito arredondado) |
| Estilo | Clean, moderno, corporativo |
```

---

## ⚡ USO NO CÓDIGO

### Provider no App
```tsx
<GlobalLoadingProvider>
  <MainLayout>
    {/* conteúdo */}
  </MainLayout>
</GlobalLoadingProvider>
```

### Indicador no Layout
```tsx
const { isLoading } = useGlobalLoading();
return (
  <div>
    <GlobalLoadingIndicator isLoading={isLoading} />
    {/* resto do layout */}
  </div>
);
```

### Em Componentes
```tsx
const { withLoading } = useGlobalLoading();

const handleSubmit = async () => {
  await withLoading(async () => {
    await saveData();
  }, 'save');
};
```
