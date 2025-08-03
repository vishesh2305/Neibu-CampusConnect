import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import Post, { PostProps } from "@/components/Post";
import { Document } from "mongodb";

async function getPostData(postId: string, userId?: string): Promise<PostProps | null> {
  if (!ObjectId.isValid(postId)) {
    return null;
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const postObjectId = new ObjectId(postId);

    const aggregationPipeline: Document[] = [
      { $match: { _id: postObjectId } },
      { $limit: 1 },
      // The rest of the pipeline is identical to the one in PostFeed
      { $lookup: { from: 'users', localField: 'authorId', foreignField: '_id', as: 'authorDetails' }},
      { $unwind: '$authorDetails' },
      { $lookup: { from: "likes", localField: "_id", foreignField: "postId", as: "likesData"}},
      {
        $addFields: {
          likesCount: { $size: "$likesData" },
          commentsCount: { $ifNull: ["$commentsCount", 0] },
          isLiked: userId ? { $in: [new ObjectId(userId), "$likesData.userId"] } : false,
          authorName: '$authorDetails.name',
          authorImage: '$authorDetails.image',
          imageUrl: { $ifNull: ["$imageUrl", null] },
        },
      },
      { $project: { likesData: 0, authorDetails: 0 } },
    ];

    const results = await db.collection("posts").aggregate(aggregationPipeline).toArray();

    if (results.length === 0) {
      return null;
    }
    
    return JSON.parse(JSON.stringify(results[0]));
  } catch (error) {
    console.error("Error fetching single post:", error);
    return null;
  }
}


export default async function SinglePostPage({ params }: { params: { postId: string } }) {
  const session = await getServerSession(authOptions);
  const post = await getPostData(params.postId, session?.user?.id);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Post post={post} defaultShowComments={true} />
    </div>
  );
}