import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
}

interface UserContextType {
  user: User | null;
  isAdmin: boolean;
  login: (user: User) => void;
  logout: () => void;
  toggle3D: boolean;
  setToggle3D: (value: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const mockUser: User = {
  id: '1',
  name: 'João Silva',
  email: 'joao.silva@montecarlo.com.br',
  role: 'admin',
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useLocalStorage<User | null>('mc-hub-user', mockUser);
  const [toggle3D, setToggle3D] = useLocalStorage<boolean>('mc-hub-3d', true);

  const isAdmin = user?.role === 'admin';

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, isAdmin, login, logout, toggle3D, setToggle3D }}>
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
