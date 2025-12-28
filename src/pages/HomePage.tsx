import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Clock, Megaphone, Zap, ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolCard } from '@/components/tools/ToolCard';
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard';
import { MCScene } from '@/components/3d/MCScene';
import { useTools } from '@/hooks/useTools';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useUser } from '@/contexts/UserContext';
import { Tool } from '@/types/tools';
import { useNavigate } from 'react-router-dom';

const quickLinks = [
  { name: 'Requisição de Despesas', icon: 'Receipt', url: 'https://despesas.montecarlo.com.br' },
  { name: 'Portal Preços', icon: 'Tags', url: 'https://precos.montecarlo.com.br' },
  { name: 'Pré-fatura', icon: 'FileText', url: 'https://prefatura.montecarlo.com.br' },
  { name: 'Portal Cliente', icon: 'Users', url: 'https://cliente.montecarlo.com.br' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useUser();
  const { tools, toggleFavorite, isFavorite, recordAccess, getFavoriteTools, getRecentTools } = useTools();
  const { announcements } = useAnnouncements();

  const favoriteTools = getFavoriteTools();
  const recentTools = getRecentTools(4);

  const handleOpenTool = (tool: Tool) => {
    recordAccess(tool.id);
    window.open(tool.url, '_blank');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <MCScene />

      <div className="space-y-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {getGreeting()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-muted-foreground mb-6">
              Acesse suas ferramentas favoritas e mantenha-se atualizado com os comunicados.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar ferramentas, páginas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-card/80 backdrop-blur-sm border-border/50 rounded-xl shadow-lg focus:shadow-glow-sm transition-shadow"
              />
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded-md border bg-muted px-2 font-mono text-[11px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </motion.section>

        {/* Quick Links */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Atalhos Rápidos</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {quickLinks.map((link, index) => (
              <motion.a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
                className="glass-card flex items-center gap-3 px-4 py-3 hover-lift group"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  {getIcon(link.icon)}
                </div>
                <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                  {link.name}
                </span>
              </motion.a>
            ))}
          </div>
        </motion.section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Favorites & Recents */}
          <div className="lg:col-span-2 space-y-8">
            {/* Favorites */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-warning" />
                  <h2 className="text-lg font-semibold text-foreground">Favoritos</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/ferramentas')}>
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              {favoriteTools.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favoriteTools.slice(0, 4).map((tool, index) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      isFavorite={true}
                      onFavoriteToggle={toggleFavorite}
                      onOpen={handleOpenTool}
                      delay={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-card p-8 text-center">
                  <Star className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Você ainda não tem favoritos.{' '}
                    <button
                      onClick={() => navigate('/ferramentas')}
                      className="text-primary hover:underline"
                    >
                      Explore as ferramentas
                    </button>
                  </p>
                </div>
              )}
            </motion.section>

            {/* Recent */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-info" />
                  <h2 className="text-lg font-semibold text-foreground">Recentes</h2>
                </div>
              </div>
              {recentTools.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentTools.map((tool, index) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      isFavorite={isFavorite(tool.id)}
                      onFavoriteToggle={toggleFavorite}
                      onOpen={handleOpenTool}
                      delay={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-card p-8 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum acesso recente.{' '}
                    <button
                      onClick={() => navigate('/ferramentas')}
                      className="text-primary hover:underline"
                    >
                      Explore as ferramentas
                    </button>
                  </p>
                </div>
              )}
            </motion.section>
          </div>

          {/* Right Column - Announcements */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Comunicados</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/comunicados')}>
                Ver todos
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 4).map((announcement, index) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onClick={() => navigate(`/comunicados/${announcement.id}`)}
                  delay={index}
                />
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
