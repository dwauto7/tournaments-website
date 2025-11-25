import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTournamentRefresh } from "@/contexts/TournamentRefreshContext";
import { getUserProfile } from "@/lib/api";
import { Trophy, Plus, Calendar, MapPin, ArrowRight, Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Tournament {
  id: string;
  title: string;
  description: string | null;
  game: string;
  location: string;
  start_datetime: string;
  status: string;
  max_participants: number;
  registration_code: string;
  prize_pool: string | null;
  participant_count?: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refreshFlag } = useTournamentRefresh();
  const [userName, setUserName] = useState("");
  const [createdTournaments, setCreatedTournaments] = useState<Tournament[]>([]);
  const [joinedTournaments, setJoinedTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, refreshFlag]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get user profile with name
      const { data: profile } = await getUserProfile(user.id);
      if (profile) {
        setUserName(profile.name);
      }

      // Get tournaments created by user
      const { data: myTournaments } = await supabase
        .from("tournaments")
        .select("*")
        .eq("created_by", user.id)
        .order("start_datetime", { ascending: true });

      // Get participant counts for created tournaments
      if (myTournaments) {
        const tournamentsWithCounts = await Promise.all(
          myTournaments.map(async (tournament) => {
            const { count } = await supabase
              .from("tournament_participants")
              .select("*", { count: "exact", head: true })
              .eq("tournament_id", tournament.id);

            return {
              ...tournament,
              participant_count: count || 0,
            };
          })
        );
        setCreatedTournaments(tournamentsWithCounts);
      }

      // Get tournaments user joined
      const { data: participations } = await supabase
        .from("tournament_participants")
        .select(`
          tournament_id,
          tournaments (
            id,
            title,
            description,
            game,
            location,
            start_datetime,
            status,
            registration_code,
            max_participants,
            prize_pool
          )
        `)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });

      if (participations) {
        const tournamentsWithCounts = await Promise.all(
          participations
            .filter((p: any) => p.tournaments)
            .map(async (participation: any) => {
              const tournament = participation.tournaments;
              const { count } = await supabase
                .from("tournament_participants")
                .select("*", { count: "exact", head: true })
                .eq("tournament_id", tournament.id);

              return {
                ...tournament,
                participant_count: count || 0,
              };
            })
        );
        setJoinedTournaments(tournamentsWithCounts);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-primary";
      case "ongoing":
        return "bg-accent";
      case "completed":
        return "bg-muted";
      default:
        return "bg-secondary";
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header with Welcome Message */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Welcome, {userName || user?.email?.split('@')[0] || "User"}!
          </h1>

          <div className="flex items-center gap-4 p-6 bg-gradient-card rounded-lg border border-border shadow-card">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-3xl font-bold">{createdTournaments.length}</p>
              </div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="text-3xl font-bold">{joinedTournaments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link to="/create-tournament">
            <Card className="shadow-card hover:shadow-hover transition-all cursor-pointer border-2 border-primary/20 hover:border-primary/40">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Create Tournament</h3>
                    <p className="text-sm text-muted-foreground">Start a new tournament</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/join-tournament">
            <Card className="shadow-card hover:shadow-hover transition-all cursor-pointer border-2 border-accent/20 hover:border-accent/40">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Join Tournament</h3>
                    <p className="text-sm text-muted-foreground">Find tournaments to join</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Tournaments I Created */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Tournaments I Created</h2>

          {createdTournaments.length === 0 ? (
            <Card className="shadow-card border-dashed">
              <CardContent className="py-16 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Trophy className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">No tournaments created yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Get started by creating your first tournament and invite players to join
                </p>
                <Link to="/create-tournament">
                  <Button size="lg" className="gap-2">
                    <Plus className="h-5 w-5" />
                    Create Your First Tournament
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {createdTournaments.map((tournament) => (
                <Card key={tournament.id} className="shadow-card hover:shadow-hover transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getStatusColor(tournament.status)}>
                        {tournament.status}
                      </Badge>
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="line-clamp-1">{tournament.title}</CardTitle>
                    <CardDescription className="line-clamp-1">{tournament.game}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(tournament.start_datetime), "MMM dd, yyyy HH:mm")}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {tournament.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {tournament.participant_count || 0} / {tournament.max_participants} players
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2 bg-muted rounded">
                      <code className="text-sm font-mono font-semibold">
                        {tournament.registration_code}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCode(tournament.registration_code)}
                      >
                        Copy
                      </Button>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => navigate(`/tournament/${tournament.id}`)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Tournaments I Joined */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Tournaments I Joined</h2>

          {joinedTournaments.length === 0 ? (
            <Card className="shadow-card border-dashed">
              <CardContent className="py-16 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-accent/10 rounded-full">
                    <Users className="h-12 w-12 text-accent" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">No tournaments joined yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Discover exciting tournaments and join the competition
                </p>
                <Link to="/join-tournament">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Users className="h-5 w-5" />
                    Browse Tournaments
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {joinedTournaments.map((tournament) => (
                <Card key={tournament.id} className="shadow-card hover:shadow-hover transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getStatusColor(tournament.status)}>
                        {tournament.status}
                      </Badge>
                      <code className="text-xs font-mono px-2 py-1 bg-muted rounded">
                        {tournament.registration_code}
                      </code>
                    </div>
                    <CardTitle className="line-clamp-1">{tournament.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {tournament.description || tournament.game}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(tournament.start_datetime), "MMM dd, yyyy HH:mm")}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {tournament.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {tournament.participant_count || 0} players joined
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => navigate(`/tournament/${tournament.id}`)}
                    >
                      View Tournament
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
