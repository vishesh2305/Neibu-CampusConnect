// src/app/api/posts/create/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  // 1. Authenticate the user
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { message: "You must be logged in to post." },
      { status: 401 }
    );
  }

  try {
    // 2. Parse the request body
    const { content } = await req.json();
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { message: "Post content is required." },
        { status: 400 }
      );
    }

    // 3. Connect to the database
    const client = await clientPromise;
    const db = client.db();

    // 4. Create the new post document
    const newPost = {
      content: content.trim(),
      authorId: new ObjectId(session.user.id), // Link the post to the user
      authorName: session.user.name,
      authorImage: session.user.image, // We'll add this to the session later
      createdAt: new Date(),
    };

    // 5. Insert the document into the 'posts' collection
    const result = await db.collection("posts").insertOne(newPost);

    return NextResponse.json(
      { message: "Post created successfully", postId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST_CREATION_ERROR", error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}