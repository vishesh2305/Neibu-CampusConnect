import clientPromise from "@/lib/mongodb";
import Post, { PostProps } from "./Post";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from "mongodb";

async function getPosts(userId?: string) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const aggregationPipeline = [
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "authorDetails",
        },
      },
      { $unwind: "$authorDetails" }, 
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "postId",
          as: "likesData",
        },
      },

      {
        $addFields: {
          likesCount: { $size: "$likesData" },
          commentsCount: { $ifNull: ["$commentsCount", 0] },
          isLiked: userId ? { $in: [new ObjectId(userId), "$likesData.userId"] } : false,
          authorName: "$authorDetails.name",
          authorImage: "$authorDetails.image",
        },
      },

      {
        $project: {
          likesData: 0,
          authorDetails: 0,
        },
      },
    ];

    const posts = await db
      .collection("posts")
      .aggregate(aggregationPipeline)
      .toArray();

    return JSON.parse(JSON.stringify(posts));
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export default async function PostFeed() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? undefined;

  const posts: PostProps[] = await getPosts(userId);

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