import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  req: Request,
  { params }: { params: { postId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
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
      await db.collection("likes").deleteOne({ _id: existingLike._id });
      await db.collection("posts").updateOne(
        { _id: postObjectId },
        { $inc: { likesCount: -1 } }
      );
      return NextResponse.json({ message: "Post unliked" }, { status: 200 });
    } else {
      await db.collection("likes").insertOne({
        postId: postObjectId,
        userId: userId,
        createdAt: new Date(),
      });
      await db.collection("posts").updateOne(
        { _id: postObjectId },
        { $inc: { likesCount: 1 } }
      );
      return NextResponse.json({ message: "Post liked" }, { status: 200 });
    }
} catch (error) {
  console.error(error);
  return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
}

}