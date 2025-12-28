import { motion } from 'framer-motion';
import { Megaphone, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard';
import { BannerCarousel } from '@/components/announcements/BannerCarousel';
import { EventCalendar } from '@/components/calendar/EventCalendar';
import { BirthdayList } from '@/components/birthday/BirthdayList';
import { MCScene } from '@/components/3d/MCScene';
import { useDbAnnouncements } from '@/hooks/useDbAnnouncements';
import { useBirthdays } from '@/hooks/useBirthdays';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { activeAnnouncements, bannerAnnouncements } = useDbAnnouncements();
  const { birthdays, isLoading: birthdaysLoading } = useBirthdays();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Convert birthdays to calendar events
  const birthdayEvents = birthdays.map(b => ({
    date: b.birthdayDate,
    title: `🎂 ${b.fullName}`,
    type: 'birthday'
  }));

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <MCScene />

      <div className="space-y-6">
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

        {/* Main Content - Split Layout */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Announcements */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Comunicados</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/comunicados')}>
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeAnnouncements.slice(0, 4).map((announcement, index) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onClick={() => navigate(`/comunicados/${announcement.id}`)}
                    delay={index}
                  />
                ))}
              </div>
            </div>

            {/* Right Side - Calendar and Birthdays */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Calendário</h2>
              </div>
              
              <EventCalendar events={birthdayEvents} />
              
              <BirthdayList birthdays={birthdays} isLoading={birthdaysLoading} />
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}