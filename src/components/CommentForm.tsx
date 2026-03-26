"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CommentFormProps {
  postId: string;
}

export default function CommentForm({ postId }: CommentFormProps) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment }),
      });

      if (res.ok) {
        setComment('');
        router.refresh(); 
      } else {
        console.error('Failed to post comment');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment..."
        className="flex-1 px-3 py-2 bg-[#12121a] border border-[#2e2e3e] rounded-md focus:outline-none text-white sm:text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 cursor-pointer rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        Post
      </button>
    </form>
  );
}