import { supabase } from '@/integrations/supabase/client';

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
