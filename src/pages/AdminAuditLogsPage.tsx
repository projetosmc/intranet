import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  User, 
  Shield, 
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const actionLabels: Record<string, string> = {
  role_added: 'Permissão adicionada',
  role_removed: 'Permissão removida',
  user_activated: 'Usuário ativado',
  user_deactivated: 'Usuário desativado',
  profile_updated: 'Perfil atualizado',
  menu_item_created: 'Item de menu criado',
  menu_item_updated: 'Item de menu atualizado',
  menu_item_deleted: 'Item de menu removido',
  announcement_created: 'Comunicado criado',
  announcement_updated: 'Comunicado atualizado',
  announcement_deleted: 'Comunicado removido',
  event_created: 'Evento criado',
  event_updated: 'Evento atualizado',
  event_deleted: 'Evento removido',
};

const entityLabels: Record<string, string> = {
  user_role: 'Permissão',
  profile: 'Perfil',
  menu_item: 'Menu',
  announcement: 'Comunicado',
  calendar_event: 'Evento',
};

const actionColors: Record<string, string> = {
  role_added: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  role_removed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  user_activated: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  user_deactivated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  profile_updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  menu_item_created: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  menu_item_updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  menu_item_deleted: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  announcement_created: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  announcement_updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  announcement_deleted: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  event_created: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  event_updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  event_deleted: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export default function AdminAuditLogsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const { logs, isLoading, refetch } = useAuditLogs({
    limit: 200,
    entityType: filterEntity !== 'all' ? filterEntity : undefined,
    action: filterAction !== 'all' ? filterAction : undefined,
  });

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.user_name?.toLowerCase().includes(query) ||
      log.user_email?.toLowerCase().includes(query) ||
      log.target_user_name?.toLowerCase().includes(query) ||
      log.target_user_email?.toLowerCase().includes(query) ||
      log.des_acao.toLowerCase().includes(query)
    );
  });

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
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterEntity} onValueChange={setFilterEntity}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="user_role">Permissões</SelectItem>
              <SelectItem value="profile">Perfis</SelectItem>
              <SelectItem value="menu_item">Menus</SelectItem>
              <SelectItem value="announcement">Comunicados</SelectItem>
              <SelectItem value="calendar_event">Eventos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[200px]">
              <Shield className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="role_added">Permissão adicionada</SelectItem>
              <SelectItem value="role_removed">Permissão removida</SelectItem>
              <SelectItem value="user_activated">Usuário ativado</SelectItem>
              <SelectItem value="user_deactivated">Usuário desativado</SelectItem>
              <SelectItem value="profile_updated">Perfil atualizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total de logs</p>
            <p className="text-2xl font-bold">{logs.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Permissões alteradas</p>
            <p className="text-2xl font-bold">
              {logs.filter(l => l.des_tipo_entidade === 'user_role').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Perfis alterados</p>
            <p className="text-2xl font-bold">
              {logs.filter(l => l.des_tipo_entidade === 'profile').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Hoje</p>
            <p className="text-2xl font-bold">
              {logs.filter(l => {
                const today = new Date();
                const logDate = new Date(l.dta_cadastro);
                return logDate.toDateString() === today.toDateString();
              }).length}
            </p>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredLogs.map((log) => (
                <motion.div
                  key={log.cod_log}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-muted/30 transition-colors"
                >
                  <div 
                    className="flex items-start gap-4 cursor-pointer"
                    onClick={() => setExpandedLog(expandedLog === log.cod_log ? null : log.cod_log)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {log.user_name || log.user_email || 'Usuário desconhecido'}
                        </span>
                        <Badge className={`text-xs ${actionColors[log.des_acao] || 'bg-gray-100 text-gray-800'}`}>
                          {actionLabels[log.des_acao] || log.des_acao}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {entityLabels[log.des_tipo_entidade] || log.des_tipo_entidade}
                        </Badge>
                      </div>
                      
                      {log.seq_usuario_alvo && log.seq_usuario_alvo !== log.seq_usuario && (
                        <p className="text-sm text-muted-foreground mt-1">
                          → Usuário afetado: <span className="font-medium">{log.target_user_name || log.target_user_email}</span>
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(log.dta_cadastro), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {expandedLog === log.cod_log ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedLog === log.cod_log && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 ml-9 p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {log.des_valor_anterior && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Valor anterior</p>
                            <pre className="bg-background p-2 rounded text-xs overflow-auto">
                              {JSON.stringify(log.des_valor_anterior, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.des_valor_novo && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Novo valor</p>
                            <pre className="bg-background p-2 rounded text-xs overflow-auto">
                              {JSON.stringify(log.des_valor_novo, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      {log.des_user_agent && (
                        <div className="mt-3 text-xs text-muted-foreground">
                          <span className="font-medium">User Agent:</span> {log.des_user_agent}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
