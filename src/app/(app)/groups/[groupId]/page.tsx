// src/app/(app)/groups/[groupId]/page.tsx

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { notFound } from 'next/navigation';

import JoinLeaveGroupButton from '@/components/JoinLeaveGroupButton';
import CreatePost from '@/components/CreatePost';
import PostFeed from '@/components/PostFeed';

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

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ groupId: string }>; // Update to reflect params as a Promise
};

export default async function GroupPage({ params }: Props) {
  const { groupId } = await params; // Await params to resolve groupId
  const session = await getServerSession(authOptions);
  const group = await getGroupDetails(groupId, session?.user?.id || null);

  if (!group) notFound();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        {group.isMember && <CreatePost groupId={group._id} />}
        <PostFeed groupId={group._id} />
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