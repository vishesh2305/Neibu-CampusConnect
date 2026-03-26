import { PostSkeleton, StorySkeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="space-y-4">
      <StorySkeleton />
      <div className="p-6"><div className="h-12 bg-[#1e1e2e] rounded-xl animate-pulse" /></div>
      {Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}
    </div>
  );
}
