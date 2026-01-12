import { useState, useEffect, useMemo, useCallback } from 'react';
import { Lock, Save, Loader2, Check, X, Info, Copy, GripVertical, Plus, Trash2, Search, Users, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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

interface Permissao {
  cod_permissao: string;
  des_role: string;
  des_rota: string;
  des_nome_tela: string;
  ind_pode_acessar: boolean;
  num_ordem: number;
}

interface RoleType {
  cod_perfil_tipo: string;
  des_codigo: string;
  des_nome: string;
  des_cor: string;
}

interface ScreenGroup {
  rota: string;
  nome: string;
  ordem: number;
  permissions: Record<string, Permissao>;
}

// Componente de item de tela com drag-and-drop
function SortableScreenItem({
  screen,
  screenData,
  selectedRole,
  pendingChanges,
  onToggle,
  onDelete,
}: {
  screen: string;
  screenData: ScreenGroup;
  selectedRole: string;
  pendingChanges: Map<string, boolean>;
  onToggle: (permissao: Permissao) => void;
  onDelete: (screenName: string) => void;
}) {
  const permissao = screenData.permissions[selectedRole];
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: permissao?.cod_permissao || screen });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!permissao) return null;

  const hasChange = pendingChanges.has(permissao.cod_permissao);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded shrink-0"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex flex-col min-w-0">
          <span className="font-medium truncate">{screen}</span>
          <span className="text-xs text-muted-foreground truncate">
            {screenData.rota}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Switch
            checked={permissao.ind_pode_acessar}
            onCheckedChange={() => onToggle(permissao)}
            className="data-[state=checked]:bg-green-500"
          />
          {permissao.ind_pode_acessar ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-destructive" />
          )}
          {hasChange && (
            <span className="h-2 w-2 rounded-full bg-orange-500" />
          )}
        </div>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(screen)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Remover tela</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export function ScreenPermissionsTab() {
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [sourceRole, setSourceRole] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('');
  const [isCopying, setIsCopying] = useState(false);
  
  // Estado para seleção de perfil
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  // Estado para adicionar nova tela
  const [addScreenDialogOpen, setAddScreenDialogOpen] = useState(false);
  const [newScreenName, setNewScreenName] = useState('');
  const [newScreenRoute, setNewScreenRoute] = useState('');
  const [isAddingScreen, setIsAddingScreen] = useState(false);
  
  // Estado para deletar tela
  const [deleteScreenName, setDeleteScreenName] = useState<string | null>(null);
  
  // Estado para busca
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para colapsar lista de perfis em mobile
  const [rolesListOpen, setRolesListOpen] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
  }, []);

  // Selecionar primeiro perfil automaticamente
  useEffect(() => {
    if (roleTypes.length > 0 && !selectedRole) {
      setSelectedRole(roleTypes[0].des_codigo);
    }
  }, [roleTypes, selectedRole]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar tipos de perfil
      const { data: rolesData, error: rolesError } = await supabase
        .from('tab_perfil_tipo')
        .select('cod_perfil_tipo, des_codigo, des_nome, des_cor')
        .eq('ind_ativo', true)
        .order('num_ordem');

      if (rolesError) throw rolesError;
      setRoleTypes((rolesData || []) as RoleType[]);

      // Buscar permissões
      const { data: permData, error: permError } = await supabase
        .from('tab_permissao_tela')
        .select('*')
        .order('num_ordem')
        .order('des_nome_tela');

      if (permError) throw permError;
      setPermissoes((permData || []) as Permissao[]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (permissao: Permissao) => {
    setPermissoes((prev) =>
      prev.map((p) =>
        p.cod_permissao === permissao.cod_permissao
          ? { ...p, ind_pode_acessar: !p.ind_pode_acessar }
          : p
      )
    );

    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      const currentValue = permissoes.find(
        (p) => p.cod_permissao === permissao.cod_permissao
      )?.ind_pode_acessar;

      if (newMap.has(permissao.cod_permissao)) {
        newMap.delete(permissao.cod_permissao);
      } else {
        newMap.set(permissao.cod_permissao, !currentValue!);
      }
      return newMap;
    });
  };

  const handleSave = async () => {
    if (pendingChanges.size === 0) return;

    setIsSaving(true);
    try {
      const updates = Array.from(pendingChanges.entries()).map(([id, value]) => ({
        cod_permissao: id,
        ind_pode_acessar: value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('tab_permissao_tela')
          .update({ ind_pode_acessar: update.ind_pode_acessar })
          .eq('cod_permissao', update.cod_permissao);

        if (error) throw error;
      }

      toast({ title: `${updates.length} permissão(ões) atualizada(s) com sucesso!` });
      setPendingChanges(new Map());
      await fetchData();
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast({ title: 'Erro ao salvar permissões', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPermissions = async () => {
    if (!sourceRole || !targetRole || sourceRole === targetRole) return;

    setIsCopying(true);
    try {
      const sourcePermissions = permissoes.filter((p) => p.des_role === sourceRole);

      for (const sourcePermission of sourcePermissions) {
        const targetPermission = permissoes.find(
          (p) => p.des_role === targetRole && p.des_rota === sourcePermission.des_rota
        );

        if (targetPermission) {
          const { error } = await supabase
            .from('tab_permissao_tela')
            .update({ ind_pode_acessar: sourcePermission.ind_pode_acessar })
            .eq('cod_permissao', targetPermission.cod_permissao);

          if (error) throw error;
        }
      }

      const sourceLabel = roleTypes.find(r => r.des_codigo === sourceRole)?.des_nome || sourceRole;
      const targetLabel = roleTypes.find(r => r.des_codigo === targetRole)?.des_nome || targetRole;
      toast({ title: `Permissões copiadas de ${sourceLabel} para ${targetLabel}` });
      setCopyDialogOpen(false);
      setSourceRole('');
      setTargetRole('');
      await fetchData();
    } catch (error) {
      console.error('Erro ao copiar permissões:', error);
      toast({ title: 'Erro ao copiar permissões', variant: 'destructive' });
    } finally {
      setIsCopying(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const screens = Object.keys(groupedByScreen);
      const oldIndex = screens.findIndex((s) => {
        const perm = groupedByScreen[s].permissions[selectedRole];
        return perm?.cod_permissao === active.id;
      });
      const newIndex = screens.findIndex((s) => {
        const perm = groupedByScreen[s].permissions[selectedRole];
        return perm?.cod_permissao === over.id;
      });

      if (oldIndex !== -1 && newIndex !== -1) {
        const newScreenOrder = arrayMove(screens, oldIndex, newIndex);

        // Atualizar ordem no banco
        try {
          for (let i = 0; i < newScreenOrder.length; i++) {
            const screenName = newScreenOrder[i];
            const screenPerms = Object.values(groupedByScreen[screenName].permissions);
            for (const perm of screenPerms) {
              await supabase
                .from('tab_permissao_tela')
                .update({ num_ordem: i + 1 })
                .eq('cod_permissao', perm.cod_permissao);
            }
          }
          toast({ title: 'Ordem das telas atualizada!' });
          await fetchData();
        } catch (error) {
          console.error('Erro ao atualizar ordem:', error);
          toast({ title: 'Erro ao atualizar ordem', variant: 'destructive' });
        }
      }
    }
  };

  const handleAddScreen = async () => {
    if (!newScreenName.trim() || !newScreenRoute.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    // Validar formato da rota
    if (!newScreenRoute.startsWith('/')) {
      toast({ title: 'A rota deve começar com /', variant: 'destructive' });
      return;
    }

    // Verificar se a rota já existe
    const existingRoute = permissoes.find(p => p.des_rota === newScreenRoute.trim());
    if (existingRoute) {
      toast({ title: 'Esta rota já existe', variant: 'destructive' });
      return;
    }

    setIsAddingScreen(true);
    try {
      // Calcular próxima ordem
      const maxOrder = Math.max(...permissoes.map(p => p.num_ordem), 0);
      
      // Inserir para o primeiro perfil (o trigger criará para os demais)
      const firstRole = roleTypes[0];
      if (!firstRole) {
        toast({ title: 'Nenhum tipo de perfil encontrado', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('tab_permissao_tela')
        .insert({
          des_role: firstRole.des_codigo,
          des_rota: newScreenRoute.trim(),
          des_nome_tela: newScreenName.trim(),
          ind_pode_acessar: false,
          num_ordem: maxOrder + 1,
        });

      if (error) throw error;

      toast({ title: 'Tela adicionada com sucesso!' });
      setAddScreenDialogOpen(false);
      setNewScreenName('');
      setNewScreenRoute('');
      await fetchData();
    } catch (error) {
      console.error('Erro ao adicionar tela:', error);
      toast({ title: 'Erro ao adicionar tela', variant: 'destructive' });
    } finally {
      setIsAddingScreen(false);
    }
  };

  const handleDeleteScreen = async () => {
    if (!deleteScreenName) return;

    try {
      // Buscar todas as permissões da tela
      const screenPerms = permissoes.filter(p => p.des_nome_tela === deleteScreenName);
      
      for (const perm of screenPerms) {
        const { error } = await supabase
          .from('tab_permissao_tela')
          .delete()
          .eq('cod_permissao', perm.cod_permissao);

        if (error) throw error;
      }

      toast({ title: 'Tela removida com sucesso!' });
      setDeleteScreenName(null);
      await fetchData();
    } catch (error) {
      console.error('Erro ao remover tela:', error);
      toast({ title: 'Erro ao remover tela', variant: 'destructive' });
    }
  };

  // Agrupa permissões por tela
  const groupedByScreen = useMemo(() => {
    const grouped: Record<string, ScreenGroup> = {};
    permissoes.forEach((p) => {
      if (!grouped[p.des_nome_tela]) {
        grouped[p.des_nome_tela] = {
          rota: p.des_rota,
          nome: p.des_nome_tela,
          ordem: p.num_ordem,
          permissions: {},
        };
      }
      grouped[p.des_nome_tela].permissions[p.des_role] = p;
    });
    return grouped;
  }, [permissoes]);

  const sortedScreens = useMemo(() => {
    return Object.keys(groupedByScreen).sort((a, b) => {
      return (groupedByScreen[a].ordem || 0) - (groupedByScreen[b].ordem || 0);
    });
  }, [groupedByScreen]);

  // Filtro de busca
  const filteredScreens = useMemo(() => {
    if (!searchTerm.trim()) return sortedScreens;
    const lowerSearch = searchTerm.toLowerCase();
    return sortedScreens.filter(screen => {
      const screenData = groupedByScreen[screen];
      return screen.toLowerCase().includes(lowerSearch) ||
             screenData.rota.toLowerCase().includes(lowerSearch);
    });
  }, [sortedScreens, groupedByScreen, searchTerm]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const sortableIds = useMemo(() => {
    return filteredScreens.map((screen) => {
      const perm = groupedByScreen[screen].permissions[selectedRole];
      return perm?.cod_permissao || screen;
    });
  }, [filteredScreens, groupedByScreen, selectedRole]);

  // Contar permissões habilitadas por perfil
  const permissionCounts = useMemo(() => {
    const counts: Record<string, { enabled: number; total: number }> = {};
    roleTypes.forEach(role => {
      const rolePerms = permissoes.filter(p => p.des_role === role.des_codigo);
      counts[role.des_codigo] = {
        enabled: rolePerms.filter(p => p.ind_pode_acessar).length,
        total: rolePerms.length,
      };
    });
    return counts;
  }, [permissoes, roleTypes]);

  // Contar mudanças pendentes para o perfil selecionado
  const pendingCountForRole = useMemo(() => {
    let count = 0;
    pendingChanges.forEach((_, key) => {
      const perm = permissoes.find(p => p.cod_permissao === key);
      if (perm?.des_role === selectedRole) count++;
    });
    return count;
  }, [pendingChanges, permissoes, selectedRole]);

  const selectedRoleData = useMemo(() => {
    return roleTypes.find(r => r.des_codigo === selectedRole);
  }, [roleTypes, selectedRole]);

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
          <Lock className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Permissões de Acesso por Perfil</h3>
            <p className="text-sm text-muted-foreground">
              Selecione um perfil e configure quais telas ele pode acessar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setAddScreenDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tela
          </Button>
          <Button variant="outline" onClick={() => setCopyDialogOpen(true)}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar Permissões
          </Button>
          <Button
            onClick={handleSave}
            disabled={pendingChanges.size === 0 || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
            {pendingChanges.size > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingChanges.size}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
        <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Selecione um perfil na lista à esquerda para configurar suas permissões. 
          Use "Copiar Permissões" para replicar configurações entre perfis.
        </p>
      </div>

      {/* Layout principal: Lista de perfis + Telas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de perfis */}
        <div className="lg:col-span-4">
          <Collapsible open={rolesListOpen} onOpenChange={setRolesListOpen} className="lg:hidden mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Perfis ({roleTypes.length})</span>
                  {selectedRoleData && (
                    <Badge className={selectedRoleData.des_cor}>{selectedRoleData.des_nome}</Badge>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${rolesListOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <RolesList
                roleTypes={roleTypes}
                selectedRole={selectedRole}
                setSelectedRole={setSelectedRole}
                permissionCounts={permissionCounts}
                pendingChanges={pendingChanges}
                permissoes={permissoes}
              />
            </CollapsibleContent>
          </Collapsible>

          <div className="hidden lg:block">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Perfis
                  <Badge variant="secondary" className="ml-auto">
                    {roleTypes.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Clique em um perfil para editar suas permissões
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <RolesList
                    roleTypes={roleTypes}
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                    permissionCounts={permissionCounts}
                    pendingChanges={pendingChanges}
                    permissoes={permissoes}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Telas do perfil selecionado */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    Telas
                    {selectedRoleData && (
                      <Badge className={selectedRoleData.des_cor}>{selectedRoleData.des_nome}</Badge>
                    )}
                    {pendingCountForRole > 0 && (
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                        {pendingCountForRole} alteração{pendingCountForRole > 1 ? 'ões' : ''}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {permissionCounts[selectedRole]?.enabled || 0} de {permissionCounts[selectedRole]?.total || 0} telas habilitadas
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tela..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-9"
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
              </div>
            </CardHeader>
            <CardContent>
              {/* Results count */}
              {searchTerm && (
                <p className="text-sm text-muted-foreground mb-4">
                  {filteredScreens.length} tela{filteredScreens.length !== 1 ? 's' : ''} encontrada{filteredScreens.length !== 1 ? 's' : ''}
                </p>
              )}

              <ScrollArea className="h-[450px] pr-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {filteredScreens.length === 0 ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                          {searchTerm ? 'Nenhuma tela encontrada' : 'Nenhuma tela cadastrada'}
                        </div>
                      ) : (
                        filteredScreens.map((screen) => (
                          <SortableScreenItem
                            key={screen}
                            screen={screen}
                            screenData={groupedByScreen[screen]}
                            selectedRole={selectedRole}
                            pendingChanges={pendingChanges}
                            onToggle={handleToggle}
                            onDelete={setDeleteScreenName}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de copiar permissões */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copiar Permissões entre Perfis</DialogTitle>
            <DialogDescription>
              Copie todas as permissões de um perfil para outro. As permissões
              existentes serão sobrescritas.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Copiar de (origem):</label>
              <Select value={sourceRole} onValueChange={setSourceRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil de origem" />
                </SelectTrigger>
                <SelectContent>
                  {roleTypes.map((role) => (
                    <SelectItem key={role.des_codigo} value={role.des_codigo}>
                      {role.des_nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Copiar para (destino):</label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil de destino" />
                </SelectTrigger>
                <SelectContent>
                  {roleTypes
                    .filter((r) => r.des_codigo !== sourceRole)
                    .map((role) => (
                      <SelectItem key={role.des_codigo} value={role.des_codigo}>
                        {role.des_nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCopyPermissions}
              disabled={!sourceRole || !targetRole || sourceRole === targetRole || isCopying}
            >
              {isCopying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de adicionar tela */}
      <Dialog open={addScreenDialogOpen} onOpenChange={setAddScreenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Tela</DialogTitle>
            <DialogDescription>
              Adicione uma nova tela ao sistema de permissões. A tela será criada com acesso desabilitado para todos os perfis.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="screen-name">Nome da Tela</Label>
              <Input
                id="screen-name"
                value={newScreenName}
                onChange={(e) => setNewScreenName(e.target.value)}
                placeholder="Ex: Relatórios, Dashboard, Configurações"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="screen-route">Rota</Label>
              <Input
                id="screen-route"
                value={newScreenRoute}
                onChange={(e) => setNewScreenRoute(e.target.value)}
                placeholder="Ex: /admin/relatorios, /dashboard"
              />
              <p className="text-xs text-muted-foreground">
                A rota deve começar com / e corresponder ao caminho da página no sistema.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddScreenDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddScreen}
              disabled={!newScreenName.trim() || !newScreenRoute.trim() || isAddingScreen}
            >
              {isAddingScreen ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteScreenName} onOpenChange={(open) => !open && setDeleteScreenName(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Tela</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a tela "{deleteScreenName}"? Esta ação irá remover todas as permissões associadas e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteScreen}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Componente separado para lista de perfis
function RolesList({
  roleTypes,
  selectedRole,
  setSelectedRole,
  permissionCounts,
  pendingChanges,
  permissoes,
}: {
  roleTypes: RoleType[];
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  permissionCounts: Record<string, { enabled: number; total: number }>;
  pendingChanges: Map<string, boolean>;
  permissoes: Permissao[];
}) {
  // Contar mudanças pendentes por perfil
  const pendingCountByRole = useMemo(() => {
    const counts: Record<string, number> = {};
    roleTypes.forEach(role => {
      let count = 0;
      pendingChanges.forEach((_, key) => {
        const perm = permissoes.find(p => p.cod_permissao === key);
        if (perm?.des_role === role.des_codigo) count++;
      });
      counts[role.des_codigo] = count;
    });
    return counts;
  }, [roleTypes, pendingChanges, permissoes]);

  return (
    <div className="space-y-1 p-2">
      {roleTypes.map((role) => {
        const counts = permissionCounts[role.des_codigo];
        const pendingCount = pendingCountByRole[role.des_codigo] || 0;
        const isSelected = selectedRole === role.des_codigo;
        const percentage = counts?.total > 0 ? Math.round((counts.enabled / counts.total) * 100) : 0;

        return (
          <button
            key={role.des_codigo}
            onClick={() => setSelectedRole(role.des_codigo)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              isSelected
                ? 'bg-primary/10 border border-primary/30'
                : 'hover:bg-muted border border-transparent'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge className={`${role.des_cor} shrink-0`}>
                  {role.des_nome.substring(0, 3).toUpperCase()}
                </Badge>
                <span className="font-medium truncate">{role.des_nome}</span>
              </div>
              {pendingCount > 0 && (
                <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {counts?.enabled || 0}/{counts?.total || 0}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
