import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_date: Date;
  event_type: string;
  created_by?: string;
}

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
        .from('calendar_events')
        .select('*')
        .order('event_date');

      if (error) throw error;

      const formattedEvents = (data || []).map(event => ({
        ...event,
        event_date: new Date(event.event_date),
      }));

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
        .from('calendar_events')
        .insert({
          title: event.title,
          description: event.description,
          event_date: event.event_date.toISOString().split('T')[0],
          event_type: event.event_type,
          created_by: user?.id,
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
      if (event.title) updateData.title = event.title;
      if (event.description !== undefined) updateData.description = event.description;
      if (event.event_date) updateData.event_date = event.event_date.toISOString().split('T')[0];
      if (event.event_type) updateData.event_type = event.event_type;

      const { error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', id);

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
        .from('calendar_events')
        .delete()
        .eq('id', id);

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
