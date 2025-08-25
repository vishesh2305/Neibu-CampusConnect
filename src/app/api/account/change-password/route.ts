// src/app/api/account/change-password/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters long."),
});

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = passwordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    const user = await db.collection('users').findOne({ _id: userId });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordCorrect) {
      return NextResponse.json({ message: 'Incorrect current password.' }, { status: 403 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.collection('users').updateOne(
      { _id: userId },
      { $set: { password: hashedNewPassword } }
    );

    return NextResponse.json({ message: 'Password updated successfully.' }, { status: 200 });

  } catch (error) {
    console.error('CHANGE_PASSWORD_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}