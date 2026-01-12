import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserContextType {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  toggle3D: boolean;
  setToggle3D: (value: boolean) => void;
  signOut: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isAuthenticated, signOut, isAdmin } = useAuthContext();
  const [toggle3D, setToggle3D] = useLocalStorage<boolean>('mc-hub-3d', true);
  const [profileName, setProfileName] = useState<string | null>(null);

  // Buscar nome completo do perfil (LDAP) quando autenticado
  useEffect(() => {
    if (!authUser?.id) {
      setProfileName(null);
      return;
    }

    const fetchProfileName = async () => {
      try {
        const { data, error } = await supabase
          .from('tab_perfil_usuario')
          .select('des_nome_completo')
          .eq('cod_usuario', authUser.id)
          .single();

        if (!error && data?.des_nome_completo) {
          setProfileName(data.des_nome_completo);
        }
      } catch (error) {
        console.error('Error fetching profile name:', error);
      }
    };

    fetchProfileName();

    // Subscribe to profile changes for real-time updates
    const channel = supabase
      .channel(`user-profile-name-${authUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tab_perfil_usuario',
          filter: `cod_usuario=eq.${authUser.id}`,
        },
        (payload) => {
          if (payload.new) {
            const data = payload.new as any;
            if (data.des_nome_completo) {
              setProfileName(data.des_nome_completo);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser?.id]);

  const user = authUser ? {
    id: authUser.id,
    // Prioridade: nome do perfil (LDAP) > metadata > fallback
    name: profileName || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
    email: authUser.email || '',
    avatar: authUser.user_metadata?.avatar_url,
  } : null;

  return (
    <UserContext.Provider value={{ 
      user, 
      isAdmin, 
      isAuthenticated, 
      toggle3D, 
      setToggle3D, 
      signOut 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

