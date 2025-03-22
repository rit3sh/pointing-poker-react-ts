import { db } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import { Room, User, Vote } from '../types';

class FirestoreService {
  private roomsCollection = db.collection('rooms');

  // Create a new room
  async createRoom(roomName: string, user: User): Promise<Room> {
    const roomId = uuidv4();
    const room: Room = {
      id: roomId,
      name: roomName,
      users: [user],
      votes: [],
      isRevealed: false,
      currentStory: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.roomsCollection.doc(roomId).set(room);
    return room;
  }

  // Get a room by ID
  async getRoomById(roomId: string): Promise<Room | null> {
    const roomDoc = await this.roomsCollection.doc(roomId).get();
    if (!roomDoc.exists) {
      return null;
    }
    return roomDoc.data() as Room;
  }

  // Get all active rooms
  async getActiveRooms(): Promise<{ id: string; name: string; userCount: number }[]> {
    try {
      const snapshot = await this.roomsCollection.get();
      return snapshot.docs.map(doc => {
        const room = doc.data() as Room;
        return {
          id: room.id,
          name: room.name,
          userCount: room.users.length
        };
      });
    } catch (error) {
      console.error('Error getting active rooms:', error);
      
      // Try to create the collection if it doesn't exist
      if (error instanceof Error && error.message.includes('NOT_FOUND')) {
        console.log('Rooms collection may not exist yet, returning empty array');
        
        // Try to initialize the collection by writing a test document
        try {
          const testRoomId = 'test-room-' + Date.now();
          const testDoc = this.roomsCollection.doc(testRoomId);
          await testDoc.set({ id: testRoomId, initialized: true });
          await testDoc.delete();
          console.log('Successfully initialized rooms collection');
        } catch (initError) {
          console.error('Failed to initialize rooms collection:', initError);
        }
      }
      
      // Return empty array on error
      return [];
    }
  }

  // Add a user to a room
  async addUserToRoom(roomId: string, user: User): Promise<Room | null> {
    const roomRef = this.roomsCollection.doc(roomId);
    
    return db.runTransaction(async transaction => {
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists) {
        return null;
      }
      
      const room = roomDoc.data() as Room;
      room.users.push(user);
      room.updatedAt = new Date().toISOString();
      
      transaction.update(roomRef, { users: room.users, updatedAt: room.updatedAt });
      return room;
    });
  }

  // Remove a user from a room
  async removeUserFromRoom(roomId: string, userId: string): Promise<Room | null> {
    const roomRef = this.roomsCollection.doc(roomId);
    
    return db.runTransaction(async transaction => {
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists) {
        return null;
      }
      
      const room = roomDoc.data() as Room;
      const userIndex = room.users.findIndex((u: User) => u.id === userId);
      
      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        room.votes = room.votes.filter((v: Vote) => v.userId !== userId);
        room.updatedAt = new Date().toISOString();
        
        // If there are no users left, delete the room
        if (room.users.length === 0) {
          transaction.delete(roomRef);
          return null;
        } else {
          transaction.update(roomRef, { 
            users: room.users, 
            votes: room.votes,
            updatedAt: room.updatedAt 
          });
        }
      }
      
      return room;
    });
  }

  // Submit or update a vote
  async submitVote(roomId: string, userId: string, value: number | null): Promise<Room | null> {
    const roomRef = this.roomsCollection.doc(roomId);
    
    return db.runTransaction(async transaction => {
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists) {
        return null;
      }
      
      const room = roomDoc.data() as Room;
      const existingVoteIndex = room.votes.findIndex((v: Vote) => v.userId === userId);
      
      if (existingVoteIndex !== -1) {
        room.votes[existingVoteIndex].value = value;
      } else {
        room.votes.push({
          userId,
          value
        });
      }
      
      room.updatedAt = new Date().toISOString();
      transaction.update(roomRef, { votes: room.votes, updatedAt: room.updatedAt });
      return room;
    });
  }

  // Reveal votes in a room
  async revealVotes(roomId: string): Promise<Room | null> {
    const roomRef = this.roomsCollection.doc(roomId);
    
    return db.runTransaction(async transaction => {
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists) {
        return null;
      }
      
      const room = roomDoc.data() as Room;
      room.isRevealed = true;
      room.updatedAt = new Date().toISOString();
      
      transaction.update(roomRef, { isRevealed: true, updatedAt: room.updatedAt });
      return room;
    });
  }

  // Reset votes in a room
  async resetVotes(roomId: string): Promise<Room | null> {
    const roomRef = this.roomsCollection.doc(roomId);
    
    return db.runTransaction(async transaction => {
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists) {
        return null;
      }
      
      const room = roomDoc.data() as Room;
      room.votes = [];
      room.isRevealed = false;
      room.updatedAt = new Date().toISOString();
      
      transaction.update(roomRef, { 
        votes: room.votes, 
        isRevealed: false,
        updatedAt: room.updatedAt 
      });
      return room;
    });
  }

  // Set current story
  async setCurrentStory(roomId: string, story: string): Promise<Room | null> {
    const roomRef = this.roomsCollection.doc(roomId);
    
    return db.runTransaction(async transaction => {
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists) {
        return null;
      }
      
      const room = roomDoc.data() as Room;
      room.currentStory = story;
      room.updatedAt = new Date().toISOString();
      
      transaction.update(roomRef, { 
        currentStory: story,
        updatedAt: room.updatedAt 
      });
      return room;
    });
  }

  // Delete a room
  async deleteRoom(roomId: string): Promise<void> {
    await this.roomsCollection.doc(roomId).delete();
  }
}

export default new FirestoreService(); 