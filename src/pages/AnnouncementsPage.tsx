import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, ArrowLeft, Pin, Calendar, RefreshCw, Image, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard';
import { PollCard } from '@/components/announcements/PollCard';
import { AnnouncementsPageSkeleton } from '@/components/announcements/AnnouncementSkeleton';
import { RichTextContent } from '@/components/ui/rich-text-editor';
import { useDbAnnouncements } from '@/hooks/useDbAnnouncements';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const templateIcons = {
  simple: FileText,
  banner: Image,
  poll: BarChart3,
};

export default function AnnouncementsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeAnnouncements, isLoading, refetch, vote, registerView } = useDbAnnouncements();

  const selectedAnnouncement = id ? activeAnnouncements.find(a => a.id === id) : null;

  // Registrar visualização quando acessar o comunicado
  useEffect(() => {
    if (selectedAnnouncement) {
      registerView(selectedAnnouncement.id);
    }
  }, [selectedAnnouncement, registerView]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (selectedAnnouncement) {
    const Icon = templateIcons[selectedAnnouncement.templateType];

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
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <Badge variant="outline" className="gap-1">
                <Icon className="h-3 w-3" />
                {selectedAnnouncement.templateType === 'simple' ? 'Comunicado' :
                 selectedAnnouncement.templateType === 'banner' ? 'Banner' : 'Enquete'}
              </Badge>
              {selectedAnnouncement.pinned && (
                <div className="flex items-center gap-1 text-primary text-sm">
                  <Pin className="h-4 w-4" />
                  Fixado
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(selectedAnnouncement.publishedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>

            {selectedAnnouncement.templateType === 'banner' && selectedAnnouncement.imageUrl && (
              <div className="rounded-xl overflow-hidden mb-6">
                <img
                  src={selectedAnnouncement.imageUrl}
                  alt={selectedAnnouncement.title}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            <h1 className="text-2xl font-bold text-foreground mb-4">
              {selectedAnnouncement.title}
            </h1>

            <p className="text-lg text-muted-foreground mb-6">
              {selectedAnnouncement.summary}
            </p>

            {selectedAnnouncement.templateType === 'poll' ? (
              <PollCard announcement={selectedAnnouncement} onVote={vote} />
            ) : (
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <RichTextContent html={selectedAnnouncement.content} />
              </div>
            )}

            {/* Rodapé com autor */}
            {selectedAnnouncement.author && (
              <div className="mt-8 pt-6 border-t border-border flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {selectedAnnouncement.author.avatarUrl ? (
                    <AvatarImage src={selectedAnnouncement.author.avatarUrl} alt={selectedAnnouncement.author.name} />
                  ) : null}
                  <AvatarFallback>
                    {getInitials(selectedAnnouncement.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Publicado por</p>
                  <p className="font-medium">{selectedAnnouncement.author.name}</p>
                </div>
              </div>
            )}
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Comunicados</h1>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        <p className="text-muted-foreground">
          Fique por dentro das últimas novidades e atualizações
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeAnnouncements.map((announcement, index) => (
          announcement.templateType === 'poll' ? (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PollCard announcement={announcement} onVote={vote} />
            </motion.div>
          ) : (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onClick={() => navigate(`/comunicados/${announcement.id}`)}
              delay={index}
            />
          )
        ))}
      </div>

      {activeAnnouncements.length === 0 && !isLoading && (
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

      {isLoading && <AnnouncementsPageSkeleton />}
    </div>
  );
}
