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
  isRevalidating: boolean;
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

// LocalStorage keys for session persistence
const SESSION_CACHE_KEY = 'mc-hub-session-cache';
const ROLES_CACHE_KEY = 'mc-hub-roles-cache';
const CACHE_EXPIRY_KEY = 'mc-hub-cache-expiry';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache helper functions
function getCachedSession(): { user: User; session: Session } | null {
  try {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (!expiry || Date.now() > parseInt(expiry, 10)) {
      clearSessionCache();
      return null;
    }
    
    const cached = localStorage.getItem(SESSION_CACHE_KEY);
    if (!cached) return null;
    
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

function getCachedRoles(): AppRole[] | null {
  try {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (!expiry || Date.now() > parseInt(expiry, 10)) {
      return null;
    }
    
    const cached = localStorage.getItem(ROLES_CACHE_KEY);
    if (!cached) return null;
    
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

function cacheSession(user: User, session: Session, roles: AppRole[]) {
  try {
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ user, session }));
    localStorage.setItem(ROLES_CACHE_KEY, JSON.stringify(roles));
    localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_TTL).toString());
  } catch {
    // Ignore storage errors
  }
}

function clearSessionCache() {
  try {
    localStorage.removeItem(SESSION_CACHE_KEY);
    localStorage.removeItem(ROLES_CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  } catch {
    // Ignore storage errors
  }
}

// Fetch roles function
async function fetchUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('tab_usuario_role')
    .select('des_role')
    .eq('seq_usuario', userId);

  if (error) {
    console.error('Error fetching roles:', error);
    throw error; // Throw to let React Query handle retry
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
    throw error;
  }

  return (data || []) as ScreenPermission[];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  // Try to restore from cache immediately for faster initial render
  const cachedData = useRef(getCachedSession());
  const cachedRoles = useRef(getCachedRoles());
  const usedCacheOnInit = useRef(!!cachedData.current && !!cachedRoles.current);
  
  // Auth state - initialize from cache if available
  const [user, setUser] = useState<User | null>(cachedData.current?.user ?? null);
  const [session, setSession] = useState<Session | null>(cachedData.current?.session ?? null);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('session');

  // Revalidation state - true when we used cache and are refreshing in background
  const [isRevalidating, setIsRevalidating] = useState(false);
  
  // Timeout and error states
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [hasError, setHasError] = useState(false);
  const loadingStartTime = useRef<number>(Date.now());
  const LOADING_TIMEOUT = 10000; // 10 seconds

  // Roles query with React Query
  const rolesQuery = useQuery({
    queryKey: [ROLES_QUERY_KEY, user?.id],
    queryFn: async () => {
      setLoadingStage('roles');
      return await fetchUserRoles(user!.id);
    },
    enabled: !!user?.id && isSessionChecked && !hasTimedOut && !hasError,
    staleTime: STALE_TIME,
    gcTime: STALE_TIME * 2,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });

  const roles = rolesQuery.data ?? [];
  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator') || isAdmin;

  // Permissions query with React Query
  const permissionsQuery = useQuery({
    queryKey: [PERMISSIONS_QUERY_KEY, roles],
    queryFn: async () => {
      setLoadingStage('permissions');
      return await fetchUserPermissions(roles);
    },
    enabled: !!user?.id && isSessionChecked && rolesQuery.isSuccess && roles.length >= 0 && !hasTimedOut && !hasError,
    staleTime: STALE_TIME,
    gcTime: STALE_TIME * 2,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });

  const permissions = permissionsQuery.data ?? [];

  // Combined loading state - SIMPLIFIED and ROBUST
  const isLoading = useMemo(() => {
    // Error or timeout - stop loading
    if (hasTimedOut || hasError) return false;
    
    // Haven't checked session yet - loading
    if (!isSessionChecked) return true;
    
    // No user after session check = not authenticated, done loading
    if (!user) return false;
    
    // User exists - check if roles are ready
    if (rolesQuery.isLoading || rolesQuery.isPending) return true;
    
    // If roles query failed, stop loading (will show error)
    if (rolesQuery.isError) return false;
    
    // Roles are ready - check permissions
    if (permissionsQuery.isLoading || permissionsQuery.isPending) return true;
    
    // All done
    return false;
  }, [isSessionChecked, user, rolesQuery.isLoading, rolesQuery.isPending, rolesQuery.isError, permissionsQuery.isLoading, permissionsQuery.isPending, hasTimedOut, hasError]);

  // Timeout effect - triggers after 10 seconds of loading
  useEffect(() => {
    if (!isLoading) return;
    
    loadingStartTime.current = Date.now();
    
    const checkTimeout = setInterval(() => {
      const elapsed = Date.now() - loadingStartTime.current;
      if (elapsed >= LOADING_TIMEOUT && isLoading) {
        setHasTimedOut(true);
        setLoadingStage('timeout');
        clearInterval(checkTimeout);
      }
    }, 1000);
    
    return () => clearInterval(checkTimeout);
  }, [isLoading]);

  // Track errors from queries
  useEffect(() => {
    if (rolesQuery.isError || permissionsQuery.isError) {
      setHasError(true);
      setLoadingStage('error');
    }
  }, [rolesQuery.isError, permissionsQuery.isError]);

  // Update loading stage when complete
  useEffect(() => {
    if (!isLoading && user && session && !hasTimedOut && !hasError) {
      setLoadingStage('complete');
      cacheSession(user, session, roles);
      setIsRevalidating(false);
    } else if (!isLoading && !user && isSessionChecked) {
      setLoadingStage('idle');
      clearSessionCache();
      setIsRevalidating(false);
    }
  }, [isLoading, user, session, roles, isSessionChecked, hasTimedOut, hasError]);

  // Retry function
  const retryLoading = useCallback(() => {
    setHasTimedOut(false);
    setHasError(false);
    loadingStartTime.current = Date.now();
    setLoadingStage('roles');
    
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: [ROLES_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [PERMISSIONS_QUERY_KEY] });
  }, [queryClient]);

  // Initialize auth and set up listener
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        setLoadingStage('session');
        
        // If we have valid cache, mark as revalidating
        if (usedCacheOnInit.current) {
          setIsRevalidating(true);
        }
        
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          // Still allow app to function, just without auth
          setIsSessionChecked(true);
          setLoadingStage('idle');
          return;
        }
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (!initialSession?.user) {
          setLoadingStage('idle');
        }
        
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

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_OUT') {
          queryClient.removeQueries({ queryKey: [ROLES_QUERY_KEY] });
          queryClient.removeQueries({ queryKey: [PERMISSIONS_QUERY_KEY] });
          clearSessionCache();
          cachedData.current = null;
          cachedRoles.current = null;
          setLoadingStage('idle');
          setHasTimedOut(false);
          setHasError(false);
        } else if (event === 'SIGNED_IN' && newSession?.user) {
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
    isRevalidating,
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
    isRevalidating,
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
