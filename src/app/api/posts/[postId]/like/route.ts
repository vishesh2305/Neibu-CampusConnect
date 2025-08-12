import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/authOptions";
import clientPromise from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";

// Notification document type
interface NotificationDoc {
  _id?: ObjectId;
  userId: ObjectId;
  actorId: ObjectId;
  type: "like";
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
        const notification: NotificationDoc = {
          userId: post.authorId,
          actorId: userId,
          type: "like",
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

      return NextResponse.json({ message: "Post liked" }, { status: 200 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}