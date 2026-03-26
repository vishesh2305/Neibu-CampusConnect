import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { storyId } = await params;
    if (!ObjectId.isValid(storyId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db();

    await db.collection("stories").updateOne(
      { _id: new ObjectId(storyId) },
      { $addToSet: { viewers: session.user.id } }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
