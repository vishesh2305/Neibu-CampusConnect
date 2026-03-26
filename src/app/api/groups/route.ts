import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const groups = await db
      .collection("groups")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const result = groups.map((g) => ({
      ...g,
      _id: g._id.toString(),
      creatorId: g.creatorId?.toString(),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
