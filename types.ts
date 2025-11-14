
export interface User {
  id: string;
  fullName: string;
  email: string;
  handicap?: number;
  phone?: string;
}

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  maxPlayers: number;
  creatorId: string;
  creatorName: string;
  participantIds: string[];
  imageUrl: string;
}

export interface ChatMessage {
  id: string;
  tournamentId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}
