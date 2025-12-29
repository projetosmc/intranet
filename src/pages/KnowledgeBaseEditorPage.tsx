import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Save,
  Eye,
  ChevronLeft,
  AlertTriangle,
  Send,
  Archive,
  FileText,
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Image,
  Upload,
  X,
  Paperclip,
  FileIcon,
  Trash2,
  Loader2,
  Download,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileType,
  Presentation,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { useUserRole } from '@/hooks/useUserRole';
import {
  useKnowledgeBaseArticles,
  ARTICLE_TYPES,
  ARTICLE_STATUS,
  KBArticle,
  ArticleType,
  ArticleStatus,
} from '@/hooks/useKnowledgeBaseArticles';
import { useKBAttachments } from '@/hooks/useKBAttachments';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const getFileIcon = (type: string | null) => {
  switch (type) {
    case 'imagem': return FileImage;
    case 'video': return FileVideo;
    case 'audio': return FileAudio;
    case 'pdf': return FileType;
    case 'planilha': return FileSpreadsheet;
    case 'documento': return FileText;
    case 'apresentacao': return Presentation;
    default: return File;
  }
};

const AUDIENCE_OPTIONS = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'TI', label: 'TI' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'RH', label: 'RH' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'OPERACIONAL', label: 'Operacional' },
];

interface ToolbarButton {
  icon: any;
  label: string;
  action: () => void;
  shortcut?: string;
}

export default function KnowledgeBaseEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { startLoading, stopLoading } = useGlobalLoading();
  const isEditing = !!id;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    categories,
    tags,
    getArticleById,
    createArticle,
    updateArticle,
  } = useKnowledgeBaseArticles();

  const {
    attachments,
    isUploading,
    fetchAttachments,
    uploadAttachment,
    deleteAttachment,
    formatFileSize,
  } = useKBAttachments(id);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const [changeDescription, setChangeDescription] = useState('');
  const [showChangeDialog, setShowChangeDialog] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [type, setType] = useState<ArticleType>('HOWTO');
  const [categoryId, setCategoryId] = useState('');
  const [system, setSystem] = useState('');
  const [audience, setAudience] = useState('TODOS');
  const [contentMd, setContentMd] = useState('');
  const [synonyms, setSynonyms] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [toolLink, setToolLink] = useState('');
  const [status, setStatus] = useState<ArticleStatus>('RASCUNHO');
  const [isCritical, setIsCritical] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/base-conhecimento-ti');
      return;
    }

    if (isEditing && id) {
      loadArticle();
      fetchAttachments();
    }
  }, [id, isAdmin, navigate]);

  const loadArticle = async () => {
    if (!id) return;
    
    setIsLoading(true);
    startLoading('kb-editor');
    
    const article = await getArticleById(id);
    
    if (article) {
      setTitle(article.title);
      setSummary(article.summary);
      setType(article.type);
      setCategoryId(article.categoryId || '');
      setSystem(article.system || '');
      setAudience(article.audience);
      setContentMd(article.contentMd);
      setSynonyms(article.synonyms.join(', '));
      setPrerequisites(article.prerequisites.join('\n'));
      setEstimatedTime(article.estimatedTime || '');
      setToolLink(article.toolLink || '');
      setStatus(article.status);
      setIsCritical(article.isCritical);
      setSelectedTags(article.tags?.map(t => t.id) || []);
    }
    
    setIsLoading(false);
    stopLoading('kb-editor');
  };

  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = contentMd.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newContent = 
      contentMd.substring(0, start) + 
      before + textToInsert + after + 
      contentMd.substring(end);
    
    setContentMd(newContent);
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + textToInsert.length;
      textarea.setSelectionRange(
        selectedText ? newPosition + after.length : start + before.length,
        selectedText ? newPosition + after.length : start + before.length + placeholder.length
      );
    }, 0);
  };

  const toolbarButtons: ToolbarButton[] = [
    { icon: Bold, label: 'Negrito', action: () => insertMarkdown('**', '**', 'texto'), shortcut: 'Ctrl+B' },
    { icon: Italic, label: 'Itálico', action: () => insertMarkdown('*', '*', 'texto'), shortcut: 'Ctrl+I' },
    { icon: Code, label: 'Código inline', action: () => insertMarkdown('`', '`', 'código') },
    { icon: Heading1, label: 'Título 1', action: () => insertMarkdown('# ', '', 'Título') },
    { icon: Heading2, label: 'Título 2', action: () => insertMarkdown('## ', '', 'Subtítulo') },
    { icon: Heading3, label: 'Título 3', action: () => insertMarkdown('### ', '', 'Seção') },
    { icon: List, label: 'Lista', action: () => insertMarkdown('- ', '', 'item') },
    { icon: ListOrdered, label: 'Lista numerada', action: () => insertMarkdown('1. ', '', 'item') },
    { icon: Quote, label: 'Citação', action: () => insertMarkdown('> ', '', 'citação') },
    { icon: LinkIcon, label: 'Link', action: () => insertMarkdown('[', '](url)', 'texto do link') },
    { icon: Image, label: 'Imagem', action: () => insertMarkdown('![', '](url)', 'descrição') },
    { icon: Minus, label: 'Linha horizontal', action: () => insertMarkdown('\n---\n', '', '') },
  ];

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = async (newStatus?: ArticleStatus) => {
    if (!title.trim() || !summary.trim() || !contentMd.trim()) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (isEditing && !changeDescription.trim()) {
      setShowChangeDialog(true);
      return;
    }

    setIsSaving(true);

    const articleData: Partial<KBArticle> = {
      title: title.trim(),
      summary: summary.trim(),
      type,
      categoryId: categoryId || null,
      system: system.trim() || null,
      audience,
      contentMd: contentMd.trim(),
      synonyms: synonyms.split(',').map(s => s.trim()).filter(Boolean),
      prerequisites: prerequisites.split('\n').map(p => p.trim()).filter(Boolean),
      estimatedTime: estimatedTime.trim() || null,
      toolLink: toolLink.trim() || null,
      status: newStatus || status,
      isCritical,
    };

    let success: boolean | string | null;

    if (isEditing && id) {
      success = await updateArticle(id, articleData, selectedTags, changeDescription);
    } else {
      success = await createArticle(articleData, selectedTags);
    }

    setIsSaving(false);
    setChangeDescription('');

    if (success) {
      toast.success(isEditing ? 'Artigo atualizado!' : 'Artigo criado!');
      navigate(`/base-conhecimento-ti${typeof success === 'string' ? `/${success}` : ''}`);
    }
  };

  const handlePublish = () => {
    setStatus('PUBLICADO');
    handleSave('PUBLICADO');
  };

  const handleArchive = () => {
    setStatus('ARQUIVADO');
    handleSave('ARQUIVADO');
  };

  const handleSubmitForReview = () => {
    setStatus('EM_REVISAO');
    handleSave('EM_REVISAO');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        insertMarkdown('**', '**', 'texto');
      } else if (e.key === 'i') {
        e.preventDefault();
        insertMarkdown('*', '*', 'texto');
      } else if (e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs isLoading />
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <Breadcrumbs />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/base-conhecimento-ti')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Editar Artigo' : 'Novo Artigo'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing ? 'Atualize o conteúdo do artigo' : 'Crie um novo artigo para a base de conhecimento'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleSave()}
            disabled={isSaving || !title.trim() || !summary.trim() || !contentMd.trim()}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Title & Summary */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Como resetar senha do AD"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Resumo *</Label>
                <Textarea
                  id="summary"
                  placeholder="Breve descrição do artigo que aparecerá na listagem..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conteúdo *</CardTitle>
                <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as 'edit' | 'preview')}>
                  <TabsList className="h-8">
                    <TabsTrigger value="edit" className="text-xs gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Editar
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Visualizar
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {editorTab === 'edit' ? (
                <div className="space-y-2">
                  {/* Toolbar */}
                  <div className="flex flex-wrap gap-1 p-2 bg-muted/50 rounded-lg border border-border/50">
                    {toolbarButtons.map((btn, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={btn.action}
                          >
                            <btn.icon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {btn.label}
                          {btn.shortcut && <span className="text-muted-foreground ml-2">({btn.shortcut})</span>}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  
                  {/* Editor */}
                  <Textarea
                    ref={textareaRef}
                    placeholder={`## Título

Escreva o conteúdo do artigo aqui usando Markdown...

### Passos

1. Primeiro passo
2. Segundo passo
3. Terceiro passo

\`\`\`
código de exemplo
\`\`\``}
                    value={contentMd}
                    onChange={(e) => setContentMd(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[500px] font-mono text-sm resize-none"
                  />
                </div>
              ) : (
                <div className="min-h-[500px] p-4 bg-muted/30 rounded-lg border border-border/50 prose prose-slate dark:prose-invert max-w-none overflow-auto">
                  {contentMd ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {contentMd}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground italic">Nenhum conteúdo para visualizar</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search & Prerequisites */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Busca e Pré-requisitos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="synonyms">Palavras-chave / Sinônimos</Label>
                <Input
                  id="synonyms"
                  placeholder="senha, reset, bloqueado, login (separados por vírgula)"
                  value={synonyms}
                  onChange={(e) => setSynonyms(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Termos alternativos que ajudam os usuários a encontrar este artigo
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prerequisites">Pré-requisitos</Label>
                <Textarea
                  id="prerequisites"
                  placeholder="Um item por linha...&#10;Ex: Acesso ao AD&#10;Permissão de administrador"
                  value={prerequisites}
                  onChange={(e) => setPrerequisites(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Tempo Estimado</Label>
                  <Input
                    id="estimatedTime"
                    placeholder="Ex: 5 min"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toolLink">Link da Ferramenta</Label>
                  <Input
                    id="toolLink"
                    placeholder="https://..."
                    value={toolLink}
                    onChange={(e) => setToolLink(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {isEditing && (
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Anexos
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Enviar
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      for (const file of files) {
                        if (id) await uploadAttachment(file, id);
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum anexo</p>
                    <p className="text-xs">Clique em Enviar para adicionar arquivos</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((attachment) => {
                      const Icon = getFileIcon(attachment.type);
                      return (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50 group"
                        >
                          <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.sizeBytes)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => window.open(attachment.url, '_blank')}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Baixar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => deleteAttachment(attachment.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remover</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Classification */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Classificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={type} onValueChange={(v) => setType(v as ArticleType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ARTICLE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-xs", t.color)}>
                            {t.label}
                          </Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="system">Sistema</Label>
                <Input
                  id="system"
                  placeholder="Ex: GLPI, VPN, Outlook..."
                  value={system}
                  onChange={(e) => setSystem(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Público</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="critical" className="flex items-center gap-2 cursor-pointer">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Artigo Crítico
                </Label>
                <Switch
                  id="critical"
                  checked={isCritical}
                  onCheckedChange={setIsCritical}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma tag disponível</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status & Actions */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Status e Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status Atual</Label>
                <div>
                  <Badge className={cn(
                    "text-sm",
                    ARTICLE_STATUS.find(s => s.value === status)?.color
                  )}>
                    {ARTICLE_STATUS.find(s => s.value === status)?.label}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                {status === 'RASCUNHO' && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleSubmitForReview}
                    disabled={isSaving}
                  >
                    <Send className="h-4 w-4" />
                    Enviar para Revisão
                  </Button>
                )}
                {(status === 'RASCUNHO' || status === 'EM_REVISAO') && (
                  <Button
                    className="w-full gap-2"
                    onClick={handlePublish}
                    disabled={isSaving}
                  >
                    <FileText className="h-4 w-4" />
                    Publicar
                  </Button>
                )}
                {status === 'PUBLICADO' && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleArchive}
                    disabled={isSaving}
                  >
                    <Archive className="h-4 w-4" />
                    Arquivar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Change Description Dialog */}
      <Dialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descreva as alterações</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe o que foi alterado nesta versão para manter o histórico.
            </p>
            <Textarea
              placeholder="Ex: Atualizado procedimento do passo 3, adicionada nova seção de troubleshooting..."
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowChangeDialog(false);
                handleSave();
              }}
              disabled={!changeDescription.trim()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
