import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between mb-6"><Skeleton className="h-8 w-40" /><Skeleton className="h-10 w-32 rounded-lg" /></div>
      <div className="flex gap-4 mb-6"><Skeleton className="h-10 w-16 rounded-lg" /><Skeleton className="h-10 w-16 rounded-lg" /><Skeleton className="h-10 w-16 rounded-lg" /><Skeleton className="h-10 flex-1 rounded-lg" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-[#1e1e2e] rounded-xl h-48 animate-pulse" />)}
      </div>
    </div>
  );
}
