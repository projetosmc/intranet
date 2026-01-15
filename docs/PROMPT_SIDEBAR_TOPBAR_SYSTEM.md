# Prompt para Replicar Sidebar, Topbar, Notificações e Theme Toggler

Use este prompt para aplicar o mesmo visual e funcionalidades em outro projeto Lovable.

---

## 📋 PROMPT COMPLETO

```
Implemente um sistema de navegação completo com Sidebar, Topbar, sistema de notificações em tempo real e toggle de tema animado seguindo exatamente estas especificações:

## 1. ESTRUTURA DE LAYOUT

### MainLayout
- Layout fixo com sidebar à esquerda (288px de largura)
- Topbar fixa no topo (65px de altura)
- Área de conteúdo com margem esquerda de 288px
- Provider de loading global envolvendo todo o conteúdo

### Dependências Necessárias
- framer-motion (animações)
- fuse.js (busca fuzzy)
- date-fns (formatação de datas)
- lucide-react (ícones)
- Radix UI (dropdown, popover, avatar, scroll-area, tooltip)

---

## 2. SIDEBAR (w-72 / 288px fixo)

### Estrutura Visual
- Posição: fixed, left-0, top-0, z-40, h-screen
- Background: gradient customizado via CSS variable `--gradient-sidebar`
- Flex column com header, conteúdo e footer

### Header (h-[65px])
- Centralizado com logo
- Background: bg-card com border-b border-border

### Badge de Admin
- Visível apenas para usuários admin
- Estilo: bg-primary/10 border-primary/20
- Ícone Shield + texto "ADMINISTRADOR" uppercase
- Animação de entrada com framer-motion

### Barra de Busca
- Ícone Search à esquerda
- Input com placeholder "Buscar..."
- Background: bg-sidebar-accent/50
- Busca fuzzy usando Fuse.js em:
  - Menus (threshold: 0.4)
  - Comunicados
  - FAQs
  - Artigos da Base de Conhecimento
- Dropdown de resultados com ícones diferenciados por tipo

### Navegação Dinâmica
- Menus carregados do banco de dados (tab_menu_item)
- Suporte a N níveis de hierarquia
- Cache local de 5 minutos (localStorage)
- Realtime updates via Supabase subscription
- Menus container (sem página) não são clicáveis e não têm ícone
- Menus com filhos são expansíveis (ChevronDown animado)
- Indicador de item ativo: barra vertical primária à esquerda
- Ícone ExternalLink para links que abrem em nova aba

### Estilos de Menu por Nível
- Nível 0: text-xs font-semibold uppercase tracking-wider
- Nível 1: ml-2, border-l-2 border-sidebar-border/30
- Nível 2+: font-medium, border-l border-sidebar-border/20

### Footer
- Badge MCTech + versão (v1.0.0)
- Border-t border-sidebar-border

---

## 3. TOPBAR (h-[65px])

### Estrutura
- Header sticky, top-0, z-20
- Border-b border-border, bg-background
- Flex com items-center justify-end
- Animação de entrada: slide down + fade in

### Elementos (direita para esquerda)
1. **Indicador de Revalidação**
   - Ícone RefreshCw girando quando isRevalidating
   - Tooltip "Atualizando dados..."
   - Animate presence para fade in/out

2. **Theme Toggler Animado**
   - Botão ghost com ícone Sun/Moon
   - Usa View Transitions API para efeito circular
   - Fallback para toggle simples se não suportado

3. **Sino de Notificações**
   - Badge vermelho com contador (máx "9+")
   - Popover com lista de notificações
   - ScrollArea com h-80
   - Botão "Marcar todas como lidas"
   - Cada notificação mostra:
     - Avatar do usuário de origem
     - Título, mensagem, tempo relativo (date-fns ptBR)
     - Indicador de não lida (bolinha primária)
     - Botão de deletar

4. **Dropdown do Usuário**
   - Trigger com avatar + nome + email
   - Avatar com fallback de iniciais
   - Menu: Perfil, Separador, Sair (destructive)

5. **Botão Sair (desktop)**
   - Visível apenas em lg:
   - bg-destructive com ícone LogOut

---

## 4. SISTEMA DE NOTIFICAÇÕES (useNotificationsSystem hook)

### Interface Notification
```typescript
interface Notification {
  id: string;
  userId: string;
  originUserId?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  originUser?: {
    name: string;
    avatarUrl?: string;
  };
}
```

### Funcionalidades
- fetchNotifications: busca notificações do usuário
- markAsRead: marca uma notificação como lida
- markAllAsRead: marca todas como lidas
- deleteNotification: remove uma notificação
- createNotification: cria notificação para outro usuário
- Realtime subscription para novas notificações

### Tabela Necessária (tab_notificacao)
- cod_notificacao (PK, UUID)
- seq_usuario (FK para usuário alvo)
- seq_usuario_origem (FK opcional para usuário de origem)
- des_tipo, des_titulo, des_mensagem
- des_link (opcional)
- ind_lida (boolean)
- dta_cadastro (timestamp)

---

## 5. ANIMATED THEME TOGGLER

### Funcionamento
- Detecta tema atual via document.documentElement.classList
- Usa View Transitions API para efeito circular
- Animação: círculo expandindo do ponto do clique
- Duração: 400ms, ease-in-out
- Fallback: toggle simples sem animação

### CSS Necessário para View Transitions
```css
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
```

---

## 6. USER AVATAR COMPONENT

### Props
- size: "sm" | "md" | "lg" | "xl"
- src: URL da imagem (opcional)
- name: nome para iniciais (opcional)

### Tamanhos
- sm: h-8 w-8, text-xs
- md: h-10 w-10, text-sm
- lg: h-12 w-12, text-base
- xl: h-24 w-24, text-3xl

### Fallback
- Iniciais do nome (máx 2 caracteres)
- bg-primary text-primary-foreground

---

## 7. CSS VARIABLES NECESSÁRIAS

```css
:root {
  --gradient-sidebar: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%);
  
  --sidebar-background: /* cor de fundo */;
  --sidebar-foreground: /* cor do texto */;
  --sidebar-accent: /* cor de hover/seleção */;
  --sidebar-border: /* cor das bordas */;
}
```

---

## 8. ESTRUTURA DE ARQUIVOS

```
src/
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── AnimatedThemeToggler.tsx
│   │   └── MCTechBadge.tsx (opcional)
│   └── ui/
│       └── user-avatar.tsx
├── hooks/
│   ├── useNotificationsSystem.ts
│   ├── useAuth.ts
│   ├── useUserProfile.ts
│   └── useScreenPermission.ts
└── contexts/
    ├── AuthContext.tsx
    ├── UserContext.tsx
    └── GlobalLoadingContext.tsx
```

---

## 9. TABELAS DO BANCO DE DADOS

### tab_menu_item
- cod_menu_item (PK)
- des_nome, des_caminho, des_icone
- seq_menu_pai (self-reference)
- ind_nova_aba, num_ordem
- ind_admin_only, ind_ativo
- des_tags (array para busca)

### tab_notificacao
- cod_notificacao (PK)
- seq_usuario, seq_usuario_origem
- des_tipo, des_titulo, des_mensagem
- des_link, ind_lida, dta_cadastro

### tab_perfil_usuario
- cod_usuario (PK)
- des_nome_completo, des_email
- des_avatar_url, des_cargo
- des_departamento, des_unidade

---

## 10. ANIMAÇÕES CHAVE

### Sidebar
- Admin badge: opacity 0→1, y -10→0
- Search results: opacity 0→1, y -10→0
- Menu expansion: max-h 0→1000px, opacity 0→1
- Active indicator: layoutId animation

### Topbar
- Header: y -20→0, opacity 0→1
- Notification badge: scale 0→1
- Notification items: opacity 0→1, x -10→0

### Theme Toggle
- Círculo expansivo usando clip-path
- Pseudoelement ::view-transition-new(root)
```

---

## 🎨 CORES E TOKENS

Use semantic tokens do Tailwind/CSS para todas as cores:
- `sidebar-background`, `sidebar-foreground`, `sidebar-accent`, `sidebar-border`
- `primary`, `primary-foreground`
- `muted-foreground`, `destructive`, `destructive-foreground`
- `card`, `border`, `background`, `foreground`

---

## 📦 DEPENDÊNCIAS

```bash
npm install framer-motion fuse.js date-fns lucide-react
npm install @radix-ui/react-dropdown-menu @radix-ui/react-popover 
npm install @radix-ui/react-avatar @radix-ui/react-scroll-area @radix-ui/react-tooltip
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
