import { motion } from 'framer-motion';
import { Star, Clock, Megaphone, ArrowRight, ExternalLink } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard';
import { BannerCarousel } from '@/components/announcements/BannerCarousel';
import { MCScene } from '@/components/3d/MCScene';
import { useTools } from '@/hooks/useTools';
import { useDbAnnouncements } from '@/hooks/useDbAnnouncements';
import { useUser } from '@/contexts/UserContext';
import { Tool } from '@/types/tools';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { toggleFavorite, isFavorite, recordAccess, getFavoriteTools, getRecentTools } = useTools();
  const { activeAnnouncements, bannerAnnouncements } = useDbAnnouncements();

  const favoriteTools = getFavoriteTools();
  const recentTools = getRecentTools(6);

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
            <p className="text-muted-foreground">
              Acesse suas ferramentas favoritas e mantenha-se atualizado com os comunicados.
            </p>
          </div>
        </motion.section>

        {/* Banner Carousel */}
        {bannerAnnouncements.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <BannerCarousel banners={bannerAnnouncements} />
          </motion.section>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Meu Dia */}
          <div className="lg:col-span-2 space-y-8">
            {/* Favoritos - Lista simples */}
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
                <div className="flex flex-wrap gap-2">
                  {favoriteTools.slice(0, 8).map((tool, index) => (
                    <motion.button
                      key={tool.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      onClick={() => handleOpenTool(tool)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/80 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary">
                        {getIcon(tool.icon)}
                      </div>
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {tool.name}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum favorito.{' '}
                  <button
                    onClick={() => navigate('/ferramentas')}
                    className="text-primary hover:underline"
                  >
                    Explore as ferramentas
                  </button>
                </p>
              )}
            </motion.section>

            {/* Recentes - Lista simples */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-info" />
                <h2 className="text-lg font-semibold text-foreground">Recentes</h2>
              </div>
              {recentTools.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {recentTools.map((tool, index) => (
                    <motion.button
                      key={tool.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      onClick={() => handleOpenTool(tool)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/80 border border-border/50 hover:border-info/50 hover:bg-info/5 transition-all group"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-info/10 text-info">
                        {getIcon(tool.icon)}
                      </div>
                      <span className="text-sm font-medium text-foreground group-hover:text-info transition-colors">
                        {tool.name}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum acesso recente.{' '}
                  <button
                    onClick={() => navigate('/ferramentas')}
                    className="text-primary hover:underline"
                  >
                    Explore as ferramentas
                  </button>
                </p>
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
              {activeAnnouncements.slice(0, 4).map((announcement, index) => (
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
