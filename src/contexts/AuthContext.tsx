import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'moderator' | 'user';

interface ScreenPermission {
  des_rota: string;
  des_nome_tela: string;
  ind_pode_acessar: boolean;
}

export type LoadingStage = 'idle' | 'session' | 'roles' | 'permissions' | 'complete' | 'timeout' | 'error';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loadingStage: LoadingStage;
  hasTimedOut: boolean;
  hasError: boolean;
  isRevalidating: boolean;
  isSessionExpired: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  roles: AppRole[];
  isAdmin: boolean;
  isModerator: boolean;
  canAccess: (route: string) => boolean;
  getScreenName: (route: string) => string | null;
  invalidateCache: () => void;
  retryLoading: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLES_QUERY_KEY = 'user-roles';
const PERMISSIONS_QUERY_KEY = 'screen-permissions';
const STALE_TIME = 5 * 60 * 1000;

// Fetch roles function
async function fetchUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('tab_usuario_role')
    .select('des_role')
    .eq('seq_usuario', userId);

  if (error) {
    console.error('Error fetching roles:', error);
    return []; // Return empty instead of throwing to prevent blocking
  }

  return (data || []).map((r) => r.des_role as AppRole);
}

// Fetch permissions function
async function fetchUserPermissions(roles: AppRole[]): Promise<ScreenPermission[]> {
  if (roles.length === 0) return [];
  if (roles.includes('admin')) return []; // Admin has access to everything

  const { data, error } = await supabase
    .from('tab_permissao_tela')
    .select('des_rota, des_nome_tela, ind_pode_acessar')
    .in('des_role', roles);

  if (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }

  return (data || []) as ScreenPermission[];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  // Core auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('session');
  const [isRevalidating, setIsRevalidating] = useState(false);
  
  // Error states
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [hasError, setHasError] = useState(false);
  const loadingStartTime = useRef<number>(Date.now());
  const LOADING_TIMEOUT = 10000;

  // Roles query
  const rolesQuery = useQuery({
    queryKey: [ROLES_QUERY_KEY, user?.id],
    queryFn: () => fetchUserRoles(user!.id),
    enabled: !!user?.id && isSessionChecked,
    staleTime: STALE_TIME,
    gcTime: STALE_TIME * 2,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });

  const roles = rolesQuery.data ?? [];
  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator') || isAdmin;

  // Permissions query
  const permissionsQuery = useQuery({
    queryKey: [PERMISSIONS_QUERY_KEY, roles],
    queryFn: () => fetchUserPermissions(roles),
    enabled: !!user?.id && isSessionChecked && rolesQuery.isSuccess,
    staleTime: STALE_TIME,
    gcTime: STALE_TIME * 2,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });

  const permissions = permissionsQuery.data ?? [];

  // Update loading stage based on query states
  useEffect(() => {
    if (!isSessionChecked) {
      setLoadingStage('session');
    } else if (!user) {
      setLoadingStage('idle');
    } else if (rolesQuery.isFetching) {
      setLoadingStage('roles');
    } else if (permissionsQuery.isFetching) {
      setLoadingStage('permissions');
    } else if (rolesQuery.isSuccess && permissionsQuery.isSuccess) {
      setLoadingStage('complete');
    } else if (rolesQuery.isSuccess && !permissionsQuery.isFetching) {
      // Permissions query might not be enabled yet or finished
      setLoadingStage('complete');
    }
  }, [isSessionChecked, user, rolesQuery.isFetching, rolesQuery.isSuccess, permissionsQuery.isFetching, permissionsQuery.isSuccess]);

  // Loading logic - wait for roles AND permissions to fully load
  const isLoading = useMemo(() => {
    if (hasTimedOut || hasError) return false;
    if (!isSessionChecked) return true;
    if (!user) return false;
    
    // Wait for roles to load
    if (!rolesQuery.isSuccess && rolesQuery.isFetching) return true;
    
    // Wait for permissions to load (unless admin who doesn't need them)
    if (!isAdmin && !permissionsQuery.isSuccess && permissionsQuery.isFetching) return true;
    
    // If roles loaded but permissions query not started/finished yet, wait
    if (rolesQuery.isSuccess && !isAdmin && !permissionsQuery.isSuccess && permissionsQuery.fetchStatus !== 'idle') return true;
    
    return false;
  }, [isSessionChecked, user, rolesQuery.isSuccess, rolesQuery.isFetching, permissionsQuery.isSuccess, permissionsQuery.isFetching, permissionsQuery.fetchStatus, hasTimedOut, hasError, isAdmin]);

  // Timeout effect
  useEffect(() => {
    if (!isLoading) {
      setHasTimedOut(false);
      return;
    }
    
    loadingStartTime.current = Date.now();
    
    const checkTimeout = setInterval(() => {
      const elapsed = Date.now() - loadingStartTime.current;
      if (elapsed >= LOADING_TIMEOUT) {
        console.warn('[Auth] Loading timeout reached');
        setHasTimedOut(true);
        setLoadingStage('timeout');
        clearInterval(checkTimeout);
      }
    }, 1000);
    
    return () => clearInterval(checkTimeout);
  }, [isLoading]);

  // Retry function
  const retryLoading = useCallback(() => {
    setHasTimedOut(false);
    setHasError(false);
    loadingStartTime.current = Date.now();
    
    if (user) {
      // Don't re-check session (avoids lock), just re-fetch roles/permissions
      setLoadingStage('roles');
      queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PERMISSIONS_QUERY_KEY] });
    } else {
      setLoadingStage('session');
      // Only call getSession as last resort
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsSessionChecked(true);
        
        if (currentSession?.user) {
          queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
          queryClient.invalidateQueries({ queryKey: [PERMISSIONS_QUERY_KEY] });
        }
      });
    }
  }, [queryClient, user]);

  // Initialize auth - IMPORTANT: Set up onAuthStateChange BEFORE getSession to avoid lock contention
  useEffect(() => {
    let isMounted = true;
    let initialSessionHandled = false;

    console.log('[Auth] Setting up auth listener...');

    // Set up listener FIRST to avoid Navigator LockManager deadlock
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;

        console.log('[Auth] onAuthStateChange event:', event, 'user:', newSession?.user?.id ?? 'none');

        // If we get INITIAL_SESSION, use it as the initial session check
        if (event === 'INITIAL_SESSION') {
          if (!initialSessionHandled) {
            initialSessionHandled = true;
            console.log('[Auth] INITIAL_SESSION handled, user:', newSession?.user?.id ?? 'none');
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setIsSessionChecked(true);
            if (!newSession?.user) {
              setLoadingStage('idle');
            }
          }
          return;
        }

        // For all other events, use setTimeout to avoid Supabase internal lock issues
        setTimeout(() => {
          if (!isMounted) return;
          
          setSession(newSession);
          setUser(newSession?.user ?? null);

          if (event === 'SIGNED_OUT') {
            queryClient.removeQueries({ queryKey: [ROLES_QUERY_KEY] });
            queryClient.removeQueries({ queryKey: [PERMISSIONS_QUERY_KEY] });
            setLoadingStage('idle');
            setHasTimedOut(false);
            setHasError(false);
            setIsSessionChecked(true);
          } else if (event === 'SIGNED_IN' && newSession?.user) {
            console.log('[Auth] SIGNED_IN, invalidating role queries for:', newSession.user.id);
            setIsSessionChecked(true);
            setLoadingStage('roles');
            queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY, newSession.user.id] });
          } else if (event === 'TOKEN_REFRESHED') {
            setIsSessionChecked(true);
          }
        }, 0);
      }
    );

    // Fallback: if INITIAL_SESSION doesn't fire within 2s, manually check
    const fallbackTimer = setTimeout(async () => {
      if (initialSessionHandled || !isMounted) return;
      console.log('[Auth] Fallback: INITIAL_SESSION not received, checking session manually...');
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted || initialSessionHandled) return;
        initialSessionHandled = true;
        console.log('[Auth] Fallback session result:', initialSession?.user?.id ?? 'none');
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setIsSessionChecked(true);
        if (!initialSession?.user) {
          setLoadingStage('idle');
        }
      } catch (error) {
        console.error('[Auth] Error getting session (fallback):', error);
        if (isMounted && !initialSessionHandled) {
          initialSessionHandled = true;
          setIsSessionChecked(true);
          setLoadingStage('idle');
        }
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Auth methods
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Session expiry detection
  const isSessionExpired = useMemo(() => {
    if (!session?.expires_at) return false;
    return new Date(session.expires_at * 1000) < new Date();
  }, [session]);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
    } catch (error) {
      console.error('[Auth] Failed to refresh session:', error);
    }
  }, []);

  // Permission check
  const canAccess = useCallback((route: string): boolean => {
    if (isAdmin) return true;

    if (roles.length === 0) {
      const publicRoutes = ['/', '/comunicados', '/status', '/suporte', '/reserva-salas', '/perfil'];
      return publicRoutes.some(r => route.startsWith(r) || route === r);
    }

    const routePermissions = permissions.filter(p => {
      return p.des_rota === route || route.startsWith(p.des_rota + '/');
    });

    if (routePermissions.length === 0) return true;
    return routePermissions.some(p => p.ind_pode_acessar);
  }, [permissions, roles, isAdmin]);

  const getScreenName = useCallback((route: string): string | null => {
    const permission = permissions.find(p => p.des_rota === route);
    return permission?.des_nome_tela || null;
  }, [permissions]);

  const invalidateCache = useCallback(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY, user.id] });
      queryClient.invalidateQueries({ queryKey: [PERMISSIONS_QUERY_KEY] });
    }
  }, [user, queryClient]);

  const value = useMemo(() => ({
    user,
    session,
    isAuthenticated: !!session,
    isLoading,
    loadingStage,
    hasTimedOut,
    hasError,
    isRevalidating,
    isSessionExpired,
    signIn,
    signUp,
    signOut,
    refreshSession,
    roles,
    isAdmin,
    isModerator,
    canAccess,
    getScreenName,
    invalidateCache,
    retryLoading,
  }), [
    user,
    session,
    isLoading,
    loadingStage,
    hasTimedOut,
    hasError,
    isRevalidating,
    isSessionExpired,
    signIn,
    signUp,
    signOut,
    refreshSession,
    roles,
    isAdmin,
    isModerator,
    canAccess,
    getScreenName,
    invalidateCache,
    retryLoading,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
