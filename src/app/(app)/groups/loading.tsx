import { GroupCardSkeleton, Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto">
      <Skeleton className="h-8 w-64 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 mt-4 space-y-2">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <GroupCardSkeleton key={i} />)}
          </div>
        </div>
        <div><Skeleton className="h-80 rounded-xl" /></div>
      </div>
    </div>
  );
}
