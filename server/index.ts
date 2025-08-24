// server/index.ts
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ObjectId, MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

export const client = new MongoClient(uri);
export const db = client.db('test');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Redis adapter
(async () => {
  try {
    const pubClient = createClient({ url: 'redis://localhost:6379' });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Redis adapter connected.');
  } catch (err) {
    console.warn('Redis not available. Using default in-memory adapter.');
  }
})();

app.use(express.json());

const userSocketMap = new Map<string, string>();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('register-user', (userId: string) => {
    userSocketMap.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('join-conversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('join-group-chat', (groupId: string) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group chat ${groupId}`);
  });

  socket.on(
    'send-group-message',
    async (message: { groupId: string; text: string; senderId: string; senderName: string }) => {
      try {
        await client.connect();
        const messageDocument = {
          groupId: new ObjectId(message.groupId),
          senderId: new ObjectId(message.senderId),
          senderName: message.senderName,
          text: message.text,
          createdAt: new Date(),
        };

        const result = await db.collection('group_messages').insertOne(messageDocument);
        const fullMessage = {
          ...messageDocument,
          _id: result.insertedId,
        };
        socket.broadcast.to(message.groupId).emit('receive-group-message', fullMessage);
      } catch (error) {
        console.error('Error saving group message:', error);
      }
    }
  );

  socket.on('send-message', (message: any) => {
    socket.to(message.conversationId).emit('receive-message', message);
  });

  socket.on('join-global-chat', () => {
    socket.join('global-chat');
    console.log(`User ${socket.id} joined global chat`);
  });

  socket.on('send-global-message', (message: any) => {
    io.to('global-chat').emit('receive-global-message', message);
  });

  socket.on('send-new-post', (post) => {
    io.emit('receive-new-post', post);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  });
});

// API endpoint to dispatch notifications
app.post('/api/dispatch-notification', (req, res) => {
  const { recipientId, notification } = req.body;
  const socketId = userSocketMap.get(recipientId);
  if (socketId) {
    io.to(socketId).emit('receive-notification', notification);
    console.log(`Dispatched notification to ${recipientId}`);
  }
  res.status(200).send('Notification dispatched');
});

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
