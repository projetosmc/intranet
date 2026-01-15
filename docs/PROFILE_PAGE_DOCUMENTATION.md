# Documentação da Tela "Meu Perfil"

Este documento detalha a implementação completa da funcionalidade de perfil do usuário, incluindo a página de edição, modal de preenchimento obrigatório e componentes auxiliares.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Arquivos](#estrutura-de-arquivos)
3. [Banco de Dados](#banco-de-dados)
4. [ProfilePage.tsx](#profilepagetsx)
5. [ProfileCompletionModal.tsx](#profilecompletionmodaltsx)
6. [AvatarCropModal.tsx](#avatarcropmodaltsx)
7. [MaskedInput.tsx](#maskedinputtsx)
8. [Hooks Relacionados](#hooks-relacionados)
9. [Fluxo de Upload de Avatar](#fluxo-de-upload-de-avatar)
10. [Validações](#validações)
11. [Dependências](#dependências)

---

## Visão Geral

O sistema de perfil permite que usuários:
- Visualizem e editem suas informações pessoais
- Façam upload e recortem fotos de perfil
- Completem informações obrigatórias no primeiro acesso

### Características Principais
- Validação em tempo real com Zod
- Upload de avatar com crop circular
- Máscara de input para telefone
- Sincronização com Supabase Auth
- Design responsivo com Framer Motion

---

## Estrutura de Arquivos

```
src/
├── pages/
│   └── ProfilePage.tsx              # Página principal de perfil
├── components/
│   ├── profile/
│   │   ├── ProfileCompletionModal.tsx  # Modal de preenchimento obrigatório
│   │   └── AvatarCropModal.tsx         # Modal de recorte de avatar
│   └── ui/
│       └── masked-input.tsx          # Input com máscara
├── hooks/
│   ├── useProfileCompletion.ts       # Hook para verificar completude do perfil
│   └── useUserProfile.ts             # Hook para dados do perfil
└── contexts/
    └── UserContext.tsx               # Context com dados do usuário logado
```

---

## Banco de Dados

### Tabela: `tab_perfil_usuario`

```sql
CREATE TABLE public.tab_perfil_usuario (
  cod_usuario UUID PRIMARY KEY,           -- ID do usuário (auth.users)
  des_nome_completo TEXT,                  -- Nome completo
  des_email TEXT,                          -- Email do usuário
  des_telefone TEXT,                       -- Telefone formatado
  des_avatar_url TEXT,                     -- URL da foto de perfil
  des_unidade TEXT,                        -- Unidade/Filial
  des_departamento TEXT,                   -- Departamento
  des_cargo TEXT,                          -- Cargo
  dta_aniversario DATE,                    -- Data de aniversário
  des_ad_object_id TEXT,                   -- ID do Active Directory (LDAP)
  dta_sincronizacao_ad TIMESTAMPTZ,        -- Última sincronização AD
  ind_ativo BOOLEAN DEFAULT true,          -- Status ativo
  dta_cadastro TIMESTAMPTZ DEFAULT now(),  -- Data de criação
  dta_atualizacao TIMESTAMPTZ DEFAULT now() -- Data de atualização
);

-- RLS Policies
ALTER TABLE public.tab_perfil_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.tab_perfil_usuario FOR SELECT
  USING (auth.uid() = cod_usuario);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.tab_perfil_usuario FOR UPDATE
  USING (auth.uid() = cod_usuario);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.tab_perfil_usuario FOR INSERT
  WITH CHECK (auth.uid() = cod_usuario);
```

---

## ProfilePage.tsx

### Localização
`src/pages/ProfilePage.tsx`

### Descrição
Página principal para visualização e edição do perfil do usuário autenticado.

### Campos do Formulário

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| Nome Completo | `text` | Sim | 1-100 caracteres |
| Email | `text` | - | Apenas leitura |
| Telefone | `masked` | Não | Formato (XX) XXXXX-XXXX |
| Data de Aniversário | `date` | Não | - |
| Unidade | `text` | Não | Máx 50 caracteres |
| Departamento | `text` | Não | Máx 50 caracteres |
| Cargo | `text` | Não | Máx 50 caracteres |

### Schema de Validação (Zod)

```typescript
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
```

### Estados do Componente

```typescript
// Dados do formulário
const [fullName, setFullName] = useState('');
const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
const [birthdayDate, setBirthdayDate] = useState('');
const [unit, setUnit] = useState('');
const [department, setDepartment] = useState('');
const [jobTitle, setJobTitle] = useState('');
const [phone, setPhone] = useState('');

// Estados de controle
const [isLoading, setIsLoading] = useState(false);
const [isUploading, setIsUploading] = useState(false);
const [errors, setErrors] = useState<FieldErrors>({});
const [touched, setTouched] = useState<Set<string>>(new Set());

// Modal de crop
const [cropModalOpen, setCropModalOpen] = useState(false);
const [imageToCrop, setImageToCrop] = useState<string | null>(null);
```

### Hooks Utilizados

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
```

### Funções Principais

#### `validateField(field, value)`
Valida um campo específico usando o schema Zod.

#### `handleFieldChange(field, value, setter)`
Atualiza o valor do campo e valida se já foi tocado.

#### `handleFieldBlur(field, value)`
Marca o campo como tocado e executa validação.

#### `handleAvatarSelect(event)`
Processa a seleção de imagem para avatar.

#### `handleCroppedImage(blob)`
Faz upload da imagem recortada para o Storage.

#### `handleSave()`
Salva todas as alterações do perfil.

### Layout e Estrutura

```tsx
<div className="max-w-2xl mx-auto space-y-6">
  <Breadcrumbs />
  
  <motion.div> {/* Título */}
    <h1>Meu Perfil</h1>
    <p>Gerencie suas informações pessoais</p>
  </motion.div>

  <motion.div className="bg-card border rounded-xl p-8 shadow-md">
    {/* Avatar Section */}
    <div className="flex flex-col items-center mb-8">
      <Avatar /> {/* Com botão de câmera */}
      <Badge /> {/* Role badges */}
    </div>

    {/* Form Fields */}
    <div className="space-y-6">
      {/* Nome Completo */}
      {/* Email (readonly) */}
      {/* Grid: Aniversário | Unidade */}
      {/* Grid: Departamento | Cargo */}
      {/* Telefone */}
      {/* Botões: Salvar | Sair */}
    </div>
  </motion.div>

  {/* Avatar Crop Modal */}
  <AvatarCropModal />
</div>
```

### Animações (Framer Motion)

```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
>
```

---

## ProfileCompletionModal.tsx

### Localização
`src/components/profile/ProfileCompletionModal.tsx`

### Descrição
Modal bloqueante exibido no primeiro login para coletar informações obrigatórias do usuário.

### Campos Obrigatórios

| Campo | Validação |
|-------|-----------|
| Nome Completo | Mín 3 caracteres, máx 100 |
| Email | Email válido, máx 255 |
| Telefone | Formato (XX) XXXXX-XXXX |

### Schema de Validação

```typescript
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
    .regex(/^\([1-9]{2}\) [0-9]{5}-[0-9]{4}$/, 'Telefone inválido'),
});
```

### Props

```typescript
interface ProfileCompletionModalProps {
  onComplete: () => void; // Callback após salvar com sucesso
}
```

### Estrutura Visual

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
  <motion.div className="w-full max-w-md mx-4">
    <div className="bg-card border rounded-2xl shadow-2xl">
      
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
        <User icon />
        <h2>Complete seu Perfil</h2>
        <p>Por favor, preencha suas informações para continuar</p>
      </div>

      {/* Form */}
      <div className="p-6 space-y-6">
        {/* Alerta de obrigatoriedade */}
        <div className="bg-amber-500/10 border-amber-500/20">
          <AlertCircle />
          Essas informações são obrigatórias...
        </div>

        {/* Campos: Nome, Email, Telefone */}
        
        {/* Status de validação */}
        {isFormValid ? <CheckCircle2 /> : <AlertCircle />}

        {/* Botão Salvar */}
        <Button disabled={!isFormValid}>
          Salvar e Continuar
        </Button>
      </div>
      
    </div>
  </motion.div>
</div>
```

### Animação de Entrada

```typescript
<motion.div
  initial={{ opacity: 0, scale: 0.95, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
>
```

---

## AvatarCropModal.tsx

### Localização
`src/components/profile/AvatarCropModal.tsx`

### Descrição
Modal para recortar e ajustar a foto de perfil antes do upload.

### Props

```typescript
interface AvatarCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
}
```

### Funcionalidades

- **Crop circular** com aspect ratio 1:1
- **Zoom** de 1x a 3x via slider
- **Rotação** em incrementos de 90°
- **Output** de 256x256 pixels em JPEG 90%

### Estados

```typescript
const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
const [rotation, setRotation] = useState(0);
const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
const [isProcessing, setIsProcessing] = useState(false);
```

### Função de Recorte

```typescript
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  
  // Calcular bounding box rotacionado
  // Aplicar transformações
  // Recortar para 256x256
  
  return new Promise((resolve) => {
    croppedCanvas.toBlob(
      (blob) => resolve(blob),
      'image/jpeg',
      0.9
    );
  });
}
```

### Estrutura Visual

```tsx
<Dialog>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Ajustar Foto</DialogTitle>
      <DialogDescription>
        Ajuste o zoom e a posição...
      </DialogDescription>
    </DialogHeader>

    {/* Área de Crop */}
    <div className="relative w-full aspect-square">
      <Cropper
        image={imageSrc}
        crop={crop}
        zoom={zoom}
        rotation={rotation}
        aspect={1}
        cropShape="round"
        showGrid={false}
      />
    </div>

    {/* Controles */}
    <div className="space-y-4">
      {/* Slider de Zoom */}
      <div className="flex items-center gap-3">
        <ZoomOut />
        <Slider min={1} max={3} step={0.1} />
        <ZoomIn />
      </div>

      {/* Botão de Rotação */}
      <Button variant="outline">
        <RotateCw /> Girar 90°
      </Button>
    </div>

    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## MaskedInput.tsx

### Localização
`src/components/ui/masked-input.tsx`

### Descrição
Componente de input com máscaras pré-definidas para formatação automática.

### Tipos de Máscara Disponíveis

```typescript
type MaskType = "phone" | "cpf" | "cnpj" | "cep" | "date" | "time" | "currency";
```

### Configuração das Máscaras

| Tipo | Formato | MaxLength | Placeholder |
|------|---------|-----------|-------------|
| phone | (XX) XXXXX-XXXX | 15 | (11) 99999-9999 |
| cpf | XXX.XXX.XXX-XX | 14 | 000.000.000-00 |
| cnpj | XX.XXX.XXX/XXXX-XX | 18 | 00.000.000/0000-00 |
| cep | XXXXX-XXX | 9 | 00000-000 |
| date | DD/MM/AAAA | 10 | DD/MM/AAAA |
| time | HH:MM | 5 | HH:MM |
| currency | R$ X.XXX,XX | 20 | R$ 0,00 |

### Props

```typescript
interface MaskedInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  mask?: MaskType;
  customMask?: (value: string) => string;
  onChange?: (value: string, rawValue: string) => void;
}
```

### Uso

```tsx
// Com máscara pré-definida
<MaskedInput
  mask="phone"
  value={phone}
  onChange={(formatted, raw) => setPhone(formatted)}
/>

// Com máscara customizada
<MaskedInput
  customMask={(value) => value.toUpperCase()}
  value={code}
  onChange={(formatted) => setCode(formatted)}
/>
```

### Implementação da Máscara de Telefone

```typescript
phone: {
  format: (value: string): string => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) {
      return numbers.length > 0 ? `(${numbers}` : "";
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
  },
  maxLength: 15,
  placeholder: "(11) 99999-9999",
}
```

---

## Hooks Relacionados

### useProfileCompletion

```typescript
// src/hooks/useProfileCompletion.ts

interface ProfileCompletionStatus {
  isComplete: boolean;
  isLoading: boolean;
  missingFields: string[];
}

const REQUIRED_FIELDS = ['des_nome_completo', 'des_telefone', 'des_email'];

export function useProfileCompletion(): ProfileCompletionStatus {
  // Verifica se o perfil está completo
  // Retorna quais campos estão faltando
  // Escuta mudanças em tempo real via realtime subscription
}
```

### useUserProfile

```typescript
// src/hooks/useUserProfile.ts

interface UserProfile {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  email: string | null;
  department: string | null;
  position: string | null;
  phone: string | null;
  unit: string | null;
  birthday: string | null;
}

export function useUserProfile() {
  return {
    profile: UserProfile | null,
    isLoading: boolean,
    getInitials: () => string,
  };
}
```

### Uso no App (Verificação de Perfil Completo)

```tsx
// Em algum componente de layout ou App.tsx
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { ProfileCompletionModal } from '@/components/profile/ProfileCompletionModal';

function AppLayout() {
  const { isComplete, isLoading } = useProfileCompletion();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isComplete) {
      setShowModal(true);
    }
  }, [isComplete, isLoading]);

  return (
    <>
      {showModal && (
        <ProfileCompletionModal onComplete={() => setShowModal(false)} />
      )}
      {/* resto do layout */}
    </>
  );
}
```

---

## Fluxo de Upload de Avatar

```
┌─────────────────────┐
│ Usuário clica no    │
│ botão de câmera     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Input file hidden   │
│ é acionado          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ handleAvatarSelect  │
│ - Valida tipo       │
│ - Cria URL.createObjectURL
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ AvatarCropModal     │
│ - Zoom, Pan, Rotate │
│ - Crop circular     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ handleCroppedImage  │
│ - Recebe Blob       │
│ - Upload Storage    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Supabase Storage    │
│ bucket: announcements│
│ path: avatars/{id}  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Atualiza DB         │
│ des_avatar_url      │
│ com timestamp       │
└─────────────────────┘
```

### Código de Upload

```typescript
const handleCroppedImage = async (croppedBlob: Blob) => {
  if (!user) return;

  setIsUploading(true);
  try {
    const fileName = `${user.id}.jpg`;
    const filePath = `avatars/${fileName}`;

    // Upload para Storage
    const { error: uploadError } = await supabase.storage
      .from('announcements')
      .upload(filePath, croppedBlob, { 
        upsert: true,
        contentType: 'image/jpeg'
      });

    if (uploadError) throw uploadError;

    // Obter URL pública
    const { data } = supabase.storage
      .from('announcements')
      .getPublicUrl(filePath);

    // Adicionar timestamp para cache busting
    const newAvatarUrl = `${data.publicUrl}?t=${Date.now()}`;

    // Atualizar perfil no banco
    await supabase
      .from('tab_perfil_usuario')
      .upsert({
        cod_usuario: user.id,
        des_avatar_url: newAvatarUrl,
        des_email: user.email,
      });

    setAvatarUrl(newAvatarUrl);
  } catch (error) {
    console.error('Error uploading avatar:', error);
  } finally {
    setIsUploading(false);
  }
};
```

---

## Validações

### Validação em Tempo Real

```typescript
// Valida campo individualmente
const validateField = (field: string, value: string) => {
  const data = { ...currentValues, [field]: value };
  const result = profileSchema.safeParse(data);
  
  if (!result.success) {
    const fieldError = result.error.errors.find(e => e.path[0] === field);
    setErrors(prev => ({ ...prev, [field]: fieldError?.message }));
  } else {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }
};

// Só valida após primeiro blur
const handleFieldBlur = (field: string, value: string) => {
  setTouched(prev => new Set(prev).add(field));
  validateField(field, value);
};
```

### Feedback Visual de Erro

```tsx
{/* Label com destaque de erro */}
<Label className={errors.fullName ? 'text-destructive' : ''}>
  <User className="h-4 w-4" />
  Nome completo
</Label>

{/* Input com borda de erro */}
<Input
  className={errors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''}
/>

{/* Mensagem de erro */}
{errors.fullName && (
  <p className="text-xs text-destructive flex items-center gap-1">
    <AlertCircle className="h-3 w-3" />
    {errors.fullName}
  </p>
)}
```

---

## Dependências

### Pacotes Necessários

```json
{
  "dependencies": {
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-slider": "^1.3.5",
    "framer-motion": "^11.18.2",
    "lucide-react": "^0.462.0",
    "react-easy-crop": "^5.5.6",
    "zod": "^3.25.76"
  }
}
```

### Ícones Utilizados (Lucide)

```typescript
import { 
  User,           // Campo nome
  Camera,         // Botão de foto
  Mail,           // Campo email
  Save,           // Botão salvar
  Shield,         // Badge admin/mod
  LogOut,         // Botão sair
  Cake,           // Campo aniversário
  Building2,      // Campo unidade/departamento
  Briefcase,      // Campo cargo
  Phone,          // Campo telefone
  AlertCircle,    // Erros de validação
  CheckCircle2,   // Validação OK
  ZoomIn,         // Controle zoom
  ZoomOut,        // Controle zoom
  RotateCw,       // Controle rotação
  Check,          // Confirmar crop
  X               // Cancelar crop
} from 'lucide-react';
```

---

## Estilos e Classes Tailwind

### Card Principal

```tsx
<div className="bg-card border border-border rounded-xl p-8 shadow-md">
```

### Avatar

```tsx
<Avatar className="h-32 w-32 border-4 border-primary/20">
  <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
```

### Badges de Role

```tsx
// Admin
<Badge className="gap-1">
  <Shield className="h-3 w-3" />
  Administrador
</Badge>

// Moderador
<Badge variant="secondary" className="gap-1">

// Usuário comum
<Badge variant="outline">
```

### Campo com Erro

```tsx
<Input className="border-destructive focus-visible:ring-destructive" />
<p className="text-xs text-destructive flex items-center gap-1">
```

### Grid Responsivo

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

---

## Integração com Supabase Auth

### Atualização de Metadata

```typescript
// Ao salvar o perfil, também atualiza metadata do auth
await supabase.auth.updateUser({
  data: { full_name: fullName.trim() },
});
```

### Sincronização de Nome

```typescript
// UserContext.tsx prioriza nome do perfil sobre metadata
const user = authUser ? {
  id: authUser.id,
  name: profileName || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
  email: authUser.email || '',
  avatar: authUser.user_metadata?.avatar_url,
} : null;
```

---

## Checklist de Implementação

- [ ] Criar tabela `tab_perfil_usuario` com RLS
- [ ] Configurar Storage bucket para avatars
- [ ] Implementar `ProfilePage.tsx`
- [ ] Implementar `ProfileCompletionModal.tsx`
- [ ] Implementar `AvatarCropModal.tsx`
- [ ] Implementar `MaskedInput.tsx`
- [ ] Implementar `useProfileCompletion.ts`
- [ ] Implementar `useUserProfile.ts`
- [ ] Integrar modal no layout principal
- [ ] Adicionar rota `/perfil` ou `/profile`
- [ ] Testar upload de avatar
- [ ] Testar validações
- [ ] Testar fluxo de primeiro login
