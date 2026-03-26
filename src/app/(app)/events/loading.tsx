import { EventCardSkeleton, Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-40 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)}
        </div>
        <div><Skeleton className="h-96 rounded-xl" /></div>
      </div>
    </div>
  );
}
