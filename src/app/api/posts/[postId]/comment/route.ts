import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  req: Request,
  { params }: { params: { postId: string } }
) {
  const { postId } = await params;
  if (!ObjectId.isValid(postId)) {
    return NextResponse.json({ message: "Invalid Post ID" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const comments = await db.collection('comments')
      .find({ postId: new ObjectId(postId) })
      .sort({ createdAt: 1 }) // Oldest first
      .toArray();
    
    return NextResponse.json(comments, { status: 200 });
  } catch (error) {
    console.error("GET_COMMENTS_ERROR", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
// --- END NEW GET HANDLER ---


// EXISTING POST HANDLER...
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
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ message: "Comment text is required." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const newComment = {
      postId: new ObjectId(postId),
      authorId: new ObjectId(session.user.id),
      authorName: session.user.name,
      text: text.trim(),
      createdAt: new Date(),
    };

    await db.collection("comments").insertOne(newComment);
    
    await db.collection("posts").updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { commentsCount: 1 } }
    );

    return NextResponse.json({ message: "Comment added" }, { status: 201 });
  } catch (error) {
    console.error("COMMENT_POST_ERROR", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}