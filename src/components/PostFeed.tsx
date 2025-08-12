// src/components/PostFeed.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import Post, { PostProps } from "./Post";
import { getPosts } from "./actions"; // server action

export default function PostFeed({
  initialPosts,
  groupId,
}: {
  initialPosts: PostProps[];
  groupId?: string;
}) {
  const [posts, setPosts] = useState<PostProps[]>(initialPosts);
  const [page, setPage] = useState(2); // Start with page 2 since page 1 is initial data
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  const [loaderRef, isIntersecting] = useIntersectionObserver({
    threshold: 0.5,
  });

  // ✅ useCallback fixes missing dependency warning
  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    // ✅ Convert page number to string to match getPosts type
    const newPosts = await getPosts(session?.user?.id, groupId, page.toString());

    if (newPosts.length > 0) {
      setPosts((prevPosts) => [...prevPosts, ...newPosts]);
      setPage((prevPage) => prevPage + 1);
    } else {
      setHasMore(false);
    }
    setIsLoading(false);
  }, [isLoading, hasMore, session?.user?.id, groupId, page]);

  useEffect(() => {
    if (isIntersecting && hasMore) {
      loadMorePosts();
    }
  }, [isIntersecting, hasMore, loadMorePosts]);

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Post key={post._id} post={post} />
      ))}

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} className="h-10 text-center text-gray-500">
        {isLoading && <p>Loading more posts...</p>}
        {!hasMore && posts.length > 0 && <p>You&apos;ve reached the end!</p>}
      </div>

      {posts.length === 0 && (
        <p className="text-center text-gray-500">
          No posts here yet. Start the conversation!
        </p>
      )}
    </div>
  );
}