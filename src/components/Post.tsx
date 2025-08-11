"use client";

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import Image from 'next/image';

export interface PostProps {
  _id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage?: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  imageUrl?: string;
}

export default function Post({
  post,
  defaultShowComments = false,
}: {
  post: PostProps;
  defaultShowComments?: boolean;
}) {
  const [showComments, setShowComments] = useState(defaultShowComments);

  return (
    <div className="p-4  rounded-lg shadow-md ">
      <div className="flex items-center mb-3">
        <Image
          src={post.authorImage || '/default-avatar.png'}
          width={80}
          height={80}
          alt={`${post.authorName}'s avatar`}
          className="w-10 h-10 rounded-full bg-gray-600 mr-3 object-cover"
        />
        <div>
          <Link
            href={`/profile/${post.authorId}`}
            className="font-semibold text-white hover:underline"
          >
            {post.authorName}
          </Link>
          <p className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(post.createdAt))} ago
          </p>
        </div>
      </div>

      <p className="text-gray-300 whitespace-pre-wrap mb-4">{post.content}</p>

      {post.imageUrl && (
        <div className="mb-4">
          <Image
            src={post.imageUrl}
            alt="Post image"
            width={600}
            height={400}
            className="rounded-lg object-cover max-h-[400px] w-full"
          />
        </div>
      )}

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

      {showComments && <CommentSection postId={post._id} />}
    </div>
  );
}