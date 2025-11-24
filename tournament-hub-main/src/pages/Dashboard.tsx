import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTournamentRefresh } from "@/contexts/TournamentRefreshContext";
import { Trophy, Plus, Calendar, MapPin, ArrowRight, Loader2, Users } from "lucide-react";
import { format } from "date-fns";

import { toast } from "sonner";

// Interface for tournaments created by user (from Supabase)
interface CreatedTournament {
  id: string;
  title: string;
  game: string;
  location: string;
  start_datetime: string;
  status: string;
  max_participants: number;
  join_code?: string;
  participant_count?: number;
}

// Interface for tournaments joined by user (from Supabase)
interface JoinedTournament {
  id: string;
  title: string;
  description: string | null;
  game: string;
  location: string | null;
  start_datetime: string;
  status: string;
  join_code: string | null;
  participant_count?: number;
}

interface DashboardStats {
  credits: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { refreshFlag } = useTournamentRefresh();
  const [stats, setStats] = useState<DashboardStats>({ credits: 0 });
  const [createdTournaments, setCreatedTournaments] = useState<CreatedTournament[]>([]);
  const [joinedTournaments, setJoinedTournaments] = useState<JoinedTournament[]>([]);
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
      // Get user profile with credits
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

      // Get tournaments created by user (keeping Supabase for now)
      const { data: myTournaments } = await supabase
        .from("tournaments")
        .select("*")
        .eq("created_by", user.id)
        .order("start_datetime", { ascending: true })
        .limit(6);

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

      // Get tournaments user joined via Supabase
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
            join_code,
            max_participants
          )
        `)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });

      if (participations) {
        // Get participant counts for joined tournaments
        const tournamentsWithCounts = await Promise.all(
          participations
            .filter(p => p.tournaments)
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
      } else {
        setJoinedTournaments([]);
      }

      setStats({
        credits: profile?.credits || 0,
      });
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
        {/* Header with Stats */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground mb-6">Welcome back! Here's your tournament overview.</p>
          
          <div className="flex items-center gap-4 p-4 bg-gradient-card rounded-lg border border-border shadow-card">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-2xl font-bold">{createdTournaments.length}</p>
              </div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="text-2xl font-bold">{joinedTournaments.length}</p>
              </div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Credits</p>
                <p className="text-2xl font-bold">{stats.credits}</p>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Tournaments I Created</h2>
            {createdTournaments.length > 0 && (
              <Link to="/tournaments">
                <Button variant="ghost" className="gap-2">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

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
                <Card key={tournament.id} className="shadow-card hover:shadow-hover transition-all h-full group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                      <Badge className={getStatusColor(tournament.status)} variant="secondary">
                        {tournament.status}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                      {tournament.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">{tournament.game}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(tournament.start_datetime), "MMM dd, yyyy")} — {format(new Date(tournament.start_datetime), "HH:mm")}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {tournament.participant_count || 0} players
                    </div>
                    {tournament.join_code && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Code:</span>
                        <code className="px-2 py-1 bg-muted rounded font-mono font-semibold">
                          {tournament.join_code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 ml-auto"
                          onClick={(e) => {
                            e.preventDefault();
                            navigator.clipboard.writeText(tournament.join_code || "");
                            toast.success("Join code copied!");
                          }}
                        >
                          Copy Code
                        </Button>
                      </div>
                    )}
                    <Link to={`/tournament/${tournament.id}`} className="block mt-4">
                      <Button variant="outline" className="w-full gap-2">
                        View Tournament
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Tournaments I Joined */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Tournaments I Joined</h2>
            {joinedTournaments.length > 0 && (
              <Link to="/tournaments">
                <Button variant="ghost" className="gap-2">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

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
                <Card key={tournament.id} className="shadow-card hover:shadow-hover transition-all h-full group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Trophy className="h-5 w-5 text-accent" />
                      </div>
                      {tournament.join_code && (
                        <code className="px-2 py-1 bg-muted rounded text-xs font-mono font-semibold">
                          {tournament.join_code}
                        </code>
                      )}
                    </div>
                    <CardTitle className="line-clamp-1 group-hover:text-accent transition-colors">
                      {tournament.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">{tournament.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(tournament.start_datetime), "MMM dd, yyyy")} — {format(new Date(tournament.start_datetime), "HH:mm")}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {tournament.participant_count || 0} players
                    </div>
                    <Button className="w-full gap-2 mt-4" variant="outline">
                      View Tournament
                      <ArrowRight className="h-4 w-4" />
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
