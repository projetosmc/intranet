import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  Share2,
  Paperclip,
  Download,
  ChevronRight,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { toast } from 'sonner';

const typeIcons: Record<string, any> = {
  FAQ: FileQuestion,
  HOWTO: BookOpen,
  TROUBLESHOOT: Wrench,
  RUNBOOK: FileText,
  POLITICA: Shield,
  POSTMORTEM: AlertCircle,
};

const typeGradients: Record<string, string> = {
  FAQ: 'from-blue-500 to-blue-600',
  HOWTO: 'from-emerald-500 to-emerald-600',
  TROUBLESHOOT: 'from-amber-500 to-amber-600',
  RUNBOOK: 'from-purple-500 to-purple-600',
  POLITICA: 'from-slate-500 to-slate-600',
  POSTMORTEM: 'from-red-500 to-red-600',
};

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <pre className={cn("bg-muted/80 backdrop-blur-sm p-4 rounded-xl overflow-x-auto border border-border/50", className)}>
        <code className="text-sm">{children}</code>
      </pre>
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
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
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleFeedback = async (helpful: boolean) => {
    if (!id) return;
    setFeedbackGiven(helpful);
    setShowFeedbackComment(true);
  };

  const handleSubmitFeedback = async () => {
    if (!id || feedbackGiven === null) return;
    await submitFeedback(id, feedbackGiven, feedbackComment || undefined);
    setShowFeedbackComment(false);
    setFeedbackSubmitted(true);
    toast.success('Obrigado pelo feedback!');
  };

  const handleToggleFavorite = async () => {
    if (!id) return;
    await toggleFavorite(id);
    const updated = await getArticleById(id);
    setArticle(updated);
    toast.success(updated?.isFavorite ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
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
    toast.success('Link copiado!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.summary,
          url: window.location.href,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
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
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/50 mb-6">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-xl font-medium">Artigo não encontrado</p>
          <p className="text-muted-foreground mt-2">O artigo que você procura pode ter sido removido ou não existe.</p>
          <Button variant="outline" onClick={() => navigate('/base-conhecimento-ti')} className="mt-6 gap-2">
            <ChevronLeft className="h-4 w-4" />
            Voltar para a lista
          </Button>
        </motion.div>
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
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-8">
      <Breadcrumbs />

      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/base-conhecimento-ti')}
          className="mb-4 -ml-2 gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden bg-card border border-border/50"
        >
          {/* Gradient header bar */}
          <div className={cn("h-2 w-full bg-gradient-to-r", typeGradients[article.type])} />

          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn(
                    "p-2.5 rounded-xl bg-gradient-to-br",
                    article.type === 'FAQ' && "from-blue-500/20 to-blue-600/10",
                    article.type === 'HOWTO' && "from-emerald-500/20 to-emerald-600/10",
                    article.type === 'TROUBLESHOOT' && "from-amber-500/20 to-amber-600/10",
                    article.type === 'RUNBOOK' && "from-purple-500/20 to-purple-600/10",
                    article.type === 'POLITICA' && "from-slate-500/20 to-slate-600/10",
                    article.type === 'POSTMORTEM' && "from-red-500/20 to-red-600/10",
                  )}>
                    <TypeIcon className={cn(
                      "h-5 w-5",
                      article.type === 'FAQ' && "text-blue-500",
                      article.type === 'HOWTO' && "text-emerald-500",
                      article.type === 'TROUBLESHOOT' && "text-amber-500",
                      article.type === 'RUNBOOK' && "text-purple-500",
                      article.type === 'POLITICA' && "text-slate-500",
                      article.type === 'POSTMORTEM' && "text-red-500",
                    )} />
                  </div>
                  <Badge variant="outline" className={cn("font-medium", typeConfig?.color)}>
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

                <h1 className="text-2xl lg:text-3xl font-bold mt-4 leading-tight">{article.title}</h1>
                <p className="text-muted-foreground mt-2 text-lg">{article.summary}</p>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {article.tags?.map(tag => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    {article.views} visualizações
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="h-4 w-4" />
                    {article.helpfulUp} úteis
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {format(new Date(article.updatedAt), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  {article.estimatedTime && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      ~{article.estimatedTime}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleToggleFavorite}>
                      {article.isFavorite ? (
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{article.isFavorite ? 'Remover favorito' : 'Adicionar favorito'}</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Compartilhar</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handlePrint}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Imprimir</TooltipContent>
                </Tooltip>
                
                {isAdmin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/base-conhecimento-ti/${article.id}/editar`)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar artigo</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Tool Link */}
            {article.toolLink && (
              <div className="mt-6 pt-4 border-t border-border/50">
                <Button variant="secondary" asChild className="gap-2">
                  <a href={article.toolLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Acessar Ferramenta
                  </a>
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Prerequisites */}
        {article.prerequisites && article.prerequisites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
          >
            <h3 className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4" />
              Pré-requisitos
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {article.prerequisites.map((prereq, i) => (
                <li key={i}>{prereq}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 lg:p-8 mt-6 bg-card border border-border/50 prose prose-slate dark:prose-invert max-w-none
            prose-headings:scroll-mt-20
            prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3
            prose-p:leading-relaxed
            prose-li:marker:text-primary
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground
            prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
            prose-table:border prose-table:border-border prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-border
          "
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ node, className, children, ...props }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm" {...props}>
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
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {children}
                </a>
              ),
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
          className="rounded-2xl p-6 mt-6 bg-card border border-border/50"
        >
          {!feedbackSubmitted ? (
            <>
              <h3 className="font-semibold text-lg mb-4">Este artigo foi útil?</h3>
              
              {!showFeedbackComment ? (
                <div className="flex gap-3">
                  <Button
                    variant={feedbackGiven === true ? 'default' : 'outline'}
                    onClick={() => handleFeedback(true)}
                    className="gap-2"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Sim, ajudou!
                  </Button>
                  <Button
                    variant={feedbackGiven === false ? 'destructive' : 'outline'}
                    onClick={() => handleFeedback(false)}
                    className="gap-2"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Não ajudou
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {feedbackGiven
                      ? 'Ótimo! Quer deixar algum comentário adicional?'
                      : 'Sentimos muito. O que podemos melhorar?'}
                  </p>
                  <Textarea
                    placeholder="Deixe um comentário (opcional)"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    rows={3}
                    className="resize-none"
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
            </>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-3">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <p className="font-medium">Obrigado pelo seu feedback!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Sua opinião nos ajuda a melhorar a base de conhecimento.
              </p>
            </div>
          )}

          {/* Open Ticket */}
          <Separator className="my-6" />
          <div className="flex items-center justify-between flex-wrap gap-4">
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
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Artigos Relacionados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {relatedArticles.map(related => {
                    const RelatedIcon = typeIcons[related.type] || FileText;
                    return (
                      <Link
                        key={related.id}
                        to={`/base-conhecimento-ti/${related.id}`}
                        className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors block group"
                      >
                        <div className="flex items-start gap-3">
                          <RelatedIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                              {related.title}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {related.summary}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
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
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Versões
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {versions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum histórico disponível
              </p>
            ) : (
              versions.map((version, index) => (
                <motion.div 
                  key={version.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border border-border/50 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">v{version.version}</Badge>
                      <span className="font-medium">{version.title}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(version.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Por: <span className="font-medium">{version.userName}</span>
                  </p>
                  {version.changes && (
                    <p className="text-sm mt-2 p-3 bg-muted/50 rounded-lg">
                      {version.changes}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
