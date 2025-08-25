"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { getAllPosts, AdminPost } from "./actions";
import AdminUserList from "@/components/AdminUserList";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"posts" | "users">("posts");
  const [posts, setPosts] = useState<AdminPost[]>([]);

  useEffect(() => {
    if (activeTab === "posts") {
      getAllPosts().then(setPosts);
    }
  }, [activeTab]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  const tabStyles =
    "px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors";
  const activeTabStyles = "bg-gray-800 text-white";
  const inactiveTabStyles = "text-gray-400 hover:bg-gray-800/50";

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Admin Dashboard</h1>
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-2">
          <button
            onClick={() => setActiveTab("posts")}
            className={`${tabStyles} ${
              activeTab === "posts" ? activeTabStyles : inactiveTabStyles
            }`}
          >
            Manage Posts
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`${tabStyles} ${
              activeTab === "users" ? activeTabStyles : inactiveTabStyles
            }`}
          >
            Manage Users
          </button>
        </nav>
      </div>

      <div>
        {activeTab === "posts" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Posts</h2>
            {posts.length === 0 ? (
              <p className="text-gray-400">No posts found.</p>
            ) : (
              <ul className="space-y-2">
                {posts.map((post) => (
                  <li
                    key={post._id}
                    className="bg-gray-900 p-3 rounded-lg shadow"
                  >
                    <p className="font-semibold">{post.authorName}</p>
                    <p className="text-gray-300">{post.content}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "users" && <AdminUserList />}
      </div>

      <div>
        {/* The AdminPostList now needs to fetch its own data or be adapted */}
        {activeTab === 'posts' && <p>Post management would be here. Refactor AdminPostList to fetch its own data similar to AdminUserList.</p>}
        {activeTab === 'users' && <AdminUserList />}
      </div>
    </div>


  );
}
