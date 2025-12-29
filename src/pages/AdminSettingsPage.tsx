import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Plus, Pencil, Trash2, GripVertical, ExternalLink, Menu, FileText, ChevronDown, ChevronRight, Link, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { clearMenuCache } from '@/components/layout/Sidebar';
import * as LucideIcons from 'lucide-react';
import { AuditLogsTab } from '@/components/admin/AuditLogsTab';
import { menuItemSchema, validateForm, type MenuItemFormData } from '@/lib/validations';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MenuItem {
  cod_menu_item: string;
  des_nome: string;
  des_caminho: string;
  des_icone: string;
  seq_menu_pai: string | null;
  ind_nova_aba: boolean;
  num_ordem: number;
  ind_admin_only: boolean;
  ind_ativo: boolean;
}

const availableIcons = [
  'Home', 'Settings', 'Users', 'FileText', 'Calendar', 'Bell', 'Mail',
  'Folder', 'Star', 'Heart', 'Bookmark', 'Tag', 'Link', 'ExternalLink',
  'Grid3X3', 'Megaphone', 'Activity', 'HelpCircle', 'Shield', 'Fuel',
  'BarChart', 'PieChart', 'TrendingUp', 'Clock', 'CheckCircle', 'DoorOpen'
];

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string>('__none__');
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [namePreview, setNamePreview] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string>('Circle');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [pathType, setPathType] = useState<'internal' | 'external'>('internal');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [deactivateConfirm, setDeactivateConfirm] = useState<{ id: string; name: string; activeSubmenus: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isAdmin) {
      fetchMenuItems();
    }
  }, [isAdmin]);

  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tab_menu_item')
        .select('*')
        .order('num_ordem');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({ title: 'Erro ao carregar itens do menu', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Removed toTitleCase - names are now saved exactly as typed

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    try {
      const parentId = (formData.get('parent_id') as string) === '__none__' ? null : (formData.get('parent_id') as string) || null;
      
      // Para submenus, usar o caminho selecionado ou digitado
      let pathValue: string;
      if (parentId) {
        if (pathType === 'internal') {
          // Se estiver editando e o selectedPath estiver vazio, usar o caminho existente
          pathValue = selectedPath || (editingItem?.des_caminho && !editingItem.des_caminho.startsWith('http') ? editingItem.des_caminho : '');
          if (!pathValue) {
            toast({ 
              title: 'Selecione uma página', 
              description: 'Escolha uma página interna para o submenu.', 
              variant: 'destructive' 
            });
            return;
          }
        } else {
          pathValue = (formData.get('external_url') as string)?.trim() || '';
          // Validar URL externa
          if (!pathValue) {
            toast({ 
              title: 'URL obrigatória', 
              description: 'Digite uma URL externa válida.', 
              variant: 'destructive' 
            });
            return;
          }
          try {
            const url = new URL(pathValue);
            if (!['http:', 'https:'].includes(url.protocol)) {
              throw new Error('Protocolo inválido');
            }
          } catch {
            toast({ 
              title: 'URL inválida', 
              description: 'Digite uma URL válida começando com http:// ou https://', 
              variant: 'destructive' 
            });
            return;
          }
        }
      } else {
        // Para menus pai, gerar caminho baseado no nome
        const rawName = (formData.get('name') as string)?.trim();
        pathValue = `/${rawName.toLowerCase().replace(/\s+/g, '-')}`;
      }
      
      const rawName = (formData.get('name') as string)?.trim();
      const formattedName = parentId ? rawName : rawName.toUpperCase();
      
      const iconValue = (formData.get('icon') as string)?.trim() || 'Circle';
      const orderValue = parseInt(formData.get('sort_order') as string) || 0;
      const openInNewTab = pathType === 'external' || formData.get('open_mode') === 'new_tab';
      const adminOnly = formData.get('is_admin_only') === 'on';

      // Validar com Zod
      const validation = validateForm(menuItemSchema, {
        name: formattedName,
        path: pathValue,
        icon: iconValue,
        order: orderValue,
        parentId: parentId,
        adminOnly,
        openInNewTab,
        active: true,
      });

      if (!validation.success) {
        const validationResult = validation as { success: false; errors: Record<string, string> };
        const firstError = Object.values(validationResult.errors)[0];
        toast({
          title: 'Erro de validação',
          description: String(firstError),
          variant: 'destructive',
        });
        return;
      }
      
      const isDuplicate = menuItems.some(item => 
        item.des_nome.toLowerCase() === formattedName.toLowerCase() && 
        item.cod_menu_item !== editingItem?.cod_menu_item
      );

      if (isDuplicate) {
        toast({ 
          title: 'Nome duplicado', 
          description: 'Já existe um item de menu com este nome.', 
          variant: 'destructive' 
        });
        return;
      }

      const item = {
        des_nome: formattedName,
        des_caminho: pathValue,
        des_icone: iconValue,
        seq_menu_pai: parentId,
        ind_nova_aba: openInNewTab,
        ind_admin_only: adminOnly,
        num_ordem: orderValue,
        ind_ativo: true,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('tab_menu_item')
          .update(item)
          .eq('cod_menu_item', editingItem.cod_menu_item);
        if (error) throw error;
        toast({ title: 'Item atualizado!' });
      } else {
        const { error } = await supabase
          .from('tab_menu_item')
          .insert(item);
        if (error) throw error;
        toast({ title: 'Item criado!' });
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      clearMenuCache();
      await fetchMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({ title: 'Erro ao salvar item', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      const { error } = await supabase
        .from('tab_menu_item')
        .delete()
        .eq('cod_menu_item', deleteItemId);

      if (error) throw error;
      toast({ title: 'Item removido!' });
      clearMenuCache();
      await fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({ title: 'Erro ao remover item', variant: 'destructive' });
    } finally {
      setDeleteItemId(null);
    }
  };

  const handleToggleActive = async (id: string, active: boolean, skipConfirm = false) => {
    // Se for desativar um menu pai com submenus ativos, pedir confirmação
    if (active && !skipConfirm) {
      const children = menuItems.filter(m => m.seq_menu_pai === id);
      const activeChildren = children.filter(c => c.ind_ativo);
      
      if (activeChildren.length > 0) {
        const item = menuItems.find(m => m.cod_menu_item === id);
        setDeactivateConfirm({ 
          id, 
          name: item?.des_nome || 'Menu', 
          activeSubmenus: activeChildren.length 
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('tab_menu_item')
        .update({ ind_ativo: !active })
        .eq('cod_menu_item', id);

      if (error) throw error;
      clearMenuCache();
      await fetchMenuItems();
    } catch (error) {
      console.error('Error toggling menu item:', error);
      toast({ title: 'Erro ao atualizar item', variant: 'destructive' });
    }
  };

  const confirmDeactivateParent = async (deactivateSubmenus = false) => {
    if (!deactivateConfirm) return;
    
    try {
      // Desativa o menu pai
      await supabase
        .from('tab_menu_item')
        .update({ ind_ativo: false })
        .eq('cod_menu_item', deactivateConfirm.id);
      
      // Se pediu para desativar submenus também
      if (deactivateSubmenus) {
        const childrenIds = menuItems
          .filter(m => m.seq_menu_pai === deactivateConfirm.id && m.ind_ativo)
          .map(m => m.cod_menu_item);
        
        if (childrenIds.length > 0) {
          await supabase
            .from('tab_menu_item')
            .update({ ind_ativo: false })
            .in('cod_menu_item', childrenIds);
        }
        
        toast({ title: 'Menu e submenus desativados!' });
      } else {
        toast({ title: 'Menu desativado!' });
      }
      
      clearMenuCache();
      await fetchMenuItems();
    } catch (error) {
      console.error('Error deactivating:', error);
      toast({ title: 'Erro ao desativar', variant: 'destructive' });
    } finally {
      setDeactivateConfirm(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const activeItem = menuItems.find(item => item.cod_menu_item === active.id);
    const overItem = menuItems.find(item => item.cod_menu_item === over.id);

    if (!activeItem) return;

    if (activeItem.seq_menu_pai && overItem && !overItem.seq_menu_pai) {
      try {
        const newChildren = getChildItems(overItem.cod_menu_item);
        await supabase
          .from('tab_menu_item')
          .update({ 
            seq_menu_pai: overItem.cod_menu_item, 
            num_ordem: newChildren.length 
          })
          .eq('cod_menu_item', activeItem.cod_menu_item);
        
        clearMenuCache();
        await fetchMenuItems();
        toast({ title: 'Submenu movido!' });
        return;
      } catch (error) {
        console.error('Error moving submenu:', error);
        toast({ title: 'Erro ao mover submenu', variant: 'destructive' });
        return;
      }
    }

    if (!activeItem.seq_menu_pai && overItem && !overItem.seq_menu_pai) {
      const oldIndex = parentItems.findIndex((item) => item.cod_menu_item === active.id);
      const newIndex = parentItems.findIndex((item) => item.cod_menu_item === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(parentItems, oldIndex, newIndex);
        
        try {
          const updates = newOrder.map((item, index) => 
            supabase
              .from('tab_menu_item')
              .update({ num_ordem: index })
              .eq('cod_menu_item', item.cod_menu_item)
          );
          
          await Promise.all(updates);
          clearMenuCache();
          await fetchMenuItems();
          toast({ title: 'Ordem atualizada!' });
        } catch (error) {
          console.error('Error reordering:', error);
          toast({ title: 'Erro ao reordenar', variant: 'destructive' });
        }
      }
    }
  };

  const handleChildDragEnd = async (parentId: string, event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const overItem = menuItems.find(item => item.cod_menu_item === over.id);

    if (overItem && !overItem.seq_menu_pai && overItem.cod_menu_item !== parentId) {
      try {
        const newChildren = getChildItems(overItem.cod_menu_item);
        await supabase
          .from('tab_menu_item')
          .update({ 
            seq_menu_pai: overItem.cod_menu_item, 
            num_ordem: newChildren.length 
          })
          .eq('cod_menu_item', String(active.id));
        
        clearMenuCache();
        await fetchMenuItems();
        toast({ title: 'Submenu movido!' });
        return;
      } catch (error) {
        console.error('Error moving submenu:', error);
        toast({ title: 'Erro ao mover submenu', variant: 'destructive' });
        return;
      }
    }

    const children = getChildItems(parentId);
    const oldIndex = children.findIndex((item) => item.cod_menu_item === active.id);
    const newIndex = children.findIndex((item) => item.cod_menu_item === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(children, oldIndex, newIndex);
      
      try {
        const updates = newOrder.map((item, index) => 
          supabase
            .from('tab_menu_item')
            .update({ num_ordem: index })
            .eq('cod_menu_item', item.cod_menu_item)
        );
        
        await Promise.all(updates);
        clearMenuCache();
        await fetchMenuItems();
        toast({ title: 'Ordem atualizada!' });
      } catch (error) {
        console.error('Error reordering:', error);
        toast({ title: 'Erro ao reordenar', variant: 'destructive' });
      }
    }
  };

  const getActiveItem = () => menuItems.find(item => item.cod_menu_item === activeId);

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Circle;
    return <Icon className="h-4 w-4" />;
  };

  const getIconComponentLarge = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Circle;
    return <Icon className="h-6 w-6" />;
  };

  const parentItems = menuItems.filter(item => !item.seq_menu_pai);
  const getChildItems = (parentId: string) => menuItems.filter(item => item.seq_menu_pai === parentId);

  // Rotas disponíveis no sistema que ainda não estão em nenhum menu
  const availablePaths = useMemo(() => {
    const allRoutes = [
      { path: '/', label: 'Meu Dia (Home)' },
      { path: '/comunicados', label: 'Comunicados' },
      { path: '/status', label: 'Status Sistemas' },
      { path: '/suporte', label: 'Suporte' },
      { path: '/reserva-salas', label: 'Reserva de Salas' },
      { path: '/perfil', label: 'Perfil' },
      { path: '/admin/configuracoes', label: 'Admin - Configurações' },
      { path: '/admin/comunicados', label: 'Admin - Comunicados' },
      { path: '/admin/usuarios', label: 'Admin - Usuários' },
      { path: '/admin/auditoria', label: 'Admin - Auditoria' },
      { path: '/admin/sistemas', label: 'Admin - Sistemas' },
      { path: '/admin/faqs', label: 'Admin - FAQs' },
      { path: '/admin/reserva-salas', label: 'Admin - Config. Reservas' },
      { path: '/admin/perfis', label: 'Admin - Perfis' },
    ];
    
    const usedPaths = menuItems.map(m => m.des_caminho);
    return allRoutes.filter(r => !usedPaths.includes(r.path) || editingItem?.des_caminho === r.path);
  }, [menuItems, editingItem]);

  const toggleExpand = (menuId: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }
      return next;
    });
  };

  const SortableMenuItem = ({ item, isChild = false }: { item: MenuItem; isChild?: boolean }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.cod_menu_item });

    const isOver = overId === item.cod_menu_item && !isDragging;
    const children = menuItems.filter(m => m.seq_menu_pai === item.cod_menu_item);
    const childCount = children.length;
    const activeChildCount = children.filter(c => c.ind_ativo).length;
    const hasChildren = !isChild && childCount > 0;
    const isExpanded = expandedMenus.has(item.cod_menu_item);

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    };

    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={false}
        animate={{
          scale: isDragging ? 1.02 : 1,
          boxShadow: isDragging ? '0 10px 40px rgba(0,0,0,0.15)' : 'none',
          opacity: isDragging ? 0.9 : 1,
        }}
        transition={{ duration: 0.2 }}
        className={`flex items-center gap-3 p-4 transition-all duration-200 ${
          isChild ? 'pl-12 bg-muted/10' : ''
        } ${isDragging ? 'z-50 bg-card rounded-lg relative' : 'hover:bg-muted/30'} ${
          isOver && !isChild ? 'bg-primary/10 border-l-4 border-primary' : ''
        }`}
      >
        <motion.div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <GripVertical className={`h-4 w-4 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        </motion.div>
        
        {/* Ícone de expandir/retrair para menus com submenus */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(item.cod_menu_item);
            }}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </Button>
        ) : !isChild ? (
          <div className="w-6" /> // Espaço para alinhar
        ) : null}
        
        <div className="flex items-center gap-2 flex-1">
          {getIconComponent(item.des_icone)}
          <span className="font-medium">{item.des_nome}</span>
          {hasChildren && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeChildCount === childCount 
                ? 'bg-green-500/10 text-green-600' 
                : activeChildCount === 0 
                  ? 'bg-muted text-muted-foreground' 
                  : 'bg-yellow-500/10 text-yellow-600'
            }`}>
              {activeChildCount}/{childCount} ativo{activeChildCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-sm text-muted-foreground">{item.des_caminho}</span>
          {item.ind_nova_aba && (
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          )}
          {item.ind_admin_only && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Admin</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={item.ind_ativo}
            onCheckedChange={() => handleToggleActive(item.cod_menu_item, item.ind_ativo)}
          />
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => { 
              setEditingItem(item); 
              setSelectedParentId(item.seq_menu_pai || '__none__'); 
              setSelectedIcon(item.des_icone || 'Circle');
              setNamePreview(item.des_nome);
              const isExternal = item.des_caminho?.startsWith('http');
              setPathType(isExternal ? 'external' : 'internal');
              setSelectedPath(isExternal ? '' : item.des_caminho || '');
              setIsDialogOpen(true); 
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => setDeleteItemId(item.cod_menu_item)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const DragOverlayItem = ({ item }: { item: MenuItem }) => (
    <div className="flex items-center gap-3 p-4 bg-card rounded-lg shadow-2xl border-2 border-primary">
      <GripVertical className="h-4 w-4 text-primary" />
      <div className="flex items-center gap-2 flex-1">
        {getIconComponent(item.des_icone)}
        <span className="font-semibold">{item.des_nome}</span>
      </div>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Configurações Gerais</h1>
          </div>
        </div>

        <Tabs defaultValue="menu">
          <TabsList>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <Menu className="h-4 w-4" />
              Menu do Sidebar
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Logs de Auditoria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Itens do Menu</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie os itens de menu e submenus do sidebar.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={isDialogOpen} onOpenChange={(o) => {
                setIsDialogOpen(o); 
                if (!o) {
                  setEditingItem(null);
                  setSelectedParentId('__none__');
                  setNamePreview('');
                  setSelectedIcon('Circle');
                  setPathType('internal');
                  setSelectedPath('');
                } else if (editingItem) {
                  setSelectedParentId(editingItem.seq_menu_pai || '__none__');
                  setNamePreview(editingItem.des_nome);
                  setSelectedIcon(editingItem.des_icone || 'Circle');
                  const isExternal = editingItem.des_caminho?.startsWith('http');
                  setPathType(isExternal ? 'external' : 'internal');
                  setSelectedPath(isExternal ? '' : editingItem.des_caminho || '');
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => { 
                    setSelectedParentId('__none__'); 
                    setNamePreview(''); 
                    setSelectedIcon('Circle'); 
                    setPathType('internal');
                    setSelectedPath('');
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? 'Editar' : 'Novo'} Item de Menu</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }} className="space-y-4">
                    <div>
                      <Label className="mb-1.5 block">Menu Pai</Label>
                      <Select 
                        name="parent_id" 
                        value={selectedParentId}
                        onValueChange={(value) => {
                          setSelectedParentId(value);
                          // Reset path when changing parent
                          if (value !== '__none__') {
                            setSelectedPath('');
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhum (item principal)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Nenhum (menu principal)</SelectItem>
                          {parentItems.map(item => (
                            <SelectItem key={item.cod_menu_item} value={item.cod_menu_item}>
                              {item.des_nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedParentId === '__none__' 
                          ? 'Este será um menu principal com submenus'
                          : 'Este será um submenu'}
                      </p>
                    </div>

                    <div>
                      <Label className="mb-1.5 block">Nome</Label>
                      <Input 
                        name="name" 
                        defaultValue={editingItem?.des_nome} 
                        required 
                        placeholder="Nome do menu"
                        onChange={(e) => setNamePreview(e.target.value)}
                      />
                      {namePreview && (
                        <div className="mt-2 p-2 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                          <p className="text-sm font-medium">
                            {selectedParentId === '__none__' 
                              ? namePreview.toUpperCase() 
                              : namePreview
                            }
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {selectedParentId !== '__none__' && (
                      <div className="space-y-3">
                        <Label className="block">Tipo de Destino</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={pathType === 'internal' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setPathType('internal')}
                          >
                            <FolderOpen className="h-4 w-4 mr-1" />
                            Página Interna
                          </Button>
                          <Button
                            type="button"
                            variant={pathType === 'external' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setPathType('external')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            URL Externa
                          </Button>
                        </div>

                        {pathType === 'internal' ? (
                          <div>
                            <Label className="mb-1.5 block text-sm">Selecione a Página</Label>
                            <Select 
                              value={selectedPath}
                              onValueChange={setSelectedPath}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma página disponível" />
                              </SelectTrigger>
                              <SelectContent>
                                {availablePaths.length === 0 ? (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">
                                    Todas as páginas já estão em uso
                                  </div>
                                ) : (
                                  availablePaths.map(route => (
                                    <SelectItem key={route.path} value={route.path}>
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-xs">{route.path}</span>
                                        <span>{route.label}</span>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              Apenas páginas não utilizadas em outros menus são exibidas
                            </p>
                          </div>
                        ) : (
                          <div>
                            <Label className="mb-1.5 block text-sm">URL Externa</Label>
                            <Input 
                              name="external_url" 
                              defaultValue={editingItem?.des_caminho?.startsWith('http') ? editingItem.des_caminho : ''} 
                              required={pathType === 'external'}
                              placeholder="https://exemplo.com" 
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Links externos sempre abrem em nova aba
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <Label className="mb-1.5 block">Ícone</Label>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20">
                          {getIconComponentLarge(selectedIcon)}
                        </div>
                        <Select 
                          name="icon" 
                          defaultValue={editingItem?.des_icone || 'Circle'}
                          onValueChange={setSelectedIcon}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {availableIcons.map(icon => (
                              <SelectItem key={icon} value={icon}>
                                <div className="flex items-center gap-2">
                                  {getIconComponent(icon)}
                                  <span>{icon}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-1.5 block">Ordem</Label>
                      <Input 
                        name="sort_order" 
                        type="number" 
                        defaultValue={editingItem?.num_ordem || 0} 
                        placeholder="0" 
                      />
                    </div>

                    {pathType === 'internal' && selectedParentId !== '__none__' && (
                      <div>
                        <Label className="mb-1.5 block">Abrir em</Label>
                        <Select name="open_mode" defaultValue={editingItem?.ind_nova_aba ? 'new_tab' : 'same_window'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="same_window">Mesma janela</SelectItem>
                            <SelectItem value="new_tab">Nova aba</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Apenas administradores</p>
                        <p className="text-xs text-muted-foreground">Visível somente para admins</p>
                      </div>
                      <Switch name="is_admin_only" defaultChecked={editingItem?.ind_admin_only} />
                    </div>

                    <Button type="submit" className="w-full" loading={isSaving}>
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Carregando...</div>
              ) : menuItems.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Menu className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum item de menu cadastrado</p>
                  <p className="text-sm">Clique em "Novo Item" para adicionar</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={parentItems.map(item => item.cod_menu_item)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="divide-y divide-border">
                      {parentItems.map((item) => {
                        const children = getChildItems(item.cod_menu_item);
                        const isExpanded = expandedMenus.has(item.cod_menu_item);
                        
                        return (
                          <div key={item.cod_menu_item}>
                            <SortableMenuItem item={item} />
                            
                            {children.length > 0 && isExpanded && (
                              <AnimatePresence>
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDragEnd={(event) => handleChildDragEnd(item.cod_menu_item, event)}
                                  >
                                    <SortableContext
                                      items={children.map(child => child.cod_menu_item)}
                                      strategy={verticalListSortingStrategy}
                                    >
                                      {children.map((child) => (
                                        <SortableMenuItem key={child.cod_menu_item} item={child} isChild />
                                      ))}
                                    </SortableContext>
                                    <DragOverlay>
                                      {activeId && getActiveItem()?.seq_menu_pai === item.cod_menu_item ? (
                                        <DragOverlayItem item={getActiveItem()!} />
                                      ) : null}
                                    </DragOverlay>
                                  </DndContext>
                                </motion.div>
                              </AnimatePresence>
                            )}
                          </div>
                        );
                      })}

                      {menuItems.filter(item => item.seq_menu_pai && !parentItems.find(p => p.cod_menu_item === item.seq_menu_pai)).map((item) => (
                        <SortableMenuItem key={item.cod_menu_item} item={item} />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeId && !getActiveItem()?.seq_menu_pai ? (
                      <DragOverlayItem item={getActiveItem()!} />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <AuditLogsTab />
          </TabsContent>
        </Tabs>
      </motion.div>

      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item de menu? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deactivateConfirm} onOpenChange={(open) => !open && setDeactivateConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar menu com submenus ativos</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">
                  O menu <strong>"{deactivateConfirm?.name}"</strong> possui <strong>{deactivateConfirm?.activeSubmenus}</strong> submenu{(deactivateConfirm?.activeSubmenus || 0) > 1 ? 's' : ''} ativo{(deactivateConfirm?.activeSubmenus || 0) > 1 ? 's' : ''}. 
                </p>
                <p>O que deseja fazer?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmDeactivateParent(false)} 
              className="bg-yellow-600 text-white hover:bg-yellow-700"
            >
              Desativar apenas o menu pai
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={() => confirmDeactivateParent(true)} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desativar menu e submenus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
