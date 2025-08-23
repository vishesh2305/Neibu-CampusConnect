// src/app/api/profile/update/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/authOptions";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import * as z from 'zod';


const updateProfileSchema = z.object({
  name: z.string().min(3, {message: "Name is required."}).trim(),
  major: z.string().trim().optional(),
  year: z.number().int({message: "Year must be an integer."}).min(1, {message: "Year must be a positive number."}).optional(),
  image: z.string().url({message: "Image must be a valid URL"}).optional(),
})

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed= updateProfileSchema.safeParse(body);

    if(!parsed.success){
      return NextResponse.json(
        {message: parsed.error.issues[0].message},
        {status: 400},
      );
    }

    const { name, major, year, image } = parsed.data;

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
    } = {name};


    if (major) updateData.major = major;
    if (year) updateData.year = year;
    if (image) updateData.image = image;


    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated successfully." }, { status: 200 });
  } catch (error) {
      if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    console.error("UPDATE_PROFILE_ERROR", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}