// src/app/api/courses/route.ts

import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const courses = await db.collection('courses').find({}).toArray();
    return NextResponse.json(courses);
  } catch (error) {
    console.error('GET_COURSES_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}