import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface Meeting {
  id: string;
  roomName: string;
  startTime: string;
  date: Date;
}

/**
 * Hook para gerenciar notificações de reuniões
 * Notifica 15 minutos antes do início
 */
export function useNotifications(meetings: Meeting[]) {
  const [notifiedMeetings, setNotifiedMeetings] = useState<Set<string>>(new Set());
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      setPermission(perm);
    } else {
      setPermission(Notification.permission);
    }
  }, []);

  // Verificar e enviar notificações
  const checkAndNotify = useCallback(() => {
    const now = new Date();
    const fifteenMinutes = 15 * 60 * 1000;

    meetings.forEach((meeting) => {
      if (notifiedMeetings.has(meeting.id)) return;

      const meetingDate = new Date(meeting.date);
      const [hours, minutes] = meeting.startTime.split(':').map(Number);
      meetingDate.setHours(hours, minutes, 0, 0);

      const timeDiff = meetingDate.getTime() - now.getTime();

      // Notificar se faltam entre 0 e 15 minutos
      if (timeDiff > 0 && timeDiff <= fifteenMinutes) {
        const minutesLeft = Math.ceil(timeDiff / 60000);

        // Toast notification
        toast({
          title: '📅 Reunião em breve!',
          description: `${meeting.roomName} em ${minutesLeft} minuto${minutesLeft > 1 ? 's' : ''}`,
        });

        // Browser notification (se permitido)
        if (permission === 'granted' && 'Notification' in window) {
          new Notification('Reunião em breve!', {
            body: `${meeting.roomName} começa em ${minutesLeft} minuto${minutesLeft > 1 ? 's' : ''}`,
            icon: '/favicon.ico',
            tag: meeting.id,
          });
        }

        setNotifiedMeetings((prev) => new Set([...prev, meeting.id]));
      }
    });
  }, [meetings, notifiedMeetings, permission]);

  // Iniciar verificação periódica
  useEffect(() => {
    requestPermission();
    
    // Verificar imediatamente
    checkAndNotify();

    // Verificar a cada minuto
    intervalRef.current = setInterval(checkAndNotify, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkAndNotify, requestPermission]);

  // Limpar notificações antigas à meia-noite
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      setNotifiedMeetings(new Set());
    }, timeUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, []);

  return {
    permission,
    requestPermission,
    notifiedCount: notifiedMeetings.size,
  };
}
