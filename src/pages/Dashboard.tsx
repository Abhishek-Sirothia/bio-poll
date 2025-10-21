import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Vote, Clock, CheckCircle, Shield } from "lucide-react";
import { toast } from "sonner";

type Election = {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  results_published: boolean;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);

      if (!profileData?.face_registered) {
        toast.info("Please register your face for voting");
        navigate("/face-registration");
        return;
      }

      const { data: electionsData } = await supabase
        .from("elections")
        .select("*")
        .in("status", ["active", "ended"])
        .order("start_time", { ascending: false });

      setElections(electionsData || []);
      setLoading(false);
    };

    initDashboard();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; text: string; icon: any }> = {
      active: { variant: "default", text: "Active", icon: Vote },
      ended: { variant: "secondary", text: "Ended", icon: CheckCircle },
      scheduled: { variant: "outline", text: "Scheduled", icon: Clock },
    };

    const config = variants[status] || variants.scheduled;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SecureVote</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Voting Dashboard</h1>
          <p className="text-muted-foreground">
            Participate in active elections and view results
          </p>
        </div>

        <div className="grid gap-6">
          {elections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Vote className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No elections available</p>
                <p className="text-sm text-muted-foreground">
                  Check back later for upcoming elections
                </p>
              </CardContent>
            </Card>
          ) : (
            elections.map((election) => (
              <Card key={election.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{election.title}</CardTitle>
                      <CardDescription>{election.description}</CardDescription>
                    </div>
                    {getStatusBadge(election.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(election.start_time).toLocaleDateString()} -{" "}
                          {new Date(election.end_time).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {election.status === "active" && (
                        <Button onClick={() => navigate(`/vote/${election.id}`)}>
                          <Vote className="h-4 w-4 mr-2" />
                          Cast Vote
                        </Button>
                      )}
                      {election.results_published && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/results/${election.id}`)}
                        >
                          View Results
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;