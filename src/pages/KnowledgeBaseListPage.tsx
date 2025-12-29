import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Star,
  StarOff,
  Clock,
  Eye,
  ThumbsUp,
  AlertTriangle,
  Grid3X3,
  List,
  BookOpen,
  FileQuestion,
  Wrench,
  AlertCircle,
  FileText,
  Shield,
  X,
  TrendingUp,
  History,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { useUserRole } from '@/hooks/useUserRole';
import {
  useKnowledgeBaseArticles,
  ARTICLE_TYPES,
  ARTICLE_STATUS,
  KBArticle,
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
  FAQ: 'from-blue-500/20 to-blue-600/10',
  HOWTO: 'from-emerald-500/20 to-emerald-600/10',
  TROUBLESHOOT: 'from-amber-500/20 to-amber-600/10',
  RUNBOOK: 'from-purple-500/20 to-purple-600/10',
  POLITICA: 'from-slate-500/20 to-slate-600/10',
  POSTMORTEM: 'from-red-500/20 to-red-600/10',
};

const typeIconColors: Record<string, string> = {
  FAQ: 'text-blue-500',
  HOWTO: 'text-emerald-500',
  TROUBLESHOOT: 'text-amber-500',
  RUNBOOK: 'text-purple-500',
  POLITICA: 'text-slate-500',
  POSTMORTEM: 'text-red-500',
};

function QuickAccessCard({ 
  article, 
  onClick,
  variant = 'default',
}: { 
  article: KBArticle; 
  onClick: () => void;
  variant?: 'default' | 'featured';
}) {
  const TypeIcon = typeIcons[article.type] || FileText;
  const typeConfig = ARTICLE_TYPES.find(t => t.value === article.type);

  if (variant === 'featured') {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
          "relative p-4 rounded-xl cursor-pointer transition-all duration-300",
          "bg-gradient-to-br",
          typeGradients[article.type],
          "border border-border/50 hover:border-primary/30",
          "hover:shadow-lg hover:shadow-primary/5"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg bg-background/80 backdrop-blur-sm",
            typeIconColors[article.type]
          )}>
            <TypeIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium line-clamp-2 text-sm">{article.title}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.views}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                {article.helpfulUp}
              </span>
            </div>
          </div>
          {article.isCritical && (
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group"
    >
      <TypeIcon className={cn("h-4 w-4 shrink-0", typeIconColors[article.type])} />
      <p className="font-medium line-clamp-1 text-sm flex-1">{article.title}</p>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

function ArticleCard({ 
  article, 
  onToggleFavorite,
  viewMode,
}: { 
  article: KBArticle; 
  onToggleFavorite: () => void;
  viewMode: 'grid' | 'list';
}) {
  const navigate = useNavigate();
  const TypeIcon = typeIcons[article.type] || FileText;
  const typeConfig = ARTICLE_TYPES.find(t => t.value === article.type);
  const statusConfig = ARTICLE_STATUS.find(s => s.value === article.status);

  const handleClick = () => {
    navigate(`/base-conhecimento-ti/${article.id}`);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/base-conhecimento-ti/${article.id}`);
    toast.success('Link copiado!');
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        whileHover={{ x: 4 }}
        className={cn(
          "relative rounded-xl p-4 cursor-pointer transition-all duration-300",
          "bg-card border border-border/50",
          "hover:border-primary/30 hover:shadow-md hover:shadow-primary/5",
          "group"
        )}
        onClick={handleClick}
      >
        {/* Gradient overlay on hover */}
        <div className={cn(
          "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "bg-gradient-to-r",
          typeGradients[article.type]
        )} />
        
        <div className="relative flex items-start gap-4">
          <div className={cn(
            "p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110",
            "bg-gradient-to-br",
            typeGradients[article.type]
          )}>
            <TypeIcon className={cn("h-5 w-5", typeIconColors[article.type])} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  {article.isCritical && (
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 animate-pulse" />
                      </TooltipTrigger>
                      <TooltipContent>Artigo crítico</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                  {article.summary}
                </p>
              </div>
              
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCopyLink}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copiar link</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite();
                      }}
                    >
                      {article.isFavorite ? (
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {article.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
              <Badge variant="outline" className={cn("text-xs font-medium", typeConfig?.color)}>
                {typeConfig?.label}
              </Badge>
              {article.categoryName && (
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  {article.categoryName}
                </span>
              )}
              {article.system && (
                <span className="font-medium text-foreground/80">{article.system}</span>
              )}
              <div className="flex items-center gap-3 ml-auto">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {article.views}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {article.helpfulUp}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(article.updatedAt), "dd/MM/yy", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className={cn(
        "relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300",
        "bg-card border border-border/50",
        "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10",
        "group"
      )}
      onClick={handleClick}
    >
      {/* Top gradient bar */}
      <div className={cn(
        "h-1 w-full bg-gradient-to-r",
        article.type === 'FAQ' && "from-blue-500 to-blue-600",
        article.type === 'HOWTO' && "from-emerald-500 to-emerald-600",
        article.type === 'TROUBLESHOOT' && "from-amber-500 to-amber-600",
        article.type === 'RUNBOOK' && "from-purple-500 to-purple-600",
        article.type === 'POLITICA' && "from-slate-500 to-slate-600",
        article.type === 'POSTMORTEM' && "from-red-500 to-red-600",
      )} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className={cn(
            "p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110",
            "bg-gradient-to-br",
            typeGradients[article.type]
          )}>
            <TypeIcon className={cn("h-5 w-5", typeIconColors[article.type])} />
          </div>
          <div className="flex items-center gap-1">
            {article.isCritical && (
              <Tooltip>
                <TooltipTrigger>
                  <div className="p-1.5 rounded-full bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Artigo crítico</TooltipContent>
              </Tooltip>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              {article.isFavorite ? (
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <h3 className="font-semibold mt-3 line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {article.summary}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge variant="outline" className={cn("text-xs font-medium", typeConfig?.color)}>
            {typeConfig?.label}
          </Badge>
          {article.status !== 'PUBLICADO' && statusConfig && (
            <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          )}
          {article.tags?.slice(0, 2).map(tag => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
            </Badge>
          ))}
          {(article.tags?.length || 0) > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{(article.tags?.length || 0) - 2}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.views}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {article.helpfulUp}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(article.updatedAt), "dd/MM/yy", { locale: ptBR })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function KnowledgeBaseListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useUserRole();
  const { startLoading, stopLoading } = useGlobalLoading();
  
  const {
    articles,
    categories,
    tags,
    isLoading,
    toggleFavorite,
    searchArticles,
    getMostViewed,
    getMostHelpful,
    getRecent,
    getFavorites,
    getUniqueSystems,
  } = useKnowledgeBaseArticles();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('all');
  
  // Filtros - usando "all" como valor padrão pois SelectItem não aceita string vazia
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSystem, setFilterSystem] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (isLoading) {
      startLoading('kb-list');
    } else {
      stopLoading('kb-list');
    }
  }, [isLoading, startLoading, stopLoading]);

  const systems = useMemo(() => getUniqueSystems(), [getUniqueSystems]);

  const filteredArticles = useMemo(() => {
    return searchArticles(searchTerm, {
      categoryId: filterCategory !== 'all' ? filterCategory : undefined,
      type: filterType !== 'all' ? filterType as any : undefined,
      system: filterSystem !== 'all' ? filterSystem : undefined,
      status: filterStatus !== 'all' ? filterStatus as any : undefined,
    });
  }, [searchTerm, filterCategory, filterType, filterSystem, filterStatus, searchArticles]);

  const mostViewed = useMemo(() => getMostViewed(4), [getMostViewed]);
  const mostHelpful = useMemo(() => getMostHelpful(4), [getMostHelpful]);
  const recentArticles = useMemo(() => getRecent(6), [getRecent]);
  const favoriteArticles = useMemo(() => getFavorites(), [getFavorites]);

  const hasFilters = filterCategory !== 'all' || filterType !== 'all' || filterSystem !== 'all' || filterStatus !== 'all';

  const clearFilters = () => {
    setFilterCategory('all');
    setFilterType('all');
    setFilterSystem('all');
    setFilterStatus('all');
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value) {
      setSearchParams({ q: value });
    } else {
      setSearchParams({});
    }
  };

  const displayedArticles = activeTab === 'favorites' ? favoriteArticles : filteredArticles;

  return (
    <div className="space-y-6 pb-8">
      <Breadcrumbs isLoading={isLoading} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Base de Conhecimento
              </h1>
              <p className="text-muted-foreground">
                Encontre soluções, tutoriais e procedimentos
              </p>
            </div>
          </div>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => navigate('/base-conhecimento-ti/novo')} 
            className="gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Novo Artigo
          </Button>
        )}
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Busque por erro, sistema, procedimento, VPN..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-12 h-14 text-lg rounded-xl bg-card border-border/50 focus:border-primary/50 transition-colors"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => handleSearch('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-3"
      >
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px] bg-card">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] bg-card">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            {ARTICLE_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSystem} onValueChange={setFilterSystem}>
          <SelectTrigger className="w-[160px] bg-card">
            <SelectValue placeholder="Sistema" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos sistemas</SelectItem>
            {systems.map(sys => (
              <SelectItem key={sys} value={sys}>{sys}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin && (
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {ARTICLE_STATUS.map(status => (
                <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        )}

        <div className="flex-1" />

        <div className="flex rounded-lg border border-border/50 bg-card p-0.5">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Quick Access Sections (when no search/filters) */}
      {!searchTerm && !hasFilters && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Most Viewed - Featured */}
          <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                Mais Acessados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))
                ) : mostViewed.length > 0 ? (
                  mostViewed.map(article => (
                    <QuickAccessCard
                      key={article.id}
                      article={article}
                      variant="featured"
                      onClick={() => navigate(`/base-conhecimento-ti/${article.id}`)}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-2 text-center py-8">
                    Nenhum artigo ainda
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
                  <History className="h-4 w-4 text-emerald-500" />
                </div>
                Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))
                ) : recentArticles.length > 0 ? (
                  recentArticles.map(article => (
                    <QuickAccessCard
                      key={article.id}
                      article={article}
                      onClick={() => navigate(`/base-conhecimento-ti/${article.id}`)}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum artigo ainda
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card/50">
          <TabsTrigger value="all" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Todos ({filteredArticles.length})
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2">
            <Star className="h-4 w-4" />
            Favoritos ({favoriteArticles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className={cn(
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-3"
            )}>
              {[...Array(8)].map((_, i) => (
                viewMode === 'grid' ? (
                  <div key={i} className="bg-card rounded-xl p-4 border border-border/50">
                    <div className="h-1 w-full bg-muted rounded-full mb-4" />
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-5 w-3/4 mt-3" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <Skeleton className="h-4 w-2/3 mt-1" />
                  </div>
                ) : (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                )
              ))}
            </div>
          ) : displayedArticles.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">Nenhum artigo encontrado</p>
              <p className="text-muted-foreground mt-1">
                {searchTerm || hasFilters
                  ? 'Tente ajustar a busca ou os filtros'
                  : 'Comece criando o primeiro artigo'}
              </p>
              {isAdmin && !searchTerm && !hasFilters && (
                <Button 
                  onClick={() => navigate('/base-conhecimento-ti/novo')} 
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Criar artigo
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              className={cn(
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-3"
              )}
            >
              <AnimatePresence mode="popLayout">
                {displayedArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ArticleCard
                      article={article}
                      viewMode={viewMode}
                      onToggleFavorite={() => toggleFavorite(article.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {favoriteArticles.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 mb-4">
                <Star className="h-8 w-8 text-amber-500" />
              </div>
              <p className="text-lg font-medium">Nenhum favorito ainda</p>
              <p className="text-muted-foreground mt-1">
                Clique na estrela nos artigos para adicioná-los aos favoritos
              </p>
            </motion.div>
          ) : (
            <motion.div
              className={cn(
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-3"
              )}
            >
              <AnimatePresence mode="popLayout">
                {favoriteArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ArticleCard
                      article={article}
                      viewMode={viewMode}
                      onToggleFavorite={() => toggleFavorite(article.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
