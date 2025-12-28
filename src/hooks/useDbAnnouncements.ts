import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Announcement } from '@/types/tools';
import { useToast } from '@/hooks/use-toast';

export function useDbAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('pinned', { ascending: false })
        .order('published_at', { ascending: false });

      if (error) throw error;

      const mapped: Announcement[] = (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        content: item.content,
        pinned: item.pinned ?? false,
        publishedAt: item.published_at,
        active: item.active ?? true,
      }));

      setAnnouncements(mapped);
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
  }, [toast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const addAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id' | 'publishedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: announcement.title,
          summary: announcement.summary,
          content: announcement.content,
          pinned: announcement.pinned,
          active: announcement.active,
        })
        .select()
        .single();

      if (error) throw error;

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

  const updateAnnouncement = useCallback(async (id: string, updates: Partial<Announcement>) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.summary !== undefined) dbUpdates.summary = updates.summary;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.pinned !== undefined) dbUpdates.pinned = updates.pinned;
      if (updates.active !== undefined) dbUpdates.active = updates.active;

      const { error } = await supabase
        .from('announcements')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

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

  return {
    announcements,
    isLoading,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    refetch: fetchAnnouncements,
  };
}
