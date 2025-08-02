import clientPromise from "@/lib/mongodb";
import Post, { PostProps } from "./Post";

async function getPosts() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const posts = await db
      .collection("posts")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return JSON.parse(JSON.stringify(posts));
  } catch {
    return [];
  }
}

export default async function PostFeed() {
  const posts: PostProps[] = await getPosts();

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Post key={post._id} post={post} />
      ))}
      {posts.length === 0 && (
        <p className="text-center text-gray-500">No posts yet. Be the first!</p>
      )}
    </div>
  );
}