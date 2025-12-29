import { Skeleton } from '@/components/ui/skeleton';

export function AnnouncementCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg shadow-md bg-card border border-border">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function PollCardSkeleton() {
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
      <Skeleton className="h-3 w-32 mx-auto mt-4" />
    </div>
  );
}

export function AnnouncementsPageSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnnouncementCardSkeleton />
      <AnnouncementCardSkeleton />
      <PollCardSkeleton />
      <AnnouncementCardSkeleton />
    </div>
  );
}
