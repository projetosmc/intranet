import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RichTextContent } from '@/components/ui/rich-text-editor';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';

interface UrgentAnnouncement {
  cod_comunicado: string;
  des_titulo: string;
  des_conteudo: string;
  des_resumo: string;
  des_imagem_url?: string;
  dta_publicacao: string;
}

export function UrgentAnnouncementPopup() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [urgentAnnouncement, setUrgentAnnouncement] = useState<UrgentAnnouncement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Fetch pending urgent announcements
    fetchUrgentAnnouncements();

    // Listen for new urgent announcements in real-time
    const channel = supabase
      .channel('urgent-announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tab_comunicado',
          filter: 'ind_popup=eq.true'
        },
        (payload) => {
          const newAnnouncement = payload.new as UrgentAnnouncement;
          if (newAnnouncement) {
            setUrgentAnnouncement(newAnnouncement);
            setIsOpen(true);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tab_comunicado',
          filter: 'ind_popup=eq.true'
        },
        (payload) => {
          const updatedAnnouncement = payload.new as UrgentAnnouncement & { ind_popup: boolean };
          if (updatedAnnouncement && updatedAnnouncement.ind_popup) {
            setUrgentAnnouncement(updatedAnnouncement);
            setIsOpen(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchUrgentAnnouncements = async () => {
    if (!user?.id) return;

    try {
      // Get urgent announcements that user hasn't seen
      const { data: announcements, error } = await supabase
        .from('tab_comunicado')
        .select('cod_comunicado, des_titulo, des_conteudo, des_resumo, des_imagem_url, dta_publicacao')
        .eq('ind_popup', true)
        .eq('ind_ativo', true)
        .order('dta_publicacao', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (announcements && announcements.length > 0) {
        const announcement = announcements[0];

        // Check if user has already seen this popup
        const { data: seenData } = await supabase
          .from('tab_comunicado_popup_visto')
          .select('cod_popup_visto')
          .eq('seq_comunicado', announcement.cod_comunicado)
          .eq('seq_usuario', user.id)
          .single();

        if (!seenData) {
          setUrgentAnnouncement(announcement);
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error('Error fetching urgent announcements:', error);
    }
  };

  const handleDismiss = async () => {
    if (!user?.id || !urgentAnnouncement) return;

    try {
      // Mark popup as seen
      await supabase.from('tab_comunicado_popup_visto').insert({
        seq_comunicado: urgentAnnouncement.cod_comunicado,
        seq_usuario: user.id,
      });
    } catch (error) {
      console.error('Error marking popup as seen:', error);
    }

    setIsOpen(false);
    setUrgentAnnouncement(null);
  };

  const handleViewFull = () => {
    if (urgentAnnouncement) {
      navigate(`/comunicados/${urgentAnnouncement.cod_comunicado}`);
      handleDismiss();
    }
  };

  if (!urgentAnnouncement) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
          <DialogContent className="max-w-lg border-destructive/50 bg-destructive/5">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <DialogHeader>
                <div className="flex items-center gap-3 text-destructive">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <AlertTriangle className="h-6 w-6" />
                  </motion.div>
                  <DialogTitle className="text-xl text-destructive">
                    {urgentAnnouncement.des_titulo}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {urgentAnnouncement.des_imagem_url && (
                  <img
                    src={urgentAnnouncement.des_imagem_url}
                    alt={urgentAnnouncement.des_titulo}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                <p className="text-muted-foreground font-medium">
                  {urgentAnnouncement.des_resumo}
                </p>

                <div className="prose prose-sm dark:prose-invert max-w-none max-h-60 overflow-y-auto">
                  <RichTextContent html={urgentAnnouncement.des_conteudo} />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDismiss}
                  >
                    Entendi
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={handleViewFull}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver Completo
                  </Button>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
