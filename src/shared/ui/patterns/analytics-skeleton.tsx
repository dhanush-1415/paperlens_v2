import { Skeleton } from '@/shared/ui/components/skeleton';

export function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="mb-2 h-10 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* 4 Stat Tiles */}
      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="size-12 rounded-xl" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div>
              <Skeleton className="mb-2 h-8 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Processing Volume */}
        <div className="flex min-h-[400px] flex-col rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm lg:col-span-2">
          <Skeleton className="mb-6 h-6 w-48" />
          <div className="flex flex-1 items-end gap-2 rounded-xl border border-dashed border-border-strong bg-surface-2/30 p-4 px-6 pt-10 pb-6">
            {/* Bars */}
            {[40, 65, 30, 80, 50, 95, 20, 60, 85, 45, 75, 55].map((h, i) => (
              <Skeleton key={i} className="w-[6%] rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="flex flex-col rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm lg:col-span-1">
          <Skeleton className="mb-6 h-6 w-32" />
          <div className="flex flex-1 flex-col justify-center gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="mb-2 flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1">
        {/* Recent Activity */}
        <div className="flex flex-col rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <div>
                    <Skeleton className="mb-1.5 h-4 w-48" />
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
