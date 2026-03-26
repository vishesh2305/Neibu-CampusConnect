import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex"><Skeleton className="h-14 w-52 rounded-2xl" /></div>
        ))}
      </div>
      <div className="p-4 border-t border-[#2e2e3e]"><Skeleton className="h-10 rounded-full" /></div>
    </div>
  );
}
