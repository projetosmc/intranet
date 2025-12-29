import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface para dados de aniversário
 * Origem: tabela tab_perfil_usuario
 */
interface Birthday {
  /** cod_usuario - ID do usuário */
  id: string;
  /** des_nome_completo - Nome completo do usuário */
  fullName: string;
  /** dta_aniversario - Data de aniversário */
  birthdayDate: Date;
  /** des_unidade - Unidade/setor do usuário */
  unit?: string;
  /** des_avatar_url - URL do avatar */
  avatarUrl?: string;
}

/**
 * Hook para busca de aniversariantes
 * 
 * Tabela: tab_perfil_usuario
 * Colunas utilizadas:
 * - cod_usuario (PK): UUID do usuário (ref auth.users)
 * - des_nome_completo: Nome completo
 * - dta_aniversario: Data de aniversário (DATE)
 * - des_unidade: Unidade/setor
 * - des_avatar_url: URL do avatar
 * 
 * RLS: Usuários podem visualizar todos os perfis
 */
export function useBirthdays() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tab_perfil_usuario')
        .select('cod_usuario, des_nome_completo, dta_aniversario, des_unidade, des_avatar_url')
        .not('dta_aniversario', 'is', null);

      if (error) throw error;

      const formattedBirthdays: Birthday[] = (data || []).map(profile => {
        // Criar Date evitando problemas de timezone
        // dta_aniversario vem como 'YYYY-MM-DD'
        const [year, month, day] = profile.dta_aniversario.split('-').map(Number);
        return {
          id: profile.cod_usuario,
          fullName: profile.des_nome_completo || 'Sem nome',
          birthdayDate: new Date(year, month - 1, day),
          unit: profile.des_unidade || undefined,
          avatarUrl: profile.des_avatar_url || undefined,
        };
      });

      setBirthdays(formattedBirthdays);
    } catch (error) {
      console.error('Error fetching birthdays:', error);
      setBirthdays([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    birthdays,
    isLoading,
    refetch: fetchBirthdays,
  };
}