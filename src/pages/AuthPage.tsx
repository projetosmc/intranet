import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import logoMontecarlo from '@/assets/logo-montecarlo-transparent.png';
import mascotMontecarlo from '@/assets/mascot-montecarlo.png';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuário é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export default function AuthPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Validate form
      const result = loginSchema.safeParse({ username, password });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      // Call LDAP auth edge function
      const { data, error } = await supabase.functions.invoke('ldap-auth', {
        body: { username, password },
      });

      if (error) {
        console.error('LDAP auth error:', error);
        toast({
          title: 'Erro ao entrar',
          description: 'Erro de comunicação com o servidor',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      if (!data.success) {
        toast({
          title: 'Erro ao entrar',
          description: data.error || 'Credenciais inválidas',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Use the magic link to authenticate
      if (data.auth?.actionLink) {
        // Extract token from magic link and verify OTP
        const linkUrl = new URL(data.auth.actionLink);
        const token = linkUrl.searchParams.get('token');
        const type = linkUrl.searchParams.get('type') || 'magiclink';
        
        if (token) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as 'magiclink' | 'email',
          });

          if (verifyError) {
            console.error('OTP verification error:', verifyError);
            toast({
              title: 'Erro ao entrar',
              description: 'Erro ao estabelecer sessão',
              variant: 'destructive',
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      toast({
        title: 'Bem-vindo!',
        description: `Login realizado com sucesso${data.user?.isNewUser ? '. Sua conta foi criada automaticamente.' : '.'}`,
      });
      
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      toast({
        title: 'Erro ao entrar',
        description: 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Animated Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: [0.3, 0.5, 0.3], 
            scale: [1, 1.1, 1],
            x: [0, 20, 0],
            y: [0, -10, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: [0.2, 0.4, 0.2], 
            scale: [1, 1.15, 1],
            x: [0, -15, 0],
            y: [0, 20, 0]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: [0.1, 0.2, 0.1], 
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" 
        />
      </div>

      {/* Left Side - Mascot */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex flex-1 items-center justify-center relative z-10"
      >
        <motion.img 
          src={mascotMontecarlo} 
          alt="Mascote Monte Carlo" 
          className="max-h-[70vh] w-auto object-contain drop-shadow-2xl"
          initial={{ y: 10 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center mb-8"
          >
            <img 
              src={logoMontecarlo} 
              alt="Monte Carlo" 
              className="h-12 w-auto object-contain"
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-center mb-2 text-foreground"
          >
            MC Hub
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-center mb-10"
          >
            Faça login com sua conta de rede
          </motion.p>

          {/* Form - Embedded without card */}
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-foreground">
                Usuário de rede
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="seu.usuario"
                  className="pl-10 bg-background/60 backdrop-blur-sm border-border/50 focus:bg-background/80 transition-colors h-11"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-background/60 backdrop-blur-sm border-border/50 focus:bg-background/80 transition-colors h-11"
                  autoComplete="current-password"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Entrar'
              )}
            </Button>
          </motion.form>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-muted-foreground mt-8"
          >
            Use as mesmas credenciais que você utiliza para acessar seu computador
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
