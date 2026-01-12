import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Announcement, PollOption, TemplateType, PollType, AnnouncementAuthor, PopupMode, ImagePosition } from '@/types/announcements';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logAudit } from '@/hooks/useAuditLog';

/**
 * Hook para gerenciamento de comunicados/anúncios
 */
export function useDbAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tab_comunicado')
        .select('*')
        .order('ind_fixado', { ascending: false })
        .order('dta_publicacao', { ascending: false });

      if (error) throw error;

      // Fetch poll options and author info for announcements
      const announcementsWithPolls: Announcement[] = await Promise.all(
        (data || []).map(async (item: any) => {
          let pollOptions: PollOption[] = [];
          let author: AnnouncementAuthor | undefined;
          let viewsCount = 0;

          // Buscar autor
          if (item.seq_usuario_publicacao) {
            const { data: profileData } = await supabase
              .from('tab_perfil_usuario')
              .select('cod_usuario, des_nome_completo, des_avatar_url')
              .eq('cod_usuario', item.seq_usuario_publicacao)
              .single();

            if (profileData) {
              author = {
                id: profileData.cod_usuario,
                name: profileData.des_nome_completo || 'Usuário',
                avatarUrl: profileData.des_avatar_url || undefined,
              };
            }
          }

          // Buscar contagem de visualizações
          const { count: viewCount } = await supabase
            .from('tab_comunicado_visualizacao')
            .select('*', { count: 'exact', head: true })
            .eq('seq_comunicado', item.cod_comunicado);

          viewsCount = viewCount || 0;

          // Buscar contagem de comentários
          let commentsCount = 0;
          const { count: commentCount } = await supabase
            .from('tab_comunicado_comentario')
            .select('*', { count: 'exact', head: true })
            .eq('seq_comunicado', item.cod_comunicado);

          commentsCount = commentCount || 0;

          if (item.des_tipo_template === 'poll') {
            const { data: optionsData } = await supabase
              .from('tab_enquete_opcao')
              .select('cod_opcao, des_texto_opcao')
              .eq('seq_comunicado', item.cod_comunicado);

            if (optionsData) {
              pollOptions = await Promise.all(
                optionsData.map(async (opt) => {
                  const { count } = await supabase
                    .from('tab_enquete_voto')
                    .select('*', { count: 'exact', head: true })
                    .eq('seq_opcao', opt.cod_opcao);

                  let userVoted = false;
                  if (user) {
                    const { data: voteData } = await supabase
                      .from('tab_enquete_voto')
                      .select('cod_voto')
                      .eq('seq_opcao', opt.cod_opcao)
                      .eq('seq_usuario', user.id)
                      .maybeSingle();
                    userVoted = !!voteData;
                  }

                  return {
                    id: opt.cod_opcao,
                    optionText: opt.des_texto_opcao,
                    voteCount: count || 0,
                    userVoted,
                  };
                })
              );
            }
          }

          return {
            id: item.cod_comunicado,
            title: item.des_titulo,
            summary: item.des_resumo,
            content: item.des_conteudo,
            pinned: item.ind_fixado ?? false,
            publishedAt: item.dta_publicacao,
            active: item.ind_ativo ?? true,
            templateType: (item.des_tipo_template as TemplateType) || 'simple',
            imageUrl: item.des_imagem_url || undefined,
            pollType: (item.des_tipo_enquete as PollType) || undefined,
            pollOptions,
            author,
            startDate: item.dta_inicio || undefined,
            endDate: item.dta_fim || undefined,
            viewsCount,
            commentsCount,
            allowComments: item.ind_permite_comentarios ?? false,
            isUrgent: item.ind_urgente ?? false,
            isPopup: item.ind_popup ?? false,
            popupMode: (item.des_popup_modo as PopupMode) || 'proximo_login',
            imagePosition: (item.des_posicao_imagem as ImagePosition) || 'center',
          };
        })
      );

      setAnnouncements(announcementsWithPolls);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os comunicados.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user?.id]);

  useEffect(() => {
    // Only fetch when auth is ready
    if (!authLoading) {
      fetchAnnouncements();
    }
  }, [fetchAnnouncements, authLoading]);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('announcements')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer upload da imagem.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const addAnnouncement = useCallback(async (
    announcement: Omit<Announcement, 'id' | 'publishedAt' | 'pollOptions' | 'author' | 'viewsCount'>,
    pollOptions?: string[]
  ) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('tab_comunicado')
        .insert({
          des_titulo: announcement.title,
          des_resumo: announcement.summary,
          des_conteudo: announcement.content,
          ind_fixado: announcement.pinned,
          ind_ativo: announcement.active,
          des_tipo_template: announcement.templateType,
          des_imagem_url: announcement.imageUrl,
          des_tipo_enquete: announcement.pollType,
          seq_usuario_publicacao: currentUser?.id,
          dta_inicio: announcement.startDate || null,
          dta_fim: announcement.endDate || null,
          ind_permite_comentarios: announcement.allowComments ?? false,
          ind_urgente: announcement.isUrgent ?? false,
          ind_popup: announcement.isPopup ?? false,
          des_popup_modo: announcement.popupMode || 'proximo_login',
          des_posicao_imagem: announcement.imagePosition || 'center',
        })
        .select()
        .single();

      if (error) throw error;

      // Add poll options if it's a poll
      if (announcement.templateType === 'poll' && pollOptions?.length) {
        const { error: optionsError } = await supabase
          .from('tab_enquete_opcao')
          .insert(
            pollOptions.map((text) => ({
              seq_comunicado: data.cod_comunicado,
              des_texto_opcao: text,
            }))
          );

        if (optionsError) throw optionsError;
      }

      await logAudit({
        action: 'announcement_created',
        entity_type: 'announcement',
        entity_id: data.cod_comunicado,
        new_value: { titulo: announcement.title, tipo: announcement.templateType }
      });

      toast({
        title: 'Sucesso',
        description: 'Comunicado criado com sucesso.',
      });

      await fetchAnnouncements();
      return data;
    } catch (error) {
      console.error('Error adding announcement:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o comunicado.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast, fetchAnnouncements]);

  const updateAnnouncement = useCallback(async (
    id: string, 
    updates: Partial<Announcement>,
    pollOptions?: string[]
  ) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.des_titulo = updates.title;
      if (updates.summary !== undefined) dbUpdates.des_resumo = updates.summary;
      if (updates.content !== undefined) dbUpdates.des_conteudo = updates.content;
      if (updates.pinned !== undefined) dbUpdates.ind_fixado = updates.pinned;
      if (updates.active !== undefined) dbUpdates.ind_ativo = updates.active;
      if (updates.templateType !== undefined) dbUpdates.des_tipo_template = updates.templateType;
      if (updates.imageUrl !== undefined) dbUpdates.des_imagem_url = updates.imageUrl;
      if (updates.pollType !== undefined) dbUpdates.des_tipo_enquete = updates.pollType;
      if (updates.startDate !== undefined) dbUpdates.dta_inicio = updates.startDate || null;
      if (updates.endDate !== undefined) dbUpdates.dta_fim = updates.endDate || null;
      if (updates.allowComments !== undefined) dbUpdates.ind_permite_comentarios = updates.allowComments;
      if (updates.isUrgent !== undefined) dbUpdates.ind_urgente = updates.isUrgent;
      if (updates.isPopup !== undefined) dbUpdates.ind_popup = updates.isPopup;
      if (updates.popupMode !== undefined) dbUpdates.des_popup_modo = updates.popupMode;
      if (updates.imagePosition !== undefined) dbUpdates.des_posicao_imagem = updates.imagePosition;

      const { error } = await supabase
        .from('tab_comunicado')
        .update(dbUpdates)
        .eq('cod_comunicado', id);

      if (error) throw error;

      // Update poll options if provided
      if (pollOptions !== undefined) {
        await supabase.from('tab_enquete_opcao').delete().eq('seq_comunicado', id);
        
        if (pollOptions.length > 0) {
          await supabase.from('tab_enquete_opcao').insert(
            pollOptions.map((text) => ({
              seq_comunicado: id,
              des_texto_opcao: text,
            }))
          );
        }
      }

      await logAudit({
        action: 'announcement_updated',
        entity_type: 'announcement',
        entity_id: id,
        new_value: dbUpdates
      });

      toast({
        title: 'Sucesso',
        description: 'Comunicado atualizado com sucesso.',
      });

      await fetchAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o comunicado.',
        variant: 'destructive',
      });
    }
  }, [toast, fetchAnnouncements]);

  const registerView = useCallback(async (announcementId: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('tab_comunicado_visualizacao')
        .upsert({
          seq_comunicado: announcementId,
          seq_usuario: user.id,
        }, { onConflict: 'seq_comunicado,seq_usuario' });
    } catch (error) {
      console.error('Error registering view:', error);
    }
  }, [user]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    try {
      // Buscar dados antes de deletar para o log
      const announcementToDelete = announcements.find(a => a.id === id);
      
      const { error } = await supabase
        .from('tab_comunicado')
        .delete()
        .eq('cod_comunicado', id);

      if (error) throw error;

      await logAudit({
        action: 'announcement_deleted',
        entity_type: 'announcement',
        entity_id: id,
        old_value: announcementToDelete ? { titulo: announcementToDelete.title, tipo: announcementToDelete.templateType } : undefined
      });

      toast({
        title: 'Sucesso',
        description: 'Comunicado excluído com sucesso.',
      });

      await fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o comunicado.',
        variant: 'destructive',
      });
    }
  }, [toast, fetchAnnouncements, announcements]);

  const vote = useCallback(async (optionId: string) => {
    if (!user) return;

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('tab_enquete_voto')
        .select('cod_voto')
        .eq('seq_opcao', optionId)
        .eq('seq_usuario', user.id)
        .maybeSingle();

      if (existingVote) {
        // Remove vote
        await supabase.from('tab_enquete_voto').delete().eq('cod_voto', existingVote.cod_voto);
      } else {
        // Add vote
        await supabase.from('tab_enquete_voto').insert({
          seq_opcao: optionId,
          seq_usuario: user.id,
        });
      }

      await fetchAnnouncements();
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar seu voto.',
        variant: 'destructive',
      });
    }
  }, [user, toast, fetchAnnouncements]);

  // Filtrar comunicados ativos considerando agendamento
  const filterScheduledAnnouncements = useCallback((items: Announcement[]) => {
    const now = new Date();
    return items.filter((a) => {
      if (!a.active) return false;
      
      // Se tem data de início e ainda não chegou, não exibir
      if (a.startDate && new Date(a.startDate) > now) return false;
      
      // Se tem data de fim e já passou, não exibir
      if (a.endDate && new Date(a.endDate) < now) return false;
      
      return true;
    });
  }, []);

  return {
    announcements,
    activeAnnouncements: filterScheduledAnnouncements(announcements),
    bannerAnnouncements: filterScheduledAnnouncements(announcements).filter(
      (a) => a.templateType === 'banner' && a.imageUrl
    ),
    isLoading,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    uploadImage,
    vote,
    registerView,
    refetch: fetchAnnouncements,
  };
}
