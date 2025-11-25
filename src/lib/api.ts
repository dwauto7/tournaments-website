import { supabase } from "@/integrations/supabase/client";

const N8N_BASE_URL = "https://n8n.aiblizzard.work/webhook";

export interface CreateUserData {
  supabase_id: string;
  name: string;
  email: string;
  phone: string;
  handicap?: number;
}

export interface ViewTournamentData {
  tournament_id: string;
  supabase_id: string;
}

export interface CreateTournamentData {
  created_by: string;
  name: string;
  description?: string;
  start_datetime: string;
  location: string;
  prize_pool?: string;
  game: string;
  max_participants: number;
  rules?: string;
}

export interface JoinTournamentData {
  supabase_id: string;
  registration_code: string;
}

export interface ContactData {
  name: string;
  email: string;
  message: string;
}

/**
 * Create user in Airtable via n8n webhook
 */
export async function createUserAPI(data: CreateUserData) {
  try {
    const response = await fetch(`${N8N_BASE_URL}/create-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return { data: null, error: { message: "Failed to create user in Airtable" } };
    }

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Create a new tournament via n8n webhook
 */
export async function createTournamentAPI(data: CreateTournamentData) {
  try {
    const response = await fetch(`${N8N_BASE_URL}/create-tournament`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return { data: null, error: { message: "Failed to create tournament" } };
    }

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Join a tournament by code via n8n webhook
 */
export async function joinTournamentAPI(data: JoinTournamentData) {
  try {
    const response = await fetch(`${N8N_BASE_URL}/join-tournament`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      return { data: null, error: { message: result.message || "Failed to join tournament" } };
    }

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Submit a contact message via direct Supabase insert
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

/**
 * Fetch tournaments the user has joined via n8n webhook
 */
export async function viewTournamentAPI(data: ViewTournamentData) {
  try {
    const response = await fetch(`${N8N_BASE_URL}/view-tournament`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result?.success) {
      return { 
        data: null, 
        error: { message: result?.message || "Failed to fetch tournament details" } 
      };
    }

    // Expected result shape from n8n:
    // {
    //   success: true,
    //   tournament: { id, name, description, start_datetime, ... },
    //   participants: [ { name, email, ... }, ... ]
    // }
    return { data: result, error: null };
  } catch (error) {
    console.error("Error fetching tournament details:", error);
    return { 
      data: null, 
      error: { message: "Network error while fetching tournament" } 
    };
  }
}
