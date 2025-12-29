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
  Timer
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
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const reservation = {
        seq_sala: selectedRoom,
        seq_usuario: userData.user.id,
        des_nome_solicitante: user?.name || userData.user.email || 'Usuário',
        dta_reserva: format(reservationDate, 'yyyy-MM-dd'),
        hra_inicio: startTime,
        hra_fim: endTime,
        seq_tipo_reuniao: selectedMeetingType || null,
        num_participantes: participants,
        des_observacao: notes || null,
      };

      const { error } = await supabase.from('tab_reserva_sala').insert(reservation);
      if (error) throw error;

      toast({ title: 'Reserva criada com sucesso!' });
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !reservationDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {reservationDate ? format(reservationDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={reservationDate}
                        onSelect={setReservationDate}
                        disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">Hora Início</Label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Hora Fim</Label>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
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

                <Button 
                  onClick={editingReservation ? handleUpdateReservation : handleCreateReservation} 
                  className="w-full"
                >
                  {editingReservation ? 'Salvar Alterações' : 'Reservar Sala'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
