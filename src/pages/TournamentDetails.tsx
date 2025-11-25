import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Users, Trophy, Loader2, MapPin, ArrowLeft, Clock } from "lucide-react";
import { format } from "date-fns";

interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  handicap: number | null;
}

interface Tournament {
  id: string;
  title: string;
  description: string | null;
  game: string;
  location: string;
  max_participants: number;
  start_datetime: string;
  end_datetime: string | null;
  status: string;
  prize_pool: string | null;
  rules: string | null;
  registration_code: string;
  created_by: string;
}

const TournamentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchTournamentDetails();
    }
  }, [id, user]);

  const fetchTournamentDetails = async () => {
    if (!id || !user) return;

    setLoading(true);

    try {
      console.log("🔍 Fetching tournament:", id);

      // Fetch tournament details
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .single();

      if (tournamentError) {
        console.error("❌ Tournament error:", tournamentError);
        toast.error("Tournament not found");
        navigate("/dashboard");
        return;
      }

      console.log("✅ Tournament found:", tournamentData);
      setTournament(tournamentData);

      // Fetch participants with user details
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
        .eq("tournament_id", id);

      if (participantsError) {
        console.error("❌ Participants error:", participantsError);
        setParticipants([]);
      } else {
        console.log("✅ Participants found:", participantRecords?.length || 0);
        
        // Extract user data from participant records
        const participantList = participantRecords
          ?.filter(p => p.users) // Filter out any null users
          .map(p => p.users as Participant) || [];
        
        setParticipants(participantList);
      }
    } catch (error) {
      console.error("❌ Exception:", error);
      toast.error("Failed to load tournament details");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (tournament?.registration_code) {
      navigator.clipboard.writeText(tournament.registration_code);
      toast.success("Registration code copied!");
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
        <div className="container mx-auto px-4 pt-24">
          <Card>
            <CardContent className="py-16 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Tournament Not Found</h2>
              <p className="text-muted-foreground mb-6">
                This tournament doesn't exist or has been removed
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Tournament Header */}
        <Card className="shadow-card mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-primary">{tournament.status}</Badge>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <code className="text-sm font-mono font-semibold">
                      {tournament.registration_code}
                    </code>
                    <Button size="sm" variant="ghost" onClick={copyCode}>
                      Copy
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-3xl mb-2">{tournament.title}</CardTitle>
                <CardDescription className="text-lg">
                  {tournament.description || `${tournament.game} Tournament`}
                </CardDescription>
              </div>
              <Trophy className="h-12 w-12 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Game</p>
                  <p className="font-semibold">{tournament.game}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{tournament.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-semibold">
                    {format(new Date(tournament.start_datetime), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
              </div>

              {tournament.end_datetime && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-semibold">
                      {format(new Date(tournament.end_datetime), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Participants</p>
                  <p className="font-semibold">
                    {participants.length} / {tournament.max_participants}
                  </p>
                </div>
              </div>

              {tournament.prize_pool && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded">
                    <Trophy className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prize Pool</p>
                    <p className="font-semibold">{tournament.prize_pool}</p>
                  </div>
                </div>
              )}
            </div>

            {tournament.rules && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Rules & Regulations</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {tournament.rules}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Participants Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participants ({participants.length})
            </CardTitle>
            <CardDescription>
              List of all players registered for this tournament
            </CardDescription>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No participants yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Handicap</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant, index) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{participant.name}</TableCell>
                        <TableCell>{participant.email}</TableCell>
                        <TableCell>{participant.phone || "-"}</TableCell>
                        <TableCell className="text-right">
                          {participant.handicap !== null ? participant.handicap : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TournamentDetails;
```

---

## 🔍 **Key Changes Made**

1. **✅ Direct Supabase Query** - Instead of using `viewTournamentAPI()`, we query Supabase directly for more reliable results
2. **✅ Proper Participant Extraction** - Fixed the mapping from `participantRecords` to actual user data
3. **✅ Real-time Count** - Uses `participants.length` from the actual fetched data
4. **✅ Better Error Handling** - Shows specific console logs to debug issues

---

## 🧪 **Test This**

1. **Deploy the changes** to Vercel (push to GitHub)
2. **Open browser console** (F12 → Console)
3. **Navigate to a tournament** from the dashboard
4. **Look for these logs:**
```
   🔍 Fetching tournament: [tournament-id]
   ✅ Tournament found: [tournament data]
   ✅ Participants found: 2
