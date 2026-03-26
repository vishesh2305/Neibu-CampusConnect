// src/components/GlobalChat.tsx

"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/userStore';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface Message {
  _id: string;
  anonymousUsername: string;
  text: string;
  createdAt: string;
}

export default function GlobalChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const { socket } = useUserStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/global-chat');
        if (res.ok) setMessages(await res.json());
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    socket.emit('join-global-chat');

    const handleReconnect = () => {
      socket.emit('join-global-chat');
    };

    const handleReceive = (message: Message) => {
      setMessages(prev => {
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    socket.on('connect', handleReconnect);
    socket.on('receive-global-message', handleReceive);

    return () => {
      socket.off('connect', handleReconnect);
      socket.off('receive-global-message', handleReceive);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user) return;

    const res = await fetch('/api/global-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newMessage }),
    });

    if (res.ok) {
        const savedMessage = await res.json();
        socket?.emit('send-global-message', savedMessage);
        setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full shadow-md rounded-lg">
      <div className="flex-1 p-4 overflow-y-auto ">
        {loading ? <p className="text-gray-400">Loading messages...</p> : messages.map(msg => (
          <div key={msg._id} className="flex my-2">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-[#1e1e2e] text-gray-200">
              <p className="font-bold text-emerald-400 text-sm">{msg.anonymousUsername}</p>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-[#2e2e3e]">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type an anonymous message..."
            className="flex-1 px-3 py-2 bg-[#12121a] border border-[#2e2e3e] text-white placeholder-gray-500 rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <button type="submit" className="p-2 bg-violet-600 rounded-full text-white hover:bg-violet-500 cursor-pointer" aria-label="Send message">
            <PaperAirplaneIcon className="h-5 w-5"/>
          </button>
        </form>
      </div>
    </div>
  );
}
