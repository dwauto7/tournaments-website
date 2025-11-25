import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTournamentRefresh } from "@/contexts/TournamentRefreshContext";
import { toast } from "sonner";
import { Calendar, Users, Trophy, Loader2, Search, MapPin } from "lucide-react";
import { format } from "date-fns";
import { joinTournamentAPI, joinTournamentByCodeAPI } from "@/lib/api";

interface Tournament {
  id: string;
  title: string;
  description: string;
  game: string;
  location: string;
  max_participants: number;
  start_datetime: string;
  status: string;
  prize_pool: string;
  registration_code: string;
}

const JoinTournament = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refreshFlag, triggerRefresh } = useTournamentRefresh();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [search, setSearch] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joiningByCode, setJoiningByCode] = useState(false);

  useEffect(() => {
    fetchAvailableTournaments();
  }, [user, refreshFlag]);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredTournaments(tournaments);
    } else {
      const searchTerm = search.toLowerCase();
      const filtered = tournaments.filter(
        (t) =>
          t.title.toLowerCase().includes(searchTerm) ||
          t.game.toLowerCase().includes(searchTerm) ||
          t.registration_code?.toLowerCase().includes(searchTerm) // ✅ ADDED
      );
      setFilteredTournaments(filtered);

      // Auto-populate join code field if search looks like a code
      if (/^[A-Z]+-\d+$/i.test(search.trim())) {
        setJoinCode(search.trim().toUpperCase());
      }
    }
  }, [search, tournaments]);

  const fetchAvailableTournaments = async () => {
    if (!user) return;

    // Get tournaments user hasn't joined yet
    const { data: participantData } = await supabase
      .from("tournament_participants")
      .select("tournament_id")
      .eq("user_id", user.id);

    const joinedIds = participantData?.map((p) => p.tournament_id) || [];

    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("status", "upcoming")
      .not("id", "in", joinedIds.length ? joinedIds : ["00000000-0000-0000-0000-000000000000"])
      .order("start_datetime", { ascending: true });

    if (error) {
      console.error("Error fetching tournaments:", error);
    } else {
      setTournaments(data || []);
      setFilteredTournaments(data || []);
    }
    setLoading(false);
  };

  const handleJoin = async (tournament: Tournament) => {
    if (!user) {
      toast.error("Please log in first");
      return;
    }

    setJoiningId(tournament.id);

    const { data, error } = await joinTournamentAPI({
      user_id: user.id,
      tournament_id: tournament.id,
    });

    if (error) {
      toast.error(error.message || "Failed to join tournament");
    } else if (data?.success) {
      toast.success("Successfully joined tournament!");
      triggerRefresh();
      fetchAvailableTournaments();
