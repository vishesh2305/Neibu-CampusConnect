"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import CommentForm from './CommentForm';

interface Comment {
  _id: string;
  text: string;
  authorName: string;
  createdAt: string;
}

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch comments on the client side when the component mounts
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/posts/${postId}/comment`);
        const data = await res.json();
        setComments(data);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  return (
    <div className="mt-4">
      {/* The CommentForm is also a client component, so this is fine */}
      <CommentForm postId={postId} />

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <p className="text-gray-400 text-sm">Loading comments...</p>
        ) : (
          <>
            {comments.map((comment) => (
              <div key={comment._id} className="text-sm bg-gray-700/50 p-3 rounded-lg">
                <p>
                  <span className="font-semibold text-white mr-2">{comment.authorName}</span>
                  <span className="text-gray-400">
                    {formatDistanceToNow(new Date(comment.createdAt))} ago
                  </span>
                </p>
                <p className="text-gray-300 mt-1">{comment.text}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-gray-500 text-sm pt-4">No comments yet.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}