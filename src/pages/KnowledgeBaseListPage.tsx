import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Filter,
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

const typeIcons: Record<string, any> = {
  FAQ: FileQuestion,
  HOWTO: BookOpen,
  TROUBLESHOOT: Wrench,
  RUNBOOK: FileText,
  POLITICA: Shield,
  POSTMORTEM: AlertCircle,
};

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
    navigate(`/base-conhecimento/${article.id}`);
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="glass-card rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={handleClick}
      >
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-2 rounded-lg shrink-0",
            typeConfig?.color || "bg-muted"
          )}>
            <TypeIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{article.title}</h3>
                  {article.isCritical && (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                  {article.summary}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
              >
                {article.isFavorite ? (
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                ) : (
                  <StarOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              <Badge variant="outline" className={cn("text-xs", typeConfig?.color)}>
                {typeConfig?.label}
              </Badge>
              {article.categoryName && (
                <span>{article.categoryName}</span>
              )}
              {article.system && (
                <span className="font-medium">{article.system}</span>
              )}
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.views}
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                {article.helpfulUp}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(article.updatedAt), "dd/MM/yy", { locale: ptBR })}
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
      className="glass-card rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className={cn("p-2 rounded-lg", typeConfig?.color || "bg-muted")}>
            <TypeIcon className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1">
            {article.isCritical && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
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

        <h3 className="font-semibold mt-3 line-clamp-2">{article.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {article.summary}
        </p>

        <div className="flex flex-wrap gap-1 mt-3">
          <Badge variant="outline" className={cn("text-xs", typeConfig?.color)}>
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

        <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
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
  
  // Filtros
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterSystem, setFilterSystem] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

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
      categoryId: filterCategory || undefined,
      type: filterType as any || undefined,
      system: filterSystem || undefined,
      status: filterStatus as any || undefined,
    });
  }, [searchTerm, filterCategory, filterType, filterSystem, filterStatus, searchArticles]);

  const mostViewed = useMemo(() => getMostViewed(4), [getMostViewed]);
  const mostHelpful = useMemo(() => getMostHelpful(4), [getMostHelpful]);
  const recentArticles = useMemo(() => getRecent(4), [getRecent]);
  const favoriteArticles = useMemo(() => getFavorites(), [getFavorites]);

  const hasFilters = filterCategory || filterType || filterSystem || filterStatus;

  const clearFilters = () => {
    setFilterCategory('');
    setFilterType('');
    setFilterSystem('');
    setFilterStatus('');
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
    <div className="space-y-6">
      <Breadcrumbs isLoading={isLoading} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Base de Conhecimento</h1>
          <p className="text-muted-foreground mt-1">
            Encontre soluções, tutoriais e procedimentos
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate('/base-conhecimento/novo')} className="gap-2">
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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Busque por erro, sistema, procedimento, VPN..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-12 h-12 text-lg"
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-3"
      >
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas categorias</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos tipos</SelectItem>
            {ARTICLE_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSystem} onValueChange={setFilterSystem}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sistema" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos sistemas</SelectItem>
            {systems.map(sys => (
              <SelectItem key={sys} value={sys}>{sys}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin && (
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos status</SelectItem>
              {ARTICLE_STATUS.map(status => (
                <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        )}

        <div className="flex-1" />

        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
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
          className="space-y-6"
        >
          {/* Most Viewed */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Mais Acessados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))
                ) : mostViewed.length > 0 ? (
                  mostViewed.map(article => (
                    <div
                      key={article.id}
                      onClick={() => navigate(`/base-conhecimento/${article.id}`)}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    >
                      <p className="font-medium line-clamp-2 text-sm">{article.title}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {article.views} visualizações
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-4 text-center py-4">
                    Nenhum artigo ainda
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))
                ) : recentArticles.length > 0 ? (
                  recentArticles.map(article => (
                    <div
                      key={article.id}
                      onClick={() => navigate(`/base-conhecimento/${article.id}`)}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    >
                      <p className="font-medium line-clamp-2 text-sm">{article.title}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(article.updatedAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-4 text-center py-4">
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
        <TabsList>
          <TabsTrigger value="all">
            Todos ({filteredArticles.length})
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-1">
            <Star className="h-4 w-4" />
            Favoritos ({favoriteArticles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className={cn(
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-3"
            )}>
              {[...Array(8)].map((_, i) => (
                viewMode === 'grid' ? (
                  <div key={i} className="glass-card rounded-xl p-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-5 w-3/4 mt-3" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <Skeleton className="h-4 w-2/3 mt-1" />
                  </div>
                ) : (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                )
              ))}
            </div>
          ) : displayedArticles.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum artigo encontrado</p>
              <p className="text-muted-foreground">
                {searchTerm || hasFilters
                  ? 'Tente ajustar a busca ou os filtros'
                  : 'Comece criando o primeiro artigo'}
              </p>
            </div>
          ) : (
            <motion.div
              className={cn(
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-3"
              )}
            >
              <AnimatePresence mode="popLayout">
                {displayedArticles.map(article => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    viewMode={viewMode}
                    onToggleFavorite={() => toggleFavorite(article.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-4">
          {favoriteArticles.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum favorito ainda</p>
              <p className="text-muted-foreground">
                Clique na estrela nos artigos para adicioná-los aos favoritos
              </p>
            </div>
          ) : (
            <motion.div
              className={cn(
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-3"
              )}
            >
              <AnimatePresence mode="popLayout">
                {favoriteArticles.map(article => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    viewMode={viewMode}
                    onToggleFavorite={() => toggleFavorite(article.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
