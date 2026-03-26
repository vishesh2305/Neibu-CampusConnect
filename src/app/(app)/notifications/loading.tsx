import { NotificationSkeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div>{Array.from({ length: 8 }).map((_, i) => <NotificationSkeleton key={i} />)}</div>
  );
}
