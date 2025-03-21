import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

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

interface Room {
  id: string;
  name: string;
  users: User[];
  votes: Vote[];
  isRevealed: boolean;
  currentStory: string;
}

interface User {
  id: string;
  name: string;
  isSpectator: boolean;
}

interface Vote {
  userId: string;
  value: number | null;
}

const rooms = new Map<string, Room>();

io.on('connection', (socket) => {
  socket.on('createRoom', ({ roomName, userName }) => {
    const roomId = uuidv4();
    const room: Room = {
      id: roomId,
      name: roomName,
      users: [{
        id: socket.id,
        name: userName,
        isSpectator: false
      }],
      votes: [],
      isRevealed: false,
      currentStory: ''
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    io.to(roomId).emit('roomUpdated', room);
    io.emit('roomCreated', {
      id: roomId,
      name: roomName,
      userCount: 1
    });
  });

  socket.on('joinRoom', ({ roomId, userName, isSpectator }) => {
    const room = rooms.get(roomId);
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

    room.users.push(user);
    socket.join(roomId);
    io.to(roomId).emit('roomUpdated', room);
  });

  socket.on('vote', ({ roomId, value }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const existingVoteIndex = room.votes.findIndex(v => v.userId === socket.id);
    if (existingVoteIndex !== -1) {
      room.votes[existingVoteIndex].value = value;
    } else {
      room.votes.push({
        userId: socket.id,
        value
      });
    }

    io.to(roomId).emit('roomUpdated', room);
  });

  socket.on('revealVotes', (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.isRevealed = true;
    io.to(roomId).emit('roomUpdated', room);
  });

  socket.on('resetVotes', (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.votes = [];
    room.isRevealed = false;
    io.to(roomId).emit('roomUpdated', room);
  });

  socket.on('setCurrentStory', ({ roomId, story }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.currentStory = story;
    io.to(roomId).emit('roomUpdated', room);
  });

  socket.on('leaveRoom', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const userIndex = room.users.findIndex(u => u.id === socket.id);
    if (userIndex !== -1) {
      room.users.splice(userIndex, 1);
      room.votes = room.votes.filter(v => v.userId !== socket.id);
      
      socket.leave(roomId);

      if (room.users.length === 0) {
        rooms.delete(roomId);
        io.emit('roomDeleted', roomId);
      } else {
        io.to(roomId).emit('roomUpdated', room);
      }
    }
  });

  socket.on('getActiveRooms', () => {
    const activeRooms = Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      userCount: room.users.length
    }));
    socket.emit('activeRooms', activeRooms);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    rooms.forEach((room, roomId) => {
      const userIndex = room.users.findIndex(u => u.id === socket.id);
      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        room.votes = room.votes.filter(v => v.userId !== socket.id);
        
        if (room.users.length === 0) {
          rooms.delete(roomId);
          io.emit('roomDeleted', roomId);
        } else {
          io.to(roomId).emit('roomUpdated', room);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 