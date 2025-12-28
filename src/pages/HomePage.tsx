import { motion } from 'framer-motion';
import { Megaphone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard';
import { BannerCarousel } from '@/components/announcements/BannerCarousel';
import { MCScene } from '@/components/3d/MCScene';
import { useDbAnnouncements } from '@/hooks/useDbAnnouncements';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { activeAnnouncements, bannerAnnouncements } = useDbAnnouncements();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
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
              Mantenha-se atualizado com os comunicados da rede.
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

        {/* Announcements Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Comunicados</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/comunicados')}>
              Ver todos
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAnnouncements.slice(0, 6).map((announcement, index) => (
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
  );
}