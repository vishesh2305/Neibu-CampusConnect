// src/components/CourseChat.tsx

"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { useUserStore } from '@/store/userStore';

interface Message {
  _id: string;
  groupId: string;
  senderId: string;
  senderName: string; 
  text: string;
  createdAt: string;
}

interface ChatWindowProps {
  groupId: string;
}

export default function CourseChat({ groupId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const { socket } = useUserStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join-group-chat', groupId);

    const handleNewMessage = (message: Message) => {
      if(message.senderId === session?.user?.id){
        return;
      }
        if (message.groupId === groupId) {
            setMessages(prev => [...prev, message]);
        }
    };
    
    socket.on('receive-group-message', handleNewMessage);
    
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/groups/${groupId}/messages`);
        if (res.ok) setMessages(await res.json());
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    return () => {
      socket.off('receive-group-message', handleNewMessage);
    };
  }, [groupId, socket, session]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user || !socket) return;
    
    const messageData = {
        groupId,
        senderId : session.user.id,
        text: newMessage.trim(),
        senderName: session.user.name || 'Anonymous'
    };
    
    socket.emit('send-group-message', messageData);

    const optimisticMessage: Message = {
      _id: Date.now().toString(),
      groupId,
      senderId: session.user.id,
      senderName: session.user.name || 'Anonymous',
      text: newMessage.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[60vh] bg-gray-800 rounded-lg">
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? <p className="text-center text-gray-400">Loading messages...</p> : messages.map(msg => (
          <div key={msg._id} className={`flex my-2 ${msg.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
              msg.senderId === session?.user?.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}>
              <p className="font-bold text-sm">{msg.senderName}</p>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700">
            <PaperAirplaneIcon className="h-5 w-5"/>
          </button>
        </form>
      </div>
    </div>
  );
}