import { Skeleton } from '@/shared/ui/components/skeleton';

export function ScanSkeleton() {
  return (
    <div className="mx-auto mt-8 flex w-full max-w-4xl flex-col gap-6">
      <div className="mb-4 text-center">
        <Skeleton className="mx-auto mb-3 h-10 w-64" />
        <Skeleton className="mx-auto h-4 w-96" />
      </div>

      <div className="flex min-h-[450px] flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-border-strong bg-surface-1 p-12 shadow-sm">
        <Skeleton variant="circle" className="mb-6 size-24" />
        <Skeleton className="mb-4 h-6 w-64" />
        <Skeleton className="mb-8 h-4 w-48" />
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>
    </div>
  );
}
