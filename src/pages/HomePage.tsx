import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, ArrowRight, Calendar, Clock, DoorOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard';
import { BannerCarousel } from '@/components/announcements/BannerCarousel';
import { EventCalendar } from '@/components/calendar/EventCalendar';
import { BirthdayList } from '@/components/birthday/BirthdayList';
import { AnnouncementCardSkeleton } from '@/components/announcements/AnnouncementSkeleton';
import { CalendarSkeleton, BirthdayListSkeleton, UpcomingMeetingsSkeleton } from '@/components/calendar/CalendarSkeleton';
import { useDbAnnouncements } from '@/hooks/useDbAnnouncements';
import { useBirthdays } from '@/hooks/useBirthdays';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useUserReservations } from '@/hooks/useUserReservations';
import { useNotifications } from '@/hooks/useNotifications';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
export default function HomePage() {
  const navigate = useNavigate();
  const {
    user
  } = useUser();
  const {
    activeAnnouncements,
    bannerAnnouncements,
    isLoading: announcementsLoading
  } = useDbAnnouncements();
  const {
    birthdays,
    isLoading: birthdaysLoading
  } = useBirthdays();
  const {
    events: calendarEvents,
    addEvent,
    deleteEvent,
    isLoading: calendarLoading
  } = useCalendarEvents();
  const {
    calendarEvents: reservationEvents,
    upcomingMeetings,
    isLoading: reservationsLoading
  } = useUserReservations();

  // Ativar notificações para reuniões próximas
  useNotifications(upcomingMeetings.map(m => ({
    id: m.id,
    roomName: m.roomName,
    startTime: m.startTime,
    date: m.date
  })));
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Memoizar combinação de eventos para evitar re-renders
  const allEvents = useMemo(() => {
    const birthdayEvents = birthdays.map(b => {
      // birthdayDate já é um Date, mas pode ter problema de timezone
      // Criar novo Date usando ano, mês e dia locais
      const bd = b.birthdayDate;
      return {
        date: new Date(bd.getFullYear(), bd.getMonth(), bd.getDate()),
        title: `🎂 ${b.fullName}`,
        type: 'birthday'
      };
    });
    const calEvents = calendarEvents.map(e => {
      // event_date já é um Date
      const ed = e.event_date;
      return {
        date: new Date(ed.getFullYear(), ed.getMonth(), ed.getDate()),
        title: e.title,
        type: e.event_type,
        id: e.id
      };
    });
    return [...birthdayEvents, ...calEvents, ...reservationEvents];
  }, [birthdays, calendarEvents, reservationEvents]);

  // Formatar data da reunião
  const formatMeetingDate = (date: Date) => {
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "dd/MM", {
      locale: ptBR
    });
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  const meetingCardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, delay: i * 0.08, ease: 'easeOut' },
    }),
  };

  return <div className="relative min-h-[calc(100vh-8rem)]">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.section variants={itemVariants} className="relative">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-foreground mb-2 pt-[20px]">
              {getGreeting()}, <span className="gradient-text">{user?.name}</span>
            </h1>
            <motion.p
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Mantenha-se atualizado com os comunicados da rede.
            </motion.p>
          </div>
        </motion.section>

        {/* Próximas Reuniões */}
        {reservationsLoading ? <motion.section variants={itemVariants}>
            <UpcomingMeetingsSkeleton />
          </motion.section> : upcomingMeetings.length > 0 && <motion.section variants={itemVariants}>
            <div className="glass-card p-4 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Próximas Reuniões</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcomingMeetings.slice(0, 3).map((meeting, i) => <motion.div
                    key={meeting.id}
                    custom={i}
                    variants={meetingCardVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <DoorOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{meeting.roomName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatMeetingDate(meeting.date)} às {meeting.startTime.slice(0, 5)}
                      </p>
                    </div>
                  </motion.div>)}
              </div>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/reserva-salas')}>
                Ver todas as reservas
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </motion.section>}

        {/* Banner Carousel */}
        {bannerAnnouncements.length > 0 && <motion.section variants={itemVariants}>
            <BannerCarousel banners={bannerAnnouncements} />
          </motion.section>}

        {/* Main Content - Split Layout */}
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Announcements */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center justify-between mb-4">
                <motion.div className="flex items-center gap-2" variants={itemVariants}>
                  <Megaphone className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Comunicados</h2>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/comunicados')}>
                    Ver todos
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </motion.div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {announcementsLoading ? <>
                    <AnnouncementCardSkeleton />
                    <AnnouncementCardSkeleton />
                    <AnnouncementCardSkeleton />
                    <AnnouncementCardSkeleton />
                  </> : activeAnnouncements.slice(0, 4).map((announcement, index) => <AnnouncementCard key={announcement.id} announcement={announcement} onClick={() => navigate(`/comunicados/${announcement.id}`)} delay={index} />)}
              </div>
            </motion.div>

            {/* Right Side - Calendar and Birthdays */}
            <motion.div
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="flex items-center gap-2 mb-2" variants={itemVariants}>
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Calendário</h2>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                {calendarLoading ? <CalendarSkeleton /> : <EventCalendar events={allEvents} onAddEvent={addEvent} onDeleteEvent={deleteEvent} />}
              </motion.div>
              
              <motion.div variants={itemVariants}>
                {birthdaysLoading ? <BirthdayListSkeleton /> : <BirthdayList birthdays={birthdays} isLoading={birthdaysLoading} />}
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      </motion.div>
    </div>;
}