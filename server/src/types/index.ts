export interface User {
  id: string;
  name: string;
  isSpectator: boolean;
}

export interface Vote {
  userId: string;
  value: number | null;
}

export interface Room {
  id: string;
  name: string;
  users: User[];
  votes: Vote[];
  isRevealed: boolean;
  currentStory: string;
  createdAt: string;
  updatedAt: string;
} 