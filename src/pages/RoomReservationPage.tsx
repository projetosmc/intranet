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
        seq_sala: selectedRoom,
        seq_usuario: userData.user.id,
        des_nome_solicitante: user?.name || userData.user.email || 'Usuário',
        dta_reserva: format(reservationDate, 'yyyy-MM-dd'),
        hra_inicio: startTime,
        hra_fim: endTime,
        seq_tipo_reuniao: selectedMeetingType || null,
        num_participantes: parseInt(participantsCount) || 1,
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

  const handleDeleteReservation = async () => {
    if (!deleteReservationId) return;

    try {
      const { error } = await supabase.from('tab_reserva_sala').delete().eq('cod_reserva', deleteReservationId);
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
                        <SelectItem key={type.cod_tipo_reuniao} value={type.cod_tipo_reuniao}>{type.des_nome}</SelectItem>
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
                  {selectedDayReservations.map((reservation) => (
                    <motion.div
                      key={reservation.cod_reserva}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {reservation.hra_inicio.slice(0, 5)} - {reservation.hra_fim.slice(0, 5)}
                            </Badge>
                            <span className="font-medium text-sm truncate">
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
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => setDeleteReservationId(reservation.cod_reserva)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
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

      {/* Delete Confirmation Dialog */}
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
