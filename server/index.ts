// server/index.ts — Enhanced with WebRTC Signaling, Typing Indicators, Read Receipts, Online Status, Nearby Discovery
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ObjectId, MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load .env.local first, fallback to .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

export const client = new MongoClient(uri, {
  maxPoolSize: 20,
  minPoolSize: 5,
  maxIdleTimeMS: 60000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});
export const db = client.db('test');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',')
      : true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 60000,
  transports: ['websocket', 'polling'],
});

// Redis adapter (optional, graceful fallback)
(async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Redis adapter connected.');
  } catch (err) {
    console.warn('Redis not available. Using default in-memory adapter.');
  }
})();

app.use(express.json());

// ==================== USER TRACKING ====================
interface OnlineUser {
  socketId: string;
  userId: string;
  lastSeen: Date;
  location?: { lat: number; lng: number };
}

const userSocketMap = new Map<string, string>(); // userId -> socketId
const onlineUsers = new Map<string, OnlineUser>(); // userId -> OnlineUser
const activeCallsMap = new Map<string, { callerId: string; calleeId: string; roomId: string }>(); // roomId -> call info

// ==================== HELPER FUNCTIONS ====================
function getUserIdBySocket(socketId: string): string | undefined {
  for (const [userId, sid] of userSocketMap.entries()) {
    if (sid === socketId) return userId;
  }
  return undefined;
}

function broadcastOnlineStatus(userId: string, isOnline: boolean) {
  io.emit('user-status-change', { userId, isOnline, lastSeen: new Date() });
}

// ==================== SOCKET.IO EVENTS ====================
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // ---- User Registration & Online Status ----
  socket.on('register-user', (userId: string) => {
    userSocketMap.set(userId, socket.id);
    onlineUsers.set(userId, {
      socketId: socket.id,
      userId,
      lastSeen: new Date(),
    });
    broadcastOnlineStatus(userId, true);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('get-online-users', (userIds: string[]) => {
    const statuses: Record<string, boolean> = {};
    for (const uid of userIds) {
      statuses[uid] = onlineUsers.has(uid);
    }
    socket.emit('online-users-status', statuses);
  });

  // ---- Conversations ----
  socket.on('join-conversation', (conversationId: string) => {
    const roomId = String(conversationId);
    socket.join(roomId);
    console.log(`[join-conversation] Socket ${socket.id} joined room: ${roomId}`);
  });

  socket.on('leave-conversation', (conversationId: string) => {
    socket.leave(conversationId);
  });

  // ---- Direct Messages with Delivery Status ----
  socket.on('send-message', (message: any) => {
    const roomId = String(message.conversationId);
    const room = io.sockets.adapter.rooms.get(roomId);
    const roomMembers = room ? Array.from(room) : [];
    console.log(`[send-message] Room: ${roomId}, Members: [${roomMembers.join(', ')}], Sender: ${socket.id}, MsgId: ${message._id}`);
    socket.to(roomId).emit('receive-message', message);
    if (room && room.size > 1) {
      socket.emit('message-delivered', { messageId: message._id, conversationId: roomId });
    }
  });

  // ---- Typing Indicators ----
  socket.on('typing-start', (data: { conversationId: string; userId: string; userName: string }) => {
    socket.to(data.conversationId).emit('user-typing', {
      userId: data.userId,
      userName: data.userName,
      conversationId: data.conversationId,
    });
  });

  socket.on('typing-stop', (data: { conversationId: string; userId: string }) => {
    socket.to(data.conversationId).emit('user-stopped-typing', {
      userId: data.userId,
      conversationId: data.conversationId,
    });
  });

  // ---- Read Receipts ----
  socket.on('messages-read', (data: { conversationId: string; userId: string; messageIds: string[] }) => {
    socket.to(data.conversationId).emit('messages-read-receipt', {
      userId: data.userId,
      messageIds: data.messageIds,
      conversationId: data.conversationId,
      readAt: new Date(),
    });
  });

  // ---- Message Reactions ----
  socket.on('message-reaction', (data: { conversationId: string; messageId: string; userId: string; emoji: string }) => {
    io.to(data.conversationId).emit('receive-reaction', data);
  });

  // ==================== WEBRTC VIDEO CALLING ====================

  socket.on('call-user', (data: { callerId: string; callerName: string; callerImage: string; calleeId: string; roomId: string; callType: 'video' | 'audio' }) => {
    const calleeSocketId = userSocketMap.get(data.calleeId);
    console.log(`[call-user] Caller: ${data.callerId} -> Callee: ${data.calleeId}, Socket: ${calleeSocketId}, Room: ${data.roomId}`);
    if (calleeSocketId) {
      activeCallsMap.set(data.roomId, { callerId: data.callerId, calleeId: data.calleeId, roomId: data.roomId });
      // Caller joins the call room immediately
      socket.join(data.roomId);
      io.to(calleeSocketId).emit('incoming-call', {
        callerId: data.callerId,
        callerName: data.callerName,
        callerImage: data.callerImage,
        roomId: data.roomId,
        callType: data.callType,
      });
    } else {
      socket.emit('call-failed', { reason: 'User is offline', calleeId: data.calleeId });
    }
  });

  socket.on('accept-call', (data: { roomId: string; callerId: string }) => {
    console.log(`[accept-call] Room: ${data.roomId}, Callee: ${socket.id}, Caller: ${data.callerId}`);
    const callerSocketId = userSocketMap.get(data.callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-accepted', { roomId: data.roomId });
    }
    socket.join(data.roomId);
  });

  socket.on('reject-call', (data: { roomId: string; callerId: string; reason?: string }) => {
    const callerSocketId = userSocketMap.get(data.callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-rejected', { roomId: data.roomId, reason: data.reason || 'Call rejected' });
    }
    activeCallsMap.delete(data.roomId);
  });

  socket.on('join-call-room', (roomId: string) => {
    socket.join(roomId);
  });

  // WebRTC Signaling
  socket.on('webrtc-offer', (data: { roomId: string; offer: RTCSessionDescriptionInit; targetUserId: string }) => {
    const targetSocketId = userSocketMap.get(data.targetUserId);
    const senderId = getUserIdBySocket(socket.id);
    console.log(`[webrtc-offer] From: ${senderId} -> To: ${data.targetUserId} (socket: ${targetSocketId || 'NOT FOUND'})`);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-offer', { offer: data.offer, roomId: data.roomId, senderId });
    } else {
      console.warn(`[webrtc-offer] Target user ${data.targetUserId} not found in socket map!`);
    }
  });

  socket.on('webrtc-answer', (data: { roomId: string; answer: RTCSessionDescriptionInit; targetUserId: string }) => {
    const targetSocketId = userSocketMap.get(data.targetUserId);
    const senderId = getUserIdBySocket(socket.id);
    console.log(`[webrtc-answer] From: ${senderId} -> To: ${data.targetUserId} (socket: ${targetSocketId || 'NOT FOUND'})`);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-answer', { answer: data.answer, roomId: data.roomId, senderId });
    } else {
      console.warn(`[webrtc-answer] Target user ${data.targetUserId} not found in socket map!`);
    }
  });

  socket.on('webrtc-ice-candidate', (data: { roomId: string; candidate: RTCIceCandidateInit; targetUserId: string }) => {
    const targetSocketId = userSocketMap.get(data.targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-ice-candidate', { candidate: data.candidate, roomId: data.roomId, senderId: getUserIdBySocket(socket.id) });
    }
  });

  socket.on('end-call', (data: { roomId: string }) => {
    socket.to(data.roomId).emit('call-ended', { roomId: data.roomId });
    socket.leave(data.roomId);
    activeCallsMap.delete(data.roomId);
  });

  socket.on('toggle-media', (data: { roomId: string; type: 'audio' | 'video'; enabled: boolean }) => {
    socket.to(data.roomId).emit('remote-media-toggle', { type: data.type, enabled: data.enabled, userId: getUserIdBySocket(socket.id) });
  });

  // ==================== GROUP CHAT ====================

  socket.on('join-group-chat', (groupId: string) => {
    socket.join(groupId);
  });

  socket.on(
    'send-group-message',
    async (message: { groupId: string; text: string; senderId: string; senderName: string; replyTo?: string }) => {
      try {
        const messageDocument: any = {
          groupId: new ObjectId(message.groupId),
          senderId: new ObjectId(message.senderId),
          senderName: message.senderName,
          text: message.text,
          createdAt: new Date(),
        };
        if (message.replyTo) {
          messageDocument.replyTo = new ObjectId(message.replyTo);
        }

        const result = await db.collection('group_messages').insertOne(messageDocument);
        const fullMessage = { ...messageDocument, _id: result.insertedId };
        socket.broadcast.to(message.groupId).emit('receive-group-message', fullMessage);
      } catch (error) {
        console.error('Error saving group message:', error);
      }
    }
  );

  // ---- Group Typing ----
  socket.on('group-typing-start', (data: { groupId: string; userId: string; userName: string }) => {
    socket.to(data.groupId).emit('group-user-typing', data);
  });

  socket.on('group-typing-stop', (data: { groupId: string; userId: string }) => {
    socket.to(data.groupId).emit('group-user-stopped-typing', data);
  });

  // ==================== GLOBAL CHAT ====================

  socket.on('join-global-chat', () => {
    socket.join('global-chat');
  });

  socket.on('send-global-message', (message: any) => {
    io.to('global-chat').emit('receive-global-message', message);
  });

  // ==================== POSTS ====================

  socket.on('send-new-post', (post) => {
    io.emit('receive-new-post', post);
  });

  // ==================== GROUPS & EVENTS (REAL-TIME) ====================

  socket.on('send-new-group', (group) => {
    io.emit('receive-new-group', group);
  });

  socket.on('send-new-event', (event) => {
    io.emit('receive-new-event', event);
  });

  // ==================== NEARBY USERS (GEOLOCATION) ====================

  socket.on('update-location', (data: { userId: string; lat: number; lng: number }) => {
    const user = onlineUsers.get(data.userId);
    if (user) {
      user.location = { lat: data.lat, lng: data.lng };
      onlineUsers.set(data.userId, user);
    }
  });

  socket.on('discover-nearby', (data: { userId: string; lat: number; lng: number; radiusKm: number }) => {
    const nearbyUsers: Array<{ userId: string; distance: number }> = [];
    for (const [uid, user] of onlineUsers.entries()) {
      if (uid === data.userId || !user.location) continue;
      const distance = haversineDistance(data.lat, data.lng, user.location.lat, user.location.lng);
      if (distance <= data.radiusKm) {
        nearbyUsers.push({ userId: uid, distance: Math.round(distance * 1000) }); // distance in meters
      }
    }
    nearbyUsers.sort((a, b) => a.distance - b.distance);
    socket.emit('nearby-users-result', nearbyUsers);
  });

  // ==================== STORIES ====================

  socket.on('new-story', (story: any) => {
    io.emit('receive-new-story', story);
  });

  // ==================== DISCONNECT ====================

  socket.on('disconnect', () => {
    const userId = getUserIdBySocket(socket.id);
    if (userId) {
      // Update last seen before removing
      const user = onlineUsers.get(userId);
      if (user) {
        // Store last seen in DB asynchronously
        db.collection('users').updateOne(
          { _id: new ObjectId(userId) },
          { $set: { lastSeen: new Date(), isOnline: false } }
        ).catch(() => {});
      }
      userSocketMap.delete(userId);
      onlineUsers.delete(userId);
      broadcastOnlineStatus(userId, false);
    }

    // Clean up any active calls
    for (const [roomId, call] of activeCallsMap.entries()) {
      if (call.callerId === userId || call.calleeId === userId) {
        socket.to(roomId).emit('call-ended', { roomId, reason: 'User disconnected' });
        activeCallsMap.delete(roomId);
      }
    }
  });
});

// ==================== HAVERSINE DISTANCE ====================
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ==================== REST ENDPOINTS ====================

// Dispatch notification
app.post('/api/dispatch-notification', (req, res) => {
  const { recipientId, notification } = req.body;
  const socketId = userSocketMap.get(recipientId);
  if (socketId) {
    io.to(socketId).emit('receive-notification', notification);
  }
  res.status(200).send('OK');
});

// Get online status for user IDs
app.post('/api/online-status', (req, res) => {
  const { userIds } = req.body;
  const statuses: Record<string, { isOnline: boolean; lastSeen?: Date }> = {};
  for (const uid of (userIds || [])) {
    const user = onlineUsers.get(uid);
    statuses[uid] = { isOnline: !!user, lastSeen: user?.lastSeen };
  }
  res.json(statuses);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    connectedUsers: userSocketMap.size,
    activeCalls: activeCallsMap.size,
    uptime: process.uptime(),
  });
});

// ==================== DB CONNECTION & START ====================
(async () => {
  try {
    await client.connect();
    console.log('MongoDB connected for Socket server.');

    // Create indexes for performance
    await db.collection('messages').createIndex({ conversationId: 1, createdAt: -1 });
    await db.collection('messages').createIndex({ senderId: 1 });
    await db.collection('messages').createIndex({ status: 1 });
    await db.collection('conversations').createIndex({ participants: 1 });
    await db.collection('conversations').createIndex({ lastMessageAt: -1 });
    await db.collection('group_messages').createIndex({ groupId: 1, createdAt: -1 });
    await db.collection('notifications').createIndex({ userId: 1, read: 1, createdAt: -1 });
    await db.collection('posts').createIndex({ authorId: 1, createdAt: -1 });
    await db.collection('posts').createIndex({ groupId: 1, createdAt: -1 });
    await db.collection('likes').createIndex({ postId: 1, userId: 1 }, { unique: true });
    await db.collection('followers').createIndex({ followerId: 1, followingId: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ lastSeen: -1 });
    await db.collection('stories').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('stories').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('marketplace').createIndex({ createdAt: -1 });
    await db.collection('marketplace').createIndex({ category: 1, status: 1 });
    await db.collection('lost_found').createIndex({ createdAt: -1 });
    await db.collection('lost_found').createIndex({ type: 1, status: 1 });
    console.log('Database indexes created.');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
})();

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  io.close();
  await client.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down...');
  io.close();
  await client.close();
  process.exit(0);
});
