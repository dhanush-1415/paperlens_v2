import { Skeleton } from '@/shared/ui/components/skeleton';

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      <div>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      
      <div className="flex flex-col gap-6">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col gap-6">
            <Skeleton className="h-6 w-40" />
            <div className="flex flex-col gap-4">
              {[1,2].map(j => (
                <div key={j} className="flex justify-between items-center py-2 border-b border-border-subtle last:border-0 last:pb-0">
                  <div className="flex flex-col gap-1">
                     <Skeleton className="h-5 w-48" />
                     <Skeleton className="h-4 w-72" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
