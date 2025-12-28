import { motion } from 'framer-motion';
import { Star, ExternalLink } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Tool } from '@/types/tools';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { statusLabels } from '@/data/tools';

interface ToolCardProps {
  tool: Tool;
  isFavorite: boolean;
  onFavoriteToggle: (id: string) => void;
  onOpen: (tool: Tool) => void;
  delay?: number;
}

export function ToolCard({ tool, isFavorite, onFavoriteToggle, onOpen, delay = 0 }: ToolCardProps) {
  const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.Box;

  const statusVariant = {
    PRODUCAO: 'production',
    PILOTO: 'pilot',
    CONSTRUCAO: 'construction',
  }[tool.status] as 'production' | 'pilot' | 'construction';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.05 }}
      whileHover={{ y: -4 }}
      className="glass-card group relative p-5 cursor-pointer hover-lift"
      onClick={() => onOpen(tool)}
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {tool.name}
            </h3>
            <p className="text-xs text-muted-foreground">{tool.area}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-all",
            isFavorite && "opacity-100 text-warning"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle(tool.id);
          }}
        >
          <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </Button>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {tool.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={statusVariant} className="text-[10px]">
            {statusLabels[tool.status]}
          </Badge>
          {tool.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
}
