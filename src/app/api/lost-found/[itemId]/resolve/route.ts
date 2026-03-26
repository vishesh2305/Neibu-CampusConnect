import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { itemId } = await params;
    if (!ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db();

    const item = await db.collection("lost_found").findOne({
      _id: new ObjectId(itemId),
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Only reporter or admin can resolve
    if (item.reporterId.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.collection("lost_found").updateOne(
      { _id: new ObjectId(itemId) },
      { $set: { status: "resolved", resolvedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
