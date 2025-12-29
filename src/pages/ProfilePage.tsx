import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Mail, Save, Shield, LogOut, Cake, Building2, Briefcase, Phone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { AvatarCropModal } from '@/components/profile/AvatarCropModal';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

// Schema de validação
const profileSchema = z.object({
  fullName: z.string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  phone: z.string()
    .trim()
    .regex(/^$|^\([1-9]{2}\) [0-9]{5}-[0-9]{4}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  unit: z.string()
    .trim()
    .max(50, 'Unidade deve ter no máximo 50 caracteres')
    .optional(),
  department: z.string()
    .trim()
    .max(50, 'Departamento deve ter no máximo 50 caracteres')
    .optional(),
  jobTitle: z.string()
    .trim()
    .max(50, 'Cargo deve ter no máximo 50 caracteres')
    .optional(),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof profileSchema>, string>>;

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { roles, isAdmin, isModerator } = useUserRole();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [birthdayDate, setBirthdayDate] = useState('');
  const [unit, setUnit] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  
  // Avatar crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('tab_perfil_usuario')
          .select('des_nome_completo, des_avatar_url, dta_aniversario, des_unidade, des_departamento, des_cargo, des_telefone')
          .eq('cod_usuario', user.id)
          .maybeSingle();

        if (data) {
          setFullName(data.des_nome_completo || '');
          setAvatarUrl(data.des_avatar_url);
          setBirthdayDate(data.dta_aniversario || '');
          setUnit(data.des_unidade || '');
          setDepartment(data.des_departamento || '');
          setJobTitle(data.des_cargo || '');
          setPhone(data.des_telefone || '');
        } else {
          setFullName(user.user_metadata?.full_name || '');
        }
      };
      fetchProfile();
    }
  }, [user]);

  // Validação em tempo real
  const validateField = (field: string, value: string) => {
    const data = { fullName, phone, unit, department, jobTitle, [field]: value };
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

  const handlePhoneChange = (formatted: string) => {
    setPhone(formatted);
    if (touched.has('phone')) {
      validateField('phone', formatted);
    }
  };

  const handleFieldBlur = (field: string, value: string) => {
    setTouched(prev => new Set(prev).add(field));
    validateField(field, value);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Criar URL temporária para preview e crop
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setCropModalOpen(true);
    
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCroppedImage = async (croppedBlob: Blob) => {
    if (!user) return;

    setIsUploading(true);
    try {
      const fileName = `${user.id}.jpg`;
      const filePath = `avatars/${fileName}`;

      // Upload do blob recortado
      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(filePath, croppedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('announcements')
        .getPublicUrl(filePath);

      // Adicionar timestamp para forçar atualização do cache
      const newAvatarUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('tab_perfil_usuario')
        .upsert({
          cod_usuario: user.id,
          des_avatar_url: newAvatarUrl,
          des_email: user.email,
        });

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      toast({
        title: 'Foto atualizada!',
        description: 'Sua foto de perfil foi alterada com sucesso.',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a foto.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Limpar URL temporária
      if (imageToCrop) {
        URL.revokeObjectURL(imageToCrop);
        setImageToCrop(null);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validar todos os campos
    const result = profileSchema.safeParse({ fullName, phone, unit, department, jobTitle });
    
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof FieldErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      setTouched(new Set(['fullName', 'phone', 'unit', 'department', 'jobTitle']));
      toast({
        title: 'Erro de validação',
        description: 'Por favor, corrija os campos destacados.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tab_perfil_usuario')
        .upsert({
          cod_usuario: user.id,
          des_nome_completo: fullName.trim(),
          des_email: user.email,
          dta_aniversario: birthdayDate || null,
          des_unidade: unit.trim() || null,
          des_departamento: department.trim() || null,
          des_cargo: jobTitle.trim() || null,
          des_telefone: phone.trim() || null,
        });

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  const getInitials = () => {
    if (fullName) {
      return fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Breadcrumbs />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas informações pessoais
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-8 shadow-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-primary/20">
              <AvatarImage src={avatarUrl || undefined} alt={fullName} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-0 right-0 rounded-full shadow-lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex gap-2 mt-4">
            {isAdmin && (
              <Badge className="gap-1">
                <Shield className="h-3 w-3" />
                Administrador
              </Badge>
            )}
            {isModerator && !isAdmin && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Moderador
              </Badge>
            )}
            {!isAdmin && !isModerator && (
              <Badge variant="outline">Usuário</Badge>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className={`flex items-center gap-2 ${errors.fullName ? 'text-destructive' : ''}`}>
              <User className="h-4 w-4" />
              Nome completo
              {errors.fullName && <span className="text-xs font-normal">*</span>}
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => handleFieldChange('fullName', e.target.value, setFullName)}
              onBlur={() => handleFieldBlur('fullName', fullName)}
              placeholder="Seu nome completo"
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
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthday" className="flex items-center gap-2">
                <Cake className="h-4 w-4" />
                Data de Aniversário
              </Label>
              <Input
                id="birthday"
                type="date"
                value={birthdayDate}
                onChange={(e) => setBirthdayDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit" className={`flex items-center gap-2 ${errors.unit ? 'text-destructive' : ''}`}>
                <Building2 className="h-4 w-4" />
                Unidade
              </Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => handleFieldChange('unit', e.target.value, setUnit)}
                onBlur={() => handleFieldBlur('unit', unit)}
                placeholder="Ex: Matriz, Filial SP"
                className={errors.unit ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.unit && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.unit}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department" className={`flex items-center gap-2 ${errors.department ? 'text-destructive' : ''}`}>
                <Building2 className="h-4 w-4" />
                Departamento
              </Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => handleFieldChange('department', e.target.value, setDepartment)}
                onBlur={() => handleFieldBlur('department', department)}
                placeholder="Ex: TI, RH, Financeiro"
                className={errors.department ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.department && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.department}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle" className={`flex items-center gap-2 ${errors.jobTitle ? 'text-destructive' : ''}`}>
                <Briefcase className="h-4 w-4" />
                Cargo
              </Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => handleFieldChange('jobTitle', e.target.value, setJobTitle)}
                onBlur={() => handleFieldBlur('jobTitle', jobTitle)}
                placeholder="Ex: Analista, Gerente"
                className={errors.jobTitle ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.jobTitle && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.jobTitle}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className={`flex items-center gap-2 ${errors.phone ? 'text-destructive' : ''}`}>
              <Phone className="h-4 w-4" />
              Telefone
            </Label>
            <MaskedInput
              id="phone"
              mask="phone"
              value={phone}
              onChange={(formatted) => handlePhoneChange(formatted)}
              onBlur={() => handleFieldBlur('phone', phone)}
              className={errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.phone}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={isLoading || hasErrors} className="gap-2">
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar alterações
            </Button>

            <Button variant="outline" onClick={signOut} className="gap-2 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              Sair da conta
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Avatar Crop Modal */}
      {imageToCrop && (
        <AvatarCropModal
          open={cropModalOpen}
          onOpenChange={(open) => {
            setCropModalOpen(open);
            if (!open && imageToCrop) {
              URL.revokeObjectURL(imageToCrop);
              setImageToCrop(null);
            }
          }}
          imageSrc={imageToCrop}
          onCropComplete={handleCroppedImage}
        />
      )}
    </div>
  );
}
