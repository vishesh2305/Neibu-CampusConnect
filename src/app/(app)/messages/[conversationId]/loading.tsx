import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center gap-3 p-4 border-b border-[#2e2e3e]">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-16" /></div>
      </div>
      <div className="flex-1 p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`flex ${i % 3 === 0 ? "justify-start" : "justify-end"}`}>
            <Skeleton className={`h-10 rounded-2xl ${i % 3 === 0 ? "w-48" : "w-36"}`} />
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-[#2e2e3e]"><Skeleton className="h-10 rounded-full" /></div>
    </div>
  );
}
