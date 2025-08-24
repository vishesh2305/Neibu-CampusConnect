// src/components/ProfileTabs.tsx
"use client";

import { useState } from 'react';
import { PostProps } from './Post';
import PostFeed from './PostFeed';
import UserList from './UserList';

interface ProfileTabsProps {
  userId: string;
  initialPosts: PostProps[];
}

export default function ProfileTabs({ userId, initialPosts }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');

  const tabStyles = "px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors";
  const activeTabStyles = "bg-gray-800 text-white";
  const inactiveTabStyles = "text-gray-400 hover:bg-gray-800/50";

  return (
    <div>
      <div className="border-b border-gray-700">
        <nav className="flex space-x-2">
          <button onClick={() => setActiveTab('posts')} className={`${tabStyles} ${activeTab === 'posts' ? activeTabStyles : inactiveTabStyles}`}>Posts</button>
          <button onClick={() => setActiveTab('followers')} className={`${tabStyles} ${activeTab === 'followers' ? activeTabStyles : inactiveTabStyles}`}>Followers</button>
          <button onClick={() => setActiveTab('following')} className={`${tabStyles} ${activeTab === 'following' ? activeTabStyles : inactiveTabStyles}`}>Following</button>
        </nav>
      </div>

      <div className="py-6">
        {activeTab === 'posts' && <PostFeed initialPosts={initialPosts} context="profile" groupId={userId} />}
        {activeTab === 'followers' && <UserList apiUrl={`/api/users/${userId}/followers`} />}
        {activeTab === 'following' && <UserList apiUrl={`/api/users/${userId}/following`} />}
      </div>
    </div>
  );
}