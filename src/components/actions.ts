// src/components/actions.ts

"use server"; // This directive marks all functions in this file as Server Actions

import clientPromise from "../lib/mongodb";
import { ObjectId, Document } from "mongodb";
import { PostProps } from "./Post";

export async function getPosts(userId?: string, groupId?: string, page = 1, limit = 10): Promise<PostProps[]> {
  try {
    const client = await clientPromise;
    const db = client.db();

    const matchStage: Document = {};
    if (groupId) {
      matchStage.groupId = new ObjectId(groupId);
    } else {
      matchStage.groupId = { $exists: false };
    }

    const skip = (page - 1) * limit;

    const aggregationPipeline = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
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

    const posts = await db.collection("posts").aggregate(aggregationPipeline).toArray();
    
    // Ensure all ObjectIds are converted to strings before returning to the client
    return JSON.parse(JSON.stringify(posts));

  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}