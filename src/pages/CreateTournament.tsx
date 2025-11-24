import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/DateTimePicker";
import { useAuth } from "@/hooks/useAuth";
import { useTournamentRefresh } from "@/contexts/TournamentRefreshContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { createTournamentAPI } from "@/lib/api";

const tournamentSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
  game: z.string().trim().min(2, "Game name must be at least 2 characters").max(50, "Game name must be less than 50 characters"),
  location: z.string().trim().min(2, "Location must be at least 2 characters").max(100, "Location must be less than 100 characters"),
  maxParticipants: z.string(),
  prizePool: z.string().trim().max(100, "Prize pool must be less than 100 characters").optional(),
  rules: z.string().trim().max(2000, "Rules must be less than 2000 characters").optional(),
});

const CreateTournament = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { triggerRefresh } = useTournamentRefresh();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    game: "",
    location: "",
    maxParticipants: "16",
    prizePool: "",
    rules: "",
  });
  const [startDateTime, setStartDateTime] = useState<Date | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate start datetime
    if (!startDateTime) {
      toast.error("Please select a start date and time");
      return;
    }

    if (startDateTime <= new Date()) {
      toast.error("Tournament start time must be in the future");
      return;
    }

    // Validate form data
    try {
      tournamentSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
        return;
      }
    }

    setLoading(true);

    const { data, error } = await createTournamentAPI({
      created_by: user.id,
      name: formData.title,
      description: formData.description || undefined,
      start_datetime: startDateTime.toISOString(),
      location: formData.location,
      game: formData.game,
      max_participants: parseInt(formData.maxParticipants, 10),
      prize_pool: formData.prizePool || undefined,
      rules: formData.rules || undefined,
    });

    if (error) {
      toast.error(error.message || "Failed to create tournament");
    } else if (data?.registration_code) {
      toast.success(`Tournament created! Join code: ${data.registration_code}`);
      
      // Show registration code with copy button
      const copyCode = () => {
        navigator.clipboard.writeText(data.registration_code);
        toast.success("Registration code copied!");
      };
      
      setTimeout(() => {
        if (window.confirm(`Your registration code is: ${data.registration_code}\n\nClick OK to copy it to clipboard.`)) {
          copyCode();
        }
      }, 500);
      
      navigate("/dashboard");
      
      // Delay refresh to ensure webhook has completed writing to Supabase
      setTimeout(() => {
        triggerRefresh();
      }, 1000);
    }
    setLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-3xl">Create Tournament</CardTitle>
            <CardDescription>Set up your tournament details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Tournament Title *</Label>
                <Input
                  id="title"
                  placeholder="Summer Championship 2024"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="game">Game *</Label>
                <Input
                  id="game"
                  placeholder="e.g., League of Legends, CS:GO, Valorant"
                  value={formData.game}
                  onChange={(e) => handleChange("game", e.target.value)}
                  required
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Online, New York, Los Angeles"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your tournament..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Max Participants *</Label>
                <Select
                  value={formData.maxParticipants}
                  onValueChange={(value) => handleChange("maxParticipants", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8 Players</SelectItem>
                    <SelectItem value="16">16 Players</SelectItem>
                    <SelectItem value="32">32 Players</SelectItem>
                    <SelectItem value="64">64 Players</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDateTime">Start Date & Time *</Label>
                <DateTimePicker
                  date={startDateTime}
                  setDate={setStartDateTime}
                  placeholder="Select tournament start date and time"
                />
                <p className="text-xs text-muted-foreground">
                  Tournament start time with timezone
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prizePool">Prize Pool</Label>
                <Input
                  id="prizePool"
                  placeholder="e.g., $1000 or Gaming Gear"
                  value={formData.prizePool}
                  onChange={(e) => handleChange("prizePool", e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules">Rules & Regulations</Label>
                <Textarea
                  id="rules"
                  placeholder="Tournament rules..."
                  value={formData.rules}
                  onChange={(e) => handleChange("rules", e.target.value)}
                  rows={6}
                  maxLength={2000}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Tournament"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateTournament;
