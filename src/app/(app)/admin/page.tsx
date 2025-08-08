// src/app/(app)/admin/page.tsx

import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/authOptions";
import { redirect } from "next/navigation";
import clientPromise from "../../../lib/mongodb";
import AdminPostList from "../../../components/AdminPostList";

interface AdminPost {
  _id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

async function getAllPosts(): Promise<AdminPost[]> {
    try {
        const client = await clientPromise;
        const db = client.db();
        const posts = await db.collection('posts')
            .find({})
            .sort({ createdAt: -1 })
            .project({ content: 1, authorName: 1, createdAt: 1 }) // Only fetch necessary fields
            .toArray();
        return JSON.parse(JSON.stringify(posts));
    } catch (error) {
        console.error("Failed to fetch all posts for admin", error);
        return [];
    }
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);


  if (session?.user?.role !== "admin") {
    redirect("/dashboard"); 
  }

  const posts = await getAllPosts();

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Admin Dashboard - Manage Posts</h1>
      <AdminPostList initialPosts={posts} />
    </div>
  );
}