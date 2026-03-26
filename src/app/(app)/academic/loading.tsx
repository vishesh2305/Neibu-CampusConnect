import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="flex gap-2 mb-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-32 rounded-lg" />)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    </div>
  );
}
