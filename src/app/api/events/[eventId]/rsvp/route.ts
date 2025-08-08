import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/authOptions";
import clientPromise from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!ObjectId.isValid(eventId)) {
    return NextResponse.json({ message: "Invalid Event ID" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);
    const eventObjectId = new ObjectId(eventId);

    const existingRsvp = await db.collection("rsvps").findOne({
      eventId: eventObjectId,
      userId: userId,
    });

    if (existingRsvp) {
      await db.collection("rsvps").deleteOne({ _id: existingRsvp._id });
      return NextResponse.json({ message: "Successfully removed RSVP." }, { status: 200 });
    } else {
      await db.collection("rsvps").insertOne({
        eventId: eventObjectId,
        userId: userId,
        rsvpdAt: new Date(),
      });
      return NextResponse.json({ message: "Successfully RSVP'd to the event." }, { status: 200 });
    }
  } catch (error) {
    console.error("RSVP_EVENT_ERROR", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}