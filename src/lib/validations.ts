import { z } from 'zod';

/**
 * Schemas de validação para formulários de administração
 * Utiliza Zod para validação robusta client-side
 */

// ============================================
// COMUNICADOS (tab_comunicado)
// ============================================

export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Título é obrigatório' })
    .max(200, { message: 'Título deve ter no máximo 200 caracteres' }),
  summary: z
    .string()
    .trim()
    .min(1, { message: 'Resumo é obrigatório' })
    .max(500, { message: 'Resumo deve ter no máximo 500 caracteres' }),
  content: z
    .string()
    .trim()
    .max(10000, { message: 'Conteúdo deve ter no máximo 10.000 caracteres' }),
  pinned: z.boolean().default(false),
  active: z.boolean().default(true),
  templateType: z.enum(['simple', 'banner', 'poll'], {
    errorMap: () => ({ message: 'Tipo de template inválido' }),
  }),
  imageUrl: z
    .string()
    .url({ message: 'URL da imagem inválida' })
    .optional()
    .or(z.literal('')),
  pollType: z.enum(['single', 'multiple']).optional(),
  pollOptions: z
    .array(z.string().trim().max(200, { message: 'Opção deve ter no máximo 200 caracteres' }))
    .optional(),
});

export type AnnouncementFormData = z.infer<typeof announcementSchema>;

// ============================================
// FAQs (tab_faq)
// ============================================

export const faqSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, { message: 'Pergunta é obrigatória' })
    .max(500, { message: 'Pergunta deve ter no máximo 500 caracteres' }),
  answer: z
    .string()
    .trim()
    .min(1, { message: 'Resposta é obrigatória' })
    .max(5000, { message: 'Resposta deve ter no máximo 5.000 caracteres' }),
  order: z
    .number()
    .int({ message: 'Ordem deve ser um número inteiro' })
    .min(0, { message: 'Ordem deve ser maior ou igual a 0' })
    .default(0),
  active: z.boolean().default(true),
});

export type FaqFormData = z.infer<typeof faqSchema>;

// ============================================
// ITENS DE MENU (tab_menu_item)
// ============================================

export const menuItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Nome é obrigatório' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres' }),
  path: z
    .string()
    .trim()
    .min(1, { message: 'Caminho é obrigatório' })
    .max(255, { message: 'Caminho deve ter no máximo 255 caracteres' })
    .refine(
      (val) => val.startsWith('/') || val.startsWith('http'),
      { message: 'Caminho deve começar com / ou http' }
    ),
  icon: z
    .string()
    .trim()
    .max(50, { message: 'Ícone deve ter no máximo 50 caracteres' })
    .default('Circle'),
  order: z
    .number()
    .int({ message: 'Ordem deve ser um número inteiro' })
    .min(0, { message: 'Ordem deve ser maior ou igual a 0' })
    .default(0),
  parentId: z.string().uuid().nullable().optional(),
  adminOnly: z.boolean().default(false),
  openInNewTab: z.boolean().default(false),
  active: z.boolean().default(true),
});

export type MenuItemFormData = z.infer<typeof menuItemSchema>;

// ============================================
// SISTEMAS (tab_sistema)
// ============================================

export const systemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Nome é obrigatório' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres' }),
  status: z.enum(['operational', 'degraded', 'partial_outage', 'major_outage'], {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
  order: z
    .number()
    .int({ message: 'Ordem deve ser um número inteiro' })
    .min(0, { message: 'Ordem deve ser maior ou igual a 0' })
    .default(0),
  active: z.boolean().default(true),
});

export type SystemFormData = z.infer<typeof systemSchema>;

// ============================================
// SALAS DE REUNIÃO (tab_sala_reuniao)
// ============================================

export const meetingRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Nome é obrigatório' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres' }),
  capacity: z
    .number()
    .int({ message: 'Capacidade deve ser um número inteiro' })
    .min(1, { message: 'Capacidade deve ser no mínimo 1' })
    .max(1000, { message: 'Capacidade deve ser no máximo 1000' }),
  allowedRoles: z
    .array(z.string().max(50))
    .default(['all']),
  order: z
    .number()
    .int({ message: 'Ordem deve ser um número inteiro' })
    .min(0, { message: 'Ordem deve ser maior ou igual a 0' })
    .default(0),
  active: z.boolean().default(true),
});

export type MeetingRoomFormData = z.infer<typeof meetingRoomSchema>;

// ============================================
// TIPOS DE REUNIÃO (tab_tipo_reuniao)
// ============================================

export const meetingTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Nome é obrigatório' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres' }),
  order: z
    .number()
    .int({ message: 'Ordem deve ser um número inteiro' })
    .min(0, { message: 'Ordem deve ser maior ou igual a 0' })
    .default(0),
  active: z.boolean().default(true),
});

export type MeetingTypeFormData = z.infer<typeof meetingTypeSchema>;

// ============================================
// RESERVAS (tab_reserva_sala)
// ============================================

export const reservationSchema = z.object({
  roomId: z
    .string()
    .uuid({ message: 'Sala inválida' }),
  meetingTypeId: z
    .string()
    .uuid({ message: 'Tipo de reunião inválido' })
    .optional()
    .nullable(),
  requesterName: z
    .string()
    .trim()
    .min(1, { message: 'Nome do solicitante é obrigatório' })
    .max(200, { message: 'Nome deve ter no máximo 200 caracteres' }),
  notes: z
    .string()
    .trim()
    .max(1000, { message: 'Observações devem ter no máximo 1000 caracteres' })
    .optional(),
  participants: z
    .number()
    .int({ message: 'Participantes deve ser um número inteiro' })
    .min(1, { message: 'Mínimo de 1 participante' })
    .max(1000, { message: 'Máximo de 1000 participantes' })
    .default(1),
  date: z.date({ required_error: 'Data é obrigatória' }),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Horário de início inválido (HH:MM)' }),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Horário de término inválido (HH:MM)' }),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: 'Horário de término deve ser após o horário de início', path: ['endTime'] }
);

export type ReservationFormData = z.infer<typeof reservationSchema>;

// ============================================
// PERFIL DE USUÁRIO (tab_perfil_usuario)
// ============================================

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { message: 'Nome é obrigatório' })
    .max(200, { message: 'Nome deve ter no máximo 200 caracteres' }),
  email: z
    .string()
    .trim()
    .email({ message: 'Email inválido' })
    .max(255, { message: 'Email deve ter no máximo 255 caracteres' })
    .optional(),
  phone: z
    .string()
    .trim()
    .max(20, { message: 'Telefone deve ter no máximo 20 caracteres' })
    .regex(/^[\d\s\-\(\)\+]*$/, { message: 'Formato de telefone inválido' })
    .optional()
    .or(z.literal('')),
  unit: z
    .string()
    .trim()
    .max(100, { message: 'Unidade deve ter no máximo 100 caracteres' })
    .optional(),
  department: z
    .string()
    .trim()
    .max(100, { message: 'Departamento deve ter no máximo 100 caracteres' })
    .optional(),
  position: z
    .string()
    .trim()
    .max(100, { message: 'Cargo deve ter no máximo 100 caracteres' })
    .optional(),
  birthday: z.date().optional().nullable(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// ============================================
// EVENTOS DO CALENDÁRIO (tab_evento_calendario)
// ============================================

export const calendarEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Título é obrigatório' })
    .max(200, { message: 'Título deve ter no máximo 200 caracteres' }),
  description: z
    .string()
    .trim()
    .max(2000, { message: 'Descrição deve ter no máximo 2000 caracteres' })
    .optional(),
  eventDate: z.date({ required_error: 'Data do evento é obrigatória' }),
  eventType: z
    .string()
    .trim()
    .max(50, { message: 'Tipo deve ter no máximo 50 caracteres' })
    .default('general'),
});

export type CalendarEventFormData = z.infer<typeof calendarEventSchema>;

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Valida dados do formulário e retorna erros formatados
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = error.message;
    }
  });

  return { success: false, errors };
}

/**
 * Sanitiza string removendo caracteres perigosos para SQL/HTML
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < e >
    .trim();
}

/**
 * Valida e sanitiza URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Aceita apenas http e https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
