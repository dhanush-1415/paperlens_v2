import { Skeleton } from '@/shared/ui/components/skeleton';

export function ProfileSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div className="flex items-center gap-6">
        <Skeleton variant="circle" className="size-24 shrink-0" />
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="flex flex-col gap-6 rounded-[1.25rem] border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
