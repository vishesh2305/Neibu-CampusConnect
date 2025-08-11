// src/components/MessageButton.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

interface MessageButtonProps {
  targetUserId: string;
}

export default function MessageButton({ targetUserId }: MessageButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (!session) {
      router.push('/login');
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      // Call the API to either get an existing conversation or create a new one
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: targetUserId }),
      });

      if (res.ok) {
        const conversation = await res.json();
        // Redirect the user to the conversation page
        router.push(`/messages/${conversation._id}`);
      } else {
        console.error("Failed to start conversation");
        alert("Could not start a conversation. Please try again.");
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Don't render the button if the user is viewing their own profile
  if (session?.user?.id === targetUserId) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-white text-sm transition-colors disabled:opacity-50 bg-green-600 hover:bg-green-700`}
    >
      <ChatBubbleLeftRightIcon className="h-5 w-5" />
      <span>{loading ? 'Starting...' : 'Message'}</span>
    </button>
  );
}