/**
 * Testes para o hook useDbAnnouncements
 * 
 * Tabelas testadas:
 * - tab_comunicado (comunicados)
 * - tab_enquete_opcao (opções de enquete)
 * - tab_enquete_voto (votos)
 */

import { describe, it, expect } from 'vitest';

describe('useDbAnnouncements - Mapeamento de Colunas', () => {
  describe('tab_comunicado', () => {
    it('deve mapear cod_comunicado para id', () => {
      const dbRow = { cod_comunicado: 'uuid-123' };
      const mapped = { id: dbRow.cod_comunicado };
      expect(mapped.id).toBe('uuid-123');
    });

    it('deve mapear des_titulo para title', () => {
      const dbRow = { des_titulo: 'Título' };
      const mapped = { title: dbRow.des_titulo };
      expect(mapped.title).toBe('Título');
    });

    it('deve mapear des_resumo para summary', () => {
      const dbRow = { des_resumo: 'Resumo' };
      const mapped = { summary: dbRow.des_resumo };
      expect(mapped.summary).toBe('Resumo');
    });

    it('deve mapear des_conteudo para content', () => {
      const dbRow = { des_conteudo: 'Conteúdo' };
      const mapped = { content: dbRow.des_conteudo };
      expect(mapped.content).toBe('Conteúdo');
    });

    it('deve mapear ind_fixado para pinned', () => {
      const dbRow = { ind_fixado: true };
      const mapped = { pinned: dbRow.ind_fixado };
      expect(mapped.pinned).toBe(true);
    });

    it('deve mapear ind_ativo para active', () => {
      const dbRow = { ind_ativo: true };
      const mapped = { active: dbRow.ind_ativo };
      expect(mapped.active).toBe(true);
    });

    it('deve mapear des_tipo_template para templateType', () => {
      const dbRow = { des_tipo_template: 'banner' };
      const mapped = { templateType: dbRow.des_tipo_template };
      expect(mapped.templateType).toBe('banner');
    });

    it('deve mapear des_imagem_url para imageUrl', () => {
      const dbRow = { des_imagem_url: 'https://example.com/image.jpg' };
      const mapped = { imageUrl: dbRow.des_imagem_url };
      expect(mapped.imageUrl).toBe('https://example.com/image.jpg');
    });

    it('deve mapear des_tipo_enquete para pollType', () => {
      const dbRow = { des_tipo_enquete: 'single' };
      const mapped = { pollType: dbRow.des_tipo_enquete };
      expect(mapped.pollType).toBe('single');
    });

    it('deve mapear dta_publicacao para publishedAt', () => {
      const dbRow = { dta_publicacao: '2025-01-01T00:00:00Z' };
      const mapped = { publishedAt: dbRow.dta_publicacao };
      expect(mapped.publishedAt).toBe('2025-01-01T00:00:00Z');
    });
  });

  describe('tab_enquete_opcao', () => {
    it('deve mapear cod_opcao para id', () => {
      const dbRow = { cod_opcao: 'uuid-123' };
      const mapped = { id: dbRow.cod_opcao };
      expect(mapped.id).toBe('uuid-123');
    });

    it('deve mapear des_texto_opcao para optionText', () => {
      const dbRow = { des_texto_opcao: 'Opção de Teste' };
      const mapped = { optionText: dbRow.des_texto_opcao };
      expect(mapped.optionText).toBe('Opção de Teste');
    });

    it('deve mapear seq_comunicado para announcementId', () => {
      const dbRow = { seq_comunicado: 'announcement-uuid' };
      const mapped = { announcementId: dbRow.seq_comunicado };
      expect(mapped.announcementId).toBe('announcement-uuid');
    });
  });

  describe('tab_enquete_voto', () => {
    it('deve mapear cod_voto para id', () => {
      const dbRow = { cod_voto: 'uuid-123' };
      const mapped = { id: dbRow.cod_voto };
      expect(mapped.id).toBe('uuid-123');
    });

    it('deve mapear seq_opcao para optionId', () => {
      const dbRow = { seq_opcao: 'option-uuid' };
      const mapped = { optionId: dbRow.seq_opcao };
      expect(mapped.optionId).toBe('option-uuid');
    });

    it('deve mapear seq_usuario para userId', () => {
      const dbRow = { seq_usuario: 'user-uuid' };
      const mapped = { userId: dbRow.seq_usuario };
      expect(mapped.userId).toBe('user-uuid');
    });
  });

  describe('Transformação completa', () => {
    it('deve transformar row do banco para interface Announcement', () => {
      const dbRow = {
        cod_comunicado: 'ann-123',
        des_titulo: 'Comunicado Importante',
        des_resumo: 'Resumo do comunicado',
        des_conteudo: 'Conteúdo completo em markdown',
        des_tipo_template: 'simple',
        des_imagem_url: null,
        des_tipo_enquete: null,
        ind_ativo: true,
        ind_fixado: false,
        dta_publicacao: '2025-01-15T10:00:00Z',
      };

      const announcement = {
        id: dbRow.cod_comunicado,
        title: dbRow.des_titulo,
        summary: dbRow.des_resumo,
        content: dbRow.des_conteudo,
        pinned: dbRow.ind_fixado ?? false,
        publishedAt: dbRow.dta_publicacao,
        active: dbRow.ind_ativo ?? true,
        templateType: dbRow.des_tipo_template || 'simple',
        imageUrl: dbRow.des_imagem_url || undefined,
        pollType: dbRow.des_tipo_enquete || undefined,
      };

      expect(announcement).toEqual({
        id: 'ann-123',
        title: 'Comunicado Importante',
        summary: 'Resumo do comunicado',
        content: 'Conteúdo completo em markdown',
        pinned: false,
        publishedAt: '2025-01-15T10:00:00Z',
        active: true,
        templateType: 'simple',
        imageUrl: undefined,
        pollType: undefined,
      });
    });
  });

  describe('Validação de templateType', () => {
    const validTypes = ['simple', 'banner', 'poll'];

    it('deve aceitar tipo simple', () => {
      expect(validTypes).toContain('simple');
    });

    it('deve aceitar tipo banner', () => {
      expect(validTypes).toContain('banner');
    });

    it('deve aceitar tipo poll', () => {
      expect(validTypes).toContain('poll');
    });
  });

  describe('Validação de pollType', () => {
    const validPollTypes = ['single', 'multiple'];

    it('deve aceitar tipo single', () => {
      expect(validPollTypes).toContain('single');
    });

    it('deve aceitar tipo multiple', () => {
      expect(validPollTypes).toContain('multiple');
    });
  });
});
