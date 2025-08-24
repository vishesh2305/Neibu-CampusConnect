// src/app/api/groups/[groupId]/messages/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../lib/authOptions';
import clientPromise from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // --- FIX START ---
  // We access 'groupId' directly without 'await'.
  const { groupId } = await params;
  // --- FIX END ---

  if (!ObjectId.isValid(groupId)) {
    return NextResponse.json({ message: 'Invalid Group ID' }, { status: 400 });
  }
  
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const messages = await db.collection('group_messages').find({ 
        groupId: new ObjectId(groupId) 
    }).sort({ createdAt: 1 }).toArray();

    // This part is correct and handles data serialization.
    return NextResponse.json(JSON.parse(JSON.stringify(messages)));
  } catch (error) {
    console.error('GET_GROUP_MESSAGES_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}