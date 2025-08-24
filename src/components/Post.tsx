// src/components/Post.tsx

"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ChatBubbleOvalLeftEllipsisIcon, TrashIcon } from '@heroicons/react/24/outline';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import Image from 'next/image';
import { useUserStore } from '@/store/userStore';
import Poll from './Poll';

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
  groupId?: string;
  imageUrl?: string;
  poll?: {
    options: {
      text: string;
      votes: string[];
    }[];
  };
}

export default function Post({
  post: initialPost,
  defaultShowComments = false,
}: {
  post: PostProps;
  defaultShowComments?: boolean;
}) {
  const [post, setPost] = useState<PostProps>(initialPost);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const { session } = useUserStore();
  const router = useRouter();

  const isAuthor = session?.user?.id === post.authorId;
  const isAdmin = session?.user?.role === 'admin';
  const canDelete = isAuthor || isAdmin;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/posts/${post._id}/delete`, { method: 'DELETE' });
      if (res.ok) router.refresh();
      else {
        const data = await res.json();
        alert(`Failed to delete post: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to delete post", error);
      alert('An error occurred while deleting the post.');
    }
  };

  const handleVote = (updatedPost: PostProps) => setPost(updatedPost);

  const formattedTime = (() => {
    try {
      return post.createdAt ? `${formatDistanceToNow(new Date(post.createdAt))} ago` : "Unknown time";
    } catch {
      return "Invalid date";
    }
  })();

  return (
    <div className="p-4 rounded-lg shadow-md border border-gray-700">
      <div className="flex justify-between items-start">
        <div className="flex items-center mb-3">
          <Image
            src={post.authorImage || '/default-avatar.png'}
            width={40}
            height={40}
            alt={`${post.authorName}'s avatar`}
            className="w-10 h-10 rounded-full bg-gray-600 mr-3 object-cover"
          />
          <div>
            <Link href={`/profile/${post.authorId}`} className="font-semibold text-white hover:underline">
              {post.authorName}
            </Link>
            <p className="text-xs text-gray-400">{formattedTime}</p>
          </div>
        </div>
        {canDelete && (
          <button
            onClick={handleDelete}
            className="p-1 text-gray-500 hover:text-red-500 rounded-full transition-colors"
            title="Delete post"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      <p className="text-gray-300 whitespace-pre-wrap mb-4">{post.content}</p>
      {post.poll && <Poll post={post} onVote={handleVote} />}
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
        <LikeButton postId={post._id} initialLikes={post.likesCount || 0} isLiked={post.isLiked || false} />
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