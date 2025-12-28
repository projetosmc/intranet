import { useState, useCallback, useMemo, useEffect } from 'react';
import { Announcement } from '@/types/tools';
import { initialAnnouncements } from '@/data/tools';
import { useLocalStorage } from './useLocalStorage';
import { supabase } from '@/integrations/supabase/client';

export function useAnnouncements() {
  const [localAnnouncements, setLocalAnnouncements] = useLocalStorage<Announcement[]>(
    'mc-hub-announcements', 
    initialAnnouncements
  );
  const [webflowAnnouncements, setWebflowAnnouncements] = useState<Announcement[]>([]);
  const [source, setSource] = useState<'local' | 'webflow' | 'loading'>('loading');
  const [error, setError] = useState<string | null>(null);

  // Fetch from Webflow via Edge Function
  useEffect(() => {
    const fetchWebflowAnnouncements = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('webflow-comunicados');
        
        if (error) {
          console.error('Edge function error:', error);
          setSource('local');
          return;
        }

        if (data?.announcements?.length > 0) {
          setWebflowAnnouncements(data.announcements);
          setSource('webflow');
          console.log('Loaded announcements from Webflow:', data.announcements.length);
        } else {
          setSource('local');
          console.log('No Webflow announcements, using local fallback');
        }
      } catch (err) {
        console.error('Failed to fetch from Webflow:', err);
        setSource('local');
      }
    };

    fetchWebflowAnnouncements();
  }, []);

  // Use Webflow announcements if available, otherwise local
  const announcements = useMemo(() => {
    const items = source === 'webflow' ? webflowAnnouncements : localAnnouncements;
    return items
      .filter(a => a.active)
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
  }, [source, webflowAnnouncements, localAnnouncements]);

  const pinnedAnnouncements = useMemo(
    () => announcements.filter(a => a.pinned),
    [announcements]
  );

  // Local management functions (for fallback)
  const addAnnouncement = useCallback((announcement: Omit<Announcement, 'id' | 'publishedAt'>) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: crypto.randomUUID(),
      publishedAt: new Date().toISOString(),
    };
    setLocalAnnouncements(prev => [...prev, newAnnouncement]);
    return newAnnouncement;
  }, [setLocalAnnouncements]);

  const updateAnnouncement = useCallback((id: string, updates: Partial<Announcement>) => {
    setLocalAnnouncements(prev => prev.map(a => 
      a.id === id ? { ...a, ...updates } : a
    ));
  }, [setLocalAnnouncements]);

  const deleteAnnouncement = useCallback((id: string) => {
    setLocalAnnouncements(prev => prev.filter(a => a.id !== id));
  }, [setLocalAnnouncements]);

  const refetch = useCallback(async () => {
    setSource('loading');
    try {
      const { data, error } = await supabase.functions.invoke('webflow-comunicados');
      
      if (error || !data?.announcements?.length) {
        setSource('local');
        return;
      }

      setWebflowAnnouncements(data.announcements);
      setSource('webflow');
    } catch {
      setSource('local');
    }
  }, []);

  return {
    announcements,
    allAnnouncements: source === 'webflow' ? webflowAnnouncements : localAnnouncements,
    pinnedAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    source,
    isLoading: source === 'loading',
    refetch,
  };
}
