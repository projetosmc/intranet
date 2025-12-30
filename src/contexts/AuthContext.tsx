import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'moderator' | 'user';

interface ScreenPermission {
  des_rota: string;
  des_nome_tela: string;
  ind_pode_acessar: boolean;
}

interface AuthContextType {
  // Auth
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  
  // Cache
  invalidateCache: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLES_CACHE_KEY = 'mc-hub-user-roles';
const PERMISSIONS_CACHE_KEY = 'mc-hub-screen-permissions';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  
  // Roles state
  const [roles, setRoles] = useState<AppRole[]>([]);
  
  // Permissions state
  const [permissions, setPermissions] = useState<ScreenPermission[]>([]);
  
  // Loading is true during initial auth OR data load
  const isLoading = isInitializing || isDataLoading;

  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator') || isAdmin;

  // Fetch roles for a user
  const fetchRoles = useCallback(async (userId: string): Promise<AppRole[]> => {
    try {
      // Check cache
      const cached = localStorage.getItem(ROLES_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.userId === userId && Date.now() - data.timestamp < CACHE_DURATION) {
          return data.roles as AppRole[];
        }
      }

      const { data, error } = await supabase
        .from('tab_usuario_role')
        .select('des_role')
        .eq('seq_usuario', userId);

      if (error) throw error;

      const fetchedRoles = (data || []).map((r) => r.des_role as AppRole);
      
      // Cache
      localStorage.setItem(ROLES_CACHE_KEY, JSON.stringify({
        userId,
        roles: fetchedRoles,
        timestamp: Date.now(),
      }));

      return fetchedRoles;
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  }, []);

  // Fetch permissions based on roles
  const fetchPermissions = useCallback(async (userRoles: AppRole[], userIsAdmin: boolean): Promise<ScreenPermission[]> => {
    try {
      // Admin has access to everything
      if (userIsAdmin) {
        return [];
      }

      // No roles
      if (userRoles.length === 0) {
        return [];
      }

      // Check cache
      const cached = localStorage.getItem(PERMISSIONS_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (
          JSON.stringify(data.roles.sort()) === JSON.stringify(userRoles.sort()) &&
          Date.now() - data.timestamp < CACHE_DURATION
        ) {
          return data.permissions as ScreenPermission[];
        }
      }

      const { data, error } = await supabase
        .from('tab_permissao_tela')
        .select('des_rota, des_nome_tela, ind_pode_acessar')
        .in('des_role', userRoles);

      if (error) throw error;

      const fetchedPermissions = (data || []) as ScreenPermission[];

      // Cache
      localStorage.setItem(PERMISSIONS_CACHE_KEY, JSON.stringify({
        roles: userRoles,
        permissions: fetchedPermissions,
        timestamp: Date.now(),
      }));

      return fetchedPermissions;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
  }, []);

  // Load user data (roles and permissions)
  const loadUserData = useCallback(async (userId: string) => {
    setIsDataLoading(true);
    try {
      const userRoles = await fetchRoles(userId);
      setRoles(userRoles);
      const userIsAdmin = userRoles.includes('admin');
      const userPermissions = await fetchPermissions(userRoles, userIsAdmin);
      setPermissions(userPermissions);
    } finally {
      setIsDataLoading(false);
    }
  }, [fetchRoles, fetchPermissions]);

  // Initialize auth and load data
  useEffect(() => {
    let isMounted = true;
    let isInitialized = false;

    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setIsInitializing(false);
          isInitialized = true;
          return;
        }
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          await loadUserData(initialSession.user.id);
        } else {
          setRoles([]);
          setPermissions([]);
          setIsDataLoading(false);
        }
        
        setIsInitializing(false);
        isInitialized = true;
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setIsInitializing(false);
          isInitialized = true;
        }
      }
    };

    // Initialize auth first
    initializeAuth();

    // Set up auth state listener AFTER initialization starts
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;

        // Update session state synchronously
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Handle specific events
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem(ROLES_CACHE_KEY);
          localStorage.removeItem(PERMISSIONS_CACHE_KEY);
          setRoles([]);
          setPermissions([]);
          setIsDataLoading(false);
        } else if (event === 'SIGNED_IN' && newSession?.user && isInitialized) {
          // Only reload data on SIGNED_IN if already initialized
          // Use setTimeout to prevent deadlock
          setTimeout(() => {
            if (!isMounted) return;
            loadUserData(newSession.user.id);
          }, 0);
        }
        // Ignore TOKEN_REFRESHED and other events to prevent unnecessary reloads
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

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
    localStorage.removeItem(ROLES_CACHE_KEY);
    localStorage.removeItem(PERMISSIONS_CACHE_KEY);
    
    if (user) {
      loadUserData(user.id);
    }
  }, [user, loadUserData]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session,
        isLoading,
        signIn,
        signUp,
        signOut,
        roles,
        isAdmin,
        isModerator,
        canAccess,
        getScreenName,
        invalidateCache,
      }}
    >
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
