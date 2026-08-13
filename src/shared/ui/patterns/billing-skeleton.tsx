import { Skeleton } from '@/shared/ui/components/skeleton';

export function BillingSkeleton() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <div>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col gap-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4 items-center">
            <Skeleton className="size-16 rounded-2xl shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <div>
            <div className="flex justify-between mb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col gap-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-6">
             {[1,2,3,4].map(i => (
                <div key={i} className="flex flex-col gap-2">
                   <Skeleton className="h-4 w-24" />
                   <Skeleton className="h-8 w-20" />
                </div>
             ))}
          </div>
        </div>
      </div>
      
      <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm">
         <Skeleton className="h-6 w-48 mb-6" />
         <div className="flex flex-col gap-4">
           {[1,2,3].map(i => (
             <div key={i} className="flex justify-between items-center py-3 border-b border-border-subtle last:border-0">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24 rounded-lg" />
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
