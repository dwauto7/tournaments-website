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
  const [endDateTime, setEndDateTime] = useState<Date | undefined>(); // ✅ ADD THIS

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

    // Validate end datetime if provided
    if (endDateTime && endDateTime <= startDateTime) {
      toast.error("End date must be after start date");
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
      title: formData.title,
      description: formData.description || undefined,
      start_datetime: startDateTime.toISOString(),
      end_datetime: endDateTime?.toISOString(), // ✅ ADD THIS
      location: formData.location,
      game: formData.game,
      max_participants: parseInt(formData.maxParticipants, 10),
      prize_pool: formData.prizePool || undefined,
      rules: formData.rules || undefined,
    });

    if (error) {
      toast.error(error.message || "Failed to create tournament");
    } else if (data?.registration_code) {
      const regCode = data.registration_code;

      toast.success(`Tournament created!`, {
        description: `Registration Code: ${regCode}`,
        duration: 10000,
      });

      navigator.clipboard.writeText(regCode);

      setTimeout(() => {
        alert(
          `✅ Tournament Created Successfully!\n\n` +
          `Registration Code: ${regCode}\n\n` +
          `(Already copied to clipboard)\n\n` +
          `Share this code with participants!`
        );
      }, 500);

      triggerRefresh();
      navigate("/dashboard");
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
              {/* ... other fields ... */}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDateTime">Start Date & Time *</Label>
                  <DateTimePicker
                    date={startDateTime}
                    setDate={setStartDateTime}
                    placeholder="Tournament start"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDateTime">End Date & Time (Optional)</Label>
                  <DateTimePicker
                    date={endDateTime}
                    setDate={setEndDateTime}
                    placeholder="Tournament end"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank for single-day tournaments
                  </p>
                </div>
              </div>

              {/* ... rest of form ... */}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateTournament;
