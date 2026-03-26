import { NearbyUserCardSkeleton, Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between mb-6"><div><Skeleton className="h-8 w-40 mb-2" /><Skeleton className="h-4 w-56" /></div><Skeleton className="h-10 w-24 rounded-lg" /></div>
      <Skeleton className="h-14 w-full rounded-lg mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <NearbyUserCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
