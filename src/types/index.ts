import { ActiveRoom } from '../hooks/useSocket';

export interface User {
  id: string;
  name: string;
  isSpectator: boolean;
}

export interface Vote {
  userId: string;
  value: PointValue | null;
}

export interface Room {
  id: string;
  name: string;
  users: User[];
  votes: Vote[];
  isRevealed: boolean;
  currentStory: string;
}

export type PointValue = 0 | 1 | 2 | 3 | 5 | 8 | 13 | 21 | '?' | 'coffee';

export interface RoomContextType {
  room: Room | null;
  user: User | null;
  joinRoom: (roomId: string, userName: string, isSpectator: boolean) => void;
  createRoom: (roomName: string, userName: string) => void;
  vote: (value: PointValue) => void;
  revealVotes: () => void;
  resetVotes: () => void;
  setCurrentStory: (story: string) => void;
  exitRoom: () => void;
  getActiveRooms: () => Promise<ActiveRoom[]>;
} 