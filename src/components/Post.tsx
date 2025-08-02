import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export interface PostProps {
  _id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage?: string | null;
  createdAt: string;
}

export default function Post({ post }: { post: PostProps }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
      <div className="flex items-center mb-3">
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
      <p className="text-gray-300 whitespace-pre-wrap">{post.content}</p>
    </div>
  );
}