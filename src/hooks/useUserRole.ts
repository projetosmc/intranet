import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AppRole = 'admin' | 'moderator' | 'user';

export function useUserRole() {
  const { user, isAuthenticated } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      setRoles((data || []).map((r) => r.role as AppRole));
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRoles();
    } else {
      setRoles([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchRoles]);

  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator') || isAdmin;

  return {
    roles,
    isAdmin,
    isModerator,
    isLoading,
    refetch: fetchRoles,
  };
}
