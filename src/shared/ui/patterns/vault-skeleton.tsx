import { Skeleton } from '@/shared/ui/components/skeleton';

export function VaultSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-64 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>
      <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex gap-4">
           <Skeleton className="h-5 w-24" />
           <Skeleton className="h-5 w-32" />
           <Skeleton className="h-5 w-24" />
           <Skeleton className="h-5 w-24 ml-auto" />
        </div>
        <div className="flex flex-col gap-3 p-4">
          {[1,2,3,4,5,6].map(i => (
             <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
