"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import Link from "next/link";
import { IconUsers } from "@tabler/icons-react";
import { GroupCardSkeleton } from "./ui/skeleton";

interface Group {
  _id: string;
  name: string;
  description: string;
}

export default function GroupList() {
  const { socket } = useUserStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Failed to fetch groups", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Real-time: listen for new groups
  useEffect(() => {
    if (!socket) return;

    const handleNewGroup = (group: Group) => {
      setGroups((prev) => {
        if (prev.some((g) => g._id === group._id)) return prev;
        return [group, ...prev];
      });
    };

    socket.on("receive-new-group", handleNewGroup);
    return () => {
      socket.off("receive-new-group", handleNewGroup);
    };
  }, [socket]);

  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-4 text-white">Discover Groups</h2>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Link
              href={`/groups/${group._id}`}
              key={group._id}
              className="flex items-start gap-4 p-5 bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl hover:border-emerald-500/40 hover:bg-[#252535] transition-all duration-200 group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <IconUsers className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  {group.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{group.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      {!loading && groups.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1e1e2e] flex items-center justify-center">
            <IconUsers className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-500">No groups found. Why not create one?</p>
        </div>
      )}
    </div>
  );
}
