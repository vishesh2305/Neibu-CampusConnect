// src/components/GlobalChat.tsx

"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  anonymousUsername: string;
  text: string;
  createdAt: string;
}

let socket: Socket;

export default function GlobalChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket = io('http://localhost:3001');

    socket.emit('join-global-chat');
    
    socket.on('receive-global-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });
    
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

    return () => {
      socket.disconnect();
    };
  }, []);
  
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
        socket.emit('send-global-message', savedMessage);
        setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg">
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? <p>Loading messages...</p> : messages.map(msg => (
          <div key={msg._id} className="flex my-2">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-gray-700 text-gray-200">
              <p className="font-bold">{msg.anonymousUsername}</p>
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
            placeholder="Type an anonymous message..."
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