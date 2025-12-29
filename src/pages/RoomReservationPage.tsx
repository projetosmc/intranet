import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DoorOpen, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Users,
  XCircle,
  Maximize2,
  Minimize2,
  List,
  Grid3X3,
  Edit,
  History,
  Timer,
  Repeat,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { toast } from '@/hooks/use-toast';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isBefore,
  startOfDay,
  differenceInMinutes,
  addWeeks as addWeeksDate,
  addMonths as addMonthsDate,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

type RecurrenceType = 'none' | 'weekly' | 'biweekly' | 'monthly';

interface MeetingRoom {
  cod_sala: string;
  des_nome: string;
  num_capacidade: number;
}

interface MeetingType {
  cod_tipo_reuniao: string;
  des_nome: string;
}

interface HistoryEntry {
  dta_alteracao: string;
  des_campo: string;
  des_valor_anterior: string;
  des_valor_novo: string;
  des_usuario: string;
}

interface Reservation {
  cod_reserva: string;
  seq_sala: string;
  seq_usuario: string;
  des_nome_solicitante: string;
  dta_reserva: string;
  hra_inicio: string;
  hra_fim: string;
  seq_tipo_reuniao: string | null;
  num_participantes: number;
  des_observacao: string | null;
  ind_cancelado: boolean;
  dta_cancelamento: string | null;
  des_motivo_cancelamento: string | null;
  des_historico_alteracoes: HistoryEntry[] | null;
  tab_sala_reuniao?: { des_nome: string };
  tab_tipo_reuniao?: { des_nome: string } | null;
}

type ViewType = 'day' | 'week' | 'month';

export default function RoomReservationPage() {
  const { user } = useUser();
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cancelReservationId, setCancelReservationId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [historyDialogReservation, setHistoryDialogReservation] = useState<Reservation | null>(null);
  
  // Edit mode
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Form state
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [reservationDate, setReservationDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [selectedMeetingType, setSelectedMeetingType] = useState<string>('');
  const [participantsCount, setParticipantsCount] = useState('1');
  const [notes, setNotes] = useState('');
  
  // Recurrence state
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [recurrenceCount, setRecurrenceCount] = useState('4');
  
  // Responsibility confirmation dialog state
  const [showResponsibilityDialog, setShowResponsibilityDialog] = useState(false);
  const [hasAcceptedResponsibility, setHasAcceptedResponsibility] = useState(false);

  // Derived state - selected room capacity
  const selectedRoomData = useMemo(() => 
    rooms.find(r => r.cod_sala === selectedRoom),
    [rooms, selectedRoom]
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [roomsRes, typesRes, reservationsRes] = await Promise.all([
        supabase.from('tab_sala_reuniao').select('cod_sala, des_nome, num_capacidade').eq('ind_ativo', true).order('num_ordem'),
        supabase.from('tab_tipo_reuniao').select('cod_tipo_reuniao, des_nome').eq('ind_ativo', true).order('num_ordem'),
        supabase.from('tab_reserva_sala').select(`
          *,
          tab_sala_reuniao(des_nome),
          tab_tipo_reuniao(des_nome)
        `).order('dta_reserva')
      ]);

      if (roomsRes.error) throw roomsRes.error;
      if (typesRes.error) throw typesRes.error;
      if (reservationsRes.error) throw reservationsRes.error;

      setRooms(roomsRes.data || []);
      setMeetingTypes(typesRes.data || []);
      setReservations((reservationsRes.data || []).map(r => ({
        ...r,
        ind_cancelado: r.ind_cancelado ?? false,
        des_historico_alteracoes: (Array.isArray(r.des_historico_alteracoes) ? r.des_historico_alteracoes : []) as unknown as HistoryEntry[]
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Validate if time is in the past for today
  const isTimeInPast = (date: Date, time: string): boolean => {
    if (!isToday(date)) return false;
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const timeDate = new Date(date);
    timeDate.setHours(hours, minutes, 0, 0);
    return isBefore(timeDate, now);
  };

  // Calculate next available start time based on existing reservations
  const getSmartAvailableTime = (date: Date, roomId: string): { start: string; end: string } => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const roomReservations = reservations
      .filter(r => r.seq_sala === roomId && r.dta_reserva === dateStr && !r.ind_cancelado)
      .sort((a, b) => a.hra_inicio.localeCompare(b.hra_inicio));
    
    const now = new Date();
    let baseStartTime: Date;
    
    if (isToday(date)) {
      // For today, start from current time + 5 minutes
      baseStartTime = new Date(date);
      baseStartTime.setHours(now.getHours(), now.getMinutes() + 5, 0, 0);
    } else {
      // For other dates, start from 08:00
      baseStartTime = new Date(date);
      baseStartTime.setHours(8, 0, 0, 0);
    }
    
    const baseTimeStr = `${String(baseStartTime.getHours()).padStart(2, '0')}:${String(baseStartTime.getMinutes()).padStart(2, '0')}`;
    
    // If no reservations, return base time + 1 hour
    if (roomReservations.length === 0) {
      const endDate = new Date(baseStartTime);
      endDate.setHours(endDate.getHours() + 1);
      const endTimeStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
      return { start: baseTimeStr, end: endTimeStr };
    }
    
    // Find the first available slot after occupied times
    let startTimeStr = baseTimeStr;
    let foundSlot = false;
    
    for (let i = 0; i < roomReservations.length; i++) {
      const current = roomReservations[i];
      const currentStart = current.hra_inicio.slice(0, 5);
      const currentEnd = current.hra_fim.slice(0, 5);
      const next = roomReservations[i + 1];
      
      // If base time is before or during this reservation
      if (startTimeStr < currentEnd) {
        // Start after this reservation ends + 5 minutes
        const [endH, endM] = currentEnd.split(':').map(Number);
        const afterEnd = new Date(date);
        afterEnd.setHours(endH, endM + 5, 0, 0);
        startTimeStr = `${String(afterEnd.getHours()).padStart(2, '0')}:${String(afterEnd.getMinutes()).padStart(2, '0')}`;
        
        // Calculate end time (default 1 hour, or 5 min before next meeting)
        const defaultEnd = new Date(afterEnd);
        defaultEnd.setHours(defaultEnd.getHours() + 1);
        let endTimeStr = `${String(defaultEnd.getHours()).padStart(2, '0')}:${String(defaultEnd.getMinutes()).padStart(2, '0')}`;
        
        if (next) {
          const nextStart = next.hra_inicio.slice(0, 5);
          // If next meeting starts before default end time
          if (nextStart < endTimeStr) {
            // Set end time to 5 min before next meeting
            const [nextH, nextM] = nextStart.split(':').map(Number);
            const beforeNext = new Date(date);
            beforeNext.setHours(nextH, nextM - 5, 0, 0);
            endTimeStr = `${String(beforeNext.getHours()).padStart(2, '0')}:${String(beforeNext.getMinutes()).padStart(2, '0')}`;
          }
        }
        
        // Ensure end time is after start time
        if (endTimeStr > startTimeStr) {
          return { start: startTimeStr, end: endTimeStr };
        }
      }
    }
    
    // If we haven't found a slot yet, start after the last reservation
    const lastReservation = roomReservations[roomReservations.length - 1];
    const [lastEndH, lastEndM] = lastReservation.hra_fim.slice(0, 5).split(':').map(Number);
    const afterLast = new Date(date);
    afterLast.setHours(lastEndH, lastEndM + 5, 0, 0);
    startTimeStr = `${String(afterLast.getHours()).padStart(2, '0')}:${String(afterLast.getMinutes()).padStart(2, '0')}`;
    
    const endDate = new Date(afterLast);
    endDate.setHours(endDate.getHours() + 1);
    const endTimeStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    
    return { start: startTimeStr, end: endTimeStr };
  };

  // Handle date selection and auto-set time based on availability
  const handleReservationDateSelect = (date: Date | undefined) => {
    setReservationDate(date);
    setIsDatePopoverOpen(false);
    
    // Auto-set smart available time when selecting a date
    if (date && selectedRoom && !editingReservation) {
      const { start, end } = getSmartAvailableTime(date, selectedRoom);
      setStartTime(start);
      setEndTime(end);
    }
  };

  // Calculate smart end time based on start time and existing reservations
  const calculateSmartEndTime = (start: string): string => {
    if (!selectedRoom || !reservationDate) {
      // Default: 1 hour after start
      const [startH, startM] = start.split(':').map(Number);
      const endDate = new Date();
      endDate.setHours(startH + 1, startM, 0, 0);
      return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    }
    
    const dateStr = format(reservationDate, 'yyyy-MM-dd');
    const roomReservations = reservations
      .filter(r => 
        r.seq_sala === selectedRoom && 
        r.dta_reserva === dateStr && 
        !r.ind_cancelado &&
        (editingReservation ? r.cod_reserva !== editingReservation.cod_reserva : true)
      )
      .sort((a, b) => a.hra_inicio.localeCompare(b.hra_inicio));
    
    // Default end time: 1 hour after start
    const [startH, startM] = start.split(':').map(Number);
    const defaultEnd = new Date(reservationDate);
    defaultEnd.setHours(startH + 1, startM, 0, 0);
    let endTimeStr = `${String(defaultEnd.getHours()).padStart(2, '0')}:${String(defaultEnd.getMinutes()).padStart(2, '0')}`;
    
    // Find the next reservation after start time
    const nextReservation = roomReservations.find(r => r.hra_inicio.slice(0, 5) > start);
    
    if (nextReservation) {
      const nextStart = nextReservation.hra_inicio.slice(0, 5);
      // If next meeting starts before default end time
      if (nextStart < endTimeStr) {
        // Set end time to 5 min before next meeting
        const [nextH, nextM] = nextStart.split(':').map(Number);
        const beforeNext = new Date(reservationDate);
        beforeNext.setHours(nextH, nextM - 5, 0, 0);
        endTimeStr = `${String(beforeNext.getHours()).padStart(2, '0')}:${String(beforeNext.getMinutes()).padStart(2, '0')}`;
      }
    }
    
    // Ensure end time is after start time
    if (endTimeStr <= start) {
      return `${String(defaultEnd.getHours()).padStart(2, '0')}:${String(defaultEnd.getMinutes()).padStart(2, '0')}`;
    }
    
    return endTimeStr;
  };

  // Handle start time change - auto-update end time
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    
    // Only auto-update end time if not editing an existing reservation
    if (!editingReservation) {
      const smartEndTime = calculateSmartEndTime(newStartTime);
      setEndTime(smartEndTime);
    }
  };

  // Popover state for date picker
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  // Calculate duration
  const calculateDuration = (start: string, end: string): string => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const diff = endMinutes - startMinutes;
    
    if (diff <= 0) return '';
    
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  // Check for time conflicts with existing reservations
  const checkTimeConflict = (
    roomId: string, 
    date: Date, 
    start: string, 
    end: string, 
    excludeReservationId?: string
  ): Reservation | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const roomReservations = reservations.filter(r => 
      r.seq_sala === roomId && 
      r.dta_reserva === dateStr && 
      !r.ind_cancelado &&
      (excludeReservationId ? r.cod_reserva !== excludeReservationId : true)
    );

    for (const reservation of roomReservations) {
      const existingStart = reservation.hra_inicio.slice(0, 5);
      const existingEnd = reservation.hra_fim.slice(0, 5);
      
      // Check if times overlap
      // New reservation starts during existing reservation
      const startsInside = start >= existingStart && start < existingEnd;
      // New reservation ends during existing reservation
      const endsInside = end > existingStart && end <= existingEnd;
      // New reservation completely contains existing reservation
      const containsExisting = start <= existingStart && end >= existingEnd;
      
      if (startsInside || endsInside || containsExisting) {
        return reservation;
      }
    }
    
    return null;
  };

  const handleCreateReservation = async () => {
    if (!selectedRoom || !reservationDate || !startTime || !endTime) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    if (startTime >= endTime) {
      toast({ title: 'Hora de início deve ser anterior à hora de fim', variant: 'destructive' });
      return;
    }

    // Validate date is not in the past
    if (isBefore(startOfDay(reservationDate), startOfDay(new Date()))) {
      toast({ title: 'Não é permitido reservar em datas passadas', variant: 'destructive' });
      return;
    }

    // Validate time is not in the past for today
    if (isTimeInPast(reservationDate, startTime)) {
      toast({ title: 'Não é permitido reservar em horários passados', variant: 'destructive' });
      return;
    }

    // Validate participants count
    const participants = parseInt(participantsCount) || 1;
    if (selectedRoomData && participants > selectedRoomData.num_capacidade) {
      toast({ 
        title: 'Número de participantes excede a capacidade', 
        description: `A sala ${selectedRoomData.des_nome} comporta no máximo ${selectedRoomData.num_capacidade} pessoas.`,
        variant: 'destructive' 
      });
      return;
    }

    // Generate all dates for recurrence
    const datesToReserve: Date[] = [reservationDate];
    if (recurrenceType !== 'none') {
      const count = parseInt(recurrenceCount) || 1;
      for (let i = 1; i < count; i++) {
        if (recurrenceType === 'weekly') {
          datesToReserve.push(addWeeksDate(reservationDate, i));
        } else if (recurrenceType === 'biweekly') {
          datesToReserve.push(addWeeksDate(reservationDate, i * 2));
        } else if (recurrenceType === 'monthly') {
          datesToReserve.push(addMonthsDate(reservationDate, i));
        }
      }
    }

    // Check for time conflicts on all dates
    const conflictDates: string[] = [];
    for (const date of datesToReserve) {
      const conflict = checkTimeConflict(selectedRoom, date, startTime, endTime);
      if (conflict) {
        conflictDates.push(format(date, 'dd/MM/yyyy'));
      }
    }

    if (conflictDates.length > 0) {
      toast({ 
        title: 'Conflito de horário', 
        description: `Já existem reservas nos seguintes dias: ${conflictDates.slice(0, 3).join(', ')}${conflictDates.length > 3 ? ` e mais ${conflictDates.length - 3}` : ''}.`,
        variant: 'destructive' 
      });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      // Create reservations for all dates
      const reservationsToCreate = datesToReserve.map(date => ({
        seq_sala: selectedRoom,
        seq_usuario: userData.user!.id,
        des_nome_solicitante: user?.name || userData.user!.email || 'Usuário',
        dta_reserva: format(date, 'yyyy-MM-dd'),
        hra_inicio: startTime,
        hra_fim: endTime,
        seq_tipo_reuniao: selectedMeetingType || null,
        num_participantes: participants,
        des_observacao: recurrenceType !== 'none' 
          ? `${notes || ''}${notes ? ' | ' : ''}Reserva recorrente (${recurrenceType === 'weekly' ? 'semanal' : 'mensal'})`.trim()
          : (notes || null),
      }));

      const { error } = await supabase.from('tab_reserva_sala').insert(reservationsToCreate);
      if (error) throw error;

      const message = datesToReserve.length > 1 
        ? `${datesToReserve.length} reservas criadas com sucesso!`
        : 'Reserva criada com sucesso!';
      toast({ title: message });
      setIsDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({ title: 'Erro ao criar reserva', variant: 'destructive' });
    }
  };

  const handleUpdateReservation = async () => {
    if (!editingReservation || !selectedRoom || !reservationDate || !startTime || !endTime) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    if (startTime >= endTime) {
      toast({ title: 'Hora de início deve ser anterior à hora de fim', variant: 'destructive' });
      return;
    }

    // Validate date is not in the past
    if (isBefore(startOfDay(reservationDate), startOfDay(new Date()))) {
      toast({ title: 'Não é permitido reservar em datas passadas', variant: 'destructive' });
      return;
    }

    // Validate time is not in the past for today
    if (isTimeInPast(reservationDate, startTime)) {
      toast({ title: 'Não é permitido reservar em horários passados', variant: 'destructive' });
      return;
    }

    // Validate participants count
    const participants = parseInt(participantsCount) || 1;
    if (selectedRoomData && participants > selectedRoomData.num_capacidade) {
      toast({ 
        title: 'Número de participantes excede a capacidade', 
        description: `A sala ${selectedRoomData.des_nome} comporta no máximo ${selectedRoomData.num_capacidade} pessoas.`,
        variant: 'destructive' 
      });
      return;
    }

    // Check for time conflicts (excluding the current reservation being edited)
    const conflictingReservation = checkTimeConflict(
      selectedRoom, 
      reservationDate, 
      startTime, 
      endTime, 
      editingReservation.cod_reserva
    );
    if (conflictingReservation) {
      toast({ 
        title: 'Conflito de horário', 
        description: `Já existe uma reserva nesta sala das ${conflictingReservation.hra_inicio.slice(0, 5)} às ${conflictingReservation.hra_fim.slice(0, 5)}.`,
        variant: 'destructive' 
      });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      // Build history entries for changes
      const changes: HistoryEntry[] = [];
      const now = new Date().toISOString();
      const userName = user?.name || userData.user.email || 'Usuário';

      const newRoom = rooms.find(r => r.cod_sala === selectedRoom);
      const oldRoom = rooms.find(r => r.cod_sala === editingReservation.seq_sala);
      
      if (selectedRoom !== editingReservation.seq_sala) {
        changes.push({
          dta_alteracao: now,
          des_campo: 'Sala',
          des_valor_anterior: oldRoom?.des_nome || '',
          des_valor_novo: newRoom?.des_nome || '',
          des_usuario: userName
        });
      }

      const newDateStr = format(reservationDate, 'yyyy-MM-dd');
      if (newDateStr !== editingReservation.dta_reserva) {
        changes.push({
          dta_alteracao: now,
          des_campo: 'Data',
          des_valor_anterior: format(new Date(editingReservation.dta_reserva + 'T00:00:00'), 'dd/MM/yyyy'),
          des_valor_novo: format(reservationDate, 'dd/MM/yyyy'),
          des_usuario: userName
        });
      }

      if (startTime !== editingReservation.hra_inicio.slice(0, 5)) {
        changes.push({
          dta_alteracao: now,
          des_campo: 'Hora Início',
          des_valor_anterior: editingReservation.hra_inicio.slice(0, 5),
          des_valor_novo: startTime,
          des_usuario: userName
        });
      }

      if (endTime !== editingReservation.hra_fim.slice(0, 5)) {
        changes.push({
          dta_alteracao: now,
          des_campo: 'Hora Fim',
          des_valor_anterior: editingReservation.hra_fim.slice(0, 5),
          des_valor_novo: endTime,
          des_usuario: userName
        });
      }

      const newMeetingType = meetingTypes.find(t => t.cod_tipo_reuniao === selectedMeetingType);
      const oldMeetingType = meetingTypes.find(t => t.cod_tipo_reuniao === editingReservation.seq_tipo_reuniao);
      if (selectedMeetingType !== (editingReservation.seq_tipo_reuniao || '')) {
        changes.push({
          dta_alteracao: now,
          des_campo: 'Tipo de Reunião',
          des_valor_anterior: oldMeetingType?.des_nome || 'Não definido',
          des_valor_novo: newMeetingType?.des_nome || 'Não definido',
          des_usuario: userName
        });
      }

      if (participants !== editingReservation.num_participantes) {
        changes.push({
          dta_alteracao: now,
          des_campo: 'Participantes',
          des_valor_anterior: String(editingReservation.num_participantes),
          des_valor_novo: String(participants),
          des_usuario: userName
        });
      }

      if ((notes || '') !== (editingReservation.des_observacao || '')) {
        changes.push({
          dta_alteracao: now,
          des_campo: 'Observações',
          des_valor_anterior: editingReservation.des_observacao || 'Sem observações',
          des_valor_novo: notes || 'Sem observações',
          des_usuario: userName
        });
      }

      // Merge with existing history
      const existingHistory = editingReservation.des_historico_alteracoes || [];
      const newHistory = [...existingHistory, ...changes];

      const { error } = await supabase
        .from('tab_reserva_sala')
        .update({
          seq_sala: selectedRoom,
          dta_reserva: newDateStr,
          hra_inicio: startTime,
          hra_fim: endTime,
          seq_tipo_reuniao: selectedMeetingType || null,
          num_participantes: participants,
          des_observacao: notes || null,
          des_historico_alteracoes: newHistory as any
        })
        .eq('cod_reserva', editingReservation.cod_reserva);

      if (error) throw error;

      toast({ title: 'Reserva atualizada com sucesso!' });
      setIsDialogOpen(false);
      setEditingReservation(null);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast({ title: 'Erro ao atualizar reserva', variant: 'destructive' });
    }
  };

  const handleCancelReservation = async () => {
    if (!cancelReservationId) return;

    try {
      const { error } = await supabase
        .from('tab_reserva_sala')
        .update({
          ind_cancelado: true,
          dta_cancelamento: new Date().toISOString(),
          des_motivo_cancelamento: cancelReason || null
        })
        .eq('cod_reserva', cancelReservationId);

      if (error) throw error;

      toast({ title: 'Reserva cancelada!' });
      await fetchData();
    } catch (error) {
      console.error('Error canceling reservation:', error);
      toast({ title: 'Erro ao cancelar reserva', variant: 'destructive' });
    } finally {
      setCancelReservationId(null);
      setCancelReason('');
    }
  };

  const openEditDialog = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setSelectedRoom(reservation.seq_sala);
    setReservationDate(new Date(reservation.dta_reserva + 'T00:00:00'));
    setStartTime(reservation.hra_inicio.slice(0, 5));
    setEndTime(reservation.hra_fim.slice(0, 5));
    setSelectedMeetingType(reservation.seq_tipo_reuniao || '');
    setParticipantsCount(String(reservation.num_participantes));
    setNotes(reservation.des_observacao || '');
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedRoom('');
    setReservationDate(undefined);
    setStartTime('09:00');
    setEndTime('10:00');
    setSelectedMeetingType('');
    setParticipantsCount('1');
    setNotes('');
    setEditingReservation(null);
    setRecurrenceType('none');
    setRecurrenceCount('4');
    setHasAcceptedResponsibility(false);
  };
  
  // Handle reserve button click - show responsibility dialog first
  const handleReserveButtonClick = () => {
    if (!selectedRoom || !reservationDate || !startTime || !endTime) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    
    if (startTime >= endTime) {
      toast({ title: 'Hora de início deve ser anterior à hora de fim', variant: 'destructive' });
      return;
    }
    
    // For new reservations, show responsibility dialog
    if (!editingReservation) {
      setShowResponsibilityDialog(true);
    } else {
      // For edits, go straight to update
      handleUpdateReservation();
    }
  };
  
  // Handle responsibility confirmation
  const handleConfirmResponsibility = () => {
    setShowResponsibilityDialog(false);
    handleCreateReservation();
  };

  const getReservationsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations.filter(r => r.dta_reserva === dateStr);
  };

  // Calendar navigation
  const handlePrevious = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });

    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName) => (
          <div key={dayName} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {dayName}
          </div>
        ))}
        {days.map((dayItem, index) => {
          const dayReservations = getReservationsForDate(dayItem);
          const activeReservations = dayReservations.filter(r => !r.ind_cancelado);
          const isCurrentMonth = isSameMonth(dayItem, currentDate);
          const isSelected = selectedDate && isSameDay(dayItem, selectedDate);
          const isTodayDate = isToday(dayItem);

          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDateClick(dayItem)}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors",
                !isCurrentMonth && "text-muted-foreground/40",
                isCurrentMonth && "hover:bg-muted",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                isTodayDate && !isSelected && "bg-primary/10 text-primary font-semibold",
                isFullscreen && "p-2 min-h-[80px]"
              )}
            >
              <span>{format(dayItem, 'd')}</span>
              {activeReservations.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {activeReservations.slice(0, 3).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isSelected ? "bg-primary-foreground" : "bg-primary"
                      )}
                    />
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR });
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((dayItem, index) => {
          const dayReservations = getReservationsForDate(dayItem);
          const activeReservations = dayReservations.filter(r => !r.ind_cancelado);
          const isSelected = selectedDate && isSameDay(dayItem, selectedDate);
          const isTodayDate = isToday(dayItem);

          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDateClick(dayItem)}
              className={cn(
                "flex flex-col items-center p-3 rounded-xl transition-colors",
                "hover:bg-muted",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                isTodayDate && !isSelected && "bg-primary/10 text-primary"
              )}
            >
              <span className="text-xs text-muted-foreground mb-1">
                {format(dayItem, 'EEE', { locale: ptBR })}
              </span>
              <span className="text-lg font-semibold">{format(dayItem, 'd')}</span>
              {activeReservations.length > 0 && (
                <span className={cn(
                  "text-xs mt-1",
                  isSelected ? "text-primary-foreground" : "text-primary"
                )}>
                  {activeReservations.length} reserva{activeReservations.length > 1 ? 's' : ''}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const isTodayDate = isToday(currentDate);

    return (
      <div className="text-center py-4">
        <div className={cn(
          "inline-flex flex-col items-center p-6 rounded-2xl",
          isTodayDate && "bg-primary/10"
        )}>
          <span className="text-muted-foreground text-sm">
            {format(currentDate, 'EEEE', { locale: ptBR })}
          </span>
          <span className="text-5xl font-bold text-foreground my-2">
            {format(currentDate, 'd')}
          </span>
          <span className="text-muted-foreground">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
        </div>
      </div>
    );
  };

  // Selected day reservations (sorted: active first, then canceled)
  const selectedDayReservations = useMemo(() => {
    const dayRes = getReservationsForDate(selectedDate);
    return [...dayRes].sort((a, b) => {
      if (a.ind_cancelado && !b.ind_cancelado) return 1;
      if (!a.ind_cancelado && b.ind_cancelado) return -1;
      return a.hra_inicio.localeCompare(b.hra_inicio);
    });
  }, [reservations, selectedDate]);

  // Get occupied times for selected room and date in the form
  const occupiedTimesForForm = useMemo(() => {
    if (!selectedRoom || !reservationDate) return [];
    const dateStr = format(reservationDate, 'yyyy-MM-dd');
    return reservations.filter(r => 
      r.seq_sala === selectedRoom && 
      r.dta_reserva === dateStr && 
      !r.ind_cancelado &&
      (editingReservation ? r.cod_reserva !== editingReservation.cod_reserva : true)
    ).sort((a, b) => a.hra_inicio.localeCompare(b.hra_inicio));
  }, [selectedRoom, reservationDate, reservations, editingReservation]);

  // Generate available time slots for start time (5-minute intervals, respecting 5-min buffer after reservations)
  const availableStartTimes = useMemo(() => {
    const slots: string[] = [];
    const startHour = 7; // 7:00
    const endHour = 20; // 20:00
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 5) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const timeMinutes = hour * 60 + min;
        
        // For today, skip times in the past (+ 5 min buffer)
        if (reservationDate && isToday(reservationDate)) {
          const now = new Date();
          const nowMinutes = now.getHours() * 60 + now.getMinutes() + 5;
          if (timeMinutes <= nowMinutes) continue;
        }
        
        // Check if this time falls within any existing reservation (including 5-min buffer before)
        let isOccupied = false;
        for (const r of occupiedTimesForForm) {
          const [rStartH, rStartM] = r.hra_inicio.slice(0, 5).split(':').map(Number);
          const [rEndH, rEndM] = r.hra_fim.slice(0, 5).split(':').map(Number);
          const rStartMinutes = rStartH * 60 + rStartM;
          const rEndMinutes = rEndH * 60 + rEndM;
          
          // Time is occupied if it's within reservation or less than 5 min after it ends
          // Also block times that are less than 5 min before a reservation starts
          if (timeMinutes >= rStartMinutes - 5 && timeMinutes < rEndMinutes + 5) {
            isOccupied = true;
            break;
          }
        }
        
        if (!isOccupied) {
          slots.push(timeStr);
        }
      }
    }
    
    return slots;
  }, [reservationDate, occupiedTimesForForm]);

  // Generate available time slots for end time (5-minute intervals, must end 5 min before next reservation)
  const availableEndTimes = useMemo(() => {
    const slots: string[] = [];
    const startHour = 7;
    const endHour = 21; // Allow ending at 21:00
    
    const [startH, startM] = startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    
    // Find the next reservation after start time to limit end time options (with 5-min buffer)
    let maxEndMinutes = 21 * 60; // Default: 21:00
    for (const r of occupiedTimesForForm) {
      const [rStartH, rStartM] = r.hra_inicio.slice(0, 5).split(':').map(Number);
      const rStartMinutes = rStartH * 60 + rStartM;
      if (rStartMinutes > startMinutes) {
        // End time must be at least 5 min before next reservation
        maxEndMinutes = rStartMinutes - 5;
        break;
      }
    }
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let min = 0; min < 60; min += 5) {
        const timeMinutes = hour * 60 + min;
        
        // Must be after start time (at least 5 min)
        if (timeMinutes <= startMinutes + 5) continue;
        
        // Must be at or before the max end time
        if (timeMinutes > maxEndMinutes) continue;
        
        const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    
    return slots;
  }, [startTime, occupiedTimesForForm]);

  const duration = calculateDuration(startTime, endTime);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DoorOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Reserva de Salas</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Reserva
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingReservation ? 'Editar Reserva' : 'Nova Reserva de Sala'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="mb-1.5 block">Sala</Label>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma sala" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map(room => (
                        <SelectItem key={room.cod_sala} value={room.cod_sala}>
                          <div className="flex items-center gap-2">
                            <span>{room.des_nome}</span>
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {room.num_capacidade}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-1.5 block">Nome do Solicitante</Label>
                  <Input value={user?.name || ''} disabled className="bg-muted" />
                </div>

                <div>
                  <Label className="mb-1.5 block">Data da Reserva</Label>
                  <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn("w-full justify-start text-left font-normal", !reservationDate && "text-muted-foreground")}
                        disabled={!selectedRoom}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {!selectedRoom 
                          ? "Selecione uma sala primeiro" 
                          : reservationDate 
                            ? format(reservationDate, "PPP", { locale: ptBR }) 
                            : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={reservationDate}
                        onSelect={handleReservationDateSelect}
                        disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                        initialFocus
                        locale={ptBR}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Visual timeline of occupied times */}
                {selectedRoom && reservationDate && occupiedTimesForForm.length > 0 && (
                  <div className="bg-muted/30 border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Horários ocupados nesta sala em {format(reservationDate, "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {occupiedTimesForForm.map((r) => (
                        <Badge 
                          key={r.cod_reserva} 
                          variant="secondary" 
                          className="bg-destructive/10 text-destructive border-destructive/20"
                        >
                          {r.hra_inicio.slice(0, 5)} - {r.hra_fim.slice(0, 5)}
                        </Badge>
                      ))}
                    </div>
                    {/* Visual timeline bar */}
                    <div className="mt-3 relative h-6 bg-muted rounded-full overflow-hidden">
                      {/* Hour markers */}
                      <div className="absolute inset-0 flex justify-between px-1">
                        {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((hour) => (
                          <div key={hour} className="flex flex-col items-center">
                            <div className="w-px h-2 bg-muted-foreground/30" />
                            <span className="text-[8px] text-muted-foreground/50">{hour}</span>
                          </div>
                        ))}
                      </div>
                      {/* Occupied blocks */}
                      {occupiedTimesForForm.map((r) => {
                        const [startH, startM] = r.hra_inicio.split(':').map(Number);
                        const [endH, endM] = r.hra_fim.split(':').map(Number);
                        const dayStart = 7; // 7am
                        const dayEnd = 20; // 8pm
                        const totalMinutes = (dayEnd - dayStart) * 60;
                        const startMinutes = (startH - dayStart) * 60 + startM;
                        const endMinutes = (endH - dayStart) * 60 + endM;
                        const left = Math.max(0, (startMinutes / totalMinutes) * 100);
                        const width = Math.min(100 - left, ((endMinutes - startMinutes) / totalMinutes) * 100);
                        
                        return (
                          <div
                            key={r.cod_reserva}
                            className="absolute top-0 h-4 bg-destructive/60 rounded"
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                            }}
                            title={`${r.hra_inicio.slice(0, 5)} - ${r.hra_fim.slice(0, 5)}: ${r.des_nome_solicitante}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedRoom && reservationDate && occupiedTimesForForm.length === 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-xs text-primary">
                        Todos os horários disponíveis nesta sala em {format(reservationDate, "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">Hora Início</Label>
                    <Select value={startTime} onValueChange={handleStartTimeChange} disabled={!reservationDate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {availableStartTimes.length > 0 ? (
                          availableStartTimes.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                            Nenhum horário disponível
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Hora Fim</Label>
                    <Select value={endTime} onValueChange={setEndTime} disabled={!reservationDate || !startTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {availableEndTimes.length > 0 ? (
                          availableEndTimes.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                            Nenhum horário disponível
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {duration && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                    <Timer className="h-4 w-4" />
                    <span>Duração: <strong className="text-foreground">{duration}</strong></span>
                  </div>
                )}

                <div>
                  <Label className="mb-1.5 block">Tipo de Reunião</Label>
                  <Select value={selectedMeetingType} onValueChange={setSelectedMeetingType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {meetingTypes.map(type => (
                        <SelectItem key={type.cod_tipo_reuniao} value={type.cod_tipo_reuniao}>{type.des_nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-1.5 block">
                    Número de Participantes
                    {selectedRoomData && (
                      <span className="text-muted-foreground font-normal ml-2">
                        (máx: {selectedRoomData.num_capacidade})
                      </span>
                    )}
                  </Label>
                  <Input 
                    type="number" 
                    value={participantsCount} 
                    onChange={(e) => setParticipantsCount(e.target.value)} 
                    min={1}
                    max={selectedRoomData?.num_capacidade}
                  />
                  {selectedRoomData && parseInt(participantsCount) > selectedRoomData.num_capacidade && (
                    <p className="text-destructive text-xs mt-1">
                      Excede a capacidade máxima da sala ({selectedRoomData.num_capacidade} pessoas)
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-1.5 block">Observações</Label>
                  <Textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Informações adicionais..."
                    rows={3}
                  />
                </div>

                {/* Recurrence options - only for new reservations */}
                {!editingReservation && (
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center gap-3">
                      <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Repetir:</span>
                      <Select value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as RecurrenceType)}>
                        <SelectTrigger className="h-8 w-auto text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Não repetir</SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                          <SelectItem value="biweekly">Quinzenalmente</SelectItem>
                          <SelectItem value="monthly">Mensalmente</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {recurrenceType !== 'none' && (
                        <>
                          <span className="text-xs text-muted-foreground">por</span>
                          <Input 
                            type="number" 
                            value={recurrenceCount} 
                            onChange={(e) => setRecurrenceCount(e.target.value)} 
                            min={2}
                            max={12}
                            className="h-8 w-16 text-xs"
                          />
                          <span className="text-xs text-muted-foreground">
                            {recurrenceType === 'weekly' ? 'semanas' : recurrenceType === 'biweekly' ? 'quinzenas' : 'meses'}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {recurrenceType !== 'none' && reservationDate && parseInt(recurrenceCount) > 1 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Array.from({ length: Math.min(parseInt(recurrenceCount) || 2, 12) }, (_, i) => {
                          let date: Date;
                          if (recurrenceType === 'weekly') {
                            date = addWeeksDate(reservationDate, i);
                          } else if (recurrenceType === 'biweekly') {
                            date = addWeeksDate(reservationDate, i * 2);
                          } else {
                            date = addMonthsDate(reservationDate, i);
                          }
                          return (
                            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                              {format(date, 'dd/MM')}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  onClick={handleReserveButtonClick} 
                  className="w-full"
                >
                  {editingReservation ? 'Salvar Alterações' : 'Reservar Sala'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Responsibility Confirmation Dialog */}
          <AlertDialog open={showResponsibilityDialog} onOpenChange={setShowResponsibilityDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <DoorOpen className="h-5 w-5 text-primary" />
                  Termo de Responsabilidade
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-left">
                    <p>
                      Ao reservar esta sala de reunião, você declara estar ciente e concorda com as seguintes responsabilidades:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li>
                        <strong>Integridade da sala:</strong> Você é responsável pela integridade da sala de reunião, incluindo todos os equipamentos, móveis e materiais disponíveis.
                      </li>
                      <li>
                        <strong>Organização e limpeza:</strong> Ao término da reunião, a sala deve ser deixada organizada e limpa, pronta para o próximo uso.
                      </li>
                      <li>
                        <strong>Manutenção:</strong> Em caso de necessidade de reparo ou qualquer problema identificado nos equipamentos ou instalações, você deve informar imediatamente a equipe de manutenção.
                      </li>
                      <li>
                        <strong>Uso adequado:</strong> Os equipamentos devem ser utilizados de forma adequada e responsável.
                      </li>
                    </ul>
                    
                    <div className="flex items-start gap-3 pt-3 border-t border-border">
                      <Checkbox
                        id="accept-responsibility"
                        checked={hasAcceptedResponsibility}
                        onCheckedChange={(checked) => setHasAcceptedResponsibility(checked === true)}
                        className="mt-0.5"
                      />
                      <label htmlFor="accept-responsibility" className="text-sm cursor-pointer leading-tight">
                        Li e estou ciente de todas as instruções acima, e me comprometo a seguir as diretrizes de uso responsável da sala de reunião.
                      </label>
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setHasAcceptedResponsibility(false)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleConfirmResponsibility}
                  disabled={!hasAcceptedResponsibility}
                  className={cn(!hasAcceptedResponsibility && "opacity-50 cursor-not-allowed")}
                >
                  Confirmar Reserva
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Main Content - Split Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* Calendar - Compact */}
          <div className={cn(
            "lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden flex flex-col",
            isFullscreen && "fixed inset-4 z-50 lg:col-span-1"
          )}>
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleToday}>
                  Hoje
                </Button>
                <h2 className="text-sm font-semibold ml-2">
                  {format(currentDate, view === 'day' ? "d 'de' MMMM yyyy" : "MMMM yyyy", { locale: ptBR })}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex bg-muted rounded-md p-0.5">
                  <Button
                    variant={view === 'day' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setView('day')}
                    className="h-7 px-2 text-xs"
                  >
                    <List className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={view === 'week' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setView('week')}
                    className="h-7 px-2 text-xs"
                  >
                    <Grid3X3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={view === 'month' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setView('month')}
                    className="h-7 px-2 text-xs"
                  >
                    <CalendarIcon className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 p-3 overflow-auto">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={view}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {view === 'month' && renderMonthView()}
                    {view === 'week' && renderWeekView()}
                    {view === 'day' && renderDayView()}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Selected Day Details */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
            </div>

            <div className="flex-1 overflow-auto">
              {selectedDayReservations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <DoorOpen className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">Nenhuma reserva para este dia</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => {
                      setReservationDate(selectedDate);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Reservar
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayReservations.map((reservation) => {
                    const resDuration = calculateDuration(reservation.hra_inicio, reservation.hra_fim);
                    const hasHistory = reservation.des_historico_alteracoes && reservation.des_historico_alteracoes.length > 0;
                    
                    return (
                      <motion.div
                        key={reservation.cod_reserva}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "p-3 rounded-lg transition-colors",
                          reservation.ind_cancelado 
                            ? "bg-destructive/10 border border-destructive/20" 
                            : "bg-muted/50 hover:bg-muted/70"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {reservation.ind_cancelado && (
                                <Badge variant="destructive" className="text-xs">
                                  Cancelada
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {reservation.hra_inicio.slice(0, 5)} - {reservation.hra_fim.slice(0, 5)}
                              </Badge>
                              {resDuration && (
                                <Badge variant="secondary" className="text-xs">
                                  <Timer className="h-3 w-3 mr-1" />
                                  {resDuration}
                                </Badge>
                              )}
                              <span className={cn(
                                "font-medium text-sm truncate",
                                reservation.ind_cancelado && "line-through text-muted-foreground"
                              )}>
                                {reservation.tab_sala_reuniao?.des_nome}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1.5 space-y-0.5">
                              <p className="truncate">{reservation.des_nome_solicitante}</p>
                              <div className="flex items-center gap-2">
                                {reservation.tab_tipo_reuniao && (
                                  <span>{reservation.tab_tipo_reuniao.des_nome}</span>
                                )}
                                <span className="flex items-center">
                                  <Users className="h-3 w-3 mr-0.5" />
                                  {reservation.num_participantes}
                                </span>
                              </div>
                            </div>
                            {reservation.des_observacao && (
                              <p className="text-xs text-muted-foreground mt-1 italic truncate">
                                {reservation.des_observacao}
                              </p>
                            )}
                            {reservation.ind_cancelado && reservation.des_motivo_cancelamento && (
                              <p className="text-xs text-destructive mt-1">
                                Motivo: {reservation.des_motivo_cancelamento}
                              </p>
                            )}
                            {hasHistory && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 mt-1 text-xs text-primary"
                                onClick={() => setHistoryDialogReservation(reservation)}
                              >
                                <History className="h-3 w-3 mr-1" />
                                Ver alterações ({reservation.des_historico_alteracoes!.length})
                              </Button>
                            )}
                          </div>
                          {!reservation.ind_cancelado && (
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openEditDialog(reservation)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setCancelReservationId(reservation.cod_reserva)}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelReservationId} onOpenChange={(open) => { if (!open) { setCancelReservationId(null); setCancelReason(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Reserva</AlertDialogTitle>
            <AlertDialogDescription>
              A reserva será marcada como cancelada e permanecerá visível no histórico do dia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label className="mb-1.5 block text-sm">Motivo do cancelamento (opcional)</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Informe o motivo do cancelamento..."
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelReservation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancelar Reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Dialog */}
      <Dialog open={!!historyDialogReservation} onOpenChange={(o) => !o && setHistoryDialogReservation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Alterações
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-auto">
            {historyDialogReservation?.des_historico_alteracoes?.map((entry, index) => (
              <div key={index} className="border border-border rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{entry.des_campo}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.dta_alteracao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">De:</span>
                    <span className="line-through text-destructive">{entry.des_valor_anterior}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Para:</span>
                    <span className="text-primary font-medium">{entry.des_valor_novo}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Por: {entry.des_usuario}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
