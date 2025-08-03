"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

interface ChatWindowProps {
  conversationId: string;
}

let socket: Socket;

export default function ChatWindow({ conversationId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket = io('http://localhost:3001');

    socket.emit('join-conversation', conversationId);
    
    socket.on('receive-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });
    
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/messages/${conversationId}`);
        if (res.ok) setMessages(await res.json());
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    return () => {
      socket.disconnect();
    };
  }, [conversationId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user) return;

    const optimisticMessage: Message = {
      _id: Date.now().toString(), 
      conversationId,
      senderId: session.user.id,
      text: newMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    
    const res = await fetch(`/api/messages/${conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newMessage }),
    });

    if (res.ok) {
        const savedMessage = await res.json();
        socket.emit('send-message', savedMessage);
        setMessages(prev => prev.map(msg => msg._id === optimisticMessage._id ? savedMessage : msg));
        router.refresh();
    } else {
        setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg">
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? <p>Loading messages...</p> : messages.map(msg => (
          <div key={msg._id} className={`flex my-2 ${msg.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
              msg.senderId === session?.user?.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}>
              {msg.text}
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