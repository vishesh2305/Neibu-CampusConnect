// src/components/Post.tsx

"use client"; // This is now a client component

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';

export interface PostProps {
  _id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number; // Add comments count
  isLiked: boolean;
}

export default function Post({ post }: { post: PostProps }) {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
      <div className="flex items-center mb-3">
        {/* Author details... */}
        <div className="w-10 h-10 rounded-full bg-gray-600 mr-3"></div>
        <div>
          <Link href={`/profile/${post.authorId}`} className="font-semibold text-white hover:underline">
            {post.authorName}
          </Link>
          <p className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(post.createdAt))} ago
          </p>
        </div>
      </div>
      <p className="text-gray-300 whitespace-pre-wrap mb-4">{post.content}</p>
      
      {/* Action buttons */}
      <div className="border-t border-gray-700 pt-2 flex items-center gap-4">
        <LikeButton 
          postId={post._id} 
          initialLikes={post.likesCount || 0} 
          isLiked={post.isLiked || false}
        />
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 text-gray-400 hover:text-blue-500 transition-colors"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6" />
          <span className="text-sm font-medium">{post.commentsCount || 0}</span>
        </button>
      </div>

      {/* Conditionally render the comment section */}
      {showComments && <CommentSection postId={post._id} />}
    </div>
  );
}