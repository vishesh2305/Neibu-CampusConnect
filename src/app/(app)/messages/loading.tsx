import { ConversationSkeleton, Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto">
      <Skeleton className="h-8 w-32 mb-4" />
      <Skeleton className="h-10 w-full mb-4 rounded-lg" />
      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => <ConversationSkeleton key={i} />)}
      </div>
    </div>
  );
}
