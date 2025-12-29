import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Birthday {
  id: string;
  fullName: string;
  birthdayDate: Date;
  unit?: string;
  avatarUrl?: string;
}

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

      const formattedBirthdays: Birthday[] = (data || []).map(profile => ({
        id: profile.cod_usuario,
        fullName: profile.des_nome_completo || 'Sem nome',
        birthdayDate: new Date(profile.dta_aniversario),
        unit: profile.des_unidade || undefined,
        avatarUrl: profile.des_avatar_url || undefined,
      }));

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