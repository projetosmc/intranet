import { useState, useCallback, useMemo } from 'react';
import { Announcement } from '@/types/tools';
import { initialAnnouncements } from '@/data/tools';
import { useLocalStorage } from './useLocalStorage';

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useLocalStorage<Announcement[]>(
    'mc-hub-announcements', 
    initialAnnouncements
  );

  const activeAnnouncements = useMemo(
    () => announcements.filter(a => a.active).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }),
    [announcements]
  );

  const pinnedAnnouncements = useMemo(
    () => activeAnnouncements.filter(a => a.pinned),
    [activeAnnouncements]
  );

  const addAnnouncement = useCallback((announcement: Omit<Announcement, 'id' | 'publishedAt'>) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: crypto.randomUUID(),
      publishedAt: new Date().toISOString(),
    };
    setAnnouncements(prev => [...prev, newAnnouncement]);
    return newAnnouncement;
  }, [setAnnouncements]);

  const updateAnnouncement = useCallback((id: string, updates: Partial<Announcement>) => {
    setAnnouncements(prev => prev.map(a => 
      a.id === id ? { ...a, ...updates } : a
    ));
  }, [setAnnouncements]);

  const deleteAnnouncement = useCallback((id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }, [setAnnouncements]);

  return {
    announcements: activeAnnouncements,
    allAnnouncements: announcements,
    pinnedAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  };
}
