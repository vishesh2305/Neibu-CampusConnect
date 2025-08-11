import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface SessionUser {
  id: string;
  role: 'admin' | 'user'; // extend with other roles if needed
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ postId: string }> }
) {
  const { postId } = await context.params;

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!ObjectId.isValid(postId)) {
    return NextResponse.json({ message: 'Invalid Post ID' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const postObjectId = new ObjectId(postId);
    const currentUserId = new ObjectId(session.user.id);
    const userRole = (session.user as SessionUser).role;

    // Authorization
    const post = await db.collection('posts').findOne({ _id: postObjectId });

    if (!post) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    const isAuthor = post.authorId.equals(currentUserId);
    const isAdmin = userRole === 'admin';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await db.collection('posts').deleteOne({ _id: postObjectId });

    await Promise.all([
      db.collection('likes').deleteMany({ postId: postObjectId }),
      db.collection('comments').deleteMany({ postId: postObjectId }),
      db.collection('notifications').deleteMany({ postId: postObjectId }),
    ]);

    return NextResponse.json(
      { message: 'Post deleted successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE_POST_ERROR', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}