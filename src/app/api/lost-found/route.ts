import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { put } from "@vercel/blob";
import { rateLimitResponse } from "@/lib/rateLimit";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET - Fetch lost & found items
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const q = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = 20;

    const client = await clientPromise;
    const db = client.db();

    const filter: Record<string, unknown> = {};
    if (type && (type === "lost" || type === "found")) filter.type = type;
    if (q) {
      const escaped = escapeRegex(q);
      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { location: { $regex: escaped, $options: "i" } },
      ];
    }

    const items = await db
      .collection("lost_found")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const result = items.map((item) => ({
      ...item,
      _id: item._id.toString(),
      reporterId: item.reporterId.toString(),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Report lost/found item
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = rateLimitResponse(`lost-found-create:${session.user.id}`, { windowMs: 60000, maxRequests: 5 });
  if (rateLimited) return rateLimited;

  try {
    const formData = await req.formData();
    const type = formData.get("type") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const location = formData.get("location") as string;
    const date = formData.get("date") as string;
    const contactInfo = formData.get("contactInfo") as string;
    const imageFiles = formData.getAll("images") as File[];

    if (!type || !title || !description || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Upload images
    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      if (file.size > 5 * 1024 * 1024) continue;
      const blob = await put(`lost-found/${Date.now()}-${file.name}`, file, {
        access: "public",
      });
      imageUrls.push(blob.url);
    }

    const client = await clientPromise;
    const db = client.db();

    const item = {
      type,
      title: title.trim(),
      description: description.trim(),
      category: category || "Other",
      location: location.trim(),
      date: date ? new Date(date) : new Date(),
      contactInfo: contactInfo?.trim() || "",
      images: imageUrls,
      reporterId: new ObjectId(session.user.id),
      reporterName: session.user.name,
      reporterImage: session.user.image,
      status: "open",
      createdAt: new Date(),
    };

    const result = await db.collection("lost_found").insertOne(item);

    return NextResponse.json({
      ...item,
      _id: result.insertedId.toString(),
      reporterId: session.user.id,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
