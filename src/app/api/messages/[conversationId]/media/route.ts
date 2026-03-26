import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { put } from "@vercel/blob";
import { rateLimitResponse } from "@/lib/rateLimit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = rateLimitResponse(`media-upload:${session.user.id}`, { windowMs: 60000, maxRequests: 5 });
  if (rateLimited) return rateLimited;

  try {
    const { conversationId } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mediaType =
      (formData.get("mediaType") as string) ||
      (file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("audio/")
          ? "voice"
          : "file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 10MB." },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(`messages/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    const client = await clientPromise;
    const db = client.db();

    // Verify user is participant
    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(conversationId),
      participants: new ObjectId(session.user.id),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const message = {
      conversationId: new ObjectId(conversationId),
      senderId: new ObjectId(session.user.id),
      senderName: session.user.name,
      text: mediaType === "voice" ? "Voice message" : "",
      mediaUrl: blob.url,
      mediaType,
      status: "sent",
      createdAt: new Date(),
    };

    const result = await db.collection("messages").insertOne(message);

    // Update conversation last message time
    await db.collection("conversations").updateOne(
      { _id: new ObjectId(conversationId) },
      { $set: { lastMessageAt: new Date() } }
    );

    return NextResponse.json({
      ...message,
      _id: result.insertedId.toString(),
      conversationId,
      senderId: session.user.id,
    });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
