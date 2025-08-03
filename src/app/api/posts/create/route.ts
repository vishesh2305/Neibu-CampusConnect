// src/app/api/posts/create/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/authOptions";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: "You must be logged in to post." }, { status: 401 });
  }

  try {
    const { content, groupId, imageUrl } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ message: "Post content is required." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    if (groupId) {
      if (!ObjectId.isValid(groupId)) {
        return NextResponse.json({ message: "Invalid Group ID" }, { status: 400 });
      }
      const membership = await db.collection('group_members').findOne({
        groupId: new ObjectId(groupId),
        userId: new ObjectId(session.user.id),
      });
      if (!membership) {
        return NextResponse.json({ message: "You are not a member of this group." }, { status: 403 });
      }
    }

  interface NewPost {
  content: string;
  authorId: ObjectId;
  authorName?: string | null;
  authorImage?: string | null;
  createdAt: Date;
  groupId?: ObjectId;
  imageUrl?: string;
}


    const newPost: NewPost = {
      content: content.trim(),
      authorId: new ObjectId(session.user.id),
      authorName: session.user.name,
      authorImage: session.user.image,
      createdAt: new Date(),
    };

    if (groupId) {
      newPost.groupId = new ObjectId(groupId);
    }

    if (imageUrl && typeof imageUrl === "string" && imageUrl.trim() !== "") {
      newPost.imageUrl = imageUrl.trim();
    }

    const result = await db.collection("posts").insertOne(newPost);

    return NextResponse.json(
      { message: "Post created successfully", postId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST_CREATION_ERROR", error);
    return NextResponse.json({ message: "An internal server error occurred." }, { status: 500 });
  }
}