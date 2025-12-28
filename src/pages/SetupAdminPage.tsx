import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function SetupAdminPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSetupAdmin = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Check if any admin exists
      const { count } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (count && count > 0) {
        toast({
          title: 'Admin já existe',
          description: 'Já existe um administrador configurado no sistema.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Insert admin role for current user using RPC to bypass RLS
      const { error } = await supabase.rpc('setup_first_admin', {
        admin_user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Você agora é administrador do sistema.',
      });
      setIsDone(true);

      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error setting up admin:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível configurar o administrador.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Faça login primeiro.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar via-background to-sidebar p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8 text-center">
          {isDone ? (
            <>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Configuração Concluída!</h1>
              <p className="text-muted-foreground">
                Redirecionando...
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Configurar Administrador</h1>
              <p className="text-muted-foreground mb-6">
                Se este é o primeiro acesso ao sistema, você pode se tornar o administrador inicial.
              </p>
              <div className="text-sm text-muted-foreground mb-6 p-3 bg-muted/50 rounded-lg">
                <p><strong>Usuário:</strong> {user?.email}</p>
              </div>
              <Button
                onClick={handleSetupAdmin}
                disabled={isLoading}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Tornar-me Administrador
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
