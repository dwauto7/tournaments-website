import type { User, Tournament, ChatMessage } from '../types';

// --- Supabase Integration (ACTUAL IMPLEMENTATION) ---
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase credentials
const supabaseUrl = "https://dzgakkxkifsmviuwejoc.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Z2Fra3hraWZzbXZpdXdlam9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMDEzODcsImV4cCI6MjA3ODY3NzM4N30.d_TRJINKiABVg0IMy4uRQKoeOy4WUXX7Ee3MVnM77pw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Mock Data (Keep for fallback) ---
const MOCK_USERS: User[] = [
  { id: 'user-123', fullName: 'John Doe', email: 'john.doe@example.com', handicap: 12, phone: '123-456-7890' },
  { id: 'user-456', fullName: 'Jane Smith', email: 'jane.smith@example.com', handicap: 8, phone: '234-567-8901' },
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
    participantIds: ['user-456', 'user-789'],
    imageUrl: 'https://picsum.photos/seed/golf1/600/400',
  },
];

const MOCK_MESSAGES: ChatMessage[] = [
    { id: 'msg-1', tournamentId: 't-001', userId: 'user-456', userName: 'Jane Smith', message: 'Hey everyone! Looking forward to the tournament.', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
];

const SESSION_STORAGE_KEY = 'tournamate_session';

// --- Updated API Functions (Supabase + Fallback) ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Login with Google OAuth
export const loginWithGoogle = async (): Promise<{ user: any; error: any }> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback.html`
      }
    });
    
    console.log("n8n webhook triggered: 'User Login Attempt'", { provider: 'google' });
    return { user: data.user, error };
  } catch (error) {
    console.error('Google OAuth error:', error);
    return { user: null, error };
  }
};

// Login with GitHub OAuth  
export const loginWithGitHub = async (): Promise<{ user: any; error: any }> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback.html`
      }
    });
    
    console.log("n8n webhook triggered: 'User Login Attempt'", { provider: 'github' });
    return { user: data.user, error };
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return { user: null, error };
  }
};

// Keep existing login for mock fallback
export const login = async (): Promise<User> => {
  await delay(500);
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(MOCK_USER));
  return MOCK_USER;
};

export const logout = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    console.log("n8n webhook triggered: 'User Logout'");
  } catch (error) {
    console.error('Logout error:', error);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
};

export const getLoggedInUser = async (): Promise<User | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    if (session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
        handicap: 0, // Will be updated from profile
        phone: ''
      };
      return user;
    }
    return null;
  } catch (error) {
    console.error('Session error, using mock:', error);
    // Fallback to mock
    const session = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return session ? JSON.parse(session) : null;
  }
};

// Keep all other functions exactly the same
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
