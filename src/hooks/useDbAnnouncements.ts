import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Announcement, PollOption, TemplateType, PollType } from '@/types/tools';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useDbAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('pinned', { ascending: false })
        .order('published_at', { ascending: false });

      if (error) throw error;

      // Fetch poll options for poll type announcements
      const announcementsWithPolls: Announcement[] = await Promise.all(
        (data || []).map(async (item) => {
          let pollOptions: PollOption[] = [];

          if (item.template_type === 'poll') {
            const { data: optionsData } = await supabase
              .from('poll_options')
              .select('id, option_text')
              .eq('announcement_id', item.id);

            if (optionsData) {
              pollOptions = await Promise.all(
                optionsData.map(async (opt) => {
                  const { count } = await supabase
                    .from('poll_votes')
                    .select('*', { count: 'exact', head: true })
                    .eq('option_id', opt.id);

                  let userVoted = false;
                  if (user) {
                    const { data: voteData } = await supabase
                      .from('poll_votes')
                      .select('id')
                      .eq('option_id', opt.id)
                      .eq('user_id', user.id)
                      .maybeSingle();
                    userVoted = !!voteData;
                  }

                  return {
                    id: opt.id,
                    optionText: opt.option_text,
                    voteCount: count || 0,
                    userVoted,
                  };
                })
              );
            }
          }

          return {
            id: item.id,
            title: item.title,
            summary: item.summary,
            content: item.content,
            pinned: item.pinned ?? false,
            publishedAt: item.published_at,
            active: item.active ?? true,
            templateType: (item.template_type as TemplateType) || 'simple',
            imageUrl: item.image_url || undefined,
            pollType: (item.poll_type as PollType) || undefined,
            pollOptions,
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
  }, [toast, user]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

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
    announcement: Omit<Announcement, 'id' | 'publishedAt' | 'pollOptions'>,
    pollOptions?: string[]
  ) => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: announcement.title,
          summary: announcement.summary,
          content: announcement.content,
          pinned: announcement.pinned,
          active: announcement.active,
          template_type: announcement.templateType,
          image_url: announcement.imageUrl,
          poll_type: announcement.pollType,
        })
        .select()
        .single();

      if (error) throw error;

      // Add poll options if it's a poll
      if (announcement.templateType === 'poll' && pollOptions?.length) {
        const { error: optionsError } = await supabase
          .from('poll_options')
          .insert(
            pollOptions.map((text) => ({
              announcement_id: data.id,
              option_text: text,
            }))
          );

        if (optionsError) throw optionsError;
      }

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
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.summary !== undefined) dbUpdates.summary = updates.summary;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.pinned !== undefined) dbUpdates.pinned = updates.pinned;
      if (updates.active !== undefined) dbUpdates.active = updates.active;
      if (updates.templateType !== undefined) dbUpdates.template_type = updates.templateType;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
      if (updates.pollType !== undefined) dbUpdates.poll_type = updates.pollType;

      const { error } = await supabase
        .from('announcements')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      // Update poll options if provided
      if (pollOptions !== undefined) {
        await supabase.from('poll_options').delete().eq('announcement_id', id);
        
        if (pollOptions.length > 0) {
          await supabase.from('poll_options').insert(
            pollOptions.map((text) => ({
              announcement_id: id,
              option_text: text,
            }))
          );
        }
      }

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

  const deleteAnnouncement = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
  }, [toast, fetchAnnouncements]);

  const vote = useCallback(async (optionId: string) => {
    if (!user) return;

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('option_id', optionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVote) {
        // Remove vote
        await supabase.from('poll_votes').delete().eq('id', existingVote.id);
      } else {
        // Add vote
        await supabase.from('poll_votes').insert({
          option_id: optionId,
          user_id: user.id,
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

  return {
    announcements,
    activeAnnouncements: announcements.filter((a) => a.active),
    bannerAnnouncements: announcements.filter((a) => a.active && a.templateType === 'banner' && a.imageUrl),
    isLoading,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    uploadImage,
    vote,
    refetch: fetchAnnouncements,
  };
}
