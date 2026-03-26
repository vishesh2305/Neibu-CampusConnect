// Reusable skeleton loading components

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[#2e2e3e]",
        className
      )}
    />
  );
}

export function PostSkeleton() {
  return (
    <div className="p-5 rounded-xl bg-[#1e1e2e] border border-[#2e2e3e] space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="flex gap-4 pt-2 border-t border-[#2e2e3e]">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

export function GroupCardSkeleton() {
  return (
    <div className="flex items-start gap-4 p-5 bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl">
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="p-5 bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-full" />
        </div>
        <Skeleton className="w-24 h-8 rounded-full" />
      </div>
      <div className="flex gap-4 mt-3 pt-3 border-t border-[#2e2e3e]">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-44" />
      </div>
    </div>
  );
}

export function MarketplaceCardSkeleton() {
  return (
    <div className="bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl overflow-hidden">
      <Skeleton className="w-full h-40" />
      <div className="p-3 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="flex justify-center gap-8">
        <Skeleton className="h-12 w-20" />
        <Skeleton className="h-12 w-20" />
        <Skeleton className="h-12 w-20" />
      </div>
    </div>
  );
}

export function StorySkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden py-2 px-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-20 space-y-1">
          <Skeleton className="w-20 h-28 rounded-xl" />
          <Skeleton className="h-3 w-14 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function NearbyUserCardSkeleton() {
  return (
    <div className="bg-[#1e1e2e] rounded-xl p-4 border border-[#2e2e3e]">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-20 mb-3" />
      <div className="flex gap-2">
        <Skeleton className="flex-1 h-9 rounded-lg" />
        <Skeleton className="w-10 h-9 rounded-lg" />
      </div>
    </div>
  );
}
