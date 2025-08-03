import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/authOptions";
import clientPromise from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!ObjectId.isValid(postId)) {
    return NextResponse.json({ message: "Invalid Post ID" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);
    const postObjectId = new ObjectId(postId);

    const existingLike = await db.collection("likes").findOne({
      postId: postObjectId,
      userId: userId,
    });

    if (existingLike) {
      // User has already liked; unlike the post
      await db.collection("likes").deleteOne({ _id: existingLike._id });
      await db.collection("posts").updateOne(
        { _id: postObjectId },
        { $inc: { likesCount: -1 } }
      );

      await db.collection("notifications").deleteOne({
        type: "like",
        postId: postObjectId,
        actorId: userId,
      });

      return NextResponse.json({ message: "Post unliked" }, { status: 200 });
    } else {
      // Insert new like
      await db.collection("likes").insertOne({
        postId: postObjectId,
        userId: userId,
        createdAt: new Date(),
      });

      await db.collection("posts").updateOne(
        { _id: postObjectId },
        { $inc: { likesCount: 1 } }
      );

      const post = await db.collection("posts").findOne({ _id: postObjectId });

      if (post && post.authorId.toString() !== session.user.id) {
        await db.collection("notifications").insertOne({
          userId: post.authorId,
          actorId: userId,
          type: "like",
          postId: postObjectId,
          read: false,
          createdAt: new Date(),
        });
      }

      return NextResponse.json({ message: "Post liked" }, { status: 200 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
