import type { User, Tournament, ChatMessage } from '../types';

// --- Supabase Integration (Real Application) ---

// In a real application, you would uncomment this section and initialize your Supabase client.
// Credentials should be stored securely in environment variables (e.g., in a .env file),
// NOT hardcoded directly in the source code.

/*
import { createClient } from '@supabase/supabase-js';

// Example for a Vite-based project, which uses `import.meta.env`
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing. Make sure to set them in your environment variables.");
    // You might want to throw an error here in a real app
}

// Initialize the client
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// The mock API functions below would then be replaced with actual calls
// to the Supabase database and authentication services.
// For example, `login` would call `supabase.auth.signInWithOAuth({...})`,
// and `getPublicTournaments` would call `supabase.from('tournaments').select('*')`.
*/


// --- Mock Data ---

const MOCK_USERS: User[] = [
  { id: 'user-123', fullName: 'John Doe', email: 'john.doe@example.com', handicap: 12, phone: '123-456-7890' },
  { id: 'user-456', fullName: 'Jane Smith', email: 'jane.smith@example.com', handicap: 8, phone: '234-567-8901' },
  { id: 'user-789', fullName: 'Sam Wilson', email: 'sam.wilson@example.com', handicap: 18, phone: '345-678-9012' },
  { id: 'user-101', fullName: 'Alice Johnson', email: 'alice.j@example.com', handicap: 22, phone: '456-789-0123' },
  { id: 'user-102', fullName: 'Bob Brown', email: 'bob.b@example.com', handicap: 5, phone: '567-890-1234' },
];

const MOCK_USER: User = MOCK_USERS[0];

const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 't-001',
    name: 'Annual Charity Classic',
    startDate: '2024-08-15T09:00:00Z',
    maxPlayers: 120,
    creatorId: 'user-456',
    creatorName: 'Jane Smith',
    participantIds: ['user-456', 'user-789', 'user-101', 'user-102', 'user-123'],
    imageUrl: 'https://picsum.photos/seed/golf1/600/400',
  },
  {
    id: 't-002',
    name: 'Summer Scramble',
    startDate: '2024-09-05T08:30:00Z',
    maxPlayers: 80,
    creatorId: 'user-123',
    creatorName: 'John Doe',
    participantIds: ['user-123', 'user-456'],
    imageUrl: 'https://picsum.photos/seed/golf2/600/400',
  },
  {
    id: 't-003',
    name: 'The President\'s Cup',
    startDate: '2024-09-20T10:00:00Z',
    maxPlayers: 100,
    creatorId: 'user-789',
    creatorName: 'Sam Wilson',
    participantIds: ['user-789', 'user-101'],
    imageUrl: 'https://picsum.photos/seed/golf3/600/400',
  },
];

const MOCK_MESSAGES: ChatMessage[] = [
    { id: 'msg-1', tournamentId: 't-001', userId: 'user-456', userName: 'Jane Smith', message: 'Hey everyone! Looking forward to the tournament.', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: 'msg-2', tournamentId: 't-001', userId: 'user-102', userName: 'Bob Brown', message: 'Me too! The course is in great shape.', timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString() },
    { id: 'msg-3', tournamentId: 't-001', userId: 'user-123', userName: 'John Doe', message: 'What are the pairings for the first round?', timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString() },
];

const SESSION_STORAGE_KEY = 'tournamate_session';

// --- Mock API Functions ---

// Simulate a network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// NOTE: These functions would trigger n8n webhooks in a real application.

export const login = async (): Promise<User> => {
  await delay(500);
  // In a real app, this would be a Supabase OAuth call
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(MOCK_USER));
  return MOCK_USER;
};

export const logout = (): void => {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
};

export const getLoggedInUser = async (): Promise<User | null> => {
    await delay(200);
    const session = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if(session) {
        return JSON.parse(session);
    }
    return null;
}

export const getPublicTournaments = async (): Promise<Tournament[]> => {
  await delay(800);
  return MOCK_TOURNAMENTS;
};

export const getMyTournaments = async (userId: string): Promise<{ created: Tournament[], joined: Tournament[] }> => {
  await delay(800);
  const created = MOCK_TOURNAMENTS.filter(t => t.creatorId === userId);
  const joined = MOCK_TOURNAMENTS.filter(t => t.participantIds.includes(userId) && t.creatorId !== userId);
  return { created, joined };
};

export const createTournament = async (
    name: string, 
    maxPlayers: number, 
    startDate: string,
    creator: User
): Promise<Tournament> => {
    await delay(1000);
    const newTournament: Tournament = {
        id: `t-${Math.random().toString(36).substr(2, 9)}`,
        name,
        maxPlayers,
        startDate,
        creatorId: creator.id,
        creatorName: creator.fullName,
        participantIds: [creator.id],
        imageUrl: `https://picsum.photos/seed/${Math.random()}/600/400`
    };
    MOCK_TOURNAMENTS.push(newTournament);
    console.log("n8n webhook triggered: 'Create Tournament'", newTournament);
    return newTournament;
}

export const joinTournament = async (tournamentId: string, user: User): Promise<Tournament> => {
    await delay(700);
    const tournament = MOCK_TOURNAMENTS.find(t => t.id === tournamentId);
    if (!tournament) {
        throw new Error("Tournament not found");
    }
    if(tournament.participantIds.length >= tournament.maxPlayers){
        throw new Error("Tournament is full");
    }
    if(!tournament.participantIds.includes(user.id)) {
        tournament.participantIds.push(user.id);
    }
    console.log("n8n webhook triggered: 'Join Tournament'", { tournamentId, userId: user.id });
    return tournament;
}

export const getTournamentById = async (tournamentId: string): Promise<Tournament | undefined> => {
    await delay(500);
    return MOCK_TOURNAMENTS.find(t => t.id === tournamentId);
}

export const getUsersByIds = async (userIds: string[]): Promise<User[]> => {
    await delay(300);
    return MOCK_USERS.filter(u => userIds.includes(u.id));
}

export const getTournamentMessages = async (tournamentId: string): Promise<ChatMessage[]> => {
    await delay(600);
    return MOCK_MESSAGES.filter(m => m.tournamentId === tournamentId)
                        .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export const sendTournamentMessage = async (tournamentId: string, user: User, message: string): Promise<ChatMessage> => {
    await delay(400);
    const newMessage: ChatMessage = {
        id: `msg-${Math.random().toString(36).substr(2, 9)}`,
        tournamentId,
        userId: user.id,
        userName: user.fullName,
        message,
        timestamp: new Date().toISOString()
    };
    MOCK_MESSAGES.push(newMessage);
    console.log("n8n webhook triggered: 'Send Message'", newMessage);
    return newMessage;
}
