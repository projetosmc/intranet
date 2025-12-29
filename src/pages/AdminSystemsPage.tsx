import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Plus, Pencil, Trash2, GripVertical, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface System {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down';
  last_check: string;
  sort_order: number;
  active: boolean;
}

const statusConfig = {
  operational: {
    label: 'Operacional',
    icon: CheckCircle,
    variant: 'success' as const,
    color: 'text-success',
  },
  degraded: {
    label: 'Degradado',
    icon: AlertTriangle,
    variant: 'warning' as const,
    color: 'text-warning',
  },
  down: {
    label: 'Indisponível',
    icon: XCircle,
    variant: 'destructive' as const,
    color: 'text-destructive',
  },
};

export default function AdminSystemsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const [systems, setSystems] = useState<System[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<System | null>(null);
  const [deleteSystemId, setDeleteSystemId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (isAdmin) {
      fetchSystems();
    }
  }, [isAdmin]);

  const fetchSystems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('systems')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setSystems((data || []).map(d => ({
        ...d,
        status: d.status as 'operational' | 'degraded' | 'down'
      })));
    } catch (error) {
      console.error('Error fetching systems:', error);
      toast({ title: 'Erro ao carregar sistemas', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (formData: FormData) => {
    const system = {
      name: formData.get('name') as string,
      status: formData.get('status') as 'operational' | 'degraded' | 'down',
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
      active: true,
      last_check: new Date().toISOString(),
    };

    try {
      if (editingSystem) {
        const { error } = await supabase
          .from('systems')
          .update(system)
          .eq('id', editingSystem.id);
        if (error) throw error;
        toast({ title: 'Sistema atualizado!' });
      } else {
        const { error } = await supabase
          .from('systems')
          .insert(system);
        if (error) throw error;
        toast({ title: 'Sistema criado!' });
      }

      setIsDialogOpen(false);
      setEditingSystem(null);
      await fetchSystems();
    } catch (error) {
      console.error('Error saving system:', error);
      toast({ title: 'Erro ao salvar sistema', variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteSystemId) return;
    try {
      const { error } = await supabase
        .from('systems')
        .delete()
        .eq('id', deleteSystemId);

      if (error) throw error;
      toast({ title: 'Sistema removido!' });
      await fetchSystems();
    } catch (error) {
      console.error('Error deleting system:', error);
      toast({ title: 'Erro ao remover sistema', variant: 'destructive' });
    } finally {
      setDeleteSystemId(null);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('systems')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;
      await fetchSystems();
    } catch (error) {
      console.error('Error toggling system:', error);
      toast({ title: 'Erro ao atualizar sistema', variant: 'destructive' });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = systems.findIndex((s) => s.id === active.id);
    const newIndex = systems.findIndex((s) => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(systems, oldIndex, newIndex);
      
      try {
        const updates = newOrder.map((item, index) => 
          supabase
            .from('systems')
            .update({ sort_order: index })
            .eq('id', item.id)
        );
        
        await Promise.all(updates);
        await fetchSystems();
        toast({ title: 'Ordem atualizada!' });
      } catch (error) {
        console.error('Error reordering:', error);
        toast({ title: 'Erro ao reordenar', variant: 'destructive' });
      }
    }
  };

  const SortableSystem = ({ system }: { system: System }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: system.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    };

    const config = statusConfig[system.status];
    const Icon = config.icon;

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
        className={`flex items-center gap-3 p-4 ${isDragging ? 'z-50 bg-card rounded-lg relative' : 'hover:bg-muted/30'}`}
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
        <div className="flex items-center gap-3 flex-1">
          <Icon className={`h-5 w-5 ${config.color}`} />
          <span className="font-medium">{system.name}</span>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={system.active}
            onCheckedChange={() => handleToggleActive(system.id, system.active)}
          />
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => { 
              setEditingSystem(system); 
              setIsDialogOpen(true); 
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => setDeleteSystemId(system.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const DragOverlayItem = ({ system }: { system: System }) => {
    const config = statusConfig[system.status];
    const Icon = config.icon;
    
    return (
      <div className="flex items-center gap-3 p-4 bg-card rounded-lg shadow-2xl border-2 border-primary">
        <GripVertical className="h-4 w-4 text-primary" />
        <Icon className={`h-5 w-5 ${config.color}`} />
        <span className="font-semibold">{system.name}</span>
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
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Gerenciar Sistemas</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(o) => { 
            setIsDialogOpen(o); 
            if (!o) setEditingSystem(null);
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Sistema
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSystem ? 'Editar' : 'Novo'} Sistema</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }} className="space-y-4">
                <div>
                  <Label className="mb-1.5 block">Nome do Sistema</Label>
                  <Input 
                    name="name" 
                    defaultValue={editingSystem?.name} 
                    required 
                    placeholder="Ex: Portal Cliente"
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block">Status</Label>
                  <Select name="status" defaultValue={editingSystem?.status || 'operational'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span>Operacional</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="degraded">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <span>Degradado</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="down">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-destructive" />
                          <span>Indisponível</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-1.5 block">Ordem</Label>
                  <Input 
                    name="sort_order" 
                    type="number" 
                    defaultValue={editingSystem?.sort_order || 0} 
                    placeholder="0" 
                  />
                </div>

                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : systems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum sistema cadastrado</p>
              <p className="text-sm">Clique em "Novo Sistema" para adicionar</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={systems.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-border">
                  {systems.map((system) => (
                    <SortableSystem key={system.id} system={system} />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <DragOverlayItem system={systems.find(s => s.id === activeId)!} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </motion.div>

      <AlertDialog open={!!deleteSystemId} onOpenChange={(open) => !open && setDeleteSystemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este sistema? Esta ação não pode ser desfeita.
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
