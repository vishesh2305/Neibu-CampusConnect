// src/components/LikeButton.tsx

"use client";

import { useState } from 'react';
import { HeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import { useSession } from "next-auth/react";

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
  isLiked: boolean;
}

export default function LikeButton({ postId, initialLikes, isLiked }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(isLiked);
  const [loading, setLoading] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const { data: session } = useSession();

  const handleLike = async () => {
    if (!session) {
      alert("Please login to like posts.");
      return;
    }
    if (loading) return;
    setLoading(true);

    const action = liked ? 'unlike' : 'like';

    setLiked(prevLiked => !prevLiked);
    setLikes(prevLikes => action === 'like' ? prevLikes + 1 : prevLikes - 1);

    // Trigger burst animation on like
    if (action === 'like') {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 600);
    }

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      if (!res.ok) {
        setLiked(prevLiked => !prevLiked);
        setLikes(prevLikes => action === 'like' ? prevLikes - 1 : prevLikes + 1);
      }
    } catch (error) {
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
      className="relative flex items-center space-x-2 text-gray-500 hover:text-rose-500 transition-colors disabled:opacity-50"
      aria-label={liked ? "Unlike post" : "Like post"}
    >
      {liked ? (
        <HeartIcon className={`h-6 w-6 text-rose-500 ${showBurst ? 'scale-125' : 'scale-100'} transition-transform duration-200`} />
      ) : (
        <HeartIconOutline className="h-6 w-6" />
      )}
      <span className="text-sm font-medium">{likes}</span>

      {/* Burst particles */}
      {showBurst && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 text-rose-500 animate-like-burst text-xs"
              style={{
                // @ts-expect-error -- CSS custom properties for animation
                "--tx": `${(Math.random() - 0.5) * 50}px`,
                "--ty": `${-(Math.random() * 30 + 10)}px`,
              }}
            >
              ♥
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
