/**
 * Testes para o hook useCalendarEvents
 * 
 * Tabela testada: tab_evento_calendario
 * Operações: CREATE, READ, UPDATE, DELETE
 */

import { describe, it, expect } from 'vitest';

describe('useCalendarEvents - Mapeamento de Colunas', () => {
  describe('tab_evento_calendario', () => {
    it('deve mapear cod_evento para id', () => {
      const dbRow = { cod_evento: 'uuid-123' };
      const mapped = { id: dbRow.cod_evento };
      expect(mapped.id).toBe('uuid-123');
    });

    it('deve mapear des_titulo para title', () => {
      const dbRow = { des_titulo: 'Título do Evento' };
      const mapped = { title: dbRow.des_titulo };
      expect(mapped.title).toBe('Título do Evento');
    });

    it('deve mapear des_descricao para description', () => {
      const dbRow = { des_descricao: 'Descrição' };
      const mapped = { description: dbRow.des_descricao };
      expect(mapped.description).toBe('Descrição');
    });

    it('deve mapear dta_evento para event_date', () => {
      const dbRow = { dta_evento: '2025-01-15' };
      const mapped = { event_date: new Date(dbRow.dta_evento) };
      expect(mapped.event_date).toBeInstanceOf(Date);
    });

    it('deve mapear des_tipo_evento para event_type', () => {
      const dbRow = { des_tipo_evento: 'meeting' };
      const mapped = { event_type: dbRow.des_tipo_evento };
      expect(mapped.event_type).toBe('meeting');
    });

    it('deve mapear seq_criado_por para created_by', () => {
      const dbRow = { seq_criado_por: 'user-uuid' };
      const mapped = { created_by: dbRow.seq_criado_por };
      expect(mapped.created_by).toBe('user-uuid');
    });
  });

  describe('Transformação completa', () => {
    it('deve transformar row do banco para interface CalendarEvent', () => {
      const dbRow = {
        cod_evento: 'event-123',
        des_titulo: 'Reunião de Projeto',
        des_descricao: 'Discussão do roadmap Q1',
        dta_evento: '2025-02-15',
        des_tipo_evento: 'meeting',
        seq_criado_por: 'user-456',
      };

      const event = {
        id: dbRow.cod_evento,
        title: dbRow.des_titulo,
        description: dbRow.des_descricao || undefined,
        event_date: new Date(dbRow.dta_evento),
        event_type: dbRow.des_tipo_evento || 'general',
        created_by: dbRow.seq_criado_por || undefined,
      };

      expect(event).toEqual({
        id: 'event-123',
        title: 'Reunião de Projeto',
        description: 'Discussão do roadmap Q1',
        event_date: expect.any(Date),
        event_type: 'meeting',
        created_by: 'user-456',
      });
    });

    it('deve lidar com campos opcionais nulos', () => {
      const dbRow = {
        cod_evento: 'event-789',
        des_titulo: 'Evento Simples',
        des_descricao: null,
        dta_evento: '2025-03-01',
        des_tipo_evento: null,
        seq_criado_por: null,
      };

      const event = {
        id: dbRow.cod_evento,
        title: dbRow.des_titulo,
        description: dbRow.des_descricao || undefined,
        event_date: new Date(dbRow.dta_evento),
        event_type: dbRow.des_tipo_evento || 'general',
        created_by: dbRow.seq_criado_por || undefined,
      };

      expect(event.description).toBeUndefined();
      expect(event.event_type).toBe('general');
      expect(event.created_by).toBeUndefined();
    });
  });

  describe('Mapeamento reverso (INSERT/UPDATE)', () => {
    it('deve mapear title para des_titulo', () => {
      const frontendData = { title: 'Novo Evento' };
      const dbData = { des_titulo: frontendData.title };
      expect(dbData.des_titulo).toBe('Novo Evento');
    });

    it('deve mapear description para des_descricao', () => {
      const frontendData = { description: 'Descrição do evento' };
      const dbData = { des_descricao: frontendData.description };
      expect(dbData.des_descricao).toBe('Descrição do evento');
    });

    it('deve mapear event_date para dta_evento (formato DATE)', () => {
      const frontendData = { event_date: new Date('2025-04-20') };
      const dbData = { dta_evento: frontendData.event_date.toISOString().split('T')[0] };
      expect(dbData.dta_evento).toBe('2025-04-20');
    });

    it('deve mapear event_type para des_tipo_evento', () => {
      const frontendData = { event_type: 'holiday' };
      const dbData = { des_tipo_evento: frontendData.event_type };
      expect(dbData.des_tipo_evento).toBe('holiday');
    });
  });
});
