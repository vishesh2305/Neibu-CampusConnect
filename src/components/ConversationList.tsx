import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/authOptions';
import clientPromise from '../lib/mongodb';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
    _id: string;
    lastMessageAt: string;
    otherParticipant: {
        _id: string;
        name: string;
        image?: string;
    };
    lastMessage?: {
        text: string;
    };
}

async function getConversations(userId: string): Promise<Conversation[]> {
    try {
        const client = await clientPromise;
        const db = client.db();
        const userObjectId = new ObjectId(userId);

        const conversations = await db.collection('conversations').aggregate([
            { $match: { participants: userObjectId } },
            { $sort: { lastMessageAt: -1 } },
            { $lookup: { from: 'users', let: { p: '$participants' }, pipeline: [ { $match: { $expr: { $in: ['$_id', '$$p'] } } }, { $match: { _id: { $ne: userObjectId } } } ], as: 'otherParticipants' }},
            { $unwind: '$otherParticipants' },
            { $lookup: { from: 'messages', localField: '_id', foreignField: 'conversationId', as: 'lastMessage' }},
            { $addFields: { lastMessage: { $last: '$lastMessage' } } },
            { $project: { _id: 1, lastMessageAt: 1, otherParticipant: { _id: '$otherParticipants._id', name: '$otherParticipants.name', image: '$otherParticipants.image' }, lastMessage: { text: '$lastMessage.text' } }}
        ]).toArray();

        return JSON.parse(JSON.stringify(conversations));
    } catch (error) {
        console.error("Failed to fetch conversations", error);
        return [];
    }
}

export default async function ConversationList() {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const conversations = await getConversations(session.user.id);

    return (
        <div className="h-full shadow-lg ">
            <div className="p-4 font-semibold text-lg ">Messages</div>
            <nav className="flex flex-col">
                {conversations.map(convo => (
                    <Link href={`/messages/${convo._id}`} key={convo._id} className="p-4 flex items-center gap-4 hover:bg-gray-800 transition-colors">
                        <Image src={convo.otherParticipant.image || '/default-avatar.png'} alt={convo.otherParticipant.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold truncate">{convo.otherParticipant.name}</h3>
                                <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(convo.lastMessageAt), { addSuffix: true })}</p>
                            </div>
                            <p className="text-sm text-gray-400 truncate">{convo.lastMessage?.text || 'No messages yet'}</p>
                        </div>
                    </Link>
                ))}
                {conversations.length === 0 && (
                    <p className="p-4 text-center text-sm text-gray-500">No conversations yet.</p>
                )}
            </nav>
        </div>
    );
}