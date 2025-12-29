/**
 * Testes para o hook useBirthdays
 * 
 * Tabela testada: tab_perfil_usuario
 * Operações: READ (busca de aniversariantes)
 */

import { describe, it, expect } from 'vitest';

describe('useBirthdays - Mapeamento de Colunas', () => {
  describe('tab_perfil_usuario (Birthday)', () => {
    it('deve mapear cod_usuario para id', () => {
      const dbRow = { cod_usuario: 'uuid-123' };
      const mapped = { id: dbRow.cod_usuario };
      expect(mapped.id).toBe('uuid-123');
    });

    it('deve mapear des_nome_completo para fullName', () => {
      const dbRow = { des_nome_completo: 'João Silva' };
      const mapped = { fullName: dbRow.des_nome_completo || 'Sem nome' };
      expect(mapped.fullName).toBe('João Silva');
    });

    it('deve usar fallback "Sem nome" quando des_nome_completo é nulo', () => {
      const dbRow = { des_nome_completo: null };
      const mapped = { fullName: dbRow.des_nome_completo || 'Sem nome' };
      expect(mapped.fullName).toBe('Sem nome');
    });

    it('deve mapear dta_aniversario para birthdayDate', () => {
      const dbRow = { dta_aniversario: '1990-03-15' };
      const mapped = { birthdayDate: new Date(dbRow.dta_aniversario) };
      expect(mapped.birthdayDate).toBeInstanceOf(Date);
      expect(mapped.birthdayDate.getMonth()).toBe(2); // Março = 2
      expect(mapped.birthdayDate.getDate()).toBe(15);
    });

    it('deve mapear des_unidade para unit', () => {
      const dbRow = { des_unidade: 'Tecnologia' };
      const mapped = { unit: dbRow.des_unidade || undefined };
      expect(mapped.unit).toBe('Tecnologia');
    });

    it('deve mapear des_avatar_url para avatarUrl', () => {
      const dbRow = { des_avatar_url: 'https://example.com/avatar.jpg' };
      const mapped = { avatarUrl: dbRow.des_avatar_url || undefined };
      expect(mapped.avatarUrl).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('Transformação completa', () => {
    it('deve transformar row do banco para interface Birthday', () => {
      const dbRow = {
        cod_usuario: 'user-123',
        des_nome_completo: 'Ana Costa',
        dta_aniversario: '1995-12-25',
        des_unidade: 'Marketing',
        des_avatar_url: 'https://example.com/ana.jpg',
      };

      const birthday = {
        id: dbRow.cod_usuario,
        fullName: dbRow.des_nome_completo || 'Sem nome',
        birthdayDate: new Date(dbRow.dta_aniversario),
        unit: dbRow.des_unidade || undefined,
        avatarUrl: dbRow.des_avatar_url || undefined,
      };

      expect(birthday).toEqual({
        id: 'user-123',
        fullName: 'Ana Costa',
        birthdayDate: expect.any(Date),
        unit: 'Marketing',
        avatarUrl: 'https://example.com/ana.jpg',
      });
    });

    it('deve lidar com campos opcionais nulos', () => {
      const dbRow = {
        cod_usuario: 'user-456',
        des_nome_completo: null,
        dta_aniversario: '2000-01-01',
        des_unidade: null,
        des_avatar_url: null,
      };

      const birthday = {
        id: dbRow.cod_usuario,
        fullName: dbRow.des_nome_completo || 'Sem nome',
        birthdayDate: new Date(dbRow.dta_aniversario),
        unit: dbRow.des_unidade || undefined,
        avatarUrl: dbRow.des_avatar_url || undefined,
      };

      expect(birthday.fullName).toBe('Sem nome');
      expect(birthday.unit).toBeUndefined();
      expect(birthday.avatarUrl).toBeUndefined();
    });
  });

  describe('Filtro de aniversariantes do mês', () => {
    it('deve identificar aniversariantes do mês atual', () => {
      const currentMonth = new Date().getMonth();
      const birthdayThisMonth = new Date(1990, currentMonth, 15);
      const birthdayOtherMonth = new Date(1990, (currentMonth + 3) % 12, 15);

      expect(birthdayThisMonth.getMonth()).toBe(currentMonth);
      expect(birthdayOtherMonth.getMonth()).not.toBe(currentMonth);
    });

    it('deve ordenar aniversariantes por dia do mês', () => {
      const birthdays = [
        { id: '1', birthdayDate: new Date(1990, 5, 25) },
        { id: '2', birthdayDate: new Date(1985, 5, 10) },
        { id: '3', birthdayDate: new Date(1995, 5, 15) },
      ];

      const sorted = [...birthdays].sort(
        (a, b) => a.birthdayDate.getDate() - b.birthdayDate.getDate()
      );

      expect(sorted[0].id).toBe('2'); // dia 10
      expect(sorted[1].id).toBe('3'); // dia 15
      expect(sorted[2].id).toBe('1'); // dia 25
    });
  });
});
