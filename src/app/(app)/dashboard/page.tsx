// src/app/(app)/dashboard/page.tsx

import PostFeed from "@/components/PostFeed";
import CreatePost from "@/components/CreatePost";
import Stories from "@/components/Stories";
import ProfileCompletion from "@/components/ProfileCompletion";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getPosts } from "@/components/actions";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  const initialPosts = await getPosts(session?.user?.id);

  return (
    <div>
      <ProfileCompletion />
      <Stories />
      <CreatePost />
      <PostFeed initialPosts={initialPosts} />
    </div>
  );
}
