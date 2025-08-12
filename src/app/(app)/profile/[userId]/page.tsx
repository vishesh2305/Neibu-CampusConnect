// src/app/(app)/profile/[userId]/page.tsx

import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import FollowButton from "@/components/FollowButton";
import MessageButton from "@/components/MessageButton";
import PostFeed from "@/components/PostFeed";
import { getPosts } from "@/components/actions";
import { PencilSquareIcon } from "@heroicons/react/24/solid";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  image?: string;
  major?: string;
  year?: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

async function getUserProfile(
  targetUserId: string,
  currentUserId: string | null
): Promise<UserProfile | null> {
  if (!ObjectId.isValid(targetUserId)) return null;

  try {
    const client = await clientPromise;
    const db = client.db();
    const targetUserObjectId = new ObjectId(targetUserId);

    const user = await db.collection("users").findOne(
      { _id: targetUserObjectId },
      { projection: { password: 0 } }
    );
    if (!user) return null;

    const followerCount = await db
      .collection("followers")
      .countDocuments({ followingId: targetUserObjectId });

    const followingCount = await db
      .collection("followers")
      .countDocuments({ followerId: targetUserObjectId });

    let isFollowing = false;
    if (currentUserId && currentUserId !== targetUserId) {
      const followRelationship = await db.collection("followers").findOne({
        followerId: new ObjectId(currentUserId),
        followingId: targetUserObjectId,
      });
      isFollowing = !!followRelationship;
    }

    return {
      ...JSON.parse(JSON.stringify(user)),
      followerCount,
      followingCount,
      isFollowing,
    };
  } catch {
    return null;
  }
}

// ✅ Corrected Next.js 15 typing for params
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await getUserProfile(userId, session.user.id);
  if (!user) notFound();

  const initialPosts = await getPosts(session.user.id, undefined, userId);
  const isOwnProfile = session.user.id === user._id;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Card */}
      <div className="p-6 rounded-lg shadow-md border border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          {/* Profile Picture & Basic Info */}
          <div className="flex items-center space-x-4">
            <Image
              src={user.image || "/default-avatar.png"}
              alt="Avatar"
              height={80}
              width={80}
              className="w-24 h-24 rounded-full bg-gray-600 object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold text-white">{user.name}</h1>
              <div className="flex items-center gap-4 text-gray-400 mt-2">
                <span>
                  <span className="font-bold text-white">
                    {user.followerCount}
                  </span>{" "}
                  Followers
                </span>
                <span>
                  <span className="font-bold text-white">
                    {user.followingCount}
                  </span>{" "}
                  Following
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <Link
                href="/profile/edit"
                className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-white text-sm transition-colors bg-gray-600 hover:bg-gray-700"
              >
                <PencilSquareIcon className="h-5 w-5" />
                <span>Edit Profile</span>
              </Link>
            ) : (
              <>
                <MessageButton targetUserId={user._id} />
                <FollowButton
                  targetUserId={user._id}
                  isFollowing={user.isFollowing}
                />
              </>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="mt-6 border-t border-gray-700 pt-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Major</p>
              <p className="text-lg font-medium">
                {user.major || "Not specified"}
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Graduation Year</p>
              <p className="text-lg font-medium">
                {user.year || "Not specified"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User's Post Feed */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Posts by {user.name}
        </h2>
        <PostFeed initialPosts={initialPosts} />
      </div>
    </div>
  );
}
