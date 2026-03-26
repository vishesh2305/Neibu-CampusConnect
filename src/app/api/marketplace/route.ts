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

// GET - Fetch marketplace listings
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = 20;

    const client = await clientPromise;
    const db = client.db();

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (q) {
      const escaped = escapeRegex(q);
      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ];
    }

    const listings = await db
      .collection("marketplace")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const result = listings.map((l) => ({
      ...l,
      _id: l._id.toString(),
      sellerId: l.sellerId.toString(),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a listing
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = rateLimitResponse(`marketplace-create:${session.user.id}`, { windowMs: 60000, maxRequests: 5 });
  if (rateLimited) return rateLimited;

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const category = formData.get("category") as string;
    const condition = formData.get("condition") as string;
    const location = formData.get("location") as string;
    const imageFiles = formData.getAll("images") as File[];

    if (!title || !description || isNaN(price)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Upload images
    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      if (file.size > 5 * 1024 * 1024) continue; // Skip files > 5MB
      const blob = await put(`marketplace/${Date.now()}-${file.name}`, file, {
        access: "public",
      });
      imageUrls.push(blob.url);
    }

    const client = await clientPromise;
    const db = client.db();

    const listing = {
      title: title.trim(),
      description: description.trim(),
      price,
      category,
      condition,
      location: location?.trim() || "",
      images: imageUrls,
      sellerId: new ObjectId(session.user.id),
      sellerName: session.user.name,
      sellerImage: session.user.image,
      status: "active",
      createdAt: new Date(),
    };

    const result = await db.collection("marketplace").insertOne(listing);

    return NextResponse.json({
      ...listing,
      _id: result.insertedId.toString(),
      sellerId: session.user.id,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
