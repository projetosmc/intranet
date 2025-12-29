import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DoorOpen, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Users,
  Trash2,
  Maximize2,
  Minimize2,
  List,
  Grid3X3
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
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
}

interface MeetingType {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  room_id: string;
  user_id: string;
  requester_name: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  meeting_type_id: string | null;
  participants_count: number;
  notes: string | null;
  meeting_rooms?: { name: string };
  meeting_types?: { name: string } | null;
}

type ViewType = 'day' | 'week' | 'month';

export default function RoomReservationPage() {
  const { user } = useUser();
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteReservationId, setDeleteReservationId] = useState<string | null>(null);
  
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [roomsRes, typesRes, reservationsRes] = await Promise.all([
        supabase.from('meeting_rooms').select('id, name, capacity').eq('active', true).order('sort_order'),
        supabase.from('meeting_types').select('id, name').eq('active', true).order('sort_order'),
        supabase.from('room_reservations').select(`
          *,
          meeting_rooms(name),
          meeting_types(name)
        `).order('reservation_date')
      ]);

      if (roomsRes.error) throw roomsRes.error;
      if (typesRes.error) throw typesRes.error;
      if (reservationsRes.error) throw reservationsRes.error;

      setRooms(roomsRes.data || []);
      setMeetingTypes(typesRes.data || []);
      setReservations(reservationsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
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

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const reservation = {
        room_id: selectedRoom,
        user_id: userData.user.id,
        requester_name: user?.name || userData.user.email || 'Usuário',
        reservation_date: format(reservationDate, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
        meeting_type_id: selectedMeetingType || null,
        participants_count: parseInt(participantsCount) || 1,
        notes: notes || null,
      };

      const { error } = await supabase.from('room_reservations').insert(reservation);
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

  const handleDeleteReservation = async () => {
    if (!deleteReservationId) return;

    try {
      const { error } = await supabase.from('room_reservations').delete().eq('id', deleteReservationId);
      if (error) throw error;

      toast({ title: 'Reserva cancelada!' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast({ title: 'Erro ao cancelar reserva', variant: 'destructive' });
    } finally {
      setDeleteReservationId(null);
    }
  };

  const resetForm = () => {
    setSelectedRoom('');
    setReservationDate(undefined);
    setStartTime('09:00');
    setEndTime('10:00');
    setSelectedMeetingType('');
    setParticipantsCount('1');
    setNotes('');
  };

  const getReservationsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations.filter(r => r.reservation_date === dateStr);
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
              {dayReservations.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {dayReservations.slice(0, 3).map((_, i) => (
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
              {dayReservations.length > 0 && (
                <span className={cn(
                  "text-xs mt-1",
                  isSelected ? "text-primary-foreground" : "text-primary"
                )}>
                  {dayReservations.length} reserva{dayReservations.length > 1 ? 's' : ''}
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
    const dayReservations = getReservationsForDate(currentDate);
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

  // Selected day reservations
  const selectedDayReservations = getReservationsForDate(selectedDate);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
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
                <DialogTitle>Nova Reserva de Sala</DialogTitle>
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
                        <SelectItem key={room.id} value={room.id}>
                          <div className="flex items-center gap-2">
                            <span>{room.name}</span>
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {room.capacity}
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
                        disabled={(date) => date < new Date()}
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

                <div>
                  <Label className="mb-1.5 block">Tipo de Reunião</Label>
                  <Select value={selectedMeetingType} onValueChange={setSelectedMeetingType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {meetingTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-1.5 block">Número de Participantes</Label>
                  <Input 
                    type="number" 
                    value={participantsCount} 
                    onChange={(e) => setParticipantsCount(e.target.value)} 
                    min={1}
                  />
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

                <Button onClick={handleCreateReservation} className="w-full">
                  Reservar Sala
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <motion.div
              layout
              className={cn(
                "bg-card border border-border rounded-xl overflow-hidden transition-all duration-300",
                isFullscreen && "fixed inset-4 z-50 shadow-2xl"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handlePrevious} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold min-w-[200px] text-center">
                    {view === 'day'
                      ? format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleToday} className="text-xs">
                    Hoje
                  </Button>

                  <div className="flex items-center bg-muted rounded-lg p-1">
                    <Button variant={view === 'day' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('day')} className="h-7 px-2">
                      <List className="h-4 w-4" />
                    </Button>
                    <Button variant={view === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('week')} className="h-7 px-2">
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button variant={view === 'month' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('month')} className="h-7 px-2">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} className="h-8 w-8">
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Calendar Body */}
              <div className={cn("p-4", isFullscreen && "p-6")}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${view}-${currentDate.toISOString()}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {view === 'month' && renderMonthView()}
                    {view === 'week' && renderWeekView()}
                    {view === 'day' && renderDayView()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Selected Day Reservations */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
              </h3>

              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : selectedDayReservations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma reserva para este dia</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayReservations.map((reservation) => (
                    <motion.div
                      key={reservation.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {reservation.meeting_rooms?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {reservation.requester_name}
                          </p>
                          {reservation.meeting_types?.name && (
                            <Badge variant="secondary" className="text-xs mt-2">
                              {reservation.meeting_types.name}
                            </Badge>
                          )}
                        </div>
                        {reservation.user_id === user?.id && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteReservationId(reservation.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteReservationId} onOpenChange={(open) => !open && setDeleteReservationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Reserva</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReservation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancelar Reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
