import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Profile } from "next-auth";
import { notFound } from "next/navigation";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  major?: string;
  year?: number;
  createdAt: string;
}

// This is the local type, replacing the global PageProps
type ProfilePageProps = {
  params: {
    userId: string;
  };
};

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!ObjectId.isValid(userId)) return null;

  try {
    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    if (!user) return null;

    return JSON.parse(JSON.stringify(user));
  } catch {
    return null;
  }
}



export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params; 
  const user = await getUserProfile(userId);

  if (!user) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="w-24 h-24 rounded-full bg-gray-600" />
          <div>
            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>
        <div className="mt-6 border-t border-gray-700 pt-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Major</p>
              <p className="text-lg font-medium">{user.major || "Not specified"}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Graduation Year</p>
              <p className="text-lg font-medium">{user.year || "Not specified"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}