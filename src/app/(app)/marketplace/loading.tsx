import { MarketplaceCardSkeleton, Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between mb-6"><Skeleton className="h-8 w-52" /><Skeleton className="h-10 w-28 rounded-lg" /></div>
      <Skeleton className="h-10 w-full rounded-lg mb-4" />
      <div className="flex gap-2 mb-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <MarketplaceCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
