import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DoorOpen, Plus, Pencil, Trash2, GripVertical, Users, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { meetingRoomSchema, meetingTypeSchema, validateForm } from '@/lib/validations';
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

interface MeetingRoom {
  cod_sala: string;
  des_nome: string;
  num_capacidade: number;
  des_roles_permitidos: string[];
  ind_ativo: boolean;
  num_ordem: number;
}

interface MeetingType {
  cod_tipo_reuniao: string;
  des_nome: string;
  ind_ativo: boolean;
  num_ordem: number;
}

const availableRoles = [
  { value: 'all', label: 'Todos' },
  { value: 'admin', label: 'Administradores' },
  { value: 'rh', label: 'RH' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'operacional', label: 'Operacional' },
];

export function RoomConfigTab() {
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<MeetingRoom | null>(null);
  const [editingType, setEditingType] = useState<MeetingType | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['all']);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [roomsRes, typesRes] = await Promise.all([
        supabase.from('tab_sala_reuniao').select('*').order('num_ordem'),
        supabase.from('tab_tipo_reuniao').select('*').order('num_ordem')
      ]);

      if (roomsRes.error) throw roomsRes.error;
      if (typesRes.error) throw typesRes.error;

      setRooms(roomsRes.data || []);
      setMeetingTypes(typesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRoom = async (formData: FormData) => {
    const name = (formData.get('name') as string)?.trim();
    const capacity = parseInt(formData.get('capacity') as string) || 10;
    const order = parseInt(formData.get('sort_order') as string) || 0;

    const validation = validateForm(meetingRoomSchema, { name, capacity, allowedRoles: selectedRoles, order, active: true });
    if (!validation.success) {
      const validationResult = validation as { success: false; errors: Record<string, string> };
      toast({ title: 'Erro de validação', description: Object.values(validationResult.errors)[0], variant: 'destructive' });
      return;
    }

    const room = { des_nome: name, num_capacidade: capacity, des_roles_permitidos: selectedRoles, num_ordem: order, ind_ativo: true };

    try {
      if (editingRoom) {
        const { error } = await supabase.from('tab_sala_reuniao').update(room).eq('cod_sala', editingRoom.cod_sala);
        if (error) throw error;
        toast({ title: 'Sala atualizada!' });
      } else {
        const { error } = await supabase.from('tab_sala_reuniao').insert(room);
        if (error) throw error;
        toast({ title: 'Sala criada!' });
      }
      setIsRoomDialogOpen(false);
      setEditingRoom(null);
      setSelectedRoles(['all']);
      await fetchData();
    } catch (error) {
      toast({ title: 'Erro ao salvar sala', variant: 'destructive' });
    }
  };

  const confirmDeleteRoom = async () => {
    if (!deleteRoomId) return;
    try {
      const { error } = await supabase.from('tab_sala_reuniao').delete().eq('cod_sala', deleteRoomId);
      if (error) throw error;
      toast({ title: 'Sala removida!' });
      await fetchData();
    } catch (error) {
      toast({ title: 'Erro ao remover sala', variant: 'destructive' });
    } finally {
      setDeleteRoomId(null);
    }
  };

  const handleToggleRoomActive = async (id: string, active: boolean) => {
    try {
      await supabase.from('tab_sala_reuniao').update({ ind_ativo: !active }).eq('cod_sala', id);
      await fetchData();
    } catch (error) {
      toast({ title: 'Erro ao atualizar sala', variant: 'destructive' });
    }
  };

  const handleSaveType = async (formData: FormData) => {
    const name = (formData.get('name') as string)?.trim();
    const order = parseInt(formData.get('sort_order') as string) || 0;

    const validation = validateForm(meetingTypeSchema, { name, order, active: true });
    if (!validation.success) {
      const validationResult = validation as { success: false; errors: Record<string, string> };
      toast({ title: 'Erro de validação', description: Object.values(validationResult.errors)[0], variant: 'destructive' });
      return;
    }

    const type = { des_nome: name, num_ordem: order, ind_ativo: true };

    try {
      if (editingType) {
        const { error } = await supabase.from('tab_tipo_reuniao').update(type).eq('cod_tipo_reuniao', editingType.cod_tipo_reuniao);
        if (error) throw error;
        toast({ title: 'Tipo de reunião atualizado!' });
      } else {
        const { error } = await supabase.from('tab_tipo_reuniao').insert(type);
        if (error) throw error;
        toast({ title: 'Tipo de reunião criado!' });
      }
      setIsTypeDialogOpen(false);
      setEditingType(null);
      await fetchData();
    } catch (error) {
      toast({ title: 'Erro ao salvar tipo', variant: 'destructive' });
    }
  };

  const confirmDeleteType = async () => {
    if (!deleteTypeId) return;
    try {
      const { error } = await supabase.from('tab_tipo_reuniao').delete().eq('cod_tipo_reuniao', deleteTypeId);
      if (error) throw error;
      toast({ title: 'Tipo de reunião removido!' });
      await fetchData();
    } catch (error) {
      toast({ title: 'Erro ao remover tipo', variant: 'destructive' });
    } finally {
      setDeleteTypeId(null);
    }
  };

  const handleToggleTypeActive = async (id: string, active: boolean) => {
    try {
      await supabase.from('tab_tipo_reuniao').update({ ind_ativo: !active }).eq('cod_tipo_reuniao', id);
      await fetchData();
    } catch (error) {
      toast({ title: 'Erro ao atualizar tipo', variant: 'destructive' });
    }
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleRoomDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = rooms.findIndex((r) => r.cod_sala === active.id);
    const newIndex = rooms.findIndex((r) => r.cod_sala === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(rooms, oldIndex, newIndex);
      try {
        await Promise.all(newOrder.map((item, index) => supabase.from('tab_sala_reuniao').update({ num_ordem: index }).eq('cod_sala', item.cod_sala)));
        await fetchData();
      } catch (error) {
        console.error('Error reordering:', error);
      }
    }
  };

  const handleTypeDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = meetingTypes.findIndex((t) => t.cod_tipo_reuniao === active.id);
    const newIndex = meetingTypes.findIndex((t) => t.cod_tipo_reuniao === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(meetingTypes, oldIndex, newIndex);
      try {
        await Promise.all(newOrder.map((item, index) => supabase.from('tab_tipo_reuniao').update({ num_ordem: index }).eq('cod_tipo_reuniao', item.cod_tipo_reuniao)));
        await fetchData();
      } catch (error) {
        console.error('Error reordering:', error);
      }
    }
  };

  const SortableRoom = ({ room }: { room: MeetingRoom }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: room.cod_sala });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
      <motion.div ref={setNodeRef} style={style} animate={{ scale: isDragging ? 1.02 : 1, opacity: isDragging ? 0.9 : 1 }} className={`flex items-center gap-3 p-4 ${isDragging ? 'z-50 bg-card rounded-lg shadow-lg' : 'hover:bg-muted/30'}`}>
        <motion.div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{room.des_nome}</span>
            <Badge variant="outline" className="text-xs"><Users className="h-3 w-3 mr-1" />{room.num_capacidade}</Badge>
          </div>
          <div className="flex gap-1 mt-1">
            {room.des_roles_permitidos?.map(role => (
              <Badge key={role} variant="secondary" className="text-xs">{availableRoles.find(r => r.value === role)?.label || role}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={room.ind_ativo} onCheckedChange={() => handleToggleRoomActive(room.cod_sala, room.ind_ativo)} />
          <Button variant="ghost" size="icon-sm" onClick={() => { setEditingRoom(room); setSelectedRoles(room.des_roles_permitidos || ['all']); setIsRoomDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteRoomId(room.cod_sala)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </motion.div>
    );
  };

  const SortableType = ({ type }: { type: MeetingType }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: type.cod_tipo_reuniao });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
      <motion.div ref={setNodeRef} style={style} animate={{ scale: isDragging ? 1.02 : 1, opacity: isDragging ? 0.9 : 1 }} className={`flex items-center gap-3 p-4 ${isDragging ? 'z-50 bg-card rounded-lg shadow-lg' : 'hover:bg-muted/30'}`}>
        <motion.div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </motion.div>
        <div className="flex-1"><span className="font-medium">{type.des_nome}</span></div>
        <div className="flex items-center gap-2">
          <Switch checked={type.ind_ativo} onCheckedChange={() => handleToggleTypeActive(type.cod_tipo_reuniao, type.ind_ativo)} />
          <Button variant="ghost" size="icon-sm" onClick={() => { setEditingType(type); setIsTypeDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTypeId(type.cod_tipo_reuniao)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms" className="gap-2"><DoorOpen className="h-4 w-4" />Salas</TabsTrigger>
          <TabsTrigger value="types" className="gap-2"><Tag className="h-4 w-4" />Tipos de Reunião</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div><h3 className="font-semibold">Salas de Reunião</h3><p className="text-sm text-muted-foreground">Gerencie as salas disponíveis para reserva</p></div>
            <Dialog open={isRoomDialogOpen} onOpenChange={(o) => { setIsRoomDialogOpen(o); if (!o) { setEditingRoom(null); setSelectedRoles(['all']); } }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Sala</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingRoom ? 'Editar' : 'Nova'} Sala</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveRoom(new FormData(e.currentTarget)); }} className="space-y-4">
                  <div><Label className="mb-1.5 block">Nome da Sala</Label><Input name="name" defaultValue={editingRoom?.des_nome} required placeholder="Ex: Sala de Reunião 1" /></div>
                  <div><Label className="mb-1.5 block">Capacidade Máxima</Label><Input name="capacity" type="number" defaultValue={editingRoom?.num_capacidade || 10} required min={1} /></div>
                  <div>
                    <Label className="mb-1.5 block">Quem pode reservar</Label>
                    <div className="space-y-2 mt-2">
                      {availableRoles.map(role => (
                        <div key={role.value} className="flex items-center gap-2">
                          <Checkbox id={role.value} checked={selectedRoles.includes(role.value)} onCheckedChange={(checked) => {
                            if (role.value === 'all') { setSelectedRoles(checked ? ['all'] : []); }
                            else { setSelectedRoles(prev => { const filtered = prev.filter(r => r !== 'all'); return checked ? [...filtered, role.value] : filtered.filter(r => r !== role.value); }); }
                          }} />
                          <label htmlFor={role.value} className="text-sm cursor-pointer">{role.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <input type="hidden" name="sort_order" value={editingRoom?.num_ordem || rooms.length} />
                  <Button type="submit" className="w-full">Salvar</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {isLoading ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> : rooms.length === 0 ? <div className="p-8 text-center text-muted-foreground">Nenhuma sala cadastrada</div> : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleRoomDragEnd}>
                <SortableContext items={rooms.map(r => r.cod_sala)} strategy={verticalListSortingStrategy}>
                  <div className="divide-y divide-border">{rooms.map((room) => <SortableRoom key={room.cod_sala} room={room} />)}</div>
                </SortableContext>
                <DragOverlay>{activeId && rooms.find(r => r.cod_sala === activeId) ? <div className="flex items-center gap-3 p-4 bg-card rounded-lg shadow-2xl border-2 border-primary"><GripVertical className="h-4 w-4 text-primary" /><span className="font-semibold">{rooms.find(r => r.cod_sala === activeId)?.des_nome}</span></div> : null}</DragOverlay>
              </DndContext>
            )}
          </div>
        </TabsContent>

        <TabsContent value="types" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div><h3 className="font-semibold">Tipos de Reunião</h3><p className="text-sm text-muted-foreground">Gerencie os tipos de reunião disponíveis</p></div>
            <Dialog open={isTypeDialogOpen} onOpenChange={(o) => { setIsTypeDialogOpen(o); if (!o) setEditingType(null); }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Novo Tipo</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingType ? 'Editar' : 'Novo'} Tipo de Reunião</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveType(new FormData(e.currentTarget)); }} className="space-y-4">
                  <div><Label className="mb-1.5 block">Nome</Label><Input name="name" defaultValue={editingType?.des_nome} required placeholder="Ex: Daily" /></div>
                  <input type="hidden" name="sort_order" value={editingType?.num_ordem || meetingTypes.length} />
                  <Button type="submit" className="w-full">Salvar</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {isLoading ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> : meetingTypes.length === 0 ? <div className="p-8 text-center text-muted-foreground">Nenhum tipo cadastrado</div> : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleTypeDragEnd}>
                <SortableContext items={meetingTypes.map(t => t.cod_tipo_reuniao)} strategy={verticalListSortingStrategy}>
                  <div className="divide-y divide-border">{meetingTypes.map((type) => <SortableType key={type.cod_tipo_reuniao} type={type} />)}</div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteRoomId} onOpenChange={(open) => !open && setDeleteRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir esta sala?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteRoom} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTypeId} onOpenChange={(open) => !open && setDeleteTypeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir este tipo de reunião?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteType} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
