import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = session.user.id;

    const events = await db
      .collection("events")
      .aggregate([
        { $sort: { date: 1, time: 1 } },
        {
          $lookup: {
            from: "rsvps",
            localField: "_id",
            foreignField: "eventId",
            as: "rsvpsData",
          },
        },
        {
          $addFields: {
            rsvpCount: { $size: "$rsvpsData" },
            hasRsvpd: { $in: [new ObjectId(userId), "$rsvpsData.userId"] },
          },
        },
        { $project: { rsvpsData: 0 } },
      ])
      .toArray();

    const result = events.map((e) => ({
      ...e,
      _id: e._id.toString(),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
