// src/components/LikeButton.tsx

"use client";

import { useState } from 'react';
import { HeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
  isLiked: boolean;
}

export default function LikeButton({ postId, initialLikes, isLiked }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(isLiked);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);

    // --- The Fix: Using Functional State Updates ---
    // We determine the action based on the current state before updating.
    const action = liked ? 'unlike' : 'like';

    // Perform the optimistic UI update using the functional form of useState.
    // This guarantees we are working with the latest state value.
    setLiked(prevLiked => !prevLiked);
    setLikes(prevLikes => action === 'like' ? prevLikes + 1 : prevLikes - 1);
    // --- End Fix ---

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });

      if (!res.ok) {
        // If the request fails, revert the state using the same atomic pattern.
        setLiked(prevLiked => !prevLiked);
        setLikes(prevLikes => action === 'like' ? prevLikes - 1 : prevLikes + 1);
        console.error("Failed to update like status");
      }
    } catch (error) {
      // Revert state on any other error.
      setLiked(prevLiked => !prevLiked);
      setLikes(prevLikes => action === 'like' ? prevLikes - 1 : prevLikes + 1);
      console.error("An error occurred:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className="flex items-center space-x-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      {liked ? (
        <HeartIcon className="h-6 w-6 text-red-500" />
      ) : (
        <HeartIconOutline className="h-6 w-6" />
      )}
      <span className="text-sm font-medium">{likes}</span>
    </button>
  );
}