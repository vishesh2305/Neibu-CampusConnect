// scripts/seed.ts

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' }); // Load environment variables from .env.local

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not found in .env.local');
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(); // Your database name is part of the MONGODB_URI

    console.log('Connected to database successfully!');

    // Clean up existing collections
    await db.collection('courses').deleteMany({});
    await db.collection('reviews').deleteMany({});
    await db.collection('study_buddies').deleteMany({});
    await db.collection('users').deleteMany({}); // Optional: clean users for consistent IDs

    console.log('Cleared existing data.');

    // --- Create Sample Users ---
    // We create users first to get their IDs for reviews and study buddy profiles
    const usersResult = await db.collection('users').insertMany([
        { _id: new ObjectId("65d8c11a0a52b9e69f6e1e6a"), name: "Alice Johnson", email: "alice@example.edu" },
        { _id: new ObjectId("65d8c11a0a52b9e69f6e1e6b"), name: "Bob Williams", email: "bob@example.edu" },
    ]);
    const aliceId = usersResult.insertedIds[0];
    const bobId = usersResult.insertedIds[1];

    // --- Seed Courses ---
    const coursesResult = await db.collection('courses').insertMany([
      { name: 'Introduction to Artificial Intelligence', courseCode: 'CS101', description: 'Learn the fundamentals of AI and machine learning.', professor: 'Dr. Alan Turing' },
      { name: 'Advanced Web Development', courseCode: 'CS202', description: 'Deep dive into modern web technologies.', professor: 'Dr. Ada Lovelace' },
      { name: 'Data Structures and Algorithms', courseCode: 'CS303', description: 'Master essential data structures.', professor: 'Dr. Grace Hopper' },
    ]);
    const aiCourseId = coursesResult.insertedIds[0];
    console.log('Seeded Courses.');

    // --- Seed Reviews ---
    await db.collection('reviews').insertMany([
      { courseId: aiCourseId, professor: 'Dr. Alan Turing', rating: 5, comment: 'Amazing course, very insightful!', createdBy: aliceId },
      { courseId: coursesResult.insertedIds[1], professor: 'Dr. Ada Lovelace', rating: 4, comment: 'Great content, but fast-paced.', createdBy: bobId },
    ]);
    console.log('Seeded Reviews.');

    // --- Seed Study Buddy Profiles ---
    await db.collection('study_buddies').insertMany([
      { userId: aliceId, courses: ['CS101', 'CS303'], availability: { monday: ['morning', 'afternoon'] } },
      { userId: bobId, courses: ['CS101', 'CS202'], availability: { tuesday: ['evening'] } },
    ]);
    console.log('Seeded Study Buddy profiles.');


    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.close();
  }
}

seedDatabase();