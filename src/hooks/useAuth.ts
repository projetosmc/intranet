import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

/**
 * Hook wrapper para autenticação
 * Utiliza o AuthContext centralizado
 */
export function useAuth() {
  const auth = useAuthContext();
  const { toast } = useToast();

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await auth.signIn(email, password);
    
    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: (error as Error).message,
        variant: 'destructive',
      });
      return { error };
    }

    toast({
      title: 'Bem-vindo!',
      description: 'Login realizado com sucesso.',
    });
    return { error: null };
  }, [auth, toast]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await auth.signUp(email, password, fullName);
    
    if (error) {
      toast({
        title: 'Erro ao cadastrar',
        description: (error as Error).message,
        variant: 'destructive',
      });
      return { error };
    }

    toast({
      title: 'Conta criada!',
      description: 'Você já pode fazer login.',
    });
    return { error: null };
  }, [auth, toast]);

  const signOut = useCallback(async () => {
    await auth.signOut();
  }, [auth]);

  return {
    user: auth.user,
    session: auth.session,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    signIn,
    signUp,
    signOut,
  };
}

