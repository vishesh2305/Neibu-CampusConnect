// src/app/api/posts/create/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/authOptions";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { z } from "zod";

const postSchema = z.object({
  content: z
    .string()
    .min(1, { message: "Content is required." })
    .max(1000, { message: "Content cannot exceed 1000 characters." }),
  groupId: z.string().optional(),
  imageUrl: z.string().url({ message: "Invalid image URL." }).optional(),
});

interface NewPost {
  content: string;
  authorId: ObjectId;
  authorName?: string | null;
  authorImage?: string | null;
  createdAt: Date;
  groupId?: ObjectId;
  imageUrl?: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { message: "You must be logged in to post." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content, groupId, imageUrl } = parsed.data;

    const client = await clientPromise;
    const db = client.db();

    if (groupId) {
      if (!ObjectId.isValid(groupId)) {
        return NextResponse.json(
          { message: "Invalid Group ID" },
          { status: 400 }
        );
      }

      const membership = await db.collection("group_members").findOne({
        groupId: new ObjectId(groupId),
        userId: new ObjectId(session.user.id),
      });

      if (!membership) {
        return NextResponse.json(
          { message: "You are not a member of this group." },
          { status: 403 }
        );
      }
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

    if (imageUrl) {
      newPost.imageUrl = imageUrl.trim();
    }

    const result = await db.collection("posts").insertOne(newPost);

    return NextResponse.json(
      { message: "Post created successfully", postId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Unexpected error creating Post:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}