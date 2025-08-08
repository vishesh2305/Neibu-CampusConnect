// src/app/api/posts/[postId]/delete/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../lib/authOptions';
import clientPromise from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { postId } = await params;
  if (!ObjectId.isValid(postId)) {
    return NextResponse.json({ message: 'Invalid Post ID' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const postObjectId = new ObjectId(postId);

    const deleteResult = await db.collection('posts').deleteOne({ _id: postObjectId });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }
    await Promise.all([
      db.collection('likes').deleteMany({ postId: postObjectId }),
      db.collection('comments').deleteMany({ postId: postObjectId }),
      db.collection('notifications').deleteMany({ postId: postObjectId }),
    ]);

    return NextResponse.json({ message: 'Post and associated data deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('DELETE_POST_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}