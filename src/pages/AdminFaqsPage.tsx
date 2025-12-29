import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
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

  const handleSave = async (formData: FormData) => {
    const rawData = {
      question: formData.get('question') as string,
      answer: formData.get('answer') as string,
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
          <p className="font-medium truncate">{faq.des_pergunta}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{faq.des_resposta}</p>
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
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingFaq ? 'Editar' : 'Nova'} FAQ</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }} className="space-y-4">
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
                  <Label className="mb-1.5 block">
                    Resposta
                    <span className="text-xs text-muted-foreground font-normal ml-2">
                      (suporta Markdown)
                    </span>
                  </Label>
                  <Textarea 
                    name="answer" 
                    defaultValue={editingFaq?.des_resposta} 
                    required 
                    maxLength={5000}
                    placeholder="Digite a resposta... Suporta **negrito**, *itálico*, [links](url), listas e mais."
                    rows={6}
                    className={`font-mono text-sm ${formErrors.answer ? 'border-destructive' : ''}`}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Dica: Use **texto** para negrito, *texto* para itálico, [texto](url) para links
                  </p>
                  {formErrors.answer && (
                    <p className="text-sm text-destructive mt-1">{formErrors.answer}</p>
                  )}
                </div>

                <div>
                  <Label className="mb-1.5 block">Ordem</Label>
                  <Input 
                    name="sort_order" 
                    type="number" 
                    defaultValue={editingFaq?.num_ordem || 0} 
                    placeholder="0" 
                  />
                </div>

                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : faqs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma FAQ cadastrada</p>
              <p className="text-sm">Clique em "Nova FAQ" para adicionar</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={faqs.map(f => f.cod_faq)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-border">
                  {faqs.map((faq) => (
                    <SortableFaq key={faq.cod_faq} faq={faq} />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <DragOverlayItem faq={faqs.find(f => f.cod_faq === activeId)!} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </motion.div>

      <AlertDialog open={!!deleteFaqId} onOpenChange={(open) => !open && setDeleteFaqId(null)}>
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
    </div>
  );
}
