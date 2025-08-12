// src/app/api/search/route.ts

import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const typeFilter = searchParams.get('type'); // 'all', 'users', 'posts', 'groups'

  if (!query) {
    return NextResponse.json({ message: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const searchRegex = { $regex: query, $options: 'i' };
    const results = [];

    if (typeFilter === 'all' || typeFilter === 'users') {
      const users = await db.collection('users').find(
        { name: searchRegex },
        { projection: { _id: 1, name: 1, image: 1 } }
      ).limit(10).toArray();
      results.push(...users.map(u => ({ ...u, type: 'user' })));
    }

    if (typeFilter === 'all' || typeFilter === 'posts') {
      const posts = await db.collection('posts').find(
        { content: searchRegex },
        { projection: { _id: 1, content: 1, authorName: 1 } }
      ).limit(10).toArray();
      results.push(...posts.map(p => ({ ...p, type: 'post' })));
    }

    if (typeFilter === 'all' || typeFilter === 'groups') {
      const groups = await db.collection('groups').find(
        { name: searchRegex },
        { projection: { _id: 1, name: 1, description: 1 } }
      ).limit(10).toArray();
      results.push(...groups.map(g => ({ ...g, type: 'group' })));
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('SEARCH_API_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}