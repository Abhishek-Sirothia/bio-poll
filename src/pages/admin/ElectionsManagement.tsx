import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, ArrowLeft, Plus, Play, Pause, StopCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const electionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
});

type ElectionFormData = z.infer<typeof electionSchema>;

interface Election {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_time: string;
  end_time: string;
  results_published: boolean;
}

const ElectionsManagement = () => {
  const navigate = useNavigate();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<ElectionFormData>({
    resolver: zodResolver(electionSchema),
    defaultValues: {
      title: "",
      description: "",
      start_time: "",
      end_time: "",
    },
  });

  useEffect(() => {
    checkAdminAndLoadElections();
  }, []);

  const checkAdminAndLoadElections = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard");
      return;
    }

    await loadElections();
  };

  const loadElections = async () => {
    const { data, error } = await supabase
      .from("elections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load elections");
      console.error(error);
    } else {
      setElections(data || []);
    }
    setLoading(false);
  };

  const onSubmit = async (data: ElectionFormData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("elections").insert({
      title: data.title,
      description: data.description || null,
      start_time: data.start_time,
      end_time: data.end_time,
      status: "scheduled",
      created_by: session.user.id,
    });

    if (error) {
      toast.error("Failed to create election");
      console.error(error);
    } else {
      toast.success("Election created successfully");
      form.reset();
      setIsDialogOpen(false);
      loadElections();
    }
  };

  const updateElectionStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("elections")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update election status");
      console.error(error);
    } else {
      toast.success(`Election ${status}`);
      loadElections();
    }
  };

  const deleteElection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this election?")) return;

    const { error } = await supabase
      .from("elections")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete election");
      console.error(error);
    } else {
      toast.success("Election deleted");
      loadElections();
    }
  };

  const publishResults = async (id: string) => {
    const { error } = await supabase
      .from("elections")
      .update({ results_published: true })
      .eq("id", id);

    if (error) {
      toast.error("Failed to publish results");
      console.error(error);
    } else {
      toast.success("Results published successfully");
      loadElections();
    }
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Elections Management</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Elections</h1>
            <p className="text-muted-foreground">Create, schedule, and control elections</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Election
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Election</DialogTitle>
                <DialogDescription>Fill in the details to create a new election</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Election Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., General Election 2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Election description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date & Time</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date & Time</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full">Create Election</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {elections.map((election) => (
            <Card key={election.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{election.title}</CardTitle>
                    <CardDescription>{election.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      election.status === "active" ? "bg-success/10 text-success" :
                      election.status === "ended" ? "bg-muted text-muted-foreground" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {election.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Start:</span>
                      <p className="font-medium">{new Date(election.start_time).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">End:</span>
                      <p className="font-medium">{new Date(election.end_time).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {election.status === "scheduled" && (
                      <Button size="sm" onClick={() => updateElectionStatus(election.id, "active")}>
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    )}
                    {election.status === "active" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateElectionStatus(election.id, "paused")}>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateElectionStatus(election.id, "ended")}>
                          <StopCircle className="h-4 w-4 mr-2" />
                          End
                        </Button>
                      </>
                    )}
                    {election.status === "paused" && (
                      <Button size="sm" onClick={() => updateElectionStatus(election.id, "active")}>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    {election.status === "ended" && !election.results_published && (
                      <Button size="sm" onClick={() => publishResults(election.id)}>
                        Publish Results
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => deleteElection(election.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ElectionsManagement;
