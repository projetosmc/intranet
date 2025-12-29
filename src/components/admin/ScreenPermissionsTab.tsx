import { useState, useEffect, useMemo } from 'react';
import { Lock, Save, Loader2, Check, X, Info, Copy, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

function SortableScreenRow({
  screen,
  screenData,
  roles,
  roleLabels,
  pendingChanges,
  onToggle,
}: {
  screen: string;
  screenData: ScreenGroup;
  roles: RoleType[];
  roleLabels: Record<string, { label: string; abbrev: string; color: string }>;
  pendingChanges: Map<string, boolean>;
  onToggle: (permissao: Permissao) => void;
}) {
  const firstPermission = Object.values(screenData.permissions)[0];
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: firstPermission?.cod_permissao || screen });

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
        <div className="flex flex-col">
          <span className="font-medium">{screen}</span>
          <span className="text-xs text-muted-foreground">
            {screenData.rota}
          </span>
        </div>
      </TableCell>
      {roles.map((role) => {
        const permissao = screenData.permissions[role.des_codigo];
        if (!permissao) return <TableCell key={role.des_codigo} />;

        const hasChange = pendingChanges.has(permissao.cod_permissao);
        const label = roleLabels[role.des_codigo];

        return (
          <TableCell key={role.des_codigo} className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Switch
                checked={permissao.ind_pode_acessar}
                onCheckedChange={() => onToggle(permissao)}
                className="data-[state=checked]:bg-green-500"
              />
              {permissao.ind_pode_acessar ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-destructive" />
              )}
              {hasChange && (
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              )}
            </div>
          </TableCell>
        );
      })}
    </TableRow>
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
  }, []);

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

  // Criar labels dinâmicos baseados nos tipos de perfil
  const roleLabels = useMemo(() => {
    const labels: Record<string, { label: string; abbrev: string; color: string }> = {};
    roleTypes.forEach((role) => {
      labels[role.des_codigo] = {
        label: role.des_nome,
        abbrev: role.des_nome.substring(0, 3).toUpperCase(),
        color: role.des_cor,
      };
    });
    return labels;
  }, [roleTypes]);

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

      const sourceLabel = roleLabels[sourceRole]?.label || sourceRole;
      const targetLabel = roleLabels[targetRole]?.label || targetRole;
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
        const firstPerm = groupedByScreen[s].permissions[Object.keys(groupedByScreen[s].permissions)[0]];
        return firstPerm?.cod_permissao === active.id;
      });
      const newIndex = screens.findIndex((s) => {
        const firstPerm = groupedByScreen[s].permissions[Object.keys(groupedByScreen[s].permissions)[0]];
        return firstPerm?.cod_permissao === over.id;
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

  const sortableIds = useMemo(() => {
    return sortedScreens.map((screen) => {
      const firstPerm = Object.values(groupedByScreen[screen].permissions)[0];
      return firstPerm?.cod_permissao || screen;
    });
  }, [sortedScreens, groupedByScreen]);

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
              Configure quais telas cada perfil de usuário pode acessar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            Salvar Alterações
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
        <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Ative ou desative o acesso de cada perfil às telas do sistema. Use "Copiar
          Permissões" para replicar configurações entre perfis. Arraste as linhas para
          reordenar as telas.
        </p>
      </div>

      {/* Legenda de perfis */}
      <div className="flex flex-wrap gap-2">
        {roleTypes.map((role) => (
          <Badge key={role.des_codigo} className={role.des_cor}>
            {role.des_nome}
          </Badge>
        ))}
      </div>

      {/* Tabela de permissões com drag-and-drop */}
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
                <TableHead className="w-[250px]">Tela</TableHead>
                {roleTypes.map((role) => (
                  <TableHead key={role.des_codigo} className="text-center w-[120px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">
                          <Badge className={role.des_cor}>
                            {role.des_nome.substring(0, 3).toUpperCase()}
                          </Badge>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{role.des_nome}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {sortedScreens.map((screen) => (
                  <SortableScreenRow
                    key={screen}
                    screen={screen}
                    screenData={groupedByScreen[screen]}
                    roles={roleTypes}
                    roleLabels={roleLabels}
                    pendingChanges={pendingChanges}
                    onToggle={handleToggle}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
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
    </div>
  );
}
