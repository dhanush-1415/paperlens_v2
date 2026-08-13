import { Skeleton } from '@/shared/ui/components/skeleton';

export function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* 4 Stat Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm">
            <div className="flex justify-between items-center">
              <Skeleton className="size-12 rounded-xl" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Processing Volume */}
        <div className="lg:col-span-2 rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col min-h-[400px]">
          <Skeleton className="h-6 w-48 mb-6" />
          <div className="flex-1 rounded-xl border border-dashed border-border-strong bg-surface-2/30 p-4 flex items-end gap-2 px-6 pb-6 pt-10">
            {/* Bars */}
            {Array(12).fill(0).map((_, i) => (
              <Skeleton key={i} className="w-[6%] rounded-t-sm" style={{ height: `${Math.max(10, Math.random() * 90)}%` }} />
            ))}
          </div>
        </div>
        
        {/* Risk Distribution */}
        <div className="lg:col-span-1 rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="flex-1 flex flex-col gap-6 justify-center">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 mt-4">
        {/* Recent Activity */}
        <div className="rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between items-center p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-48 mb-1.5" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
