import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Star,
  StarOff,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Copy,
  Check,
  Printer,
  Edit2,
  ExternalLink,
  History,
  ChevronLeft,
  BookOpen,
  FileQuestion,
  Wrench,
  FileText,
  Shield,
  AlertCircle,
  Link as LinkIcon,
  MessageSquare,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { useUserRole } from '@/hooks/useUserRole';
import {
  useKnowledgeBaseArticles,
  ARTICLE_TYPES,
  ARTICLE_STATUS,
  KBArticle,
  KBArticleVersion,
} from '@/hooks/useKnowledgeBaseArticles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, any> = {
  FAQ: FileQuestion,
  HOWTO: BookOpen,
  TROUBLESHOOT: Wrench,
  RUNBOOK: FileText,
  POLITICA: Shield,
  POSTMORTEM: AlertCircle,
};

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className={cn("bg-muted p-4 rounded-lg overflow-x-auto", className)}>
        <code>{children}</code>
      </pre>
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export default function KnowledgeBaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { startLoading, stopLoading } = useGlobalLoading();

  const {
    getArticleById,
    toggleFavorite,
    registerView,
    submitFeedback,
    fetchVersions,
    articles,
  } = useKnowledgeBaseArticles();

  const [article, setArticle] = useState<KBArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackComment, setShowFeedbackComment] = useState(false);
  const [versions, setVersions] = useState<KBArticleVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const loadArticle = async () => {
      if (!id) return;
      
      setIsLoading(true);
      startLoading('kb-detail');
      
      const data = await getArticleById(id);
      setArticle(data);
      
      if (data) {
        registerView(id);
      }
      
      setIsLoading(false);
      stopLoading('kb-detail');
    };

    loadArticle();
  }, [id, getArticleById, registerView, startLoading, stopLoading]);

  const handleFeedback = async (helpful: boolean) => {
    if (!id) return;
    setFeedbackGiven(helpful);
    setShowFeedbackComment(true);
  };

  const handleSubmitFeedback = async () => {
    if (!id || feedbackGiven === null) return;
    await submitFeedback(id, feedbackGiven, feedbackComment || undefined);
    setShowFeedbackComment(false);
  };

  const handleToggleFavorite = async () => {
    if (!id) return;
    await toggleFavorite(id);
    const updated = await getArticleById(id);
    setArticle(updated);
  };

  const handleViewVersions = async () => {
    if (!id) return;
    const data = await fetchVersions(id);
    setVersions(data);
    setShowVersions(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs isLoading />
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Artigo não encontrado</p>
          <Button variant="link" onClick={() => navigate('/base-conhecimento')}>
            Voltar para a lista
          </Button>
        </div>
      </div>
    );
  }

  const TypeIcon = typeIcons[article.type] || FileText;
  const typeConfig = ARTICLE_TYPES.find(t => t.value === article.type);
  const statusConfig = ARTICLE_STATUS.find(s => s.value === article.status);

  // Artigos relacionados (mesma categoria)
  const relatedArticles = articles
    .filter(a => 
      a.id !== article.id && 
      a.status === 'PUBLICADO' && 
      (a.categoryId === article.categoryId || a.system === article.system)
    )
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/base-conhecimento')}
          className="mb-4 -ml-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <div className={cn("p-2 rounded-lg", typeConfig?.color)}>
                  <TypeIcon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className={cn(typeConfig?.color)}>
                  {typeConfig?.label}
                </Badge>
                {article.system && (
                  <Badge variant="secondary">{article.system}</Badge>
                )}
                {article.status !== 'PUBLICADO' && statusConfig && (
                  <Badge variant="outline" className={cn(statusConfig.color)}>
                    {statusConfig.label}
                  </Badge>
                )}
                {article.isCritical && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Crítico
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold mt-4">{article.title}</h1>
              <p className="text-muted-foreground mt-2">{article.summary}</p>

              <div className="flex flex-wrap gap-2 mt-4">
                {article.tags?.map(tag => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {article.views} visualizações
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {article.helpfulUp} úteis
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(article.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleFavorite}
              >
                {article.isFavorite ? (
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copiedLink ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(`/base-conhecimento/${article.id}/editar`)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Tool Link */}
          {article.toolLink && (
            <div className="mt-4 pt-4 border-t">
              <Button variant="secondary" asChild className="gap-2">
                <a href={article.toolLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Acessar Ferramenta
                </a>
              </Button>
            </div>
          )}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-6 mt-6 prose prose-slate dark:prose-invert max-w-none"
        >
          <ReactMarkdown
            components={{
              code: ({ node, className, children, ...props }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  );
                }
                return (
                  <CodeBlock className={className}>
                    {String(children).replace(/\n$/, '')}
                  </CodeBlock>
                );
              },
              pre: ({ children }) => <>{children}</>,
            }}
          >
            {article.contentMd}
          </ReactMarkdown>
        </motion.div>

        {/* Feedback Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-6 mt-6"
        >
          <h3 className="font-semibold text-lg mb-4">Isso resolveu seu problema?</h3>
          
          {!showFeedbackComment ? (
            <div className="flex gap-3">
              <Button
                variant={feedbackGiven === true ? 'default' : 'outline'}
                onClick={() => handleFeedback(true)}
                className="gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Sim, resolveu!
              </Button>
              <Button
                variant={feedbackGiven === false ? 'destructive' : 'outline'}
                onClick={() => handleFeedback(false)}
                className="gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                Não resolveu
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {feedbackGiven
                  ? 'Ótimo! Tem algo mais que gostaria de comentar?'
                  : 'Sentimos muito. Pode nos dizer o que faltou?'}
              </p>
              <Textarea
                placeholder="Deixe um comentário (opcional)"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmitFeedback}>
                  Enviar Feedback
                </Button>
                <Button variant="ghost" onClick={() => setShowFeedbackComment(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Open Ticket */}
          <Separator className="my-6" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ainda precisa de ajuda?</p>
              <p className="text-sm text-muted-foreground">
                Abra um chamado no GLPI com este artigo como referência
              </p>
            </div>
            <Button variant="secondary" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Abrir Chamado
            </Button>
          </div>
        </motion.div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Artigos Relacionados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {relatedArticles.map(related => (
                    <Link
                      key={related.id}
                      to={`/base-conhecimento/${related.id}`}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors block"
                    >
                      <p className="font-medium">{related.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {related.summary}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Version History (Admin only) */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <Button variant="outline" onClick={handleViewVersions} className="gap-2">
              <History className="h-4 w-4" />
              Ver Histórico de Versões (v{article.version})
            </Button>
          </motion.div>
        )}
      </div>

      {/* Versions Modal */}
      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Versões</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {versions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum histórico disponível
              </p>
            ) : (
              versions.map((version) => (
                <div key={version.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{version.version}</Badge>
                      <span className="font-medium">{version.title}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(version.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Por: {version.userName}
                  </p>
                  {version.changes && (
                    <p className="text-sm mt-2 p-2 bg-muted rounded">
                      {version.changes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
