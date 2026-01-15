# 📚 Design System do Sidebar - Documentação Completa

Este documento contém todas as especificações de cores, fontes, estilos e componentes do sidebar para replicação em outros projetos.

---

## 📐 Estrutura Geral

```
┌──────────────────────────────────────┐
│           HEADER (65px)              │  ← bg-card, border-b
├──────────────────────────────────────┤
│         ADMIN BADGE (opcional)       │  ← bg-primary/10
├──────────────────────────────────────┤
│           SEARCH BAR                 │  ← bg-sidebar-accent/50
├──────────────────────────────────────┤
│                                      │
│           NAVIGATION                 │  ← gradient-sidebar
│           (flex-1, scroll)           │
│                                      │
├──────────────────────────────────────┤
│             FOOTER                   │  ← border-t
└──────────────────────────────────────┘
```

### Dimensões
| Elemento | Valor |
|----------|-------|
| **Largura total** | `w-72` (288px) |
| **Altura header** | `h-[65px]` |
| **Posição** | `fixed left-0 top-0 z-40` |
| **Altura** | `h-screen` |

---

## 🎨 Variáveis CSS do Sidebar

### Light Mode (:root)
```css
:root {
  /* Sidebar (Deep Navy) */
  --sidebar-background: 210 30% 12%;           /* #16202a - Azul muito escuro */
  --sidebar-foreground: 210 40% 98%;           /* #f5f7fa - Branco azulado */
  --sidebar-primary: 0 0% 98%;                 /* #fafafa - Branco */
  --sidebar-primary-foreground: 195 100% 44%;  /* #00a0c6 - Teal */
  --sidebar-accent: 0 0% 30%;                  /* #4d4d4d - Cinza escuro */
  --sidebar-accent-foreground: 0 0% 98%;       /* #fafafa - Branco */
  --sidebar-border: 210 30% 18%;               /* #212e3a - Azul escuro */
  --sidebar-ring: 195 81% 60%;                 /* #4cc9e9 - Teal claro */
  
  /* Gradiente do Sidebar */
  --gradient-sidebar: linear-gradient(180deg, hsl(210 30% 12%) 0%, hsl(210 30% 8%) 100%);
}
```

### Dark Mode (.dark)
```css
.dark {
  --sidebar-background: 222 47% 8%;            /* #0d1117 - Quase preto */
  --sidebar-foreground: 210 40% 98%;           /* #f5f7fa - Branco azulado */
  --sidebar-primary: 195 100% 44%;             /* #00a0c6 - Teal */
  --sidebar-primary-foreground: 0 0% 100%;     /* #ffffff - Branco puro */
  --sidebar-accent: 217 33% 17%;               /* #1f2937 - Cinza azulado */
  --sidebar-accent-foreground: 210 40% 98%;    /* #f5f7fa - Branco azulado */
  --sidebar-border: 217 33% 20%;               /* #283548 - Cinza azulado */
  --sidebar-ring: 195 81% 60%;                 /* #4cc9e9 - Teal claro */
}
```

---

## 📝 Tipografia

### Fontes
```css
body {
  font-family: 'Inter', 'Figtree', ui-sans-serif, system-ui, -apple-system, 
               BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

html {
  font-size: 14px;  /* Base */
}
```

### Google Fonts (index.html)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 🔤 Hierarquia de Texto no Menu

### Por Nível de Profundidade (depth)

| Depth | Tipo | Tamanho | Peso | Estilo | Cor |
|-------|------|---------|------|--------|-----|
| **0** | Header/Categoria | `text-xs` (12px) | `font-semibold` | `uppercase tracking-wider` | `text-sidebar-foreground/70` |
| **1** | Subcategoria | `text-xs` (12px) | `font-semibold` | `uppercase tracking-wider` | `text-sidebar-foreground/70` |
| **2** | Item clicável | `text-sm` (14px) | `font-medium` | Normal | `text-sidebar-foreground/70` ou `/80` |
| **3+** | Sub-item | `text-sm` (14px) | `font-normal` | Normal | `text-sidebar-foreground/70` |

### Estados de Texto

| Estado | Classes |
|--------|---------|
| **Inativo** | `text-sidebar-foreground/70` |
| **Hover** | `text-sidebar-foreground` (100%) |
| **Ativo** | `text-sidebar-foreground font-semibold` |

---

## 🎨 Cores dos Ícones

| Estado | Classes | Descrição |
|--------|---------|-----------|
| **Inativo** | `text-sidebar-foreground/50` | 50% opacidade |
| **Hover** | `text-sidebar-foreground` | 100% opacidade |
| **Ativo** | `text-primary` | Teal (#00a0c6) |

### Tamanho dos Ícones
```tsx
// Padrão para todos os níveis
className="h-4 w-4"

// Link externo (menor)
className="h-3 w-3"
```

---

## 📦 Componentes do Sidebar

### 1. Container Principal
```tsx
<aside
  className="fixed left-0 top-0 z-40 h-screen w-72 flex flex-col"
  style={{ background: 'var(--gradient-sidebar)' }}
>
```

### 2. Header com Logo
```tsx
<div className="flex items-center justify-center px-6 h-[65px] bg-card border-b border-border">
  <img 
    src="/logo.png" 
    alt="Logo" 
    className="h-12 w-auto object-contain"
  />
</div>
```

### 3. Admin Badge
```tsx
<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
  <Shield className="h-4 w-4 text-primary" />
  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
    Administrador
  </span>
</div>
```

### 4. Search Bar
```tsx
<Input
  className="pl-9 bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 text-sm h-9"
/>
```

### 5. Navigation Container
```tsx
<nav className="flex-1 overflow-y-auto py-4 px-2 mt-2 space-y-1 scrollbar-thin">
```

### 6. Footer
```tsx
<div className="p-4 border-t border-sidebar-border">
  <span className="text-xs text-sidebar-foreground/40">v1.0.0</span>
</div>
```

---

## 🔗 Estilos de Links/Itens de Menu

### Item Clicável (NavLink)
```tsx
<NavLink
  className={cn(
    "ripple-container group flex items-center gap-2 rounded-lg transition-all duration-200 relative overflow-hidden",
    // Padding por profundidade
    depth === 0 && "px-3 py-2 text-sm font-medium",
    depth === 1 && "px-3 py-1.5 ml-2 text-sm font-medium",
    depth === 2 && "px-2.5 py-1.5 ml-1 text-sm font-medium",
    depth >= 3 && "px-2 py-1.5 ml-1 text-sm",
    // Estados
    active 
      ? "bg-sidebar-accent text-sidebar-foreground font-semibold hover:bg-sidebar-accent/80" 
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
  )}
>
```

### Indicador de Item Ativo
```tsx
{active && (
  <motion.div
    layoutId="activeIndicator"
    className={cn(
      "absolute left-0 top-1/2 -translate-y-1/2 bg-primary rounded-r-full",
      depth <= 1 ? "w-1 h-5" : "w-0.5 h-4"
    )}
  />
)}
```

### Menu Expansível (com filhos)
```tsx
<button
  className={cn(
    "w-full ripple-container group flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-all duration-200 relative overflow-hidden",
    // Headers (depth 0-1)
    (depth === 0 || depth === 1) && "text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70",
    // Submenus (depth 2+)
    depth >= 2 && "text-sm font-medium text-sidebar-foreground/80 pl-3",
    "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
  )}
>
```

### Seta de Expansão
```tsx
<ChevronDown className={cn(
  "h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40 transition-transform duration-200",
  expanded && "rotate-180 text-primary"
)} />
```

---

## 📊 Hierarquia Visual (Indentação)

### Bordas por Nível
```tsx
// Depth 0: sem borda
depth === 0 && "space-y-0.5 mt-1"

// Depth 1: borda grossa
depth === 1 && "space-y-0.5 ml-4 mt-1 border-l-2 border-sidebar-border/30 pl-2"

// Depth 2+: borda fina
depth >= 2 && "space-y-0.5 ml-3 mt-0.5 border-l border-sidebar-border/20 pl-2"
```

### Margens por Nível
```tsx
depth === 1 && "ml-2"
depth >= 2 && "ml-1"
```

---

## 🎭 Separadores

### Entre Grupos de Nível 1
```tsx
<div className="my-2 mx-2 border-t border-sidebar-border/40" />
```

### Separador Principal
```tsx
<div className="my-3 border-t border-sidebar-border" />
```

---

## ✨ Animações e Efeitos

### Ripple Effect
```css
.ripple-container {
  position: relative;
  overflow: hidden;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: hsl(var(--sidebar-ring) / 0.3);
  transform: scale(0);
  animation: ripple-effect 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple-effect {
  0% { transform: scale(0); opacity: 0.4; }
  100% { transform: scale(4); opacity: 0; }
}
```

### Expansão de Menu
```tsx
className={cn(
  "overflow-hidden transition-all duration-300 ease-in-out",
  expanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
)}
```

### Animação do Indicador Ativo (Framer Motion)
```tsx
<motion.div layoutId="activeIndicator" />
```

### Animação de Entrada
```tsx
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
>
```

---

## 📜 Scrollbar Customizada

```css
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted)) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: hsl(var(--muted));
  border-radius: 9999px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
```

---

## 🔧 Tailwind Config (Cores do Sidebar)

```typescript
// tailwind.config.ts
colors: {
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
}
```

---

## 📦 Dependências Necessárias

```bash
npm install framer-motion lucide-react react-router-dom fuse.js
```

---

## 🎯 Resumo Visual Rápido

| Elemento | Cor/Estilo |
|----------|------------|
| **Background Sidebar** | Deep Navy com gradiente vertical |
| **Texto Principal** | Branco azulado 98% |
| **Texto Inativo** | 70% opacidade |
| **Texto Hover** | 100% opacidade |
| **Texto Ativo** | Branco + font-semibold |
| **Ícone Inativo** | 50% opacidade |
| **Ícone Ativo** | Teal (#00a0c6) |
| **Indicador Ativo** | Barra teal à esquerda |
| **Background Hover** | sidebar-accent/50 |
| **Background Ativo** | sidebar-accent |
| **Headers** | text-xs, uppercase, tracking-wider |
| **Itens** | text-sm, font-medium |
| **Bordas** | sidebar-border (azul escuro sutil) |

---

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   └── layout/
│       ├── Sidebar.tsx        # Componente principal
│       └── MCTechBadge.tsx    # Badge do footer
├── index.css                  # Variáveis CSS
└── ...
```

---

*Documentação gerada automaticamente - Monte Carlo Hub v1.0*
