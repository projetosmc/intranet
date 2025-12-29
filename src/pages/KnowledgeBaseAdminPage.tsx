import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Pencil, Trash2, GripVertical, FolderOpen, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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

interface Category {
  cod_categoria: string;
  des_nome: string;
  des_descricao: string | null;
  ind_ativo: boolean;
  num_ordem: number;
}

interface KBTag {
  cod_tag: string;
  des_nome: string;
  ind_ativo: boolean;
  num_ordem: number;
}

export default function KnowledgeBaseAdminPage() {
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<KBTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTag, setEditingTag] = useState<KBTag | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        supabase.from('tab_kb_categoria').select('*').order('num_ordem'),
        supabase.from('tab_kb_tag').select('*').order('num_ordem')
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (tagsRes.error) throw tagsRes.error;

      setCategories(categoriesRes.data || []);
      setTags(tagsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Category handlers
  const handleSaveCategory = async (formData: FormData) => {
    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;

    if (!name) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    const category = {
      des_nome: name,
      des_descricao: description,
      num_ordem: editingCategory?.num_ordem ?? categories.length,
      ind_ativo: true,
    };

    try {
      if (editingCategory) {
        const { error } = await supabase.from('tab_kb_categoria').update(category).eq('cod_categoria', editingCategory.cod_categoria);
        if (error) throw error;
        toast({ title: 'Categoria atualizada!' });
      } else {
        const { error } = await supabase.from('tab_kb_categoria').insert(category);
        if (error) throw error;
        toast({ title: 'Categoria criada!' });
      }
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      await fetchData();
    } catch (error) {
      toast({ title: 'Erro ao salvar categoria', variant: 'destructive' });
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryId) return;
    try {
      const { error } = await supabase.from('tab_kb_categoria').update({ ind_ativo: false }).eq('cod_categoria', deleteCategoryId);
      if (error) throw error;
      toast({ title: 'Categoria removida!' });
      await fetchData();
    } catch (error) {
      toast({ title: 'Erro ao remover categoria', variant: 'destructive' });
    } finally {
      setDeleteCategoryId(null);
    }
  };

  const handleToggleCategoryActive = async (id: string, active: boolean) => {
    try {
      await supabase.from('tab_kb_categoria').update({ ind_ativo: !active }).eq('cod_categoria', id);
      await fetchData();
    } catch (error) {
      toast({ title: 'Erro ao atualizar categoria', variant: 'destructive' });
    }
  };

  // Tag handlers
  const handleSaveTag = async (formData: FormData) => {
    const name = (formData.get('name') as string)?.trim();

    if (!name) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    const tag = {
      des_nome: name,
      num_ordem: editingTag?.num_ordem ?? tags.length,
      ind_ativo: true,
    };

    try {
      if (editingTag) {
        const { error } = await supabase.from('tab_kb_tag').update(tag).eq('cod_tag', editingTag.cod_tag);
        if (error) throw error;
        toast({ title: 'Tag atualizada!' });
      } else {
        const { error } = await supabase.from('tab_kb_tag').insert(tag);
        if (error) throw error;
        toast({ title: 'Tag criada!' });
      }
      setIsTagDialogOpen(false);
      setEditingTag(null);
      await fetchData();
    } catch (error) {
      toast({ title: 'Erro ao salvar tag', variant: 'destructive' });
    }
  };

  const confirmDeleteTag = async () => {
    if (!deleteTagId) return;
    try {
      const { error } = await supabase.from('tab_kb_tag').update({ ind_ativo: false }).eq('cod_tag', deleteTagId);
      if (error) throw error;
      toast({ title: 'Tag removida!' });
      await fetchData();
    } catch (error) {
      toast({ title: 'Erro ao remover tag', variant: 'destructive' });
    } finally {
      setDeleteTagId(null);
    }
  };

  const handleToggleTagActive = async (id: string, active: boolean) => {
    try {
      await supabase.from('tab_kb_tag').update({ ind_ativo: !active }).eq('cod_tag', id);
      await fetchData();
    } catch (error) {
      toast({ title: 'Erro ao atualizar tag', variant: 'destructive' });
    }
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.cod_categoria === active.id);
    const newIndex = categories.findIndex((c) => c.cod_categoria === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      try {
        await Promise.all(newOrder.map((item, index) => supabase.from('tab_kb_categoria').update({ num_ordem: index }).eq('cod_categoria', item.cod_categoria)));
        await fetchData();
      } catch (error) {
        console.error('Error reordering:', error);
      }
    }
  };

  const handleTagDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = tags.findIndex((t) => t.cod_tag === active.id);
    const newIndex = tags.findIndex((t) => t.cod_tag === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(tags, oldIndex, newIndex);
      try {
        await Promise.all(newOrder.map((item, index) => supabase.from('tab_kb_tag').update({ num_ordem: index }).eq('cod_tag', item.cod_tag)));
        await fetchData();
      } catch (error) {
        console.error('Error reordering:', error);
      }
    }
  };

  const SortableCategory = ({ category }: { category: Category }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.cod_categoria });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
      <motion.div ref={setNodeRef} style={style} animate={{ scale: isDragging ? 1.02 : 1, opacity: isDragging ? 0.9 : 1 }} className={`flex items-center gap-3 p-4 ${isDragging ? 'z-50 bg-card rounded-lg shadow-lg' : 'hover:bg-muted/30'}`}>
        <motion.div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </motion.div>
        <FolderOpen className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <span className="font-medium">{category.des_nome}</span>
          {category.des_descricao && <p className="text-sm text-muted-foreground">{category.des_descricao}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={category.ind_ativo} onCheckedChange={() => handleToggleCategoryActive(category.cod_categoria, category.ind_ativo)} />
          <Button variant="ghost" size="icon-sm" onClick={() => { setEditingCategory(category); setIsCategoryDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteCategoryId(category.cod_categoria)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </motion.div>
    );
  };

  const SortableTag = ({ tag }: { tag: KBTag }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tag.cod_tag });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
      <motion.div ref={setNodeRef} style={style} animate={{ scale: isDragging ? 1.02 : 1, opacity: isDragging ? 0.9 : 1 }} className={`flex items-center gap-3 p-4 ${isDragging ? 'z-50 bg-card rounded-lg shadow-lg' : 'hover:bg-muted/30'}`}>
        <motion.div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </motion.div>
        <Tag className="h-4 w-4 text-primary" />
        <div className="flex-1"><span className="font-medium">{tag.des_nome}</span></div>
        <div className="flex items-center gap-2">
          <Switch checked={tag.ind_ativo} onCheckedChange={() => handleToggleTagActive(tag.cod_tag, tag.ind_ativo)} />
          <Button variant="ghost" size="icon-sm" onClick={() => { setEditingTag(tag); setIsTagDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTagId(tag.cod_tag)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </motion.div>
    );
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => navigate('/base-conhecimento-ti')}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Administração da Base de Conhecimento</h1>
        </div>

        <Tabs defaultValue="categories">
          <TabsList>
            <TabsTrigger value="categories" className="gap-2"><FolderOpen className="h-4 w-4" />Categorias</TabsTrigger>
            <TabsTrigger value="tags" className="gap-2"><Tag className="h-4 w-4" />Tags</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div><h2 className="text-lg font-semibold">Categorias</h2><p className="text-sm text-muted-foreground">Organize os artigos em categorias</p></div>
              <Dialog open={isCategoryDialogOpen} onOpenChange={(o) => { setIsCategoryDialogOpen(o); if (!o) setEditingCategory(null); }}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Categoria</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingCategory ? 'Editar' : 'Nova'} Categoria</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveCategory(new FormData(e.currentTarget)); }} className="space-y-4">
                    <div><Label className="mb-1.5 block">Nome</Label><Input name="name" defaultValue={editingCategory?.des_nome} required placeholder="Ex: Infraestrutura" /></div>
                    <div><Label className="mb-1.5 block">Descrição (opcional)</Label><Textarea name="description" defaultValue={editingCategory?.des_descricao || ''} placeholder="Breve descrição da categoria" rows={2} /></div>
                    <Button type="submit" className="w-full">Salvar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {isLoading ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> : categories.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground"><FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhuma categoria cadastrada</p></div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleCategoryDragEnd}>
                  <SortableContext items={categories.map(c => c.cod_categoria)} strategy={verticalListSortingStrategy}>
                    <div className="divide-y divide-border">{categories.map((category) => <SortableCategory key={category.cod_categoria} category={category} />)}</div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tags" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div><h2 className="text-lg font-semibold">Tags</h2><p className="text-sm text-muted-foreground">Crie tags para classificar os artigos</p></div>
              <Dialog open={isTagDialogOpen} onOpenChange={(o) => { setIsTagDialogOpen(o); if (!o) setEditingTag(null); }}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Tag</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingTag ? 'Editar' : 'Nova'} Tag</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveTag(new FormData(e.currentTarget)); }} className="space-y-4">
                    <div><Label className="mb-1.5 block">Nome</Label><Input name="name" defaultValue={editingTag?.des_nome} required placeholder="Ex: VPN" /></div>
                    <Button type="submit" className="w-full">Salvar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {isLoading ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> : tags.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground"><Tag className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhuma tag cadastrada</p></div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleTagDragEnd}>
                  <SortableContext items={tags.map(t => t.cod_tag)} strategy={verticalListSortingStrategy}>
                    <div className="divide-y divide-border">{tags.map((tag) => <SortableTag key={tag.cod_tag} tag={tag} />)}</div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      <AlertDialog open={!!deleteCategoryId} onOpenChange={(open) => !open && setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja desativar esta categoria?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Desativar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTagId} onOpenChange={(open) => !open && setDeleteTagId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja desativar esta tag?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteTag} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Desativar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
