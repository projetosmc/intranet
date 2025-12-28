import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Plus, Pencil, Trash2, GripVertical, ExternalLink, Menu, FileText } from 'lucide-react';
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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

const availableIcons = [
  'Home', 'Settings', 'Users', 'FileText', 'Calendar', 'Bell', 'Mail',
  'Folder', 'Star', 'Heart', 'Bookmark', 'Tag', 'Link', 'ExternalLink',
  'Grid3X3', 'Megaphone', 'Activity', 'HelpCircle', 'Shield', 'Fuel',
  'BarChart', 'PieChart', 'TrendingUp', 'Clock', 'CheckCircle'
];

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string>('__none__');
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [namePreview, setNamePreview] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string>('Circle');

  const sensors = useSensors(
    useSensor(PointerSensor),
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
        .from('menu_items')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({ title: 'Erro ao carregar itens do menu', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const toTitleCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  };

  const handleSave = async (formData: FormData) => {
    const parentId = (formData.get('parent_id') as string) === '__none__' ? null : (formData.get('parent_id') as string) || null;
    const pathValue = formData.get('path') as string;
    
    // Format name: UPPERCASE for parent menus, Title Case for submenus
    const rawName = formData.get('name') as string;
    const formattedName = parentId ? toTitleCase(rawName) : rawName.toUpperCase();
    
    // If it's a parent menu (no parent_id), path is optional - generate from name
    const finalPath = parentId ? pathValue : (pathValue || `/${rawName.toLowerCase().replace(/\s+/g, '-')}`);
    
    // Check for duplicate name
    const isDuplicate = menuItems.some(item => 
      item.name.toLowerCase() === formattedName.toLowerCase() && 
      item.id !== editingItem?.id
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
      name: formattedName,
      path: finalPath,
      icon: formData.get('icon') as string,
      parent_id: parentId,
      open_in_new_tab: formData.get('open_mode') === 'new_tab',
      is_admin_only: formData.get('is_admin_only') === 'on',
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
      active: true,
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(item)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast({ title: 'Item atualizado!' });
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert(item);
        if (error) throw error;
        toast({ title: 'Item criado!' });
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      clearMenuCache(); // Clear sidebar cache
      await fetchMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({ title: 'Erro ao salvar item', variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', deleteItemId);

      if (error) throw error;
      toast({ title: 'Item removido!' });
      clearMenuCache(); // Clear sidebar cache
      await fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({ title: 'Erro ao remover item', variant: 'destructive' });
    } finally {
      setDeleteItemId(null);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;
      clearMenuCache(); // Clear sidebar cache
      await fetchMenuItems();
    } catch (error) {
      console.error('Error toggling menu item:', error);
      toast({ title: 'Erro ao atualizar item', variant: 'destructive' });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parentItems.findIndex((item) => item.id === active.id);
      const newIndex = parentItems.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(parentItems, oldIndex, newIndex);
        
        // Update sort_order for all affected items
        try {
          const updates = newOrder.map((item, index) => 
            supabase
              .from('menu_items')
              .update({ sort_order: index })
              .eq('id', item.id)
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
    const children = getChildItems(parentId);

    if (over && active.id !== over.id) {
      const oldIndex = children.findIndex((item) => item.id === active.id);
      const newIndex = children.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(children, oldIndex, newIndex);
        
        try {
          const updates = newOrder.map((item, index) => 
            supabase
              .from('menu_items')
              .update({ sort_order: index })
              .eq('id', item.id)
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

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Circle;
    return <Icon className="h-4 w-4" />;
  };

  const getIconComponentLarge = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Circle;
    return <Icon className="h-6 w-6" />;
  };

  const parentItems = menuItems.filter(item => !item.parent_id);
  const getChildItems = (parentId: string) => menuItems.filter(item => item.parent_id === parentId);

  // Sortable Menu Item Component
  const SortableMenuItem = ({ item, isChild = false }: { item: MenuItem; isChild?: boolean }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors ${isChild ? 'pl-12 bg-muted/10' : ''} ${isDragging ? 'z-50 bg-card shadow-lg' : ''}`}
      >
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2 flex-1">
          {getIconComponent(item.icon)}
          <span className="font-medium">{item.name}</span>
          <span className="text-sm text-muted-foreground">{item.path}</span>
          {item.open_in_new_tab && (
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          )}
          {item.is_admin_only && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Admin</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={item.active}
            onCheckedChange={() => handleToggleActive(item.id, item.active)}
          />
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => { 
              setEditingItem(item); 
              setSelectedParentId(item.parent_id || '__none__'); 
              setSelectedIcon(item.icon || 'Circle');
              setNamePreview(item.name);
              setIsDialogOpen(true); 
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => setDeleteItemId(item.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    );
  };

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
              <Dialog open={isDialogOpen} onOpenChange={(o) => { 
                setIsDialogOpen(o); 
                if (!o) {
                  setEditingItem(null);
                  setSelectedParentId('__none__');
                  setNamePreview('');
                  setSelectedIcon('Circle');
                } else if (editingItem) {
                  setSelectedParentId(editingItem.parent_id || '__none__');
                  setNamePreview(editingItem.name);
                  setSelectedIcon(editingItem.icon || 'Circle');
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => { setSelectedParentId('__none__'); setNamePreview(''); setSelectedIcon('Circle'); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingItem ? 'Editar' : 'Novo'} Item de Menu</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }} className="space-y-4">
                    <div>
                      <Label className="mb-1.5 block">Menu Pai</Label>
                      <Select 
                        name="parent_id" 
                        value={selectedParentId}
                        onValueChange={setSelectedParentId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhum (item principal)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Nenhum (menu principal)</SelectItem>
                          {parentItems.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
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
                        defaultValue={editingItem?.name} 
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
                              : namePreview.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())
                            }
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {selectedParentId !== '__none__' && (
                      <div>
                        <Label className="mb-1.5 block">Caminho/URL</Label>
                        <Input name="path" defaultValue={editingItem?.path} required placeholder="/pagina ou https://..." />
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
                          defaultValue={editingItem?.icon || 'Circle'}
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
                        defaultValue={editingItem?.sort_order || 0} 
                        placeholder="0" 
                      />
                    </div>

                    <div>
                      <Label className="mb-1.5 block">Abrir em</Label>
                      <Select name="open_mode" defaultValue={editingItem?.open_in_new_tab ? 'new_tab' : 'same_window'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="same_window">Mesma janela</SelectItem>
                          <SelectItem value="new_tab">Nova aba</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Apenas administradores</p>
                        <p className="text-xs text-muted-foreground">Visível somente para admins</p>
                      </div>
                      <Switch name="is_admin_only" defaultChecked={editingItem?.is_admin_only} />
                    </div>

                    <Button type="submit" className="w-full">Salvar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Menu Items List */}
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
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={parentItems.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="divide-y divide-border">
                      {parentItems.map((item) => (
                        <div key={item.id}>
                          <SortableMenuItem item={item} />
                          
                          {/* Child Items with their own DndContext */}
                          {getChildItems(item.id).length > 0 && (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => handleChildDragEnd(item.id, event)}
                            >
                              <SortableContext
                                items={getChildItems(item.id).map(child => child.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                {getChildItems(item.id).map((child) => (
                                  <SortableMenuItem key={child.id} item={child} isChild />
                                ))}
                              </SortableContext>
                            </DndContext>
                          )}
                        </div>
                      ))}

                      {/* Orphan Items */}
                      {menuItems.filter(item => item.parent_id && !parentItems.find(p => p.id === item.parent_id)).map((item) => (
                        <SortableMenuItem key={item.id} item={item} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <AuditLogsTab />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Delete Confirmation Dialog */}
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
    </div>
  );
}
