import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const profileSchema = z.object({
  fullName: z.string()
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  phone: z.string()
    .trim()
    .regex(/^\([1-9]{2}\) [0-9]{5}-[0-9]{4}$/, 'Telefone inválido - use o formato (XX) XXXXX-XXXX'),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof profileSchema>, string>>;

interface ProfileCompletionModalProps {
  onComplete: () => void;
}

export function ProfileCompletionModal({ onComplete }: ProfileCompletionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Load existing profile data (but NOT email from auth)
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('tab_perfil_usuario')
          .select('des_nome_completo, des_telefone, des_email')
          .eq('cod_usuario', user.id)
          .maybeSingle();

        if (data) {
          setFullName(data.des_nome_completo || '');
          setPhone(data.des_telefone || '');
          setEmail(data.des_email || ''); // Only use email from profile, not from auth
        } else {
          // Use user metadata as fallback for name only
          setFullName(user.user_metadata?.full_name || '');
          // Email starts blank - user must fill it
          setEmail('');
        }
      };
      fetchProfile();
    }
  }, [user]);

  const validateField = (field: string, value: string) => {
    const data = { fullName, email, phone, [field]: value };
    const result = profileSchema.safeParse(data);
    
    if (!result.success) {
      const fieldError = result.error.errors.find(e => e.path[0] === field);
      setErrors(prev => ({
        ...prev,
        [field]: fieldError?.message || undefined
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FieldErrors];
        return newErrors;
      });
    }
  };

  const handleFieldChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched.has(field)) {
      validateField(field, value);
    }
  };

  const handleFieldBlur = (field: string, value: string) => {
    setTouched(prev => new Set(prev).add(field));
    validateField(field, value);
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate all fields
    const result = profileSchema.safeParse({ fullName, email, phone });
    
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof FieldErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      setTouched(new Set(['fullName', 'email', 'phone']));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tab_perfil_usuario')
        .upsert({
          cod_usuario: user.id,
          des_nome_completo: fullName.trim(),
          des_email: email.trim(),
          des_telefone: phone.trim(),
        });

      if (error) throw error;

      // Update auth user metadata
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      toast({
        title: 'Perfil salvo!',
        description: 'Suas informações foram salvas com sucesso.',
      });

      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as informações.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;
  const isFormValid = 
    fullName.trim().length >= 3 && 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    /^\([1-9]{2}\) [0-9]{5}-[0-9]{4}$/.test(phone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md mx-4"
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Complete seu Perfil</h2>
                <p className="text-sm text-muted-foreground">
                  Por favor, preencha suas informações para continuar
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">
                Essas informações são obrigatórias para utilizar o sistema.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className={`flex items-center gap-2 ${errors.fullName ? 'text-destructive' : ''}`}>
                  <User className="h-4 w-4" />
                  Nome Completo *
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => handleFieldChange('fullName', e.target.value, setFullName)}
                  onBlur={() => handleFieldBlur('fullName', fullName)}
                  placeholder="Digite seu nome completo"
                  className={errors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className={`flex items-center gap-2 ${errors.email ? 'text-destructive' : ''}`}>
                  <Mail className="h-4 w-4" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleFieldChange('email', e.target.value, setEmail)}
                  onBlur={() => handleFieldBlur('email', email)}
                  placeholder="Digite seu email"
                  className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className={`flex items-center gap-2 ${errors.phone ? 'text-destructive' : ''}`}>
                  <Phone className="h-4 w-4" />
                  Telefone *
                </Label>
                <MaskedInput
                  id="phone"
                  mask="phone"
                  value={phone}
                  onChange={(formatted) => handleFieldChange('phone', formatted, setPhone)}
                  onBlur={() => handleFieldBlur('phone', phone)}
                  placeholder="(XX) XXXXX-XXXX"
                  className={errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Validation status */}
            <div className="flex items-center gap-2 text-sm">
              {isFormValid ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Formulário válido</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Preencha todos os campos obrigatórios</span>
                </>
              )}
            </div>

            <Button 
              onClick={handleSave} 
              disabled={isLoading || hasErrors || !isFormValid}
              className="w-full gap-2"
              size="lg"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar e Continuar
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
