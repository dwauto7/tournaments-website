import { supabase } from "@/integrations/supabase/client";

// ==================== TYPES ====================

export interface CreateUserData {
  supabase_id: string;
  name: string;
  email: string;
  phone: string;
  handicap?: number;
}

export interface CreateTournamentData {
  created_by: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime?: string; 
  location: string;
  prize_pool?: string;
  game: string;
  max_participants: number;
  rules?: string;
}

export interface JoinTournamentData {
  user_id: string;
  tournament_id: string;
}

export interface ContactData {
  name: string;
  email: string;
  message: string;
}

// ==================== USER OPERATIONS ====================

/**
 * Create user profile in Supabase (called after auth.signUp)
 */
export async function createUserAPI(data: CreateUserData) {
  try {
    console.log("🚀 Creating user profile:", data);

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        id: data.supabase_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        handicap: data.handicap,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating user:", error);
      console.error("Error code:", error.code);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
      console.error("Error message:", error.message);
      return { data: null, error };
    }

    console.log("✅ User profile created:", user);
    return { data: { success: true, user }, error: null };
  } catch (error) {
    console.error("❌ Exception creating user:", error);
    return { data: null, error };
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// ==================== TOURNAMENT OPERATIONS ====================

/**
/**
 * Create a new tournament (Direct Supabase)
 */
export async function createTournamentAPI(data: CreateTournamentData) {
  try {
    let registrationCode = "";
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Generate a unique registration code
    while (!isUnique && attempts < maxAttempts) {
      // Use first 4 chars of game + random 4 digits + random 2 letters
      const gamePrefix = data.game.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000); // 1000-9999
      const randomLetters = Math.random().toString(36).substring(2, 4).toUpperCase();
      
      registrationCode = `${gamePrefix || 'TOUR'}-${randomNum}${randomLetters}`;

      // Check if code already exists
      const { data: existing } = await supabase
        .from("tournaments")
        .select("id")
        .eq("registration_code", registrationCode)
        .single();

      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      // Fallback: use timestamp-based code
      registrationCode = `TOUR-${Date.now().toString().slice(-8)}`;
    }

    const { data: tournament, error } = await supabase
      .from("tournaments")
      .insert({
        title: data.title,
        description: data.description,
        game: data.game,
        location: data.location,
        max_participants: data.max_participants,
        start_datetime: data.start_datetime,
        end_datetime: data.end_datetime, // ✅ ADD THIS
        status: "upcoming",
        prize_pool: data.prize_pool,
        rules: data.rules,
        created_by: data.created_by,
        registration_code: registrationCode,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating tournament:", error);
      return { data: null, error };
    }

    return { data: { success: true, registration_code: registrationCode, tournament }, error: null };
  } catch (error) {
    console.error("Exception creating tournament:", error);
    return { data: null, error };
  }
}

/**
 * Join a tournament by registration code
 */
export async function joinTournamentAPI(data: JoinTournamentData) {
  try {
    // Check if already joined
    const { data: existing } = await supabase
      .from("tournament_participants")
      .select("*")
      .eq("user_id", data.user_id)
      .eq("tournament_id", data.tournament_id)
      .single();

    if (existing) {
      return { 
        data: null, 
        error: { message: "You have already joined this tournament" } 
      };
    }

    // Check tournament capacity
    const { count } = await supabase
      .from("tournament_participants")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", data.tournament_id);

    const { data: tournament } = await supabase
      .from("tournaments")
      .select("max_participants")
      .eq("id", data.tournament_id)
      .single();

    if (count && tournament && count >= tournament.max_participants) {
      return { 
        data: null, 
        error: { message: "Tournament is full" } 
      };
    }

    // Join tournament
    const { data: participant, error } = await supabase
      .from("tournament_participants")
      .insert({
        tournament_id: data.tournament_id,
        user_id: data.user_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error joining tournament:", error);
      return { data: null, error };
    }

    return { data: { success: true, participant }, error: null };
  } catch (error) {
    console.error("Exception joining tournament:", error);
    return { data: null, error };
  }
}

/**
 * Join tournament by registration code
 */
export async function joinTournamentByCodeAPI(userId: string, registrationCode: string) {
  try {
    // Find tournament by code
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("id, max_participants, status")
      .eq("registration_code", registrationCode.toUpperCase())
      .single();

    if (tournamentError || !tournament) {
      return { 
        data: null, 
        error: { message: "Invalid registration code" } 
      };
    }

    if (tournament.status !== "upcoming") {
      return { 
        data: null, 
        error: { message: "Tournament is not open for registration" } 
      };
    }

    // Use the main join function
    return await joinTournamentAPI({
      user_id: userId,
      tournament_id: tournament.id,
    });
  } catch (error) {
    console.error("Exception joining by code:", error);
    return { data: null, error };
  }
}

/**
 * Get tournament details with participants
 */
export async function viewTournamentAPI(tournamentId: string) {
  try {
    console.log("🔍 Fetching tournament:", tournamentId);

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single();

    if (tournamentError) {
      console.error("❌ Tournament error:", tournamentError);
      return { data: null, error: tournamentError };
    }

    if (!tournament) {
      console.error("❌ Tournament not found");
      return { data: null, error: { message: "Tournament not found" } };
    }

    console.log("✅ Tournament found:", tournament);

    // Get participants with user details
    const { data: participantRecords, error: participantsError } = await supabase
      .from("tournament_participants")
      .select(`
        id,
        user_id,
        joined_at,
        group_assignment,
        users (
          id,
          name,
          email,
          phone,
          handicap
        )
      `)
      .eq("tournament_id", tournamentId);

    if (participantsError) {
      console.error("❌ Participants error:", participantsError);
      // Don't fail if participants fetch fails, just return empty array
      return {
        data: {
          success: true,
          tournament,
          participants: [],
        },
        error: null,
      };
    }

    console.log("✅ Participants found:", participantRecords?.length || 0);

    // Extract user data from participant records
    const participants = participantRecords
      ?.filter(p => p.users) // Filter out any null users
      .map(p => p.users) || [];

    return {
      data: {
        success: true,
        tournament,
        participants,
      },
      error: null,
    };
  } catch (error) {
    console.error("❌ Exception viewing tournament:", error);
    return { data: null, error };
  }
}

/**
 * List all upcoming tournaments
 */
export async function listTournamentsAPI(userId?: string) {
  try {
    let query = supabase
      .from("tournaments")
      .select("*, tournament_participants(count)")
      .eq("status", "upcoming")
      .order("start_datetime", { ascending: true });

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * List tournaments user has joined
 */
export async function listMyTournamentsAPI(userId: string) {
  try {
    const { data, error } = await supabase
      .from("tournament_participants")
      .select(`
        *,
        tournaments (*)
      `)
      .eq("user_id", userId)
      .order("joined_at", { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { 
      data: data.map(item => item.tournaments),
      error: null 
    };
  } catch (error) {
    return { data: null, error };
  }
}

// ==================== CONTACT ====================

/**
 * Submit a contact message
 */
export async function submitContactAPI(data: ContactData) {
  try {
    const { error } = await supabase.from("contact_messages").insert({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      message: data.message.trim(),
    });

    if (error) {
      return { data: null, error };
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
