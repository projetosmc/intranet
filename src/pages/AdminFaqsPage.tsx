import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Plus, Pencil, Trash2, GripVertical, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { faqSchema, validateForm } from '@/lib/validations';
import { RichTextEditor, RichTextContent } from '@/components/ui/rich-text-editor';
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
}

export default function AdminFaqsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [deleteFaqId, setDeleteFaqId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [answerHtml, setAnswerHtml] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Sugestões de tags populares baseadas nas tags existentes
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

  // Sugestões filtradas baseadas no que o usuário está digitando
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
    if (isAdmin) {
      fetchFaqs();
    }
  }, [isAdmin]);

  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tab_faq')
        .select('*')
        .order('num_ordem');

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast({ title: 'Erro ao carregar FAQs', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
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

    // Validar com Zod
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

      setIsDialogOpen(false);
      setEditingFaq(null);
      setAnswerHtml('');
      setEditingTags([]);
      setNewTag('');
      await fetchFaqs();
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
        toast({ title: 'Ordem atualizada!' });
      } catch (error) {
        console.error('Error reordering:', error);
        toast({ title: 'Erro ao reordenar', variant: 'destructive' });
      }
    }
  };

  // Helper to strip HTML tags for preview text
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
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
        className={`flex items-start gap-3 p-4 ${isDragging ? 'z-50 bg-card rounded-lg relative' : 'hover:bg-muted/30'}`}
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
            <p className="font-medium truncate">{faq.des_pergunta}</p>
            {faq.des_tags && faq.des_tags.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {faq.des_tags.slice(0, 2).join(', ')}
                  {faq.des_tags.length > 2 && ` +${faq.des_tags.length - 2}`}
                </span>
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            <RichTextContent html={faq.des_resposta} className="[&_a]:text-primary [&_a]:underline" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={faq.ind_ativo}
            onCheckedChange={() => handleToggleActive(faq.cod_faq, faq.ind_ativo)}
          />
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => { 
              setEditingFaq(faq); 
              setAnswerHtml(faq.des_resposta);
              setEditingTags(faq.des_tags || []);
              setNewTag('');
              setIsDialogOpen(true); 
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => setDeleteFaqId(faq.cod_faq)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const DragOverlayItem = ({ faq }: { faq: FAQ }) => (
    <div className="flex items-center gap-3 p-4 bg-card rounded-lg shadow-2xl border-2 border-primary">
      <GripVertical className="h-4 w-4 text-primary" />
      <span className="font-semibold truncate">{faq.des_pergunta}</span>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Gerenciar FAQs</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(o) => { 
            setIsDialogOpen(o); 
            if (!o) {
              setEditingFaq(null);
              setFormErrors({});
              setAnswerHtml('');
              setEditingTags([]);
              setNewTag('');
            } else if (editingFaq) {
              setAnswerHtml(editingFaq.des_resposta);
              setEditingTags(editingFaq.des_tags || []);
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova FAQ
              </Button>
            </DialogTrigger>
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
                  
                  {/* Sugestões de tags populares */}
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

                <Input 
                  type="hidden" 
                  name="sort_order" 
                  value={editingFaq?.num_ordem || faqs.length} 
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingFaq ? 'Salvar' : 'Criar'} FAQ
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todos ({faqs.length})</TabsTrigger>
            <TabsTrigger value="active">Ativos ({faqs.filter(f => f.ind_ativo).length})</TabsTrigger>
            <TabsTrigger value="inactive">Inativos ({faqs.filter(f => !f.ind_ativo).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
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
          </TabsContent>

          <TabsContent value="active">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {faqs.filter(f => f.ind_ativo).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Nenhuma FAQ ativa.</div>
              ) : (
                <div className="divide-y divide-border">
                  {faqs.filter(f => f.ind_ativo).map((faq) => (
                    <SortableFaq key={faq.cod_faq} faq={faq} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="inactive">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {faqs.filter(f => !f.ind_ativo).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Nenhuma FAQ inativa.</div>
              ) : (
                <div className="divide-y divide-border">
                  {faqs.filter(f => !f.ind_ativo).map((faq) => (
                    <SortableFaq key={faq.cod_faq} faq={faq} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
      </motion.div>
    </div>
  );
}
