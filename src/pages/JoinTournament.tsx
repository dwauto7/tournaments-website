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
      // Search by title, game, or registration code format
      const searchTerm = search.toLowerCase();
      const filtered = tournaments.filter(
        (t) =>
          t.title.toLowerCase().includes(searchTerm) ||
          t.game.toLowerCase().includes(searchTerm)
      );
      setFilteredTournaments(filtered);
      
      // If search looks like a registration code (e.g., "GOLF-42"), auto-populate join code field
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
    
  // Direct Supabase call
  const { data, error } = await joinTournamentAPI({
    user_id: user.id,
    registration_code: tournament.join_code,
  });

  if (error) {
    toast.error(error.message || "Failed to join tournament");
  } else if (data?.success) {
    toast.success("Successfully joined tournament!");
    triggerRefresh();
    fetchAvailableTournaments();
  }

  setJoiningId(null);
}

const handleJoinByCode = async () => {
  if (!user || !joinCode.trim()) {
    toast.error("Please enter a join code");
    return;
  }

  setJoiningByCode(true);

 // Direct Supabase call with code
  const { data, error } = await joinTournamentByCodeAPI(user.id, joinCode.trim());

  if (error) {
    toast.error(error.message || "Failed to join tournament");
  } else if (data?.success) {
    toast.success("Successfully joined tournament!");
    setJoinCode("");
    triggerRefresh();
    fetchAvailableTournaments();
  }

  setJoiningByCode(false);
};


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Join a Tournament</h1>
          <p className="text-muted-foreground mb-6">
            Find and join upcoming tournaments that match your interests
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Join by Code</CardTitle>
                <CardDescription>Have a tournament code? Enter it here</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="joinCode">Registration Code</Label>
                    <Input
                      id="joinCode"
                      placeholder="e.g. GOLF-42"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="uppercase mt-2"
                    />
                  </div>
                  <Button 
                    onClick={handleJoinByCode} 
                    disabled={joiningByCode || !joinCode.trim()}
                    className="w-full"
                  >
                    {joiningByCode ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join Tournament"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="relative">
              <Label htmlFor="search">Search Tournaments</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title, game, or code (e.g. GOLF-42)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <Separator className="my-6" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTournaments.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                {search ? "No tournaments match your search" : "No available tournaments to join"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <Card key={tournament.id} className="shadow-card hover:shadow-hover transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className="bg-primary">{tournament.status}</Badge>
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="line-clamp-1">{tournament.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {tournament.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    {tournament.game}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(tournament.start_datetime), "MMM dd, yyyy HH:mm")}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Max {tournament.max_participants} players
                  </div>
                  {tournament.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {tournament.location}
                    </div>
                  )}
                  {tournament.prize_pool && (
                    <p className="text-sm font-semibold text-accent">
                      Prize: {tournament.prize_pool}
                    </p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button
                      className="flex-1"
                      onClick={() => handleJoin(tournament)}
                      disabled={joiningId === tournament.id}
                    >
                      {joiningId === tournament.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        "Join Now"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/tournament/${tournament.id}`)}
                    >
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinTournament;
