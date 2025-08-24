// src/app/(app)/academic/courses/[courseId]/page.tsx

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../lib/authOptions';
import clientPromise from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { notFound } from 'next/navigation';
import CourseChat from '@/components/CourseChat';

interface CourseDetails {
  _id: string;
  name: string;
  description: string;
  courseCode: string;
  professor: string;
  chatGroupId?: string;
  isEnrolled: boolean;
}

async function getCourseDetails(courseId: string, userId: string): Promise<CourseDetails | null> {
  if (!ObjectId.isValid(courseId) || !ObjectId.isValid(userId)) return null;

  try {
    const client = await clientPromise;
    const db = client.db();

    const courseObjectId = new ObjectId(courseId);
    const userObjectId = new ObjectId(userId);

    const course = await db.collection('courses').findOne({ _id: courseObjectId });
    if (!course) return null;

    const membership = await db.collection('course_members').findOne({
      courseId: courseObjectId,
      userId: userObjectId,
    });


    const chatGroup = await db.collection('groups').findOne({ courseId: courseObjectId });

    return {
      _id: course._id.toString(),
      name: course.name,
      description: course.description,
      courseCode: course.courseCode,
      professor: course.professor,
      isEnrolled: !!membership,
      chatGroupId: chatGroup ? chatGroup._id.toString() : undefined,
    };
  } catch (error) {
    console.error("Failed to get course details", error);
    return null;
  }
}

// ✅ Using promise for params, same pattern as ProfilePage
export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) return notFound();

  const course = await getCourseDetails(courseId, session.user.id);
  if (!course) return notFound();


return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
                <h1 className="text-3xl font-bold text-white">{course.name}</h1>
                <p className="text-lg text-gray-400">{course.courseCode}</p>
                <p className="mt-4 text-gray-300">{course.description}</p>
                <p className="mt-2 text-sm text-gray-500">Professor: {course.professor}</p>
            </div>

            {course.isEnrolled && course.chatGroupId ? (
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Course Chat</h2>
                    {/* Replace the placeholder with the new CourseChat component */}
                    <CourseChat groupId={course.chatGroupId} />
                </div>
            ) : (
                <div className="text-center text-white p-8 bg-gray-800 rounded-lg">
                    <h2 className="text-xl">Enroll in this course to join the discussion.</h2>
                </div>
            )}
        </div>
    );
}