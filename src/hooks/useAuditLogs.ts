import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuditLog {
  id: string;
  user_id: string;
  target_user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
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
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      if (action) {
        query = query.eq('action', action);
      }
      if (userId) {
        query = query.or(`user_id.eq.${userId},target_user_id.eq.${userId}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user details for each log
      const userIds = new Set<string>();
      (data || []).forEach(log => {
        if (log.user_id) userIds.add(log.user_id);
        if (log.target_user_id) userIds.add(log.target_user_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', Array.from(userIds));

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const enrichedLogs = (data || []).map(log => ({
        ...log,
        user_email: profileMap.get(log.user_id)?.email,
        user_name: profileMap.get(log.user_id)?.full_name,
        target_user_email: log.target_user_id ? profileMap.get(log.target_user_id)?.email : undefined,
        target_user_name: log.target_user_id ? profileMap.get(log.target_user_id)?.full_name : undefined,
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
