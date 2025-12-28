import { motion } from 'framer-motion';
import { BarChart3, CheckCircle2 } from 'lucide-react';
import { Announcement } from '@/types/tools';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PollCardProps {
  announcement: Announcement;
  onVote: (optionId: string) => void;
}

export function PollCard({ announcement, onVote }: PollCardProps) {
  const totalVotes = announcement.pollOptions?.reduce(
    (acc, opt) => acc + (opt.voteCount || 0),
    0
  ) || 0;

  const hasVoted = announcement.pollOptions?.some((opt) => opt.userVoted);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{announcement.title}</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {announcement.summary}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {announcement.pollOptions?.map((option) => {
          const percentage = totalVotes > 0
            ? Math.round((option.voteCount || 0) / totalVotes * 100)
            : 0;

          return (
            <Button
              key={option.id}
              variant="outline"
              className={cn(
                "w-full h-auto py-3 px-4 justify-start relative overflow-hidden",
                option.userVoted && "border-primary bg-primary/5"
              )}
              onClick={() => onVote(option.id)}
            >
              {/* Progress bar background */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute left-0 top-0 bottom-0 bg-primary/10"
              />
              
              <div className="relative flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {option.userVoted && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                  <span>{option.optionText}</span>
                </div>
                <span className="text-muted-foreground text-sm">
                  {percentage}% ({option.voteCount || 0})
                </span>
              </div>
            </Button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'} • 
        {announcement.pollType === 'multiple' ? ' Múltipla escolha' : ' Escolha única'}
      </p>
    </motion.div>
  );
}
