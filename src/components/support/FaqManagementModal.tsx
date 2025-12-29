import { useState, useRef, useMemo, useEffect } from 'react';
import { HelpCircle, Plus, Pencil, Trash2, GripVertical, Tag, X, Upload, Image, Video, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RichTextEditor, RichTextContent } from '@/components/ui/rich-text-editor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { faqSchema, validateForm } from '@/lib/validations';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FAQ {
  cod_faq: string;
  des_pergunta: string;
  des_resposta: string;
  num_ordem: number;
  ind_ativo: boolean;
  des_tags: string[];
  des_imagem_url: string | null;
  des_video_url: string | null;
  des_legenda_imagem: string | null;
  des_legenda_video: string | null;
}

interface FaqManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFaqsChange?: () => void;
}

export function FaqManagementModal({ open, onOpenChange, onFaqsChange }: FaqManagementModalProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [deleteFaqId, setDeleteFaqId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [answerHtml, setAnswerHtml] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const popularTags = useMemo(() => {
    const tagCount: Record<string, number> = {};
    faqs.forEach(faq => {
      (faq.des_tags || []).forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [faqs]);

  const filteredSuggestions = useMemo(() => {
    if (!newTag.trim()) return popularTags.filter(tag => !editingTags.includes(tag));
    const search = newTag.toLowerCase().trim();
    return popularTags
      .filter(tag => tag.includes(search) && !editingTags.includes(tag))
      .slice(0, 5);
  }, [newTag, popularTags, editingTags]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (open) {
      fetchFaqs();
    }
  }, [open]);

  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tab_faq')
        .select('*')
        .order('num_ordem');

      if (error) throw error;
      setFaqs((data || []) as FAQ[]);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast({ title: 'Erro ao carregar FAQs', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem válida.', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'A imagem deve ter no máximo 5MB.', variant: 'destructive' });
      return;
    }

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('faqs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('faqs')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast({ title: 'Imagem enviada!' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Erro ao enviar imagem', variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione um vídeo válido.', variant: 'destructive' });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'O vídeo deve ter no máximo 50MB.', variant: 'destructive' });
      return;
    }

    setIsUploadingVideo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('faqs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('faqs')
        .getPublicUrl(filePath);

      setVideoUrl(publicUrl);
      toast({ title: 'Vídeo enviado!' });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({ title: 'Erro ao enviar vídeo', variant: 'destructive' });
    } finally {
      setIsUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const resetEditForm = () => {
    setEditingFaq(null);
    setFormErrors({});
    setAnswerHtml('');
    setEditingTags([]);
    setNewTag('');
    setImageUrl(null);
    setVideoUrl(null);
    setImageCaption('');
    setVideoCaption('');
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const rawData = {
      question: formData.get('question') as string,
      answer: answerHtml,
      order: parseInt(formData.get('sort_order') as string) || 0,
      active: true,
    };

    const validation = validateForm(faqSchema, rawData);
    
    if ('errors' in validation) {
      setFormErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      toast({ title: 'Erro de validação', description: firstError, variant: 'destructive' });
      return;
    }

    setFormErrors({});
    const validData = validation.data;

    const faq = {
      des_pergunta: validData.question,
      des_resposta: validData.answer,
      num_ordem: validData.order,
      ind_ativo: validData.active,
      des_tags: editingTags,
      des_imagem_url: imageUrl,
      des_video_url: videoUrl,
      des_legenda_imagem: imageCaption || null,
      des_legenda_video: videoCaption || null,
    };

    try {
      if (editingFaq) {
        const { error } = await supabase
          .from('tab_faq')
          .update(faq)
          .eq('cod_faq', editingFaq.cod_faq);
        if (error) throw error;
        toast({ title: 'FAQ atualizado!' });
      } else {
        const { error } = await supabase
          .from('tab_faq')
          .insert(faq);
        if (error) throw error;
        toast({ title: 'FAQ criado!' });
      }

      setIsEditDialogOpen(false);
      resetEditForm();
      await fetchFaqs();
      onFaqsChange?.();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast({ title: 'Erro ao salvar FAQ', variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteFaqId) return;
    try {
      const { error } = await supabase
        .from('tab_faq')
        .delete()
        .eq('cod_faq', deleteFaqId);

      if (error) throw error;
      toast({ title: 'FAQ removido!' });
      await fetchFaqs();
      onFaqsChange?.();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({ title: 'Erro ao remover FAQ', variant: 'destructive' });
    } finally {
      setDeleteFaqId(null);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('tab_faq')
        .update({ ind_ativo: !active })
        .eq('cod_faq', id);

      if (error) throw error;
      await fetchFaqs();
      onFaqsChange?.();
    } catch (error) {
      console.error('Error toggling FAQ:', error);
      toast({ title: 'Erro ao atualizar FAQ', variant: 'destructive' });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = faqs.findIndex((f) => f.cod_faq === active.id);
    const newIndex = faqs.findIndex((f) => f.cod_faq === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(faqs, oldIndex, newIndex);
      
      try {
        const updates = newOrder.map((item, index) => 
          supabase
            .from('tab_faq')
            .update({ num_ordem: index })
            .eq('cod_faq', item.cod_faq)
        );
        
        await Promise.all(updates);
        await fetchFaqs();
        onFaqsChange?.();
        toast({ title: 'Ordem atualizada!' });
      } catch (error) {
        console.error('Error reordering:', error);
        toast({ title: 'Erro ao reordenar', variant: 'destructive' });
      }
    }
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const openEditDialog = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setAnswerHtml(faq.des_resposta);
      setEditingTags(faq.des_tags || []);
      setImageUrl(faq.des_imagem_url);
      setVideoUrl(faq.des_video_url);
      setImageCaption(faq.des_legenda_imagem || '');
      setVideoCaption(faq.des_legenda_video || '');
    } else {
      resetEditForm();
    }
    setIsEditDialogOpen(true);
  };

  const SortableFaq = ({ faq }: { faq: FAQ }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: faq.cod_faq });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    };

    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={false}
        animate={{
          scale: isDragging ? 1.02 : 1,
          boxShadow: isDragging ? '0 10px 40px rgba(0,0,0,0.15)' : 'none',
          opacity: isDragging ? 0.9 : 1,
        }}
        transition={{ duration: 0.2 }}
        className={`flex items-start gap-3 p-3 ${isDragging ? 'z-50 bg-card rounded-lg relative' : 'hover:bg-muted/30'}`}
      >
        <motion.div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing mt-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <GripVertical className={`h-4 w-4 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate text-sm">{faq.des_pergunta}</p>
            {faq.des_tags && faq.des_tags.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {faq.des_tags.length}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {faq.des_imagem_url && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 text-blue-600 text-xs rounded">
                <Image className="h-3 w-3" />
              </span>
            )}
            {faq.des_video_url && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/10 text-purple-600 text-xs rounded">
                <Video className="h-3 w-3" />
              </span>
            )}
            <span className={`text-xs ${faq.ind_ativo ? 'text-green-600' : 'text-muted-foreground'}`}>
              {faq.ind_ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Switch
            checked={faq.ind_ativo}
            onCheckedChange={() => handleToggleActive(faq.cod_faq, faq.ind_ativo)}
            className="scale-75"
          />
          <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(faq)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteFaqId(faq.cod_faq)}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const DragOverlayItem = ({ faq }: { faq: FAQ }) => (
    <div className="flex items-center gap-3 p-3 bg-card rounded-lg shadow-2xl border-2 border-primary">
      <GripVertical className="h-4 w-4 text-primary" />
      <span className="font-semibold truncate text-sm">{faq.des_pergunta}</span>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Gerenciar FAQs
            </DialogTitle>
            <DialogDescription>
              Adicione, edite, reordene ou remova as perguntas frequentes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">
              {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''} cadastrada{faqs.length !== 1 ? 's' : ''}
            </span>
            <Button size="sm" onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              Nova FAQ
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : faqs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma FAQ cadastrada ainda.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={faqs.map(f => f.cod_faq)} strategy={verticalListSortingStrategy}>
                  <div className="divide-y divide-border">
                    {faqs.map((faq) => (
                      <SortableFaq key={faq.cod_faq} faq={faq} />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeId && faqs.find(f => f.cod_faq === activeId) && (
                    <DragOverlayItem faq={faqs.find(f => f.cod_faq === activeId)!} />
                  )}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit FAQ Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(o) => {
        setIsEditDialogOpen(o);
        if (!o) resetEditForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Editar' : 'Nova'} FAQ</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo. Use a barra de ferramentas para formatar a resposta.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Pergunta</Label>
              <Input 
                name="question" 
                defaultValue={editingFaq?.des_pergunta} 
                required 
                maxLength={500}
                placeholder="Ex: Como abrir um chamado?"
                className={formErrors.question ? 'border-destructive' : ''}
              />
              {formErrors.question && (
                <p className="text-sm text-destructive mt-1">{formErrors.question}</p>
              )}
            </div>

            <div>
              <Label className="mb-1.5 block">Resposta</Label>
              <RichTextEditor
                content={answerHtml}
                onChange={setAnswerHtml}
                placeholder="Digite a resposta aqui..."
              />
              {formErrors.answer && (
                <p className="text-sm text-destructive mt-1">{formErrors.answer}</p>
              )}
            </div>

            {/* Tags de Busca */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags de Busca
              </Label>
              <p className="text-xs text-muted-foreground">
                Adicione palavras-chave para facilitar a localização desta FAQ na busca
              </p>
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-muted/30 rounded-lg">
                {editingTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setEditingTags(prev => prev.filter((_, i) => i !== index))}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {editingTags.length === 0 && (
                  <span className="text-xs text-muted-foreground">Nenhuma tag adicionada</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Digite uma tag e pressione Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const tag = newTag.trim().toLowerCase();
                      if (tag && !editingTags.includes(tag)) {
                        setEditingTags(prev => [...prev, tag]);
                        setNewTag('');
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tag = newTag.trim().toLowerCase();
                    if (tag && !editingTags.includes(tag)) {
                      setEditingTags(prev => [...prev, tag]);
                      setNewTag('');
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {filteredSuggestions.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    {newTag.trim() ? 'Sugestões:' : 'Tags populares:'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {filteredSuggestions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (!editingTags.includes(tag)) {
                            setEditingTags(prev => [...prev, tag]);
                            setNewTag('');
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs rounded-full transition-colors"
                      >
                        <Plus className="h-2.5 w-2.5" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Upload de Mídia */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Mídia (opcional)
              </Label>
              
              {/* Upload de Imagem */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Imagem ilustrativa (max 5MB)</p>
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {imageUrl ? (
                  <div className="space-y-2">
                    <div className="relative group">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-full max-h-40 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => { setImageUrl(null); setImageCaption(''); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      placeholder="Legenda da imagem (opcional)"
                      maxLength={200}
                    />
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Enviar Imagem
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Upload de Vídeo */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Vídeo tutorial (max 50MB - MP4, WebM)</p>
                <input
                  type="file"
                  ref={videoInputRef}
                  accept="video/mp4,video/webm,video/ogg"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                {videoUrl ? (
                  <div className="space-y-2">
                    <div className="relative group">
                      <video 
                        src={videoUrl} 
                        controls
                        className="w-full max-h-48 rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => { setVideoUrl(null); setVideoCaption(''); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={videoCaption}
                      onChange={(e) => setVideoCaption(e.target.value)}
                      placeholder="Legenda do vídeo (opcional)"
                      maxLength={200}
                    />
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploadingVideo}
                  >
                    {isUploadingVideo ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4 mr-2" />
                        Enviar Vídeo
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <Input 
              type="hidden" 
              name="sort_order" 
              value={editingFaq?.num_ordem || faqs.length} 
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingFaq ? 'Salvar' : 'Criar'} FAQ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFaqId} onOpenChange={(o) => !o && setDeleteFaqId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta FAQ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}