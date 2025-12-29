import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  email: string | null;
  department: string | null;
  position: string | null;
  phone: string | null;
  unit: string | null;
  birthday: string | null;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('tab_perfil_usuario')
          .select('*')
          .eq('cod_usuario', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }

        if (data) {
          setProfile({
            id: data.cod_usuario,
            fullName: data.des_nome_completo,
            avatarUrl: data.des_avatar_url,
            email: data.des_email,
            department: data.des_departamento,
            position: data.des_cargo,
            phone: data.des_telefone,
            unit: data.des_unidade,
            birthday: data.dta_aniversario,
          });
        } else {
          // Fallback to auth user metadata
          setProfile({
            id: user.id,
            fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
            avatarUrl: user.user_metadata?.avatar_url || null,
            email: user.email || null,
            department: null,
            position: null,
            phone: null,
            unit: null,
            birthday: null,
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();

    // Subscribe to profile changes
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tab_perfil_usuario',
          filter: `cod_usuario=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            const data = payload.new as any;
            setProfile({
              id: data.cod_usuario,
              fullName: data.des_nome_completo,
              avatarUrl: data.des_avatar_url,
              email: data.des_email,
              department: data.des_departamento,
              position: data.des_cargo,
              phone: data.des_telefone,
              unit: data.des_unidade,
              birthday: data.dta_aniversario,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const getInitials = () => {
    const name = profile?.fullName || user?.email?.split('@')[0] || 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return {
    profile,
    isLoading,
    getInitials,
  };
}
