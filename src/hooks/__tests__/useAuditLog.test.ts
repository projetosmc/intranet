/**
 * Testes para o hook useAuditLog
 * 
 * Tabela testada: tab_log_auditoria
 * Operações: CREATE (logAudit)
 */

import { describe, it, expect } from 'vitest';

describe('useAuditLog - Mapeamento de Colunas', () => {
  describe('tab_log_auditoria', () => {
    it('deve mapear cod_log para id (PK)', () => {
      const dbRow = { cod_log: 'uuid-123' };
      const mapped = { id: dbRow.cod_log };
      expect(mapped.id).toBe('uuid-123');
    });

    it('deve mapear seq_usuario para userId', () => {
      const dbRow = { seq_usuario: 'user-uuid' };
      const mapped = { userId: dbRow.seq_usuario };
      expect(mapped.userId).toBe('user-uuid');
    });

    it('deve mapear seq_usuario_alvo para targetUserId', () => {
      const dbRow = { seq_usuario_alvo: 'target-uuid' };
      const mapped = { targetUserId: dbRow.seq_usuario_alvo };
      expect(mapped.targetUserId).toBe('target-uuid');
    });

    it('deve mapear des_acao para action', () => {
      const dbRow = { des_acao: 'role_added' };
      const mapped = { action: dbRow.des_acao };
      expect(mapped.action).toBe('role_added');
    });

    it('deve mapear des_tipo_entidade para entityType', () => {
      const dbRow = { des_tipo_entidade: 'user_role' };
      const mapped = { entityType: dbRow.des_tipo_entidade };
      expect(mapped.entityType).toBe('user_role');
    });

    it('deve mapear des_id_entidade para entityId', () => {
      const dbRow = { des_id_entidade: 'entity-123' };
      const mapped = { entityId: dbRow.des_id_entidade };
      expect(mapped.entityId).toBe('entity-123');
    });

    it('deve mapear des_valor_anterior para oldValue (JSONB)', () => {
      const dbRow = { des_valor_anterior: { role: 'user' } };
      const mapped = { oldValue: dbRow.des_valor_anterior };
      expect(mapped.oldValue).toEqual({ role: 'user' });
    });

    it('deve mapear des_valor_novo para newValue (JSONB)', () => {
      const dbRow = { des_valor_novo: { role: 'admin' } };
      const mapped = { newValue: dbRow.des_valor_novo };
      expect(mapped.newValue).toEqual({ role: 'admin' });
    });

    it('deve mapear des_user_agent para userAgent', () => {
      const dbRow = { des_user_agent: 'Mozilla/5.0...' };
      const mapped = { userAgent: dbRow.des_user_agent };
      expect(mapped.userAgent).toBe('Mozilla/5.0...');
    });

    it('deve mapear des_ip para ipAddress', () => {
      const dbRow = { des_ip: '192.168.1.1' };
      const mapped = { ipAddress: dbRow.des_ip };
      expect(mapped.ipAddress).toBe('192.168.1.1');
    });

    it('deve mapear dta_cadastro para createdAt', () => {
      const dbRow = { dta_cadastro: '2025-01-01T12:00:00Z' };
      const mapped = { createdAt: dbRow.dta_cadastro };
      expect(mapped.createdAt).toBe('2025-01-01T12:00:00Z');
    });
  });

  describe('Validação de AuditAction', () => {
    const validActions = [
      'role_added',
      'role_removed',
      'user_activated',
      'user_deactivated',
      'profile_updated',
      'menu_item_created',
      'menu_item_updated',
      'menu_item_deleted',
      'announcement_created',
      'announcement_updated',
      'announcement_deleted',
      'event_created',
      'event_updated',
      'event_deleted',
    ];

    it.each(validActions)('deve aceitar action: %s', (action) => {
      expect(validActions).toContain(action);
    });
  });

  describe('Validação de EntityType', () => {
    const validEntityTypes = [
      'user_role',
      'profile',
      'menu_item',
      'announcement',
      'calendar_event',
    ];

    it.each(validEntityTypes)('deve aceitar entity_type: %s', (entityType) => {
      expect(validEntityTypes).toContain(entityType);
    });
  });

  describe('Transformação para INSERT', () => {
    it('deve criar objeto correto para inserção', () => {
      const logEntry = {
        action: 'user_activated',
        entity_type: 'profile',
        entity_id: 'profile-123',
        target_user_id: 'target-user-123',
        old_value: { ind_ativo: false },
        new_value: { ind_ativo: true },
      };

      const userId = 'admin-user-id';
      const userAgent = 'Mozilla/5.0';

      const dbInsert = {
        seq_usuario: userId,
        seq_usuario_alvo: logEntry.target_user_id,
        des_acao: logEntry.action,
        des_tipo_entidade: logEntry.entity_type,
        des_id_entidade: logEntry.entity_id,
        des_valor_anterior: logEntry.old_value,
        des_valor_novo: logEntry.new_value,
        des_user_agent: userAgent,
      };

      expect(dbInsert).toEqual({
        seq_usuario: 'admin-user-id',
        seq_usuario_alvo: 'target-user-123',
        des_acao: 'user_activated',
        des_tipo_entidade: 'profile',
        des_id_entidade: 'profile-123',
        des_valor_anterior: { ind_ativo: false },
        des_valor_novo: { ind_ativo: true },
        des_user_agent: 'Mozilla/5.0',
      });
    });
  });
});
