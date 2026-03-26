import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userIds } = await req.json();
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json([]);
    }

    // Limit batch size for security
    const limitedIds = userIds.slice(0, 50);
    const objectIds = limitedIds
      .filter((id: string) => ObjectId.isValid(id))
      .map((id: string) => new ObjectId(id));

    const client = await clientPromise;
    const db = client.db();

    const users = await db
      .collection("users")
      .find(
        { _id: { $in: objectIds } },
        { projection: { password: 0 } }
      )
      .toArray();

    const result = users.map((u) => ({
      _id: u._id.toString(),
      id: u._id.toString(),
      name: u.name,
      image: u.image,
      major: u.major,
      graduationYear: u.graduationYear,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
