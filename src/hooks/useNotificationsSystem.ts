import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  userId: string;
  originUserId?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  originUser?: {
    name: string;
    avatarUrl?: string;
  };
}

export function useNotificationsSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tab_notificacao')
        .select('*')
        .eq('seq_usuario', user.id)
        .order('dta_cadastro', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch origin users
      const originUserIds = [...new Set((data || []).filter((n: any) => n.seq_usuario_origem).map((n: any) => n.seq_usuario_origem))];
      let profileMap = new Map();

      if (originUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('tab_perfil_usuario')
          .select('cod_usuario, des_nome_completo, des_avatar_url')
          .in('cod_usuario', originUserIds);

        profileMap = new Map(
          (profiles || []).map((p: any) => [p.cod_usuario, {
            name: p.des_nome_completo || 'Usuário',
            avatarUrl: p.des_avatar_url || undefined,
          }])
        );
      }

      const mappedNotifications: Notification[] = (data || []).map((item: any) => ({
        id: item.cod_notificacao,
        userId: item.seq_usuario,
        originUserId: item.seq_usuario_origem || undefined,
        type: item.des_tipo,
        title: item.des_titulo,
        message: item.des_mensagem,
        link: item.des_link || undefined,
        read: item.ind_lida || false,
        createdAt: item.dta_cadastro,
        originUser: item.seq_usuario_origem ? profileMap.get(item.seq_usuario_origem) : undefined,
      }));

      setNotifications(mappedNotifications);
      setUnreadCount(mappedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tab_notificacao',
          filter: `seq_usuario=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('tab_notificacao')
        .update({ ind_lida: true })
        .eq('cod_notificacao', notificationId)
        .eq('seq_usuario', user.id);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('tab_notificacao')
        .update({ ind_lida: true })
        .eq('seq_usuario', user.id)
        .eq('ind_lida', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('tab_notificacao')
        .delete()
        .eq('cod_notificacao', notificationId)
        .eq('seq_usuario', user.id);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user]);

  const createNotification = useCallback(async (
    targetUserId: string,
    type: string,
    title: string,
    message: string,
    link?: string
  ) => {
    if (!user || targetUserId === user.id) return; // Don't notify self

    try {
      await supabase
        .from('tab_notificacao')
        .insert({
          seq_usuario: targetUserId,
          seq_usuario_origem: user.id,
          des_tipo: type,
          des_titulo: title,
          des_mensagem: message,
          des_link: link,
        });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refetch: fetchNotifications,
  };
}
