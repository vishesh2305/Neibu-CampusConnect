// src/app/api/courses/[courseId]/enroll/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../lib/authOptions';
import clientPromise from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  

  const { courseId } = await params;
  if (!ObjectId.isValid(courseId)) {
    return NextResponse.json({ message: 'Invalid Course ID' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);
    const courseObjectId = new ObjectId(courseId);

    const course = await db.collection('courses').findOne({ _id: courseObjectId });
    if (!course) {
        return NextResponse.json({ message: 'Course not found.' }, { status: 404 });
    }

    const existingMembership = await db.collection('course_members').findOne({
      courseId: courseObjectId,
      userId: userId,
    });

    if (existingMembership) {
      return NextResponse.json({ message: 'You are already enrolled in this course.' }, { status: 409 });
    }

    let chatGroup = await db.collection('groups').findOne({ courseId: courseObjectId });
    if (!chatGroup) {
        const newGroup = {
            name: `${course.name} - Chat`,
            description: `Discussion group for the course: ${course.name}`,
            creatorId: new ObjectId(session.user.id), 
            isCourseGroup: true, 
            courseId: courseObjectId,
            createdAt: new Date(),
        };
        const groupResult = await db.collection('groups').insertOne(newGroup);
        chatGroup = { _id: groupResult.insertedId, ...newGroup };
    }

    await db.collection('group_members').updateOne(
        { groupId: chatGroup._id, userId: userId },
        { $setOnInsert: { groupId: chatGroup._id, userId: userId, joinedAt: new Date() } },
        { upsert: true }
    );
    
    await db.collection('course_members').insertOne({
        courseId: courseObjectId,
        userId: userId,
        enrolledAt: new Date(),
    });

    return NextResponse.json({ message: 'Successfully enrolled and added to chat group.' }, { status: 200 });

  } catch (error) {
    console.error('ENROLL_COURSE_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}