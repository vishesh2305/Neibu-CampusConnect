// src/components/FollowButton.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/solid';

interface FollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
}

export default function FollowButton({ targetUserId, isFollowing }: FollowButtonProps) {
  const { data: session } = useSession();
  const [isFollowingState, setIsFollowingState] = useState(isFollowing);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (!session) {
      router.push('/login');
      return;
    }
    if (loading) return;

    setLoading(true);
    // Optimistic update
    setIsFollowingState(prev => !prev);

    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'POST',
      });

      if (!res.ok) {
        // Revert on failure
        setIsFollowingState(prev => !prev);
      }
      // Refresh the page to update follower counts, etc.
      router.refresh(); 
    } catch (error) {
      console.error("Failed to follow/unfollow user:", error);
      // Revert on error
      setIsFollowingState(prev => !prev);
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
      className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-white text-sm transition-colors disabled:opacity-50 ${
        isFollowingState
          ? 'bg-gray-600 hover:bg-gray-700'
          : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {isFollowingState ? (
        <UserMinusIcon className="h-5 w-5" />
      ) : (
        <UserPlusIcon className="h-5 w-5" />
      )}
      <span>{isFollowingState ? 'Unfollow' : 'Follow'}</span>
    </button>
  );
}