// src/components/actions.ts

"use server";

import clientPromise from "../lib/mongodb";
import { ObjectId, Document } from "mongodb";
import { PostProps } from "./Post";

function isValidObjectId(id?: string): id is string {
  return !!id && ObjectId.isValid(id);
}

export async function getPosts(
  currentUserId?: string,
  groupId?: string,
  profileUserId?: string, 
  page = 1,
  limit = 10
): Promise<PostProps[]> {
  if (!currentUserId || !isValidObjectId(currentUserId)) return [];

  try {
    const client = await clientPromise;
    const db = client.db();
    const currentUserObjectId = new ObjectId(currentUserId);

    const skip = (page - 1) * limit;

    let matchStage: Document = {};

    if (isValidObjectId(profileUserId)) {
      matchStage.authorId = new ObjectId(profileUserId);
    } else if (isValidObjectId(groupId)) {
      matchStage.groupId = new ObjectId(groupId);
    } else {
      const followingCursor = db
        .collection("followers")
        .find({ followerId: currentUserObjectId });
      const followingIds = await followingCursor
        .map(doc => doc.followingId)
        .toArray();
      followingIds.push(currentUserObjectId); 

      const groupsCursor = db
        .collection("group_members")
        .find({ userId: currentUserObjectId });
      const groupIds = await groupsCursor
        .map(doc => doc.groupId)
        .toArray();

      matchStage = {
        $or: [
          { authorId: { $in: followingIds }, groupId: { $exists: false } },
          { groupId: { $in: groupIds } },
        ],
      };
    }

    const aggregationPipeline = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "authorDetails"
        }
      },
      { $unwind: "$authorDetails" },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "postId",
          as: "likesData"
        }
      },
      {
        $addFields: {
          likesCount: { $size: "$likesData" },
          commentsCount: { $ifNull: ["$commentsCount", 0] },
          isLiked: { $in: [currentUserObjectId, "$likesData.userId"] },
          authorName: "$authorDetails.name",
          authorImage: "$authorDetails.image",
          imageUrl: { $ifNull: ["$imageUrl", null] }
        }
      },
      { $project: { likesData: 0, authorDetails: 0 } }
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