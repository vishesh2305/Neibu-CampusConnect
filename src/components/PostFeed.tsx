import clientPromise from "@/lib/mongodb";
import Post, { PostProps } from "./Post";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { ObjectId, Document } from "mongodb";

async function getPosts(userId?: string, groupId?: string) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const matchStage: Document = {};
    if (groupId) {
      matchStage.groupId = new ObjectId(groupId);
    } else {
      matchStage.groupId = { $exists: false };
    }

    const aggregationPipeline = [
      { $match: matchStage },
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
          isLiked: userId
            ? {
                $in: [new ObjectId(userId), "$likesData.userId"],
              }
            : false,
          authorName: "$authorDetails.name",
          authorImage: "$authorDetails.image",
          imageUrl: { $ifNull: ["$imageUrl", null] }, // <-- added line
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

    return JSON.parse(JSON.stringify(posts)) as PostProps[];
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export default async function PostFeed({ groupId }: { groupId?: string }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const posts = await getPosts(userId, groupId);

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Post key={post._id} post={post} />
      ))}
      {posts.length === 0 && (
        <p className="text-center text-gray-500">
          No posts here yet. Start the conversation!
        </p>
      )}
    </div>
  );
}