import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Save,
  Eye,
  ChevronLeft,
  AlertTriangle,
  Send,
  Archive,
  FileText,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { useUserRole } from '@/hooks/useUserRole';
import ReactMarkdown from 'react-markdown';
import {
  useKnowledgeBaseArticles,
  ARTICLE_TYPES,
  ARTICLE_STATUS,
  KBArticle,
  ArticleType,
  ArticleStatus,
} from '@/hooks/useKnowledgeBaseArticles';
import { cn } from '@/lib/utils';

const AUDIENCE_OPTIONS = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'TI', label: 'TI' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'RH', label: 'RH' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'OPERACIONAL', label: 'Operacional' },
];

export default function KnowledgeBaseEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { startLoading, stopLoading } = useGlobalLoading();
  const isEditing = !!id;

  const {
    categories,
    tags,
    getArticleById,
    createArticle,
    updateArticle,
  } = useKnowledgeBaseArticles();

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
      navigate('/base-conhecimento');
      return;
    }

    if (isEditing && id) {
      loadArticle();
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

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = async (newStatus?: ArticleStatus) => {
    if (!title.trim() || !summary.trim() || !contentMd.trim()) {
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
      navigate(`/base-conhecimento${typeof success === 'string' ? `/${success}` : ''}`);
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
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/base-conhecimento')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Editar Artigo' : 'Novo Artigo'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-2">
            <Eye className="h-4 w-4" />
            Visualizar
          </Button>
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
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Como resetar senha do AD"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Resumo *</Label>
                <Textarea
                  id="summary"
                  placeholder="Breve descrição do artigo..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Conteúdo (Markdown) *</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="## Título

Escreva o conteúdo do artigo aqui usando Markdown...

### Passos

1. Primeiro passo
2. Segundo passo
3. Terceiro passo

```
código de exemplo
```"
                value={contentMd}
                onChange={(e) => setContentMd(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Synonyms & Prerequisites */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Busca e Pré-requisitos</CardTitle>
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
                  Termos alternativos que ajudam na busca
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prerequisites">Pré-requisitos</Label>
                <Textarea
                  id="prerequisites"
                  placeholder="Um item por linha..."
                  value={prerequisites}
                  onChange={(e) => setPrerequisites(e.target.value)}
                  rows={3}
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
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Classification */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Classificação</CardTitle>
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
                        {t.label}
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
              <div className="flex items-center justify-between">
                <Label htmlFor="critical" className="flex items-center gap-2">
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
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Tags</CardTitle>
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
              </div>
            </CardContent>
          </Card>

          {/* Status & Actions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Status e Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status Atual</Label>
                <div>
                  <Badge className={cn(
                    ARTICLE_STATUS.find(s => s.value === status)?.color
                  )}>
                    {ARTICLE_STATUS.find(s => s.value === status)?.label}
                  </Badge>
                </div>
              </div>

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

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold">{title || 'Sem título'}</h1>
              <p className="text-muted-foreground mt-2">{summary || 'Sem resumo'}</p>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown>{contentMd || '*Sem conteúdo*'}</ReactMarkdown>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Description Dialog */}
      <Dialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descreva as alterações</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="O que foi alterado nesta versão?"
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              rows={3}
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
