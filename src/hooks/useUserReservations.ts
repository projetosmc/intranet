import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface para reservas do usuário
 * Mapeamento para tabela: tab_reserva_sala
 */
export interface UserReservation {
  id: string;
  roomId: string;
  roomName: string;
  date: Date;
  startTime: string;
  endTime: string;
  meetingTypeName?: string;
  notes?: string;
  participants: number;
}

/**
 * Hook otimizado para buscar reservas do usuário atual
 * Usa memoização para evitar re-renders desnecessários
 */
export function useUserReservations() {
  const [reservations, setReservations] = useState<UserReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReservations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setReservations([]);
        setIsLoading(false);
        return;
      }

      // Buscar reservas do usuário com joins otimizados
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('tab_reserva_sala')
        .select(`
          cod_reserva,
          seq_sala,
          dta_reserva,
          hra_inicio,
          hra_fim,
          des_observacao,
          num_participantes,
          seq_tipo_reuniao,
          tab_sala_reuniao!inner(des_nome),
          tab_tipo_reuniao(des_nome)
        `)
        .eq('seq_usuario', user.id)
        .gte('dta_reserva', today)
        .order('dta_reserva')
        .order('hra_inicio');

      if (error) throw error;

      const formattedReservations: UserReservation[] = (data || []).map((r: any) => ({
        id: r.cod_reserva,
        roomId: r.seq_sala,
        roomName: r.tab_sala_reuniao?.des_nome || 'Sala',
        date: new Date(r.dta_reserva),
        startTime: r.hra_inicio,
        endTime: r.hra_fim,
        meetingTypeName: r.tab_tipo_reuniao?.des_nome,
        notes: r.des_observacao,
        participants: r.num_participantes || 1,
      }));

      setReservations(formattedReservations);
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Memoizar eventos para o calendário
  const calendarEvents = useMemo(() => {
    return reservations.map(r => ({
      date: r.date,
      title: `🏢 ${r.startTime.slice(0, 5)} - ${r.roomName}`,
      type: 'reservation',
      id: r.id,
      startTime: r.startTime,
      endTime: r.endTime,
    }));
  }, [reservations]);

  // Retornar próximas reuniões (próximas 24h)
  const upcomingMeetings = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return reservations.filter(r => {
      const meetingDate = new Date(r.date);
      const [hours, minutes] = r.startTime.split(':').map(Number);
      meetingDate.setHours(hours, minutes, 0, 0);
      
      return meetingDate >= now && meetingDate <= tomorrow;
    });
  }, [reservations]);

  return {
    reservations,
    calendarEvents,
    upcomingMeetings,
    isLoading,
    refetch: fetchReservations,
  };
}
