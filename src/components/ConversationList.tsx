"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/userStore";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ConversationSkeleton } from "./ui/skeleton";

interface Conversation {
  _id: string;
  lastMessageAt: string;
  otherParticipant: {
    _id: string;
    name: string;
    image?: string;
  };
  lastMessage?: {
    text: string;
  };
}

export default function ConversationList() {
  const { data: session } = useSession();
  const { socket } = useUserStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch conversations
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch (error) {
        console.error("Failed to fetch conversations", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [session?.user?.id]);

  // Real-time: update conversation list when a new message arrives
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: { conversationId: string; text: string }) => {
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c._id === message.conversationId
            ? { ...c, lastMessage: { text: message.text }, lastMessageAt: new Date().toISOString() }
            : c
        );
        // Sort by latest message
        return updated.sort(
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      });
    };

    socket.on("receive-message", handleNewMessage);
    return () => {
      socket.off("receive-message", handleNewMessage);
    };
  }, [socket]);

  if (!session) return null;

  return (
    <div className="h-full shadow-lg">
      <div className="p-4 font-semibold text-lg text-white">Messages</div>
      <nav className="flex flex-col">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <ConversationSkeleton key={i} />)
          : conversations.map((convo) => (
              <Link
                href={`/messages/${convo._id}`}
                key={convo._id}
                className="p-4 flex items-center gap-4 hover:bg-[#1e1e2e] transition-colors"
              >
                <Image
                  src={convo.otherParticipant.image || "/default-avatar.png"}
                  alt={convo.otherParticipant.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold truncate text-white">{convo.otherParticipant.name}</h3>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(convo.lastMessageAt), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {convo.lastMessage?.text || "No messages yet"}
                  </p>
                </div>
              </Link>
            ))}
        {!loading && conversations.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">No conversations yet.</p>
        )}
      </nav>
    </div>
  );
}
