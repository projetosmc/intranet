import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2,
  Calendar as CalendarIcon,
  List,
  Grid3X3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ViewType = 'day' | 'week' | 'month';

interface EventCalendarProps {
  events?: { date: Date; title: string; type?: string }[];
  onDateSelect?: (date: Date) => void;
}

export function EventCalendar({ events = [], onDateSelect }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<ViewType>('month');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName) => (
          <div
            key={dayName}
            className="text-center text-xs font-semibold text-muted-foreground py-2"
          >
            {dayName}
          </div>
        ))}
        {days.map((dayItem, index) => {
          const dayEvents = getEventsForDate(dayItem);
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
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((_, i) => (
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

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR });
    const days = [];

    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((dayItem, index) => {
          const dayEvents = getEventsForDate(dayItem);
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
              {dayEvents.length > 0 && (
                <span className={cn(
                  "text-xs mt-1",
                  isSelected ? "text-primary-foreground" : "text-primary"
                )}>
                  {dayEvents.length} evento{dayEvents.length > 1 ? 's' : ''}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const isTodayDate = isToday(currentDate);

    return (
      <div className="text-center py-8">
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

        {dayEvents.length > 0 ? (
          <div className="mt-6 space-y-2">
            {dayEvents.map((event, index) => (
              <div
                key={index}
                className="p-3 bg-muted rounded-lg text-left"
              >
                <span className="font-medium">{event.title}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-muted-foreground text-sm">
            Nenhum evento para este dia
          </p>
        )}
      </div>
    );
  };

  const calendarContent = (
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {view === 'day'
              ? format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
              : format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs"
          >
            Hoje
          </Button>

          {/* View Switcher */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={view === 'day' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
              className="h-7 px-2"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className="h-7 px-2"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className="h-7 px-2"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
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
  );

  return (
    <>
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}
      {calendarContent}
    </>
  );
}