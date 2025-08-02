// src/app/api/profile/update/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // We can now accept 'image' in the request body
    const { name, major, year, image } = await req.json();

    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ message: "Name is required." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const userId = session.user.id;

    const updateData: {
      name: string;
      major?: string;
      year?: number;
      image?: string;
    } = {
      name: name.trim(),
      major: major?.trim(),
      year,
    };

    // Conditionally add the image to the update object if it exists
    if (typeof image === 'string') {
        updateData.image = image;
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated successfully." }, { status: 200 });
  } catch (error) {
    console.error("UPDATE_PROFILE_ERROR", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}