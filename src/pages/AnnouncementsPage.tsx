import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Megaphone, ArrowLeft, Pin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AnnouncementsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { announcements } = useAnnouncements();

  const selectedAnnouncement = id ? announcements.find(a => a.id === id) : null;

  if (selectedAnnouncement) {
    return (
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/comunicados')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <article className="glass-card p-8">
            <div className="flex items-center gap-2 mb-4">
              {selectedAnnouncement.pinned && (
                <div className="flex items-center gap-1 text-primary text-sm">
                  <Pin className="h-4 w-4" />
                  Comunicado Fixado
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(selectedAnnouncement.publishedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-4">
              {selectedAnnouncement.title}
            </h1>

            <p className="text-lg text-muted-foreground mb-6">
              {selectedAnnouncement.summary}
            </p>

            <div className="prose prose-slate max-w-none">
              <p className="text-foreground whitespace-pre-wrap">
                {selectedAnnouncement.content}
              </p>
            </div>
          </article>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Comunicados</h1>
        </div>
        <p className="text-muted-foreground">
          Fique por dentro das últimas novidades e atualizações
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {announcements.map((announcement, index) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            onClick={() => navigate(`/comunicados/${announcement.id}`)}
            delay={index}
          />
        ))}
      </div>

      {announcements.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center"
        >
          <Megaphone className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum comunicado</h3>
          <p className="text-muted-foreground">
            Não há comunicados disponíveis no momento.
          </p>
        </motion.div>
      )}
    </div>
  );
}
