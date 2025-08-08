"use client";

import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/solid';

interface AdminPost {
  _id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export default function AdminPostList({ initialPosts }: { initialPosts: AdminPost[] }) {
    const [posts, setPosts] = useState(initialPosts);

    const handleDelete = async (postId: string) => {
        if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`/api/posts/${postId}/delete`, {
                method: 'DELETE',
            });

            if (res.ok) {
                // Optimistically remove the post from the UI
                setPosts(posts.filter(p => p._id !== postId));
            } else {
                alert('Failed to delete post.');
            }
        } catch (error) {
            alert('An error occurred.');
            console.error(error);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Author</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Content</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {posts.map(post => (
                        <tr key={post._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{post.authorName}</td>
                            <td className="px-6 py-4 max-w-sm text-sm text-gray-300 truncate">{post.content}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button onClick={() => handleDelete(post._id)} className="text-red-500 hover:text-red-700">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}