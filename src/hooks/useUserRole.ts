import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Tipo de roles disponíveis no sistema
 * Enum no banco: app_role ('admin' | 'moderator' | 'user')
 */
type AppRole = 'admin' | 'moderator' | 'user';

const CACHE_KEY = 'mc-hub-user-roles';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Interface para cache local de roles
 */
interface CachedRoles {
  userId: string;
  roles: AppRole[];
  timestamp: number;
}

function getCachedRoles(userId: string): AppRole[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedRoles = JSON.parse(cached);
    
    // Check if cache is for the same user and not expired
    if (data.userId === userId && Date.now() - data.timestamp < CACHE_DURATION) {
      return data.roles;
    }
    
    return null;
  } catch {
    return null;
  }
}

function setCachedRoles(userId: string, roles: AppRole[]): void {
  try {
    const data: CachedRoles = {
      userId,
      roles,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage errors
  }
}

function clearCachedRoles(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Hook para gerenciamento de roles de usuário
 * 
 * Tabela: tab_usuario_role
 * Colunas:
 * - cod_usuario_role (PK): UUID do registro
 * - seq_usuario: FK para o usuário (auth.users)
 * - des_role: Role do usuário (app_role enum)
 * - dta_cadastro: Data de criação
 * 
 * Função auxiliar: has_role(_user_id, _role) - Verifica se usuário tem role
 * 
 * RLS: Admins podem gerenciar, usuários podem ver próprios roles
 * 
 * Obs: Utiliza cache local para performance (5 min de duração)
 */
export function useUserRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch roles when userId changes
  useEffect(() => {
    let isMounted = true;

    const fetchRoles = async (uid: string) => {
      // Check cache first
      const cachedRoles = getCachedRoles(uid);
      if (cachedRoles && isMounted) {
        setRoles(cachedRoles);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tab_usuario_role')
          .select('des_role')
          .eq('seq_usuario', uid);

        if (error) throw error;

        if (isMounted) {
          const fetchedRoles = (data || []).map((r) => r.des_role as AppRole);
          setRoles(fetchedRoles);
          setCachedRoles(uid, fetchedRoles);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        if (isMounted) {
          setRoles([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      
      if (uid) {
        fetchRoles(uid);
      } else {
        clearCachedRoles();
        setRoles([]);
        setIsLoading(false);
      }
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        const newUserId = session?.user?.id ?? null;
        setUserId(newUserId);
        
        if (event === 'SIGNED_OUT') {
          clearCachedRoles();
          setRoles([]);
          setIsLoading(false);
        } else if (newUserId) {
          setIsLoading(true);
          fetchRoles(newUserId);
        } else {
          setRoles([]);
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const invalidateCache = useCallback(() => {
    clearCachedRoles();
    if (userId) {
      setIsLoading(true);
      // Trigger refetch
      supabase
        .from('tab_usuario_role')
        .select('des_role')
        .eq('seq_usuario', userId)
        .then(({ data, error }) => {
          if (!error) {
            const fetchedRoles = (data || []).map((r) => r.des_role as AppRole);
            setRoles(fetchedRoles);
            setCachedRoles(userId, fetchedRoles);
          }
          setIsLoading(false);
        });
    }
  }, [userId]);

  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator') || isAdmin;

  return {
    roles,
    isAdmin,
    isModerator,
    isLoading,
    refetch: invalidateCache,
    invalidateCache,
  };
}
