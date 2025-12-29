import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuditLog {
  cod_log: string;
  seq_usuario: string;
  seq_usuario_alvo?: string;
  des_acao: string;
  des_tipo_entidade: string;
  des_id_entidade?: string;
  des_valor_anterior?: any;
  des_valor_novo?: any;
  des_ip?: string;
  des_user_agent?: string;
  dta_cadastro: string;
  user_email?: string;
  user_name?: string;
  target_user_email?: string;
  target_user_name?: string;
}

interface UseAuditLogsOptions {
  limit?: number;
  entityType?: string;
  action?: string;
  userId?: string;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { limit = 100, entityType, action, userId } = options;

  useEffect(() => {
    fetchLogs();
  }, [limit, entityType, action, userId]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('tab_log_auditoria')
        .select('*')
        .order('dta_cadastro', { ascending: false })
        .limit(limit);

      if (entityType) {
        query = query.eq('des_tipo_entidade', entityType);
      }
      if (action) {
        query = query.eq('des_acao', action);
      }
      if (userId) {
        query = query.or(`seq_usuario.eq.${userId},seq_usuario_alvo.eq.${userId}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user details for each log
      const userIds = new Set<string>();
      (data || []).forEach(log => {
        if (log.seq_usuario) userIds.add(log.seq_usuario);
        if (log.seq_usuario_alvo) userIds.add(log.seq_usuario_alvo);
      });

      const { data: profiles } = await supabase
        .from('tab_perfil_usuario')
        .select('cod_usuario, des_email, des_nome_completo')
        .in('cod_usuario', Array.from(userIds));

      const profileMap = new Map((profiles || []).map(p => [p.cod_usuario, p]));

      const enrichedLogs = (data || []).map(log => ({
        ...log,
        user_email: profileMap.get(log.seq_usuario)?.des_email,
        user_name: profileMap.get(log.seq_usuario)?.des_nome_completo,
        target_user_email: log.seq_usuario_alvo ? profileMap.get(log.seq_usuario_alvo)?.des_email : undefined,
        target_user_name: log.seq_usuario_alvo ? profileMap.get(log.seq_usuario_alvo)?.des_nome_completo : undefined,
      }));

      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    logs,
    isLoading,
    refetch: fetchLogs,
  };
}
