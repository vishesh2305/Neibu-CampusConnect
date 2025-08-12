// server/index.ts

import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

const userSocketMap = new Map<string, string>(); // Map<userId, socketId>

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('register-user', (userId: string) => {
    userSocketMap.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('send-message', (message) => {
    socket.to(message.conversationId).emit('receive-message', message);
  });

  socket.on('join-global-chat', () => {
    socket.join('global-chat');
    console.log(`User ${socket.id} joined the global chat`);
  });

  socket.on('send-global-message', (message) => {
    io.to('global-chat').emit('receive-global-message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up the map on disconnect
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  });
});

// Endpoint for Next.js API to trigger notifications
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