import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Grid3X3, LayoutList, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToolCard } from '@/components/tools/ToolCard';
import { useTools } from '@/hooks/useTools';
import { Tool, ToolStatus } from '@/types/tools';
import { areas, statusLabels } from '@/data/tools';

type SortOption = 'name' | 'recent' | 'popular';

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<ToolStatus | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { tools, toggleFavorite, isFavorite, recordAccess, recents } = useTools();

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tools.forEach(tool => tool.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [tools]);

  // Filter and sort tools
  const filteredTools = useMemo(() => {
    let result = [...tools];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Area filter
    if (selectedArea !== 'all') {
      result = result.filter(tool => tool.area === selectedArea);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter(tool => tool.status === selectedStatus);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      result = result.filter(tool =>
        selectedTags.every(tag => tool.tags.includes(tag))
      );
    }

    // Sorting
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
        const recentMap = new Map(recents.map(r => [r.toolId, new Date(r.lastAccess).getTime()]));
        result.sort((a, b) => (recentMap.get(b.id) || 0) - (recentMap.get(a.id) || 0));
        break;
      case 'popular':
        const countMap = new Map(recents.map(r => [r.toolId, r.count]));
        result.sort((a, b) => (countMap.get(b.id) || 0) - (countMap.get(a.id) || 0));
        break;
    }

    return result;
  }, [tools, searchQuery, selectedArea, selectedStatus, selectedTags, sortBy, recents]);

  const handleOpenTool = (tool: Tool) => {
    recordAccess(tool.id);
    window.open(tool.url, '_blank');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedArea('all');
    setSelectedStatus('all');
    setSelectedTags([]);
    setSortBy('name');
  };

  const hasActiveFilters = searchQuery || selectedArea !== 'all' || selectedStatus !== 'all' || selectedTags.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">Catálogo de Ferramentas</h1>
        <p className="text-muted-foreground">
          Explore todas as ferramentas disponíveis na Monte Carlo
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-card p-4 space-y-4"
      >
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ferramentas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Area Filter */}
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              {areas.map(area => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as ToolStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="PRODUCAO">Em Produção</SelectItem>
              <SelectItem value="PILOTO">Em Piloto</SelectItem>
              <SelectItem value="CONSTRUCAO">Em Construção</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">A-Z</SelectItem>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="popular">Mais usados</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Tags:
          </span>
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7">
              <X className="h-3 w-3 mr-1" />
              Limpar filtros
            </Button>
          </div>
        )}
      </motion.div>

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="text-sm text-muted-foreground"
      >
        {filteredTools.length} ferramenta{filteredTools.length !== 1 ? 's' : ''} encontrada{filteredTools.length !== 1 ? 's' : ''}
      </motion.div>

      {/* Tools Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${filteredTools.length}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {filteredTools.map((tool, index) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isFavorite={isFavorite(tool.id)}
              onFavoriteToggle={toggleFavorite}
              onOpen={handleOpenTool}
              delay={index}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredTools.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center"
        >
          <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma ferramenta encontrada</h3>
          <p className="text-muted-foreground mb-4">
            Tente ajustar os filtros ou buscar por outros termos.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </motion.div>
      )}
    </div>
  );
}
