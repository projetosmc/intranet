import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, ExternalLink, Mail, Phone, FileQuestion, Pencil, Plus, Trash2, Save, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RichTextContent } from '@/components/ui/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useFeaturePermission } from '@/hooks/useFeaturePermission';
import { toast } from '@/hooks/use-toast';

interface FAQ {
  cod_faq: string;
  des_pergunta: string;
  des_resposta: string;
  des_imagem_url: string | null;
  des_video_url: string | null;
}

interface SupportConfig {
  cod_config: string;
  des_tipo: string;
  des_nome: string;
  des_descricao: string | null;
  des_valor: string;
  des_icone: string;
  num_ordem: number;
  ind_ativo: boolean;
}

const availableIcons = [
  'MessageCircle', 'Book', 'Mail', 'Phone', 'Globe', 'ExternalLink', 
  'FileText', 'HelpCircle', 'Headphones', 'Users', 'Building', 'Briefcase'
];

const getIconComponent = (iconName: string): LucideIcon => {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[iconName] || LucideIcons.Circle;
};

export default function SupportPage() {
  const { canEditSupport } = useFeaturePermission();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [supportLinks, setSupportLinks] = useState<SupportConfig[]>([]);
  const [contacts, setContacts] = useState<SupportConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupportConfig | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);
  const [itemType, setItemType] = useState<'link' | 'contact'>('link');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [faqResult, configResult] = await Promise.all([
        supabase
          .from('tab_faq')
          .select('cod_faq, des_pergunta, des_resposta, des_imagem_url, des_video_url')
          .eq('ind_ativo', true)
          .order('num_ordem'),
        supabase
          .from('tab_config_suporte')
          .select('*')
          .eq('ind_ativo', true)
          .order('num_ordem')
      ]);

      if (faqResult.error) throw faqResult.error;
      if (configResult.error) throw configResult.error;

      setFaqs((faqResult.data || []) as FAQ[]);
      
      const configs = configResult.data || [];
      setSupportLinks(configs.filter(c => c.des_tipo === 'link'));
      setContacts(configs.filter(c => c.des_tipo === 'contact'));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = (item: SupportConfig) => {
    setEditingItem(item);
    setIsNewItem(false);
    setItemType(item.des_tipo as 'link' | 'contact');
    setEditDialogOpen(true);
  };

  const handleNewItem = (type: 'link' | 'contact') => {
    setEditingItem({
      cod_config: '',
      des_tipo: type,
      des_nome: '',
      des_descricao: '',
      des_valor: '',
      des_icone: type === 'link' ? 'MessageCircle' : 'Mail',
      num_ordem: type === 'link' ? supportLinks.length : contacts.length,
      ind_ativo: true
    });
    setIsNewItem(true);
    setItemType(type);
    setEditDialogOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      des_tipo: itemType,
      des_nome: formData.get('nome') as string,
      des_descricao: formData.get('descricao') as string || null,
      des_valor: formData.get('valor') as string,
      des_icone: formData.get('icone') as string,
      num_ordem: editingItem.num_ordem,
      ind_ativo: true
    };

    try {
      if (isNewItem) {
        const { error } = await supabase
          .from('tab_config_suporte')
          .insert(data);
        if (error) throw error;
        toast({ title: 'Item criado!' });
      } else {
        const { error } = await supabase
          .from('tab_config_suporte')
          .update(data)
          .eq('cod_config', editingItem.cod_config);
        if (error) throw error;
        toast({ title: 'Item atualizado!' });
      }
      setEditDialogOpen(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving item:', error);
      toast({ title: 'Erro ao salvar item', variant: 'destructive' });
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItemId) return;
    try {
      const { error } = await supabase
        .from('tab_config_suporte')
        .delete()
        .eq('cod_config', deleteItemId);
      if (error) throw error;
      toast({ title: 'Item removido!' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({ title: 'Erro ao remover item', variant: 'destructive' });
    } finally {
      setDeleteItemId(null);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
        </div>
        <p className="text-muted-foreground">
          Precisa de ajuda? Encontre recursos e entre em contato conosco
        </p>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Links Úteis</h2>
          {canEditSupport && (
            <Button size="sm" variant="outline" onClick={() => handleNewItem('link')}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Link
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {supportLinks.map((link, index) => {
            const Icon = getIconComponent(link.des_icone);
            return (
              <motion.div
                key={link.cod_config}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                className="glass-card p-6 hover-lift group relative"
              >
                {canEditSupport && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon-sm" variant="ghost" onClick={() => handleEditItem(link)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => setDeleteItemId(link.cod_config)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                )}
                <a
                  href={link.des_valor}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {link.des_nome}
                  </h3>
                  <p className="text-sm text-muted-foreground">{link.des_descricao}</p>
                </a>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Contato Direto</h2>
          {canEditSupport && (
            <Button size="sm" variant="outline" onClick={() => handleNewItem('contact')}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Contato
            </Button>
          )}
        </div>
        <div className="glass-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contacts.map((contact) => {
              const Icon = getIconComponent(contact.des_icone);
              const isEmail = contact.des_nome.toLowerCase().includes('mail');
              
              return (
                <div key={contact.cod_config} className="flex items-center gap-4 group relative">
                  {canEditSupport && (
                    <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon-sm" variant="ghost" onClick={() => handleEditItem(contact)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => setDeleteItemId(contact.cod_config)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{contact.des_nome}</p>
                    {isEmail ? (
                      <a href={`mailto:${contact.des_valor}`} className="font-medium text-foreground hover:text-primary transition-colors">
                        {contact.des_valor}
                      </a>
                    ) : (
                      <p className="font-medium text-foreground">{contact.des_valor}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <FileQuestion className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Perguntas Frequentes</h2>
        </div>
        <div className="glass-card p-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-4">Carregando...</p>
          ) : faqs.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhuma FAQ cadastrada</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.cod_faq} value={faq.cod_faq}>
                  <AccordionTrigger className="text-left hover:no-underline hover:text-primary">
                    {faq.des_pergunta}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-4">
                    <RichTextContent html={faq.des_resposta} />
                    
                    {/* Imagem da FAQ */}
                    {faq.des_imagem_url && (
                      <div className="mt-4">
                        <img 
                          src={faq.des_imagem_url} 
                          alt="Ilustração" 
                          className="max-w-full max-h-80 rounded-lg border object-contain"
                        />
                      </div>
                    )}
                    
                    {/* Vídeo da FAQ */}
                    {faq.des_video_url && (
                      <div className="mt-4">
                        <video 
                          src={faq.des_video_url} 
                          controls
                          className="w-full max-h-96 rounded-lg border"
                        >
                          Seu navegador não suporta a reprodução de vídeos.
                        </video>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </motion.section>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isNewItem ? 'Novo' : 'Editar'} {itemType === 'link' ? 'Link' : 'Contato'}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {isNewItem ? 'criar' : 'editar'} o item.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input 
                id="nome" 
                name="nome" 
                defaultValue={editingItem?.des_nome} 
                required 
                placeholder={itemType === 'link' ? 'Ex: GLPI - Service Desk' : 'Ex: E-mail'}
              />
            </div>
            {itemType === 'link' && (
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input 
                  id="descricao" 
                  name="descricao" 
                  defaultValue={editingItem?.des_descricao || ''} 
                  placeholder="Ex: Abra chamados de suporte técnico"
                />
              </div>
            )}
            <div>
              <Label htmlFor="valor">{itemType === 'link' ? 'URL' : 'Valor'}</Label>
              <Input 
                id="valor" 
                name="valor" 
                defaultValue={editingItem?.des_valor} 
                required 
                placeholder={itemType === 'link' ? 'https://...' : 'Ex: suporte@empresa.com'}
              />
            </div>
            <div>
              <Label htmlFor="icone">Ícone</Label>
              <Select name="icone" defaultValue={editingItem?.des_icone || 'MessageCircle'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableIcons.map((iconName) => {
                    const IconComp = getIconComponent(iconName);
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          <IconComp className="h-4 w-4" />
                          {iconName}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {isNewItem ? 'Criar' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(o) => !o && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
