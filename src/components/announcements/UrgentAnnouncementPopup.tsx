import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ExternalLink, BellOff } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PopupAnnouncement {
  cod_comunicado: string;
  des_titulo: string;
  des_resumo: string;
  des_imagem_url?: string;
  dta_publicacao: string;
  des_popup_modo?: string;
}

export function UrgentAnnouncementPopup() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<PopupAnnouncement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user?.id) return;

    fetchPopupAnnouncements();

    // Listen for immediate popups in real-time
    const channel = supabase
      .channel('popup-announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tab_comunicado',
        },
        (payload) => {
          const announcement = payload.new as PopupAnnouncement & { ind_popup: boolean; des_popup_modo: string };
          if (announcement?.ind_popup && announcement?.des_popup_modo === 'imediato') {
            // Check if already seen
            checkAndAddAnnouncement(announcement);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const checkAndAddAnnouncement = async (announcement: PopupAnnouncement) => {
    if (!user?.id) return;

    const { data: seenData } = await supabase
      .from('tab_comunicado_popup_visto')
      .select('cod_popup_visto')
      .eq('seq_comunicado', announcement.cod_comunicado)
      .eq('seq_usuario', user.id)
      .single();

    if (!seenData) {
      setAnnouncements(prev => {
        if (prev.find(a => a.cod_comunicado === announcement.cod_comunicado)) {
          return prev;
        }
        return [...prev, announcement];
      });
      setIsOpen(true);
    }
  };

  const fetchPopupAnnouncements = async () => {
    if (!user?.id) return;

    try {
      // Get popup announcements that user hasn't marked as "don't show again"
      const { data: announcements, error } = await supabase
        .from('tab_comunicado')
        .select('cod_comunicado, des_titulo, des_resumo, des_imagem_url, dta_publicacao, des_popup_modo')
        .eq('ind_popup', true)
        .eq('ind_ativo', true)
        .order('dta_publicacao', { ascending: false });

      if (error) throw error;

      if (announcements && announcements.length > 0) {
        // Get seen popups
        const { data: seenData } = await supabase
          .from('tab_comunicado_popup_visto')
          .select('seq_comunicado')
          .eq('seq_usuario', user.id);

        const seenIds = new Set((seenData || []).map(s => s.seq_comunicado));

        // Filter out already seen ones
        const unseenAnnouncements = announcements.filter(a => !seenIds.has(a.cod_comunicado));

        if (unseenAnnouncements.length > 0) {
          setAnnouncements(unseenAnnouncements);
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error('Error fetching popup announcements:', error);
    }
  };

  const handleDismiss = useCallback(async () => {
    if (!user?.id || announcements.length === 0) return;

    const currentAnnouncement = announcements[currentIndex];
    if (!currentAnnouncement) return;

    try {
      // Mark popup as seen only if "don't show again" is checked
      if (dontShowAgain[currentAnnouncement.cod_comunicado]) {
        await supabase.from('tab_comunicado_popup_visto').insert({
          seq_comunicado: currentAnnouncement.cod_comunicado,
          seq_usuario: user.id,
        });
      }
    } catch (error) {
      console.error('Error marking popup as seen:', error);
    }

    // Move to next or close
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsOpen(false);
      setAnnouncements([]);
      setCurrentIndex(0);
      setDontShowAgain({});
    }
  }, [user?.id, announcements, currentIndex, dontShowAgain]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleViewFull = () => {
    const currentAnnouncement = announcements[currentIndex];
    if (currentAnnouncement) {
      navigate(`/comunicados/${currentAnnouncement.cod_comunicado}`);
      handleDismiss();
    }
  };

  const toggleDontShowAgain = (id: string) => {
    setDontShowAgain(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (announcements.length === 0) return null;

  const currentAnnouncement = announcements[currentIndex];
  if (!currentAnnouncement) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
          <DialogContent className="max-w-lg p-0 overflow-hidden border-border/50 bg-card">
            <motion.div
              key={currentAnnouncement.cod_comunicado}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Image */}
              {currentAnnouncement.des_imagem_url && (
                <div className="relative w-full h-48 overflow-hidden">
                  <img
                    src={currentAnnouncement.des_imagem_url}
                    alt={currentAnnouncement.des_titulo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                </div>
              )}

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">
                    {currentAnnouncement.des_titulo}
                  </h2>
                  <p className="text-muted-foreground">
                    {currentAnnouncement.des_resumo}
                  </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id={`dont-show-${currentAnnouncement.cod_comunicado}`}
                    checked={dontShowAgain[currentAnnouncement.cod_comunicado] || false}
                    onCheckedChange={() => toggleDontShowAgain(currentAnnouncement.cod_comunicado)}
                  />
                  <label
                    htmlFor={`dont-show-${currentAnnouncement.cod_comunicado}`}
                    className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1.5"
                  >
                    <BellOff className="h-3.5 w-3.5" />
                    Não mostrar novamente
                  </label>
                </div>

                {/* Carousel indicators */}
                {announcements.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 pt-2">
                    {announcements.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          index === currentIndex
                            ? "bg-primary w-6"
                            : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  {announcements.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className="shrink-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDismiss}
                  >
                    {currentIndex < announcements.length - 1 ? 'Próximo' : 'Fechar'}
                  </Button>
                  
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleViewFull}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver Completo
                  </Button>

                  {announcements.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNext}
                      disabled={currentIndex === announcements.length - 1}
                      className="shrink-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Counter */}
                {announcements.length > 1 && (
                  <p className="text-xs text-center text-muted-foreground">
                    {currentIndex + 1} de {announcements.length} comunicados
                  </p>
                )}
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
