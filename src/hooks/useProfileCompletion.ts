import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProfileCompletionStatus {
  isComplete: boolean;
  isLoading: boolean;
  missingFields: string[];
}

const REQUIRED_FIELDS = ['des_nome_completo', 'des_telefone'];

export function useProfileCompletion(): ProfileCompletionStatus {
  const { user } = useAuth();
  const [isComplete, setIsComplete] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      setIsComplete(true);
      return;
    }

    const checkProfileCompletion = async () => {
      try {
        const { data, error } = await supabase
          .from('tab_perfil_usuario')
          .select('des_nome_completo, des_telefone, des_email')
          .eq('cod_usuario', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking profile completion:', error);
          setIsComplete(true); // Don't block on error
          setIsLoading(false);
          return;
        }

        const missing: string[] = [];
        
        // Check if profile exists
        if (!data) {
          missing.push('des_nome_completo', 'des_telefone');
        } else {
          // Check required fields
          if (!data.des_nome_completo?.trim()) {
            missing.push('des_nome_completo');
          }
          if (!data.des_telefone?.trim()) {
            missing.push('des_telefone');
          }
        }

        setMissingFields(missing);
        setIsComplete(missing.length === 0);
      } catch (error) {
        console.error('Error checking profile:', error);
        setIsComplete(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileCompletion();

    // Subscribe to profile changes
    const channel = supabase
      .channel(`profile-completion-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tab_perfil_usuario',
          filter: `cod_usuario=eq.${user.id}`,
        },
        () => {
          checkProfileCompletion();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { isComplete, isLoading, missingFields };
}
