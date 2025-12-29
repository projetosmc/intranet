import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para registro de logs de auditoria
 * 
 * Tabela: tab_log_auditoria
 * Colunas:
 * - cod_log (PK): UUID do log
 * - seq_usuario: ID do usuário que realizou a ação
 * - seq_usuario_alvo: ID do usuário afetado (se aplicável)
 * - des_acao: Ação realizada (AuditAction)
 * - des_tipo_entidade: Tipo da entidade afetada (EntityType)
 * - des_id_entidade: ID da entidade afetada
 * - des_valor_anterior: Valor anterior (JSONB)
 * - des_valor_novo: Novo valor (JSONB)
 * - des_user_agent: User agent do navegador
 * - des_ip: Endereço IP (se disponível)
 * - dta_cadastro: Data/hora do registro
 * 
 * RLS: Admins podem visualizar, sistema pode inserir
 */

export type AuditAction =
  | 'role_added' 
  | 'role_removed' 
  | 'user_activated' 
  | 'user_deactivated'
  | 'profile_updated'
  | 'menu_item_created'
  | 'menu_item_updated'
  | 'menu_item_deleted'
  | 'announcement_created'
  | 'announcement_updated'
  | 'announcement_deleted'
  | 'event_created'
  | 'event_updated'
  | 'event_deleted';

export type EntityType = 
  | 'user_role' 
  | 'profile' 
  | 'menu_item' 
  | 'announcement' 
  | 'calendar_event';

interface AuditLogEntry {
  action: AuditAction;
  entity_type: EntityType;
  entity_id?: string;
  target_user_id?: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
}

export async function logAudit(entry: AuditLogEntry): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Cannot log audit: No authenticated user');
      return false;
    }

    const { error } = await supabase
      .from('tab_log_auditoria')
      .insert({
        seq_usuario: user.id,
        seq_usuario_alvo: entry.target_user_id,
        des_acao: entry.action,
        des_tipo_entidade: entry.entity_type,
        des_id_entidade: entry.entity_id,
        des_valor_anterior: entry.old_value,
        des_valor_novo: entry.new_value,
        des_user_agent: navigator.userAgent,
      });

    if (error) {
      console.error('Error logging audit:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error logging audit:', error);
    return false;
  }
}

export function useAuditLog() {
  return { logAudit };
}
