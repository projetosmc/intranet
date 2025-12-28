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
        .from('profiles')
        .select('id, full_name, birthday_date, unit, avatar_url')
        .not('birthday_date', 'is', null);

      if (error) throw error;

      const formattedBirthdays: Birthday[] = (data || []).map(profile => ({
        id: profile.id,
        fullName: profile.full_name || 'Sem nome',
        birthdayDate: new Date(profile.birthday_date),
        unit: profile.unit || undefined,
        avatarUrl: profile.avatar_url || undefined,
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