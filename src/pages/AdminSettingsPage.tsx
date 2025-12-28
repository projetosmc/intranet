import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Plus, Pencil, Trash2, GripVertical, ExternalLink, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as LucideIcons from 'lucide-react';

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

  const handleSave = async (formData: FormData) => {
    const item = {
      name: formData.get('name') as string,
      path: formData.get('path') as string,
      icon: formData.get('icon') as string,
      parent_id: formData.get('parent_id') as string || null,
      open_in_new_tab: formData.get('open_in_new_tab') === 'on',
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
      await fetchMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({ title: 'Erro ao salvar item', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Item removido!' });
      await fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({ title: 'Erro ao remover item', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;
      await fetchMenuItems();
    } catch (error) {
      console.error('Error toggling menu item:', error);
      toast({ title: 'Erro ao atualizar item', variant: 'destructive' });
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Circle;
    return <Icon className="h-4 w-4" />;
  };

  const parentItems = menuItems.filter(item => !item.parent_id);
  const getChildItems = (parentId: string) => menuItems.filter(item => item.parent_id === parentId);

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
          </TabsList>

          <TabsContent value="menu" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Itens do Menu</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie os itens de menu e submenus do sidebar.
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) setEditingItem(null); }}>
                <DialogTrigger asChild>
                  <Button size="sm">
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
                      <Label>Nome</Label>
                      <Input name="name" defaultValue={editingItem?.name} required placeholder="Nome do menu" />
                    </div>
                    
                    <div>
                      <Label>Caminho/URL</Label>
                      <Input name="path" defaultValue={editingItem?.path} required placeholder="/pagina ou https://..." />
                    </div>

                    <div>
                      <Label>Ícone</Label>
                      <Select name="icon" defaultValue={editingItem?.icon || 'Circle'}>
                        <SelectTrigger>
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

                    <div>
                      <Label>Menu Pai (opcional)</Label>
                      <Select name="parent_id" defaultValue={editingItem?.parent_id || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhum (item principal)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhum (item principal)</SelectItem>
                          {parentItems.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Ordem</Label>
                      <Input 
                        name="sort_order" 
                        type="number" 
                        defaultValue={editingItem?.sort_order || 0} 
                        placeholder="0" 
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Abrir em nova aba</p>
                        <p className="text-xs text-muted-foreground">Link abrirá em uma nova janela</p>
                      </div>
                      <Switch name="open_in_new_tab" defaultChecked={editingItem?.open_in_new_tab} />
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
                <div className="divide-y divide-border">
                  {parentItems.map((item) => (
                    <div key={item.id}>
                      {/* Parent Item */}
                      <div className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
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
                            onClick={() => { setEditingItem(item); setIsDialogOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* Child Items */}
                      {getChildItems(item.id).map((child) => (
                        <div 
                          key={child.id} 
                          className="flex items-center gap-3 p-4 pl-12 hover:bg-muted/30 transition-colors bg-muted/10"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <div className="flex items-center gap-2 flex-1">
                            {getIconComponent(child.icon)}
                            <span className="font-medium">{child.name}</span>
                            <span className="text-sm text-muted-foreground">{child.path}</span>
                            {child.open_in_new_tab && (
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            )}
                            {child.is_admin_only && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Admin</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={child.active}
                              onCheckedChange={() => handleToggleActive(child.id, child.active)}
                            />
                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              onClick={() => { setEditingItem(child); setIsDialogOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              onClick={() => handleDelete(child.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Orphan Items (items with parent_id but parent doesn't exist) */}
                  {menuItems.filter(item => item.parent_id && !parentItems.find(p => p.id === item.parent_id)).map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className="flex items-center gap-2 flex-1">
                        {getIconComponent(item.icon)}
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.path}</span>
                        {item.open_in_new_tab && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
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
                          onClick={() => { setEditingItem(item); setIsDialogOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
