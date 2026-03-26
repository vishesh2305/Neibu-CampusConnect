import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="flex gap-2 mb-6"><Skeleton className="h-10 w-32 rounded-lg" /><Skeleton className="h-10 w-32 rounded-lg" /></div>
      <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
    </div>
  );
}
