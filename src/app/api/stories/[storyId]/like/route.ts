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

    const story = await db.collection("stories").findOne({ _id: new ObjectId(storyId) });
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const isLiked = story.likes?.includes(session.user.id);
    const filter = { _id: new ObjectId(storyId) };
    if (isLiked) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.collection("stories").updateOne(filter, { $pull: { likes: session.user.id } } as any);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.collection("stories").updateOne(filter, { $addToSet: { likes: session.user.id } } as any);
    }

    return NextResponse.json({ liked: !isLiked });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
