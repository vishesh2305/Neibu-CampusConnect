// src/app/(app)/messages/[conversationId]/page.tsx

import { notFound } from 'next/navigation';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/authOptions';
import ChatWindow from '../../../../components/ChatWindow';
import Image from 'next/image';

interface Participant {
    _id: string;
    name: string;
    image?: string;
}

async function getConversationPartner(conversationId: string, currentUserId: string): Promise<Participant | null> {
    if (!ObjectId.isValid(conversationId)) return null;

    try {
        const client = await clientPromise;
        const db = client.db();
        const conversation = await db.collection('conversations').findOne({
            _id: new ObjectId(conversationId),
            participants: new ObjectId(currentUserId)
        });

        if (!conversation) return null;

        const partnerId = conversation.participants.find((p: ObjectId) => !p.equals(currentUserId));
        if (!partnerId) return null;

        const partner = await db.collection('users').findOne({ _id: partnerId }, { projection: { name: 1, image: 1 } });
        return JSON.parse(JSON.stringify(partner));

    } catch (error) {
        console.error("Failed to get conversation partner", error);
        return null;
    }
}

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;

    const session = await getServerSession(authOptions);
    if (!session) return notFound();

    const partner = await getConversationPartner(conversationId, session.user.id);
    if (!partner) return notFound();

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center gap-4 p-3 border-b border-gray-800 bg-gray-950">
                <Image
                    src={partner.image || '/default-avatar.png'}
                    alt={partner.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                />
                <h2 className="font-semibold text-lg text-white">{partner.name}</h2>
            </header>
            <div className="flex-1">
                <ChatWindow conversationId={conversationId} />
            </div>
        </div>
    );
}