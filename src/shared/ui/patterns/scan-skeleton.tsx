import { Skeleton } from '@/shared/ui/components/skeleton';

export function ScanSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto mt-8">
      <div className="text-center mb-4">
        <Skeleton className="h-10 w-64 mx-auto mb-3" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>
      
      <div className="rounded-[1.5rem] border-2 border-dashed border-border-strong bg-surface-1 p-12 shadow-sm flex flex-col items-center justify-center min-h-[450px]">
        <Skeleton variant="circle" className="size-24 mb-6" />
        <Skeleton className="h-6 w-64 mb-4" />
        <Skeleton className="h-4 w-48 mb-8" />
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>
    </div>
  );
}
