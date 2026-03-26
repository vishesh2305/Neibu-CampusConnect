import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { put } from "@vercel/blob";
import { rateLimitResponse } from "@/lib/rateLimit";

interface StoryGroup {
  userId: string;
  userName: string;
  userImage: string | undefined;
  stories: Array<Record<string, unknown>>;
  hasUnviewed: boolean;
}

// GET - Fetch all stories (grouped by user)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // Get stories not expired (24h)
    const stories = await db
      .collection("stories")
      .find({ expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .toArray();

    // Group by user
    const groupMap = new Map<string, StoryGroup>();
    for (const story of stories) {
      const uid = story.userId.toString();
      if (!groupMap.has(uid)) {
        groupMap.set(uid, {
          userId: uid,
          userName: story.userName,
          userImage: story.userImage,
          stories: [],
          hasUnviewed: false,
        });
      }
      const group = groupMap.get(uid)!;
      const storyData = {
        ...story,
        _id: story._id.toString(),
        userId: story.userId.toString(),
        viewsCount: story.viewers?.length || 0,
      };
      group.stories.push(storyData);
      if (!story.viewers?.includes(session.user.id)) {
        group.hasUnviewed = true;
      }
    }

    // Put current user's stories first
    const result = Array.from(groupMap.values());
    const myIndex = result.findIndex((g) => g.userId === session.user.id);
    if (myIndex > 0) {
      const [myGroup] = result.splice(myIndex, 1);
      result.unshift(myGroup);
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a story
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = rateLimitResponse(`story-create:${session.user.id}`, { windowMs: 60000, maxRequests: 10 });
  if (rateLimited) return rateLimited;

  try {
    const formData = await req.formData();
    const mediaType = formData.get("mediaType") as string;
    const text = formData.get("text") as string;
    const bgColor = formData.get("bgColor") as string;
    const file = formData.get("file") as File | null;

    let mediaUrl = "";
    if (file) {
      const blob = await put(`stories/${Date.now()}-${file.name}`, file, {
        access: "public",
      });
      mediaUrl = blob.url;
    }

    const client = await clientPromise;
    const db = client.db();

    const story = {
      userId: new ObjectId(session.user.id),
      userName: session.user.name,
      userImage: session.user.image,
      mediaUrl,
      mediaType: mediaType || "text",
      text: text || "",
      bgColor: bgColor || "#1e40af",
      viewers: [],
      likes: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    const result = await db.collection("stories").insertOne(story);

    return NextResponse.json({
      ...story,
      _id: result.insertedId.toString(),
      userId: session.user.id,
      viewsCount: 0,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
