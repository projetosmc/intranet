import { useState, useEffect, useMemo, useCallback } from 'react';
import { Lock, Save, Loader2, Check, X, Info, Copy } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Permissao {
  cod_permissao: string;
  des_role: 'admin' | 'moderator' | 'user';
  des_rota: string;
  des_nome_tela: string;
  ind_pode_acessar: boolean;
}

type AppRole = 'admin' | 'moderator' | 'user';

const roleLabels: Record<AppRole, { label: string; abbrev: string; color: string }> = {
  admin: {
    label: 'Administrador',
    abbrev: 'ADM',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  moderator: {
    label: 'Moderador',
    abbrev: 'MOD',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  user: {
    label: 'Usuário',
    abbrev: 'USR',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
};

const roles: AppRole[] = ['admin', 'moderator', 'user'];

export function ScreenPermissionsTab() {
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [sourceRole, setSourceRole] = useState<AppRole | ''>('');
  const [targetRole, setTargetRole] = useState<AppRole | ''>('');
  const [isCopying, setIsCopying] = useState(false);
  

  useEffect(() => {
    fetchPermissoes();
  }, []);

  const fetchPermissoes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tab_permissao_tela')
        .select('*')
        .order('des_nome_tela')
        .order('des_role');

      if (error) throw error;
      setPermissoes((data || []) as Permissao[]);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      toast({ title: 'Erro ao carregar permissões', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (permissao: Permissao) => {
    // Atualiza localmente
    setPermissoes((prev) =>
      prev.map((p) =>
        p.cod_permissao === permissao.cod_permissao
          ? { ...p, ind_pode_acessar: !p.ind_pode_acessar }
          : p
      )
    );

    // Marca como alteração pendente
    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      const currentValue = permissoes.find(
        (p) => p.cod_permissao === permissao.cod_permissao
      )?.ind_pode_acessar;

      // Se está voltando ao valor original, remove do pending
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

      // Log de auditoria será feito automaticamente pelo sistema

      toast({ title: `${updates.length} permissão(ões) atualizada(s) com sucesso!` });
      setPendingChanges(new Map());
      await fetchPermissoes();
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
      // Buscar permissões do perfil de origem
      const sourcePermissions = permissoes.filter((p) => p.des_role === sourceRole);

      // Atualizar permissões do perfil de destino
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

      // Log de auditoria será feito automaticamente pelo sistema

      toast({
        title: `Permissões copiadas de ${roleLabels[sourceRole].label} para ${roleLabels[targetRole].label}`,
      });
      setCopyDialogOpen(false);
      setSourceRole('');
      setTargetRole('');
      await fetchPermissoes();
    } catch (error) {
      console.error('Erro ao copiar permissões:', error);
      toast({ title: 'Erro ao copiar permissões', variant: 'destructive' });
    } finally {
      setIsCopying(false);
    }
  };

  // Agrupa permissões por tela
  const groupedByScreen = useMemo(() => {
    return permissoes.reduce(
      (acc, p) => {
        if (!acc[p.des_nome_tela]) {
          acc[p.des_nome_tela] = { rota: p.des_rota, permissions: {} };
        }
        acc[p.des_nome_tela].permissions[p.des_role] = p;
        return acc;
      },
      {} as Record<string, { rota: string; permissions: Record<string, Permissao> }>
    );
  }, [permissoes]);

  const screens = useMemo(() => Object.keys(groupedByScreen).sort(), [groupedByScreen]);

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
          Permissões" para replicar configurações entre perfis. Todas as alterações são
          registradas em log de auditoria.
        </p>
      </div>

      {/* Legenda de perfis */}
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <Badge key={role} className={roleLabels[role].color}>
            {roleLabels[role].label}
          </Badge>
        ))}
      </div>

      {/* Tabela de permissões */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Tela</TableHead>
              {roles.map((role) => (
                <TableHead key={role} className="text-center w-[120px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <Badge className={roleLabels[role].color}>
                          {roleLabels[role].abbrev}
                        </Badge>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{roleLabels[role].label}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {screens.map((screen) => (
              <TableRow key={screen}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{screen}</span>
                    <span className="text-xs text-muted-foreground">
                      {groupedByScreen[screen].rota}
                    </span>
                  </div>
                </TableCell>
                {roles.map((role) => {
                  const permissao = groupedByScreen[screen]?.permissions[role];
                  if (!permissao) return <TableCell key={role} />;

                  const hasChange = pendingChanges.has(permissao.cod_permissao);

                  return (
                    <TableCell key={role} className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={permissao.ind_pode_acessar}
                          onCheckedChange={() => handleToggle(permissao)}
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
            ))}
          </TableBody>
        </Table>
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
              <Select
                value={sourceRole}
                onValueChange={(v) => setSourceRole(v as AppRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil de origem" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Copiar para (destino):</label>
              <Select
                value={targetRole}
                onValueChange={(v) => setTargetRole(v as AppRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil de destino" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((r) => r !== sourceRole)
                    .map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role].label}
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
