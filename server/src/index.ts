import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Room, User, Vote } from './types';
import FirestoreService from './services/FirestoreService';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "https://pointing-poker-client.azurewebsites.net"],
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: ["http://localhost:5173", "https://pointing-poker-client.azurewebsites.net"]
}));
app.use(express.json());

// Store active socket room memberships for quick lookup
const socketRooms = new Map<string, string>();

// Function to broadcast updated rooms list to all clients
const broadcastActiveRooms = async () => {
  try {
    const activeRooms = await FirestoreService.getActiveRooms();
    io.emit('activeRoomsUpdated', activeRooms);
    console.log(`Broadcasting ${activeRooms.length} active rooms to all clients`);
  } catch (error) {
    console.error('Error broadcasting active rooms:', error);
  }
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', async ({ roomName, userName }) => {
    try {
      const user: User = {
        id: socket.id,
        name: userName,
        isSpectator: false
      };

      const room = await FirestoreService.createRoom(roomName, user);
      
      // Track which room this socket is in
      socketRooms.set(socket.id, room.id);
      
      // Join the socket room
      socket.join(room.id);
      
      // Notify room members
      io.to(room.id).emit('roomUpdated', room);
      
      // Broadcast updated rooms list to all clients
      await broadcastActiveRooms();
      
      console.log(`Room created: ${room.id}, ${room.name}`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('roomError', { message: 'Failed to create room' });
    }
  });

  socket.on('joinRoom', async ({ roomId, userName, isSpectator }) => {
    try {
      // First check if room exists
      const room = await FirestoreService.getRoomById(roomId);
      if (!room) {
        console.log(`Room with ID ${roomId} not found`);
        socket.emit('roomError', { message: 'Room not found' });
        return;
      }

      const user: User = {
        id: socket.id,
        name: userName,
        isSpectator
      };

      // Add user to room in Firestore
      const updatedRoom = await FirestoreService.addUserToRoom(roomId, user);
      if (!updatedRoom) {
        socket.emit('roomError', { message: 'Failed to join room' });
        return;
      }
      
      // Track which room this socket is in
      socketRooms.set(socket.id, roomId);
      
      // Join the socket room
      socket.join(roomId);
      
      // Notify room members
      io.to(roomId).emit('roomUpdated', updatedRoom);
      console.log(`User ${userName} joined room ${roomId}`);
      
      // Broadcast updated active rooms to all clients to update user counts
      await broadcastActiveRooms();
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('roomError', { message: 'Failed to join room' });
    }
  });

  socket.on('vote', async ({ roomId, value }) => {
    try {
      const updatedRoom = await FirestoreService.submitVote(roomId, socket.id, value);
      if (updatedRoom) {
        io.to(roomId).emit('roomUpdated', updatedRoom);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      socket.emit('roomError', { message: 'Failed to submit vote' });
    }
  });

  socket.on('revealVotes', async (roomId) => {
    try {
      const updatedRoom = await FirestoreService.revealVotes(roomId);
      if (updatedRoom) {
        io.to(roomId).emit('roomUpdated', updatedRoom);
      }
    } catch (error) {
      console.error('Error revealing votes:', error);
      socket.emit('roomError', { message: 'Failed to reveal votes' });
    }
  });

  socket.on('resetVotes', async (roomId) => {
    try {
      const updatedRoom = await FirestoreService.resetVotes(roomId);
      if (updatedRoom) {
        io.to(roomId).emit('roomUpdated', updatedRoom);
      }
    } catch (error) {
      console.error('Error resetting votes:', error);
      socket.emit('roomError', { message: 'Failed to reset votes' });
    }
  });

  socket.on('setCurrentStory', async ({ roomId, story }) => {
    try {
      const updatedRoom = await FirestoreService.setCurrentStory(roomId, story);
      if (updatedRoom) {
        io.to(roomId).emit('roomUpdated', updatedRoom);
      }
    } catch (error) {
      console.error('Error setting story:', error);
      socket.emit('roomError', { message: 'Failed to set story' });
    }
  });

  socket.on('leaveRoom', async ({ roomId }) => {
    try {
      const updatedRoom = await FirestoreService.removeUserFromRoom(roomId, socket.id);
      
      // Leave the socket room
      socket.leave(roomId);
      
      // Remove from socket tracking
      socketRooms.delete(socket.id);
      
      if (updatedRoom) {
        // Room still exists, notify remaining members
        io.to(roomId).emit('roomUpdated', updatedRoom);
      } 
      
      // Broadcast updated rooms list to all clients
      await broadcastActiveRooms();
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  socket.on('getActiveRooms', async () => {
    try {
      console.log('Client requested active rooms');
      const activeRooms = await FirestoreService.getActiveRooms();
      console.log(`Sending ${activeRooms.length} active rooms to client`);
      socket.emit('activeRooms', activeRooms);
    } catch (error) {
      console.error('Error getting active rooms:', error);
      // Send empty array on error to prevent client from hanging
      socket.emit('activeRooms', []);
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // Check if this socket was in a room
    const roomId = socketRooms.get(socket.id);
    if (roomId) {
      try {
        // Remove user from the room
        const updatedRoom = await FirestoreService.removeUserFromRoom(roomId, socket.id);
        
        // Clean up tracking
        socketRooms.delete(socket.id);
        
        if (updatedRoom) {
          // Room still exists, notify remaining members
          io.to(roomId).emit('roomUpdated', updatedRoom);
        }
        
        // Broadcast updated rooms list to all clients
        await broadcastActiveRooms();
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 