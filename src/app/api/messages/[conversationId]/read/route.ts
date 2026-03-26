import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { conversationId } = await params;
    const { messageIds } = await req.json();

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ success: true });
    }

    const client = await clientPromise;
    const db = client.db();

    const objectIds = messageIds
      .filter((id: string) => ObjectId.isValid(id))
      .map((id: string) => new ObjectId(id));

    await db.collection("messages").updateMany(
      {
        _id: { $in: objectIds },
        conversationId: new ObjectId(conversationId),
        senderId: { $ne: new ObjectId(session.user.id) },
      },
      { $set: { status: "read", readAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
