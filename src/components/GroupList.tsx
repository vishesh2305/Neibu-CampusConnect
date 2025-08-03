import clientPromise from '../lib/mongodb';
import Link from 'next/link';

interface Group {
    _id: string;
    name: string;
    description: string;
}

async function getGroups(): Promise<Group[]> {
    try {
        const client = await clientPromise;
        const db = client.db();
        const groups = await db.collection('groups').find({}).sort({ createdAt: -1 }).toArray();
        return JSON.parse(JSON.stringify(groups));
    } catch (error) {
        console.error("Failed to fetch groups", error);
        return [];
    }
}

export default async function GroupList() {
    const groups = await getGroups();

    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-white">Discover Groups</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                    <Link href={`/groups/${group._id}`} key={group._id} className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                        <h3 className="font-semibold text-white">{group.name}</h3>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{group.description}</p>
                    </Link>
                ))}
            </div>
            {groups.length === 0 && (
                <p className="text-center text-gray-500 mt-8">No groups found. Why not create one?</p>
            )}
        </div>
    );
}