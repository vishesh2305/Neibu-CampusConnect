// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
    return NextResponse.json(JSON.parse(JSON.stringify(users)));
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}