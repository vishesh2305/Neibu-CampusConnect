"use server";

import clientPromise from "@/lib/mongodb";

export interface AdminPost {
  _id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export async function getAllPosts(): Promise<AdminPost[]> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const posts = await db
      .collection("posts")
      .find({})
      .sort({ createdAt: -1 })
      .project({ content: 1, authorName: 1, createdAt: 1 })
      .toArray();

    return JSON.parse(JSON.stringify(posts));
  } catch (error) {
    console.error("Failed to fetch posts for admin", error);
    return [];
  }
}
