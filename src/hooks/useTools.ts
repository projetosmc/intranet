import { useState, useCallback, useMemo } from 'react';
import { Tool, Favorite, RecentAccess } from '@/types/tools';
import { initialTools } from '@/data/tools';
import { useLocalStorage } from './useLocalStorage';

export function useTools() {
  const [tools, setTools] = useLocalStorage<Tool[]>('mc-hub-tools', initialTools);
  const [favorites, setFavorites] = useLocalStorage<Favorite[]>('mc-hub-favorites', []);
  const [recents, setRecents] = useLocalStorage<RecentAccess[]>('mc-hub-recents', []);

  const activeTools = useMemo(() => tools.filter(t => t.active), [tools]);

  const toggleFavorite = useCallback((toolId: string) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.toolId === toolId);
      if (exists) {
        return prev.filter(f => f.toolId !== toolId);
      }
      return [...prev, { toolId, favoritedAt: new Date().toISOString() }];
    });
  }, [setFavorites]);

  const isFavorite = useCallback((toolId: string) => {
    return favorites.some(f => f.toolId === toolId);
  }, [favorites]);

  const recordAccess = useCallback((toolId: string) => {
    setRecents(prev => {
      const existing = prev.find(r => r.toolId === toolId);
      if (existing) {
        return prev.map(r => 
          r.toolId === toolId 
            ? { ...r, lastAccess: new Date().toISOString(), count: r.count + 1 }
            : r
        );
      }
      return [...prev, { toolId, lastAccess: new Date().toISOString(), count: 1 }];
    });
  }, [setRecents]);

  const getFavoriteTools = useCallback(() => {
    return favorites
      .map(f => activeTools.find(t => t.id === f.toolId))
      .filter((t): t is Tool => t !== undefined);
  }, [favorites, activeTools]);

  const getRecentTools = useCallback((limit = 5) => {
    return recents
      .sort((a, b) => new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime())
      .slice(0, limit)
      .map(r => activeTools.find(t => t.id === r.toolId))
      .filter((t): t is Tool => t !== undefined);
  }, [recents, activeTools]);

  const addTool = useCallback((tool: Omit<Tool, 'id' | 'updatedAt'>) => {
    const newTool: Tool = {
      ...tool,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    setTools(prev => [...prev, newTool]);
    return newTool;
  }, [setTools]);

  const updateTool = useCallback((id: string, updates: Partial<Tool>) => {
    setTools(prev => prev.map(t => 
      t.id === id 
        ? { ...t, ...updates, updatedAt: new Date().toISOString() }
        : t
    ));
  }, [setTools]);

  const deleteTool = useCallback((id: string) => {
    setTools(prev => prev.filter(t => t.id !== id));
    setFavorites(prev => prev.filter(f => f.toolId !== id));
    setRecents(prev => prev.filter(r => r.toolId !== id));
  }, [setTools, setFavorites, setRecents]);

  return {
    tools: activeTools,
    allTools: tools,
    favorites,
    recents,
    toggleFavorite,
    isFavorite,
    recordAccess,
    getFavoriteTools,
    getRecentTools,
    addTool,
    updateTool,
    deleteTool,
    setTools,
  };
}
