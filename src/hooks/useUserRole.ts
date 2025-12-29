import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'moderator' | 'user';

const CACHE_KEY = 'mc-hub-user-roles';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

export function useUserRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Listen to auth state changes directly
  useEffect(() => {
    // Get initial session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      const newUserId = session?.user?.id ?? null;
      setUserId(newUserId);
      setAuthReady(true);
      
      // Clear cache if user changed
      if (!newUserId) {
        clearCachedRoles();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUserId = session?.user?.id ?? null;
        setUserId(newUserId);
        setAuthReady(true);
        
        // Clear cache on sign out
        if (event === 'SIGNED_OUT') {
          clearCachedRoles();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchRoles = useCallback(async (skipCache = false) => {
    if (!authReady) {
      return;
    }

    if (!userId) {
      setRoles([]);
      setIsLoading(false);
      return;
    }

    // Check cache first
    if (!skipCache) {
      const cachedRoles = getCachedRoles(userId);
      if (cachedRoles) {
        setRoles(cachedRoles);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tab_usuario_role')
        .select('des_role')
        .eq('seq_usuario', userId);

      if (error) throw error;

      const fetchedRoles = (data || []).map((r) => r.des_role as AppRole);
      setRoles(fetchedRoles);
      setCachedRoles(userId, fetchedRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, authReady]);

  useEffect(() => {
    if (authReady) {
      fetchRoles();
    }
  }, [authReady, fetchRoles]);

  const invalidateCache = useCallback(() => {
    clearCachedRoles();
    fetchRoles(true);
  }, [fetchRoles]);

  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator') || isAdmin;

  return {
    roles,
    isAdmin,
    isModerator,
    isLoading: !authReady || isLoading,
    refetch: fetchRoles,
    invalidateCache,
  };
}
