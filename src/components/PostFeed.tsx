"use client";

import { useState, useEffect, useCallback } from "react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import Post, { PostProps } from "./Post";
import { getPosts } from "./actions";
import { useUserStore } from "@/store/userStore";

export default function PostFeed({
  initialPosts,
  groupId,
  context = "feed",
}: {
  initialPosts: PostProps[];
  groupId?: string;
  context?: "feed" | "group" | "explore" | "profile";
}) {
  const [posts, setPosts] = useState<PostProps[]>(initialPosts);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialPosts.length > 0);
  const [isLoading, setIsLoading] = useState(false);
  const { session, socket } = useUserStore();

useEffect(() => {
  if (!socket) return;

  const handleNewPost = (newPost: PostProps) => {
    if (posts.some(p => p._id === newPost._id)) return;

    let shouldAddPost = false;
    if (context === "group" && newPost.groupId === groupId) shouldAddPost = true;
    else if (context === "feed" && !newPost.groupId) shouldAddPost = true;
    else if(context === "profile" && newPost.authorId === groupId) shouldAddPost = true;
    
    
    if (shouldAddPost) setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  socket.on("receive-new-post", handleNewPost);


  return () => {
    socket.off("receive-new-post", handleNewPost);
  };
}, [socket, posts, context, groupId, session?.user?.id]);



  const [loaderRef, isIntersecting] = useIntersectionObserver({ threshold: 0.5 });

  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    const newPosts = await getPosts(session?.user?.id, groupId, undefined, page);

    if (newPosts.length > 0) {
      setPosts(prevPosts => [...prevPosts, ...newPosts]);
      setPage(prev => prev + 1);
    } else setHasMore(false);

    setIsLoading(false);
  }, [isLoading, hasMore, session?.user?.id, groupId, page]);

  useEffect(() => {
    if (isIntersecting && hasMore) loadMorePosts();
  }, [isIntersecting, hasMore, loadMorePosts]);

  return (
    <div className="space-y-4">
      {posts.map(post => <Post key={post._id} post={post} />)}
      <div ref={loaderRef} className="h-10 text-center text-gray-500">
        {isLoading && <p>Loading more posts...</p>}
        {!hasMore && posts.length > 0 && <p>You&aposve reached the end!</p>}
      </div>
      {posts.length === 0 && <p className="text-center text-gray-500">No posts here yet. Start the conversation!</p>}
    </div>
  );
}