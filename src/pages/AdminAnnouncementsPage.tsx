import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Pin, PinOff, Eye, EyeOff, Upload, Image, FileText, BarChart3, X, Users, Clock, CalendarClock, MessageCircle, AlertTriangle, Bell, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RichTextEditor, RichTextContent } from '@/components/ui/rich-text-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDbAnnouncements } from '@/hooks/useDbAnnouncements';
import { Announcement, TemplateType, PollType, PopupMode, ImagePosition } from '@/types/announcements';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { announcementSchema, validateForm, type AnnouncementFormData } from '@/lib/validations';
import { toast } from '@/hooks/use-toast';
import { LoadingIcon } from '@/components/layout/GlobalLoadingIndicator';

type FormData = {
  title: string;
  summary: string;
  content: string;
  pinned: boolean;
  active: boolean;
  templateType: TemplateType;
  imageUrl?: string;
  imagePosition: ImagePosition;
  pollType?: PollType;
  pollOptions: string[];
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  hasSchedule: boolean;
  hasEndDate: boolean;
  allowComments: boolean;
  isUrgent: boolean;
  isPopup: boolean;
  popupMode: PopupMode;
};

type FormErrors = Partial<Record<keyof AnnouncementFormData, string>>;

const initialFormData: FormData = {
  title: '',
  summary: '',
  content: '',
  pinned: false,
  active: true,
  templateType: 'simple',
  imageUrl: undefined,
  imagePosition: 'center',
  pollType: 'single',
  pollOptions: ['', ''],
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  hasSchedule: false,
  hasEndDate: false,
  allowComments: false,
  isUrgent: false,
  isPopup: false,
  popupMode: 'proximo_login',
};

const templateIcons = {
  simple: FileText,
  banner: Image,
  poll: BarChart3,
};

const templateLabels = {
  simple: 'Comunicado',
  banner: 'Banner',
  poll: 'Enquete',
};

export default function AdminAnnouncementsPage() {
  const { announcements, isLoading, addAnnouncement, updateAnnouncement, deleteAnnouncement, uploadImage } = useDbAnnouncements();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setFormErrors({});
    setActiveTab('edit');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    
    const startDateTime = announcement.startDate ? new Date(announcement.startDate) : null;
    const endDateTime = announcement.endDate ? new Date(announcement.endDate) : null;
    
    setFormData({
      title: announcement.title,
      summary: announcement.summary,
      content: announcement.content,
      pinned: announcement.pinned,
      active: announcement.active,
      templateType: announcement.templateType,
      imageUrl: announcement.imageUrl,
      imagePosition: announcement.imagePosition || 'center',
      pollType: announcement.pollType || 'single',
      pollOptions: announcement.pollOptions?.map((o) => o.optionText) || ['', ''],
      startDate: startDateTime ? startDateTime.toISOString().split('T')[0] : '',
      startTime: startDateTime ? startDateTime.toTimeString().slice(0, 5) : '',
      endDate: endDateTime ? endDateTime.toISOString().split('T')[0] : '',
      endTime: endDateTime ? endDateTime.toTimeString().slice(0, 5) : '',
      hasSchedule: !!announcement.startDate,
      hasEndDate: !!announcement.endDate,
      allowComments: announcement.allowComments ?? false,
      isUrgent: announcement.isUrgent ?? false,
      isPopup: announcement.isPopup ?? false,
      popupMode: announcement.popupMode || 'proximo_login',
    });
    setActiveTab('edit');
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const url = await uploadImage(file);
    if (url) {
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    }
    setIsUploading(false);
  };

  const handleAddPollOption = () => {
    setFormData((prev) => ({
      ...prev,
      pollOptions: [...prev.pollOptions, ''],
    }));
  };

  const handleRemovePollOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pollOptions: prev.pollOptions.filter((_, i) => i !== index),
    }));
  };

  const handlePollOptionChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      pollOptions: prev.pollOptions.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  const handleSubmit = async () => {
    // Validar com Zod
    const validation = validateForm(announcementSchema, {
      title: formData.title,
      summary: formData.summary,
      content: formData.content,
      pinned: formData.pinned,
      active: formData.active,
      templateType: formData.templateType,
      imageUrl: formData.imageUrl || undefined,
      pollType: formData.templateType === 'poll' ? formData.pollType : undefined,
      pollOptions: formData.templateType === 'poll' ? formData.pollOptions.filter(o => o.trim()) : undefined,
    });

    if (!validation.success) {
      const validationResult = validation as { success: false; errors: Record<string, string> };
      setFormErrors(validationResult.errors as FormErrors);
      const firstError = Object.values(validationResult.errors)[0];
      toast({
        title: 'Erro de validação',
        description: String(firstError),
        variant: 'destructive',
      });
      return;
    }

    setFormErrors({});

    // Montar datas de agendamento
    let startDate: string | undefined;
    let endDate: string | undefined;
    
    if (formData.hasSchedule && formData.startDate && formData.startTime) {
      startDate = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
    }
    
    if (formData.hasSchedule && formData.hasEndDate && formData.endDate && formData.endTime) {
      endDate = new Date(`${formData.endDate}T${formData.endTime}`).toISOString();
    }

    const announcementData = {
      title: formData.title,
      summary: formData.summary,
      content: formData.content,
      pinned: formData.pinned,
      active: formData.active,
      templateType: formData.templateType,
      imageUrl: formData.imageUrl,
      imagePosition: formData.imagePosition,
      pollType: formData.templateType === 'poll' ? formData.pollType : undefined,
      startDate,
      endDate,
      allowComments: formData.templateType === 'simple' ? formData.allowComments : false,
      isUrgent: formData.isUrgent,
      isPopup: formData.isPopup,
      popupMode: formData.popupMode,
    };

    const pollOptions = formData.templateType === 'poll'
      ? formData.pollOptions.filter((opt) => opt.trim())
      : undefined;

    if (editingId) {
      await updateAnnouncement(editingId, announcementData, pollOptions);
    } else {
      await addAnnouncement(announcementData, pollOptions);
    }

    setIsDialogOpen(false);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteAnnouncement(deletingId);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const togglePinned = async (announcement: Announcement) => {
    await updateAnnouncement(announcement.id, { pinned: !announcement.pinned });
  };

  const toggleActive = async (announcement: Announcement) => {
    await updateAnnouncement(announcement.id, { active: !announcement.active });
  };

  const TemplateIcon = templateIcons[formData.templateType];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Comunicados</h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie os comunicados do MC Hub
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Comunicado
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-center">Views</TableHead>
              <TableHead className="text-center">Comentários</TableHead>
              <TableHead className="text-center">Fixado</TableHead>
              <TableHead className="text-center">Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum comunicado cadastrado
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((announcement, index) => {
                const Icon = templateIcons[announcement.templateType];
                return (
                  <motion.tr
                    key={announcement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Icon className="h-3 w-3" />
                        {templateLabels[announcement.templateType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2 flex-wrap">
                        {announcement.isUrgent && (
                          <Badge className="text-xs bg-red-500 hover:bg-red-600 text-white">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Urgente
                          </Badge>
                        )}
                        {announcement.isPopup && (
                          <Badge variant="outline" className="text-xs text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-400">
                            <Bell className="h-3 w-3 mr-1" />
                            Popup
                          </Badge>
                        )}
                        {announcement.pinned && (
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="h-3 w-3 mr-1" />
                            Fixado
                          </Badge>
                        )}
                        {announcement.startDate && new Date(announcement.startDate) > new Date() && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400">
                            <CalendarClock className="h-3 w-3 mr-1" />
                            Agendado
                          </Badge>
                        )}
                        {announcement.endDate && new Date(announcement.endDate) < new Date() && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            Expirado
                          </Badge>
                        )}
                        <span className="line-clamp-1">{announcement.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(announcement.publishedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{announcement.viewsCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {announcement.allowComments ? (
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <MessageCircle className="h-3 w-3" />
                          <span>{announcement.commentsCount || 0}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePinned(announcement)}
                        className={announcement.pinned ? 'text-primary' : 'text-muted-foreground'}
                      >
                        {announcement.pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(announcement)}
                        className={announcement.active ? 'text-green-500' : 'text-muted-foreground'}
                      >
                        {announcement.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(announcement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(announcement.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Comunicado' : 'Novo Comunicado'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Editar</TabsTrigger>
              <TabsTrigger value="preview">Visualizar</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="mt-4">
              {/* Template Selection */}
              <div className="space-y-3">
                <Label>Tipo de Comunicado</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(['simple', 'banner', 'poll'] as TemplateType[]).map((type) => {
                    const Icon = templateIcons[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, templateType: type }))}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          formData.templateType === type
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Icon className={cn(
                          "h-6 w-6",
                          formData.templateType === type ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className="text-sm font-medium">{templateLabels[type]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título do comunicado"
                    maxLength={200}
                    className={formErrors.title ? 'border-destructive' : ''}
                  />
                  {formErrors.title && (
                    <p className="text-sm text-destructive">{formErrors.title}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary">Resumo</Label>
                  <Input
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="Breve resumo do comunicado"
                    maxLength={500}
                    className={formErrors.summary ? 'border-destructive' : ''}
                  />
                  {formErrors.summary && (
                    <p className="text-sm text-destructive">{formErrors.summary}</p>
                  )}
                </div>

                {formData.templateType !== 'poll' && (
                  <div className="space-y-2">
                    <Label>Conteúdo</Label>
                    <RichTextEditor
                      content={formData.content}
                      onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
                      placeholder="Digite o conteúdo completo do comunicado..."
                      className="min-h-[200px]"
                    />
                  </div>
                )}

                {/* Image Upload - Obrigatório para todos os tipos */}
                <div className="space-y-2">
                  <Label>Imagem *</Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.templateType === 'banner' && 'Tamanho ideal: 1920x600px (proporção 16:5)'}
                    {formData.templateType === 'simple' && 'Tamanho ideal: 800x450px (proporção 16:9)'}
                    {formData.templateType === 'poll' && 'Tamanho ideal: 600x400px (proporção 3:2)'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {formData.imageUrl ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-40 object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData((prev) => ({ ...prev, imageUrl: undefined }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-40 flex-col gap-2",
                        formErrors.imageUrl && "border-destructive"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <LoadingIcon size="md" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6" />
                          <span>Clique para enviar imagem</span>
                        </>
                      )}
                    </Button>
                  )}
                  {formErrors.imageUrl && (
                    <p className="text-sm text-destructive">{formErrors.imageUrl}</p>
                  )}
                </div>

                {/* Image Position - Only show for banners */}
                {formData.templateType === 'banner' && formData.imageUrl && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Move className="h-4 w-4 text-muted-foreground" />
                      <Label>Posicionamento Focal da Imagem</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Define qual parte da imagem ficará visível quando for recortada
                    </p>
                    
                    {/* Preview do posicionamento */}
                    <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
                      <div className="relative w-full h-0 pb-[33.33%]">
                        <img
                          src={formData.imageUrl}
                          alt="Preview posicionamento"
                          className={cn(
                            "absolute inset-0 w-full h-full object-cover transition-all duration-300",
                            formData.imagePosition === 'top' && 'object-top',
                            formData.imagePosition === 'bottom' && 'object-bottom',
                            formData.imagePosition === 'left' && 'object-left',
                            formData.imagePosition === 'right' && 'object-right',
                            formData.imagePosition === 'center' && 'object-center'
                          )}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-2 text-white text-xs font-medium px-2 py-1 bg-black/50 rounded">
                          Preview: {
                            formData.imagePosition === 'center' ? 'Centro' :
                            formData.imagePosition === 'top' ? 'Topo' :
                            formData.imagePosition === 'bottom' ? 'Base' :
                            formData.imagePosition === 'left' ? 'Esquerda' : 'Direita'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Botões de seleção */}
                    <div className="grid grid-cols-5 gap-2">
                      {([
                        { value: 'center', label: 'Centro' },
                        { value: 'top', label: 'Topo' },
                        { value: 'bottom', label: 'Base' },
                        { value: 'left', label: 'Esquerda' },
                        { value: 'right', label: 'Direita' },
                      ] as { value: ImagePosition; label: string }[]).map((pos) => (
                        <button
                          key={pos.value}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, imagePosition: pos.value }))}
                          className={cn(
                            "p-2 text-xs rounded-lg border transition-all",
                            formData.imagePosition === pos.value
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Poll Options */}
                {formData.templateType === 'poll' && (
                  <>
                    <div className="space-y-2">
                      <Label>Tipo de Votação</Label>
                      <Select
                        value={formData.pollType}
                        onValueChange={(value: PollType) =>
                          setFormData((prev) => ({ ...prev, pollType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Escolha única</SelectItem>
                          <SelectItem value="multiple">Múltipla escolha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Opções da Enquete</Label>
                      <div className="space-y-2">
                        {formData.pollOptions.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => handlePollOptionChange(index, e.target.value)}
                              placeholder={`Opção ${index + 1}`}
                            />
                            {formData.pollOptions.length > 2 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemovePollOption(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddPollOption}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar opção
                      </Button>
                    </div>
                  </>
                )}

                {/* Permitir comentários - apenas para comunicados simples */}
                {formData.templateType === 'simple' && (
                  <div className="flex items-center gap-2 p-4 border border-border rounded-lg">
                    <Switch
                      id="allowComments"
                      checked={formData.allowComments}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowComments: checked }))}
                    />
                    <Label htmlFor="allowComments" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Permitir comentários
                    </Label>
                  </div>
                )}

                {/* Comunicado Urgente / Popup */}
                <div className="space-y-3 p-4 border border-border rounded-lg bg-amber-500/5">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    Comunicado Urgente
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Comunicados urgentes aparecem com destaque especial e podem abrir como popup para todos os usuários.
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="isUrgent"
                        checked={formData.isUrgent}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isUrgent: checked }))}
                      />
                      <Label htmlFor="isUrgent" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Marcar como urgente
                      </Label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="isPopup"
                          checked={formData.isPopup}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPopup: checked }))}
                        />
                        <Label htmlFor="isPopup" className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Exibir como popup
                        </Label>
                      </div>
                      
                      {formData.isPopup && (
                        <div className="ml-6 space-y-2">
                          <Label className="text-sm text-muted-foreground">Quando exibir?</Label>
                          <Select
                            value={formData.popupMode}
                            onValueChange={(value: PopupMode) => setFormData(prev => ({ ...prev, popupMode: value }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="proximo_login">
                                <span className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  No próximo login do usuário
                                </span>
                              </SelectItem>
                              <SelectItem value="imediato">
                                <span className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Imediatamente para todos logados
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {formData.popupMode === 'imediato' 
                              ? 'O popup aparecerá instantaneamente para todos os usuários que estão logados.'
                              : 'O popup aparecerá quando o usuário fizer login. Se não marcar "não mostrar novamente", continuará aparecendo em cada login.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Agendamento */}
                <div className="space-y-4 p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="hasSchedule"
                      checked={formData.hasSchedule}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasSchedule: checked }))}
                    />
                    <Label htmlFor="hasSchedule" className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      Agendar publicação
                    </Label>
                  </div>
                  
                  {formData.hasSchedule && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Data início</Label>
                          <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Hora início</Label>
                          <Input
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          id="hasEndDate"
                          checked={formData.hasEndDate}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasEndDate: checked }))}
                        />
                        <Label htmlFor="hasEndDate">Definir data fim</Label>
                      </div>
                      
                      {formData.hasEndDate && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Data fim</Label>
                            <Input
                              type="date"
                              value={formData.endDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Hora fim</Label>
                            <Input
                              type="time"
                              value={formData.endTime}
                              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="pinned"
                      checked={formData.pinned}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pinned: checked }))}
                    />
                    <Label htmlFor="pinned">Fixar no topo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                    />
                    <Label htmlFor="active">Ativo</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div className="rounded-xl border bg-card p-6 space-y-4">
                {/* Preview Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="gap-1">
                    {(() => {
                      const Icon = templateIcons[formData.templateType];
                      return <Icon className="h-3 w-3" />;
                    })()}
                    {templateLabels[formData.templateType]}
                  </Badge>
                  {formData.pinned && (
                    <Badge variant="secondary" className="text-xs">
                      <Pin className="h-3 w-3 mr-1" />
                      Fixado
                    </Badge>
                  )}
                  {!formData.active && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Inativo
                    </Badge>
                  )}
                </div>

                {/* Banner Image */}
                {formData.templateType === 'banner' && formData.imageUrl && (
                  <div className="rounded-xl overflow-hidden">
                    <img
                      src={formData.imageUrl}
                      alt="Banner"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                {/* Title */}
                <h2 className="text-2xl font-bold">
                  {formData.title || 'Título do comunicado'}
                </h2>

                {/* Summary */}
                <p className="text-muted-foreground">
                  {formData.summary || 'Resumo do comunicado'}
                </p>

                {/* Content */}
                {formData.templateType !== 'poll' && formData.content && (
                  <div className="border-t pt-4">
                    <RichTextContent html={formData.content} />
                  </div>
                )}

                {/* Poll Preview */}
                {formData.templateType === 'poll' && (
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {formData.pollType === 'single' ? 'Escolha uma opção:' : 'Escolha uma ou mais opções:'}
                    </p>
                    <div className="space-y-2">
                      {formData.pollOptions.filter(o => o.trim()).map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className={cn(
                            "w-4 h-4 border-2 border-primary",
                            formData.pollType === 'single' ? 'rounded-full' : 'rounded'
                          )} />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.pollOptions.filter(o => o.trim()).length === 0 && formData.templateType === 'poll' && (
                  <p className="text-sm text-muted-foreground italic">
                    Adicione opções para a enquete
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comunicado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O comunicado será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
