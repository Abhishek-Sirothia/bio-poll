import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import FaceRegistration from "./pages/FaceRegistration";
import Dashboard from "./pages/Dashboard";
import Vote from "./pages/Vote";
import Results from "./pages/Results";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ElectionsManagement from "./pages/admin/ElectionsManagement";
import CandidatesManagement from "./pages/admin/CandidatesManagement";
import VotersManagement from "./pages/admin/VotersManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/face-registration" element={<FaceRegistration />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vote/:electionId" element={<Vote />} />
          <Route path="/results/:electionId" element={<Results />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/elections" element={<ElectionsManagement />} />
          <Route path="/admin/candidates" element={<CandidatesManagement />} />
          <Route path="/admin/voters" element={<VotersManagement />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
