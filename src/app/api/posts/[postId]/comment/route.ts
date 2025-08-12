import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/authOptions";
import clientPromise from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";

// Notification document type for MongoDB
interface NotificationDoc {
  _id?: ObjectId;
  userId: ObjectId;
  actorId: ObjectId;
  type: "comment";
  postId: ObjectId;
  read: boolean;
  createdAt: Date;
}

// Helper to dispatch notification
async function dispatchNotification(notification: NotificationDoc) {
  try {
    await fetch("http://localhost:3001/api/dispatch-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId: notification.userId.toString(),
        notification,
      }),
    });
  } catch (error) {
    console.error("Failed to dispatch notification", error);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;

  if (!ObjectId.isValid(postId)) {
    return NextResponse.json({ message: "Invalid Post ID" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const comments = await db
      .collection("comments")
      .find({ postId: new ObjectId(postId) })
      .sort({ createdAt: 1 }) // Oldest first
      .toArray();

    return NextResponse.json(comments, { status: 200 });
  } catch (error) {
    console.error("GET_COMMENTS_ERROR", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { message: "Comment text is required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const postObjectId = new ObjectId(postId);
    const userId = new ObjectId(session.user.id);

    const newComment = {
      postId: postObjectId,
      authorId: userId,
      authorName: session.user.name,
      text: text.trim(),
      createdAt: new Date(),
    };

    await db.collection("comments").insertOne(newComment);

    await db.collection("posts").updateOne(
      { _id: postObjectId },
      { $inc: { commentsCount: 1 } }
    );

    // Notifications
    const post = await db.collection("posts").findOne({ _id: postObjectId });
    if (post && post.authorId.toString() !== session.user.id) {
      const notification: NotificationDoc = {
        userId: post.authorId,
        actorId: userId,
        type: "comment",
        postId: postObjectId,
        read: false,
        createdAt: new Date(),
      };
      const result = await db.collection("notifications").insertOne(notification);

      // Dispatch the notification
      const fullNotification = (await db
        .collection("notifications")
        .findOne({ _id: result.insertedId })) as NotificationDoc;
      if (fullNotification) {
        await dispatchNotification(fullNotification);
      }
    }

    return NextResponse.json({ message: "Comment added" }, { status: 201 });
  } catch (error) {
    console.error("COMMENT_POST_ERROR", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
