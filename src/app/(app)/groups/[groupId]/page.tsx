// src/app/(app)/groups/[groupId]/page.tsx

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/authOptions';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { notFound } from 'next/navigation';
import JoinLeaveGroupButton from '../../../../components/JoinLeaveGroupButton';
import CreatePost from '../../../../components/CreatePost';
import PostFeed from '../../../../components/PostFeed';
import { Metadata } from 'next';

interface GroupDetails {
  _id: string;
  name: string;
  description: string;
  memberCount: number;
  isMember: boolean;
}

async function getGroupDetails(groupId: string, userId: string | null): Promise<GroupDetails | null> {
  if (!ObjectId.isValid(groupId)) return null;
  try {
    const client = await clientPromise;
    const db = client.db();
    const groupObjectId = new ObjectId(groupId);
    const group = await db.collection('groups').findOne({ _id: groupObjectId });
    if (!group) return null;

    const memberCount = await db.collection('group_members').countDocuments({ groupId: groupObjectId });
    let isMember = false;

    if (userId) {
      const membership = await db.collection('group_members').findOne({
        groupId: groupObjectId,
        userId: new ObjectId(userId),
      });
      isMember = !!membership;
    }

    return {
      ...JSON.parse(JSON.stringify(group)),
      memberCount,
      isMember,
    };
  } catch (error) {
    console.error("Failed to get group details", error);
    return null;
  }
}

async function getGroupPosts(groupId: string) {
  const client = await clientPromise;
  const db = client.db();
  const posts = await db
    .collection('posts')
    .find({ groupId: new ObjectId(groupId) })
    .sort({ createdAt: -1 })
    .toArray();

  return JSON.parse(JSON.stringify(posts));
}

type Props = {
  params: Promise<{ groupId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { groupId } = await params;
  const session = await getServerSession(authOptions);
  const group = await getGroupDetails(groupId, session?.user?.id || null);

  if (!group) {
    return { title: 'Group Not Found' };
  }

  return {
    title: group.name,
    description: group.description,
  };
}

export default async function GroupPage({ params }: Props) {
  const { groupId } = await params;
  const session = await getServerSession(authOptions);
  const group = await getGroupDetails(groupId, session?.user?.id || null);

  if (!group) notFound();

  const posts = await getGroupPosts(groupId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        {group.isMember && <CreatePost groupId={group._id} />}
        <PostFeed initialPosts={posts} groupId={group._id} />
      </div>

      <div className="md:col-span-1">
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white">{group.name}</h1>
              <p className="text-gray-400 mt-2">{group.description}</p>
              <p className="text-sm text-gray-500 mt-2">{group.memberCount} member(s)</p>
            </div>
            <JoinLeaveGroupButton groupId={group._id} isMember={group.isMember} />
          </div>
        </div>
      </div>
    </div>
  );
}