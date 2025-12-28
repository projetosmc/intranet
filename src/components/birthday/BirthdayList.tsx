import { motion } from 'framer-motion';
import { Cake, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Birthday {
  id: string;
  fullName: string;
  birthdayDate: Date;
  unit?: string;
  avatarUrl?: string;
}

interface BirthdayListProps {
  birthdays: Birthday[];
  isLoading?: boolean;
}

export function BirthdayList({ birthdays, isLoading }: BirthdayListProps) {
  const currentMonth = new Date();
  
  // Filter birthdays for current month and sort by day
  const monthBirthdays = birthdays
    .filter(b => isSameMonth(b.birthdayDate, currentMonth))
    .sort((a, b) => a.birthdayDate.getDate() - b.birthdayDate.getDate());

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Cake className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Aniversariantes do Mês</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Cake className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">
          Aniversariantes de {format(currentMonth, 'MMMM', { locale: ptBR })}
        </h3>
      </div>

      {monthBirthdays.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Cake className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum aniversariante este mês</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
          {monthBirthdays.map((birthday, index) => (
            <motion.div
              key={birthday.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={birthday.avatarUrl} alt={birthday.fullName} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials(birthday.fullName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {birthday.fullName}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-primary">
                    {format(birthday.birthdayDate, "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                  {birthday.unit && (
                    <>
                      <span>•</span>
                      <span className="truncate">{birthday.unit}</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}