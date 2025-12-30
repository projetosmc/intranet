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
  // Auth
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loadingStage: LoadingStage;
  hasTimedOut: boolean;
  hasError: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  
  // Roles
  roles: AppRole[];
  isAdmin: boolean;
  isModerator: boolean;
  
  // Permissions
  canAccess: (route: string) => boolean;
  getScreenName: (route: string) => string | null;
  
  // Cache & Retry
  invalidateCache: () => void;
  retryLoading: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Query keys
const ROLES_QUERY_KEY = 'user-roles';
const PERMISSIONS_QUERY_KEY = 'screen-permissions';

// Stale time: 5 minutes
const STALE_TIME = 5 * 60 * 1000;

// Fetch roles function
async function fetchUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('tab_usuario_role')
    .select('des_role')
    .eq('seq_usuario', userId);

  if (error) {
    console.error('Error fetching roles:', error);
    return [];
  }

  return (data || []).map((r) => r.des_role as AppRole);
}

// Fetch permissions function
async function fetchUserPermissions(roles: AppRole[]): Promise<ScreenPermission[]> {
  if (roles.length === 0) {
    return [];
  }

  // Admin has access to everything - no need to fetch
  if (roles.includes('admin')) {
    return [];
  }

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
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('session');

  // Track if initial data fetch is complete
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  
  // Timeout and error states
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [hasError, setHasError] = useState(false);
  const loadingStartTime = useRef<number>(Date.now());
  const LOADING_TIMEOUT = 10000; // 10 seconds

  // Reset loaded flags when user changes
  useEffect(() => {
    if (!user) {
      setRolesLoaded(false);
      setPermissionsLoaded(false);
      setHasTimedOut(false);
      setHasError(false);
    }
  }, [user]);

  // Timeout effect - triggers after 10 seconds of loading
  useEffect(() => {
    if (!isSessionChecked || !user) return;
    
    loadingStartTime.current = Date.now();
    setHasTimedOut(false);
    
    const checkTimeout = setInterval(() => {
      if (rolesLoaded && permissionsLoaded) {
        clearInterval(checkTimeout);
        return;
      }
      
      const elapsed = Date.now() - loadingStartTime.current;
      if (elapsed >= LOADING_TIMEOUT) {
        setHasTimedOut(true);
        setLoadingStage('timeout');
        clearInterval(checkTimeout);
      }
    }, 1000);
    
    return () => clearInterval(checkTimeout);
  }, [isSessionChecked, user, rolesLoaded, permissionsLoaded]);

  // Roles query with React Query
  const {
    data: roles = [],
    isLoading: isRolesLoading,
    isError: isRolesError,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: [ROLES_QUERY_KEY, user?.id],
    queryFn: async () => {
      setLoadingStage('roles');
      const result = await fetchUserRoles(user!.id);
      setRolesLoaded(true);
      return result;
    },
    enabled: !!user?.id && isSessionChecked && !hasTimedOut,
    staleTime: STALE_TIME,
    gcTime: STALE_TIME * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator') || isAdmin;

  // Permissions query with React Query
  const {
    data: permissions = [],
    isLoading: isPermissionsLoading,
    isError: isPermissionsError,
    refetch: refetchPermissions,
  } = useQuery({
    queryKey: [PERMISSIONS_QUERY_KEY, roles],
    queryFn: async () => {
      setLoadingStage('permissions');
      const result = await fetchUserPermissions(roles);
      setPermissionsLoaded(true);
      setLoadingStage('complete');
      return result;
    },
    enabled: !!user?.id && isSessionChecked && rolesLoaded && !hasTimedOut,
    staleTime: STALE_TIME,
    gcTime: STALE_TIME * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Track errors
  useEffect(() => {
    if (isRolesError || isPermissionsError) {
      setHasError(true);
      setLoadingStage('error');
    }
  }, [isRolesError, isPermissionsError]);

  // Retry function
  const retryLoading = useCallback(() => {
    setHasTimedOut(false);
    setHasError(false);
    setRolesLoaded(false);
    setPermissionsLoaded(false);
    loadingStartTime.current = Date.now();
    setLoadingStage('roles');
    
    // Clear cache and refetch
    queryClient.removeQueries({ queryKey: [ROLES_QUERY_KEY] });
    queryClient.removeQueries({ queryKey: [PERMISSIONS_QUERY_KEY] });
    
    if (user) {
      setTimeout(() => {
        refetchRoles();
      }, 100);
    }
  }, [user, queryClient, refetchRoles]);

  // Combined loading state - CRITICAL: only false when we KNOW the auth state
  const isLoading = useMemo(() => {
    // Timeout or error - stop loading to show error state
    if (hasTimedOut || hasError) return false;
    
    // Haven't checked session yet - MUST wait
    if (!isSessionChecked) return true;
    
    // No user after checking = definitely not authenticated, stop loading
    if (!user) return false;
    
    // User exists - wait for roles to be loaded
    if (!rolesLoaded || isRolesLoading) return true;
    
    // Roles loaded - wait for permissions to be loaded
    if (!permissionsLoaded || isPermissionsLoading) return true;
    
    return false;
  }, [isSessionChecked, user, rolesLoaded, isRolesLoading, permissionsLoaded, isPermissionsLoading, hasTimedOut, hasError]);

  // Update loading stage when complete
  useEffect(() => {
    if (!isLoading && user && !hasTimedOut && !hasError) {
      setLoadingStage('complete');
    } else if (!isLoading && !user && isSessionChecked) {
      setLoadingStage('idle');
    }
  }, [isLoading, user, isSessionChecked, hasTimedOut, hasError]);

  // Initialize auth and set up listener
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        setLoadingStage('session');
        
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setIsSessionChecked(true);
          setLoadingStage('idle');
          return;
        }
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (!initialSession?.user) {
          setLoadingStage('idle');
        }
        
        // Mark session as checked AFTER setting user/session
        setIsSessionChecked(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setIsSessionChecked(true);
          setLoadingStage('idle');
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;

        // Update session state synchronously
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Handle specific events
        if (event === 'SIGNED_OUT') {
          // Clear React Query cache and reset flags
          queryClient.removeQueries({ queryKey: [ROLES_QUERY_KEY] });
          queryClient.removeQueries({ queryKey: [PERMISSIONS_QUERY_KEY] });
          setRolesLoaded(false);
          setPermissionsLoaded(false);
          setLoadingStage('idle');
        } else if (event === 'SIGNED_IN' && newSession?.user) {
          // Invalidate and refetch on sign in
          setTimeout(() => {
            if (!isMounted) return;
            queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY, newSession.user.id] });
          }, 0);
        }
      }
    );

    return () => {
      isMounted = false;
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

    if (routePermissions.length === 0) {
      return true;
    }

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
    signIn,
    signUp,
    signOut,
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
    signIn,
    signUp,
    signOut,
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
