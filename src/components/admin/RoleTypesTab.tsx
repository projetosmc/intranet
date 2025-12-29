import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Shield,
  GripVertical,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RoleType {
  cod_perfil_tipo: string;
  des_codigo: string;
  des_nome: string;
  des_descricao: string | null;
  des_cor: string;
  ind_sistema: boolean;
  num_ordem: number;
  ind_ativo: boolean;
}

const colorOptions = [
  { value: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Vermelho' },
  { value: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Verde' },
  { value: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Azul' },
  { value: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Amarelo' },
  { value: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', label: 'Roxo' },
  { value: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'Laranja' },
  { value: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200', label: 'Rosa' },
  { value: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200', label: 'Ciano' },
  { value: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', label: 'Cinza' },
];

function SortableRow({ role, onEdit, onDelete }: { 
  role: RoleType; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: role.cod_perfil_tipo });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-[40px]">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        <Badge className={role.des_cor}>{role.des_nome}</Badge>
      </TableCell>
      <TableCell className="font-mono text-sm text-muted-foreground">
        {role.des_codigo}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {role.des_descricao || '-'}
      </TableCell>
      <TableCell>
        {role.ind_sistema ? (
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            Sistema
          </Badge>
        ) : (
          <Badge variant="secondary">Customizado</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          {!role.ind_sistema && (
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function RoleTypesTab() {
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleType | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formCodigo, setFormCodigo] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formCor, setFormCor] = useState(colorOptions[0].value);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tab_perfil_tipo')
        .select('*')
        .order('num_ordem');

      if (error) throw error;
      setRoles((data || []) as RoleType[]);
    } catch (error) {
      console.error('Erro ao carregar tipos de perfil:', error);
      toast({ title: 'Erro ao carregar tipos de perfil', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = roles.findIndex((r) => r.cod_perfil_tipo === active.id);
      const newIndex = roles.findIndex((r) => r.cod_perfil_tipo === over.id);
      const newRoles = arrayMove(roles, oldIndex, newIndex);

      setRoles(newRoles);

      // Atualizar ordem no banco
      try {
        for (let i = 0; i < newRoles.length; i++) {
          await supabase
            .from('tab_perfil_tipo')
            .update({ num_ordem: i + 1 })
            .eq('cod_perfil_tipo', newRoles[i].cod_perfil_tipo);
        }
        toast({ title: 'Ordem atualizada!' });
      } catch (error) {
        console.error('Erro ao atualizar ordem:', error);
        toast({ title: 'Erro ao atualizar ordem', variant: 'destructive' });
        fetchRoles();
      }
    }
  };

  const handleNew = () => {
    setEditingRole(null);
    setFormCodigo('');
    setFormNome('');
    setFormDescricao('');
    setFormCor(colorOptions[0].value);
    setDialogOpen(true);
  };

  const handleEdit = (role: RoleType) => {
    setEditingRole(role);
    setFormCodigo(role.des_codigo);
    setFormNome(role.des_nome);
    setFormDescricao(role.des_descricao || '');
    setFormCor(role.des_cor);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formCodigo.trim() || !formNome.trim()) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    // Validar código: apenas letras minúsculas, números e underscore
    const codigoRegex = /^[a-z][a-z0-9_]*$/;
    if (!codigoRegex.test(formCodigo)) {
      toast({ 
        title: 'Código inválido', 
        description: 'Use apenas letras minúsculas, números e underscore. Deve começar com letra.',
        variant: 'destructive' 
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingRole) {
        // Atualizar
        const { error } = await supabase
          .from('tab_perfil_tipo')
          .update({
            des_codigo: editingRole.ind_sistema ? editingRole.des_codigo : formCodigo,
            des_nome: formNome,
            des_descricao: formDescricao || null,
            des_cor: formCor,
          })
          .eq('cod_perfil_tipo', editingRole.cod_perfil_tipo);

        if (error) throw error;
        toast({ title: 'Tipo de perfil atualizado!' });
      } else {
        // Criar novo
        const maxOrdem = Math.max(...roles.map(r => r.num_ordem), 0);
        const { error } = await supabase
          .from('tab_perfil_tipo')
          .insert({
            des_codigo: formCodigo,
            des_nome: formNome,
            des_descricao: formDescricao || null,
            des_cor: formCor,
            num_ordem: maxOrdem + 1,
          });

        if (error) {
          if (error.code === '23505') {
            toast({ title: 'Este código já existe', variant: 'destructive' });
            return;
          }
          throw error;
        }
        toast({ title: 'Tipo de perfil criado!' });
      }

      setDialogOpen(false);
      fetchRoles();
    } catch (error) {
      console.error('Erro ao salvar tipo de perfil:', error);
      toast({ title: 'Erro ao salvar tipo de perfil', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;

    try {
      const { error } = await supabase
        .from('tab_perfil_tipo')
        .delete()
        .eq('cod_perfil_tipo', deletingRole.cod_perfil_tipo);

      if (error) throw error;

      toast({ title: 'Tipo de perfil excluído!' });
      setDeleteDialogOpen(false);
      setDeletingRole(null);
      fetchRoles();
    } catch (error) {
      console.error('Erro ao excluir tipo de perfil:', error);
      toast({ title: 'Erro ao excluir tipo de perfil', variant: 'destructive' });
    }
  };

  // Filtro de busca
  const filteredRoles = useMemo(() => {
    if (!searchTerm.trim()) return roles;
    const lowerSearch = searchTerm.toLowerCase();
    return roles.filter(role =>
      role.des_nome.toLowerCase().includes(lowerSearch) ||
      role.des_codigo.toLowerCase().includes(lowerSearch) ||
      role.des_descricao?.toLowerCase().includes(lowerSearch)
    );
  }, [roles, searchTerm]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Tipos de Perfil</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie os tipos de perfil disponíveis no sistema
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9 w-full sm:w-64"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tipo
          </Button>
        </div>
      </div>

      {/* Results count */}
      {searchTerm && (
        <p className="text-sm text-muted-foreground">
          {filteredRoles.length} tipo{filteredRoles.length !== 1 ? 's' : ''} encontrado{filteredRoles.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Tabela com drag-and-drop */}
      <div className="border border-border rounded-lg overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={filteredRoles.map((r) => r.cod_perfil_tipo)}
                strategy={verticalListSortingStrategy}
              >
                {filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhum tipo de perfil encontrado' : 'Nenhum tipo de perfil cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role) => (
                    <SortableRow
                      key={role.cod_perfil_tipo}
                      role={role}
                      onEdit={() => handleEdit(role)}
                      onDelete={() => {
                        setDeletingRole(role);
                        setDeleteDialogOpen(true);
                      }}
                    />
                  ))
                )}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Dialog de criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Tipo de Perfil' : 'Novo Tipo de Perfil'}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Atualize as informações do tipo de perfil'
                : 'Crie um novo tipo de perfil para atribuir aos usuários'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formCodigo}
                onChange={(e) => setFormCodigo(e.target.value.toLowerCase())}
                placeholder="ex: gestor, analista"
                disabled={editingRole?.ind_sistema}
              />
              <p className="text-xs text-muted-foreground">
                Identificador único. Use apenas letras minúsculas, números e underscore.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome de Exibição *</Label>
              <Input
                id="nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="ex: Gestor, Analista de TI"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                placeholder="Descreva as responsabilidades deste perfil"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor do Badge</Label>
              <Select value={formCor} onValueChange={setFormCor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={color.value}>{color.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <Badge className={formCor}>{formNome || 'Nome do Perfil'}</Badge>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRole ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tipo de perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O tipo de perfil "{deletingRole?.des_nome}" 
              será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
