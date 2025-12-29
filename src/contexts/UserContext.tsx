import { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuthContext } from '@/contexts/AuthContext';

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

  const user = authUser ? {
    id: authUser.id,
    name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
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

