import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Calendar, Loader2, MapPin, Copy, Users } from "lucide-react";
import { format } from "date-fns";
import { viewTournamentAPI } from "@/lib/api";

interface Tournament {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  join_code: string | null;
  start_datetime: string;
  is_creator: boolean;
}

interface Participant {
  profiles: {
    full_name: string | null;
  };
}

const TournamentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchTournamentDetails();
  }, [id]);

  const fetchTournamentDetails = async () => {
    if (!id || !user) return;
    
    const { data, error } = await viewTournamentAPI({
      tournament_id: id,
      supabase_id: user.id,
    });

    if (error || !data?.tournament) {
      console.error("Error fetching tournament:", error);
      toast.error("Failed to load tournament");
      setLoading(false);
      return;
    }

    setTournament({
      ...data.tournament,
      is_creator: data.tournament.created_by === user.id,
    });
    setParticipants(data.participants || []);
    setLoading(false);
  };

  const copyJoinCode = () => {
    if (tournament?.join_code) {
      navigator.clipboard.writeText(tournament.join_code);
      toast.success("Join code copied!");
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

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center">
          <p className="text-xl">Tournament not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{tournament.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Start Date */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Start Date & Time</p>
                  <p className="font-semibold">
                    {format(new Date(tournament.start_datetime), "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
              </div>

              {/* Description */}
              {tournament.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p>{tournament.description}</p>
                </div>
              )}

              {/* Location */}
              {tournament.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold">{tournament.location}</p>
                  </div>
                </div>
              )}

              {/* Join Code */}
              {tournament.join_code && (
                <div className="flex items-center gap-2 p-4 bg-secondary/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Join Code</p>
                    <p className="font-mono text-xl font-bold">{tournament.join_code}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={copyJoinCode}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
              )}

              {/* Manage Participants - Only for creator */}
              {tournament.is_creator && (
                <div className="pt-4 border-t">
                  <Button variant="secondary" disabled>
                    Manage Participants (Coming Soon)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants List */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Participants ({participants.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No participants yet
                </p>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                    >
                      <Badge variant="outline">#{index + 1}</Badge>
                      <p className="font-medium">
                        {participant.profiles.full_name || "Anonymous"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetails;
