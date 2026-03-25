import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, Search, TrendingUp, DollarSign, CreditCard, Calendar,
  Clock, CheckCircle, AlertCircle, Loader2, ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RastreioVenda {
  cod_rastreio: string;
  cod_empresa: number;
  des_nom_resumido: string;
  cod_pessoa_sacado: number;
  nom_pessoa: string;
  tipo_titulo: string;
  dta_venda: string | null;
  dta_venc_titulo: string | null;
  dta_faturamento: string | null;
  dta_vencimento_fatura: string | null;
  dta_recebimento: string | null;
  val_bruto_titulo: number;
  val_liquido_titulo: number;
  val_pagamento: number;
  cod_forma_pagto: number;
  des_forma_pagto: string;
  seq_titulo: number;
  seq_cupom: number;
  num_cupom: number;
  source_key: string;
  dta_prev_recebimento: string | null;
}

interface SyncControle {
  des_status: string;
  dta_ultima_sync: string | null;
  dta_inicio_sync: string | null;
  num_registros_processados: number;
  num_total_registros: number;
  des_erro: string | null;
}

const PAGE_SIZE = 50;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
};

const getStatusBadge = (venda: RastreioVenda) => {
  if (venda.dta_recebimento) {
    return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Recebido</Badge>;
  }
  if (venda.dta_prev_recebimento) {
    const prev = new Date(venda.dta_prev_recebimento);
    const today = new Date();
    if (prev < today) {
      return <Badge variant="destructive">Atrasado</Badge>;
    }
    return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pendente</Badge>;
  }
  if (venda.dta_faturamento) {
    return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Faturado</Badge>;
  }
  return <Badge variant="secondary">Em Processo</Badge>;
};

export default function TrilhaVendasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');
  const [formaPagtoFilter, setFormaPagtoFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sortField, setSortField] = useState<string>('dta_venda');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Fetch sync status
  const { data: syncStatus, refetch: refetchSync } = useQuery({
    queryKey: ['sync-status-rastreio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tab_sync_controle')
        .select('*')
        .eq('des_entidade', 'rastreio_vendas')
        .single();
      if (error) throw error;
      return data as SyncControle;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.des_status;
      return status === 'running' ? 3000 : 30000;
    },
  });

  // Fetch vendas data
  const { data: vendas, isLoading } = useQuery({
    queryKey: ['rastreio-vendas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tab_rastreio_venda')
        .select('*')
        .order('dta_venda', { ascending: false })
        .limit(10000);
      if (error) throw error;
      return (data || []) as RastreioVenda[];
    },
  });

  // Auto-refresh vendas when sync completes
  useEffect(() => {
    if (syncStatus?.des_status === 'completed' && isSyncing) {
      setIsSyncing(false);
      queryClient.invalidateQueries({ queryKey: ['rastreio-vendas'] });
      toast.success('Sincronização concluída!');
    }
    if (syncStatus?.des_status === 'error' && isSyncing) {
      setIsSyncing(false);
      toast.error(`Erro na sincronização: ${syncStatus.des_erro}`);
    }
  }, [syncStatus?.des_status]);

  // Poll sync status while running
  useEffect(() => {
    if (syncStatus?.des_status === 'running') {
      setIsSyncing(true);
    }
  }, [syncStatus?.des_status]);

  const handleSync = async (mode: 'full' | 'incremental') => {
    setIsSyncing(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/sync-rastreio-vendas`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ mode }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        if (response.status === 409) {
          toast.info('Sincronização já em andamento...');
          return;
        }
        throw new Error(err.error || 'Erro na sincronização');
      }

      toast.success('Sincronização iniciada! Pode fechar a página, o processo continuará em segundo plano.');
      refetchSync();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar sincronização');
      setIsSyncing(false);
    }
  };

  // Computed filters
  const empresas = useMemo(() => {
    if (!vendas) return [];
    const map = new Map<number, string>();
    vendas.forEach(v => map.set(v.cod_empresa, v.des_nom_resumido || `Empresa ${v.cod_empresa}`));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [vendas]);

  const formasPagto = useMemo(() => {
    if (!vendas) return [];
    const set = new Set<string>();
    vendas.forEach(v => { if (v.des_forma_pagto) set.add(v.des_forma_pagto); });
    return Array.from(set).sort();
  }, [vendas]);

  const filteredVendas = useMemo(() => {
    if (!vendas) return [];
    let filtered = vendas;

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(v =>
        v.nom_pessoa?.toLowerCase().includes(s) ||
        v.des_nom_resumido?.toLowerCase().includes(s) ||
        v.num_cupom?.toString().includes(s) ||
        v.seq_titulo?.toString().includes(s)
      );
    }

    if (empresaFilter !== 'all') {
      filtered = filtered.filter(v => v.cod_empresa === Number(empresaFilter));
    }

    if (formaPagtoFilter !== 'all') {
      filtered = filtered.filter(v => v.des_forma_pagto === formaPagtoFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => {
        if (statusFilter === 'recebido') return !!v.dta_recebimento;
        if (statusFilter === 'atrasado') {
          return !v.dta_recebimento && v.dta_prev_recebimento && new Date(v.dta_prev_recebimento) < new Date();
        }
        if (statusFilter === 'pendente') {
          return !v.dta_recebimento && v.dta_prev_recebimento && new Date(v.dta_prev_recebimento) >= new Date();
        }
        if (statusFilter === 'faturado') return !v.dta_recebimento && !!v.dta_faturamento;
        return true;
      });
    }

    // Sort
    filtered.sort((a: any, b: any) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [vendas, search, empresaFilter, formaPagtoFilter, statusFilter, sortField, sortDir]);

  const paginatedVendas = useMemo(() => {
    return filteredVendas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }, [filteredVendas, page]);

  const totalPages = Math.ceil(filteredVendas.length / PAGE_SIZE);

  // Summary cards
  const summary = useMemo(() => {
    if (!filteredVendas.length) return { totalBruto: 0, totalLiquido: 0, totalRecebido: 0, totalPendente: 0, count: 0 };
    return {
      totalBruto: filteredVendas.reduce((acc, v) => acc + (v.val_bruto_titulo || 0), 0),
      totalLiquido: filteredVendas.reduce((acc, v) => acc + (v.val_liquido_titulo || 0), 0),
      totalRecebido: filteredVendas.filter(v => v.dta_recebimento).reduce((acc, v) => acc + (v.val_pagamento || 0), 0),
      totalPendente: filteredVendas.filter(v => !v.dta_recebimento).reduce((acc, v) => acc + (v.val_liquido_titulo || 0), 0),
      count: filteredVendas.length,
    };
  }, [filteredVendas]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground/40'}`} />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trilha de Vendas</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhamento completo da venda ao recebimento
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncStatus?.des_status === 'running' ? (
            <div className="flex flex-col gap-2 min-w-[260px]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>
                  Sincronizando... {(syncStatus.num_registros_processados ?? 0).toLocaleString('pt-BR')}
                  {syncStatus.num_total_registros ? ` / ${syncStatus.num_total_registros.toLocaleString('pt-BR')}` : ''} registros
                </span>
              </div>
              <Progress 
                value={syncStatus.num_total_registros ? Math.round(((syncStatus.num_registros_processados ?? 0) / syncStatus.num_total_registros) * 100) : undefined}
                className="h-2"
              />
              {syncStatus.num_total_registros ? (
                <span className="text-xs text-muted-foreground text-right">
                  {Math.round(((syncStatus.num_registros_processados ?? 0) / syncStatus.num_total_registros) * 100)}%
                </span>
              ) : null}
            </div>
          ) : (
            <>
              {syncStatus?.dta_ultima_sync && (
                <span className="text-xs text-muted-foreground">
                  Última sync: {formatDate(syncStatus.dta_ultima_sync)}
                </span>
              )}
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSync('incremental')}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleSync('full')}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Completa (6 meses)
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Bruto</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(summary.totalBruto)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Líquido</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(summary.totalLiquido)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recebido</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(summary.totalRecebido)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendente</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(summary.totalPendente)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, cupom..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <Select value={empresaFilter} onValueChange={v => { setEmpresaFilter(v); setPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Empresas</SelectItem>
                {empresas.map(([cod, nome]) => (
                  <SelectItem key={cod} value={String(cod)}>{nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={formaPagtoFilter} onValueChange={v => { setFormaPagtoFilter(v); setPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="Forma de Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Formas</SelectItem>
                {formasPagto.map(fp => (
                  <SelectItem key={fp} value={fp}>{fp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="recebido">Recebido</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="faturado">Faturado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{filteredVendas.length.toLocaleString('pt-BR')} registros encontrados</span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <SortableHeader field="des_nom_resumido">Empresa</SortableHeader>
                      <SortableHeader field="nom_pessoa">Cliente</SortableHeader>
                      <SortableHeader field="dta_venda">Dt. Venda</SortableHeader>
                      <SortableHeader field="des_forma_pagto">Forma Pgto</SortableHeader>
                      <SortableHeader field="val_bruto_titulo">Vl. Bruto</SortableHeader>
                      <SortableHeader field="val_liquido_titulo">Vl. Líquido</SortableHeader>
                      <SortableHeader field="dta_faturamento">Dt. Faturamento</SortableHeader>
                      <SortableHeader field="dta_vencimento_fatura">Venc. Fatura</SortableHeader>
                      <SortableHeader field="dta_prev_recebimento">Prev. Recebimento</SortableHeader>
                      <SortableHeader field="dta_recebimento">Dt. Recebimento</SortableHeader>
                      <SortableHeader field="val_pagamento">Vl. Recebido</SortableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedVendas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                            <p>Nenhum registro encontrado</p>
                            <p className="text-xs">
                              {!vendas?.length
                                ? 'Clique em "Sync Completa" para carregar os dados pela primeira vez.'
                                : 'Tente ajustar os filtros.'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedVendas.map(venda => (
                        <TableRow key={venda.cod_rastreio} className="hover:bg-muted/50">
                          <TableCell>{getStatusBadge(venda)}</TableCell>
                          <TableCell className="font-medium text-xs">{venda.des_nom_resumido}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm" title={venda.nom_pessoa}>
                            {venda.nom_pessoa}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{formatDate(venda.dta_venda)}</TableCell>
                          <TableCell className="text-xs">{venda.des_forma_pagto}</TableCell>
                          <TableCell className="text-xs tabular-nums text-right">{formatCurrency(venda.val_bruto_titulo)}</TableCell>
                          <TableCell className="text-xs tabular-nums text-right">{formatCurrency(venda.val_liquido_titulo)}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{formatDate(venda.dta_faturamento)}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{formatDate(venda.dta_vencimento_fatura)}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{formatDate(venda.dta_prev_recebimento)}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap font-medium">
                            {venda.dta_recebimento ? (
                              <span className="text-emerald-600">{formatDate(venda.dta_recebimento)}</span>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums text-right">
                            {venda.val_pagamento ? (
                              <span className="text-emerald-600">{formatCurrency(venda.val_pagamento)}</span>
                            ) : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Página {page + 1} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
