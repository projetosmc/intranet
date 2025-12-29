import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Interface para eventos do calendário
 * Mapeamento para tabela: tab_evento_calendario
 */
export interface CalendarEvent {
  /** cod_evento - Identificador único do evento (UUID) */
  id: string;
  /** des_titulo - Título do evento */
  title: string;
  /** des_descricao - Descrição detalhada do evento */
  description?: string;
  /** dta_evento - Data do evento */
  event_date: Date;
  /** des_tipo_evento - Tipo do evento (general, meeting, holiday, etc.) */
  event_type: string;
  /** seq_criado_por - ID do usuário que criou o evento */
  created_by?: string;
}

/**
 * Hook para gerenciamento de eventos do calendário
 * 
 * Tabela: tab_evento_calendario
 * Colunas:
 * - cod_evento (PK): UUID do evento
 * - des_titulo: Título do evento
 * - des_descricao: Descrição do evento
 * - dta_evento: Data do evento (DATE)
 * - des_tipo_evento: Tipo do evento
 * - seq_criado_por: FK para o usuário criador
 * - dta_cadastro: Data de criação
 * - dta_atualizacao: Data de atualização
 * 
 * RLS: Admins podem gerenciar, usuários autenticados podem visualizar
 */
export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tab_evento_calendario')
        .select('*')
        .order('dta_evento');

      if (error) throw error;

      const formattedEvents: CalendarEvent[] = (data || []).map(event => {
        // Criar Date evitando problemas de timezone
        // dta_evento vem como 'YYYY-MM-DD'
        const [year, month, day] = event.dta_evento.split('-').map(Number);
        return {
          id: event.cod_evento,
          title: event.des_titulo,
          description: event.des_descricao || undefined,
          event_date: new Date(year, month - 1, day),
          event_type: event.des_tipo_evento || 'general',
          created_by: event.seq_criado_por || undefined,
        };
      });

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addEvent = async (event: Omit<CalendarEvent, 'id' | 'created_by'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('tab_evento_calendario')
        .insert({
          des_titulo: event.title,
          des_descricao: event.description,
          dta_evento: event.event_date.toISOString().split('T')[0],
          des_tipo_evento: event.event_type,
          seq_criado_por: user?.id,
        });

      if (error) throw error;

      await fetchEvents();
      toast({ title: 'Evento criado!' });
      return true;
    } catch (error) {
      console.error('Error adding event:', error);
      toast({ title: 'Erro ao criar evento', variant: 'destructive' });
      return false;
    }
  };

  const updateEvent = async (id: string, event: Partial<CalendarEvent>) => {
    try {
      const updateData: any = {};
      if (event.title) updateData.des_titulo = event.title;
      if (event.description !== undefined) updateData.des_descricao = event.description;
      if (event.event_date) updateData.dta_evento = event.event_date.toISOString().split('T')[0];
      if (event.event_type) updateData.des_tipo_evento = event.event_type;

      const { error } = await supabase
        .from('tab_evento_calendario')
        .update(updateData)
        .eq('cod_evento', id);

      if (error) throw error;

      await fetchEvents();
      toast({ title: 'Evento atualizado!' });
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      toast({ title: 'Erro ao atualizar evento', variant: 'destructive' });
      return false;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tab_evento_calendario')
        .delete()
        .eq('cod_evento', id);

      if (error) throw error;

      await fetchEvents();
      toast({ title: 'Evento removido!' });
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({ title: 'Erro ao remover evento', variant: 'destructive' });
      return false;
    }
  };

  return {
    events,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
}
