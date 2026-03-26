import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div>
      <Skeleton className="h-12 w-full rounded-xl mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="w-11 h-11 rounded-full" />
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-20" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
