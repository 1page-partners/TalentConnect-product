import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import InfluencerWizard from "./pages/InfluencerWizard";
import CampaignDetailOnly from "./pages/CampaignDetailOnly";
import Install from "./pages/Install";
import Auth from "./pages/admin/Auth";
import RegistrationComplete from "./pages/admin/RegistrationComplete";
import Dashboard from "./pages/admin/Dashboard";
import NewCampaignEnhanced from "./pages/admin/NewCampaignEnhanced";
import CampaignList from "./pages/admin/CampaignList";
import CampaignDetail from "./pages/admin/CampaignDetail";
import EditCampaign from "./pages/admin/EditCampaign";
import MemberManagement from "./pages/admin/MemberManagement";
import CreatorListPage from "./pages/admin/CreatorList";
import CreatorDetail from "./pages/admin/CreatorDetail";
import AdminLayout from "./components/admin/AdminLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AdminLayout><Index /></AdminLayout>} />
            <Route path="/i/:token" element={<InfluencerWizard />} />
            <Route path="/c/:slug" element={<CampaignDetailOnly />} />
            <Route path="/admin/auth" element={<Auth />} />
            <Route path="/admin/registration-complete" element={<RegistrationComplete />} />
            <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
            <Route path="/admin/new" element={<AdminLayout><NewCampaignEnhanced /></AdminLayout>} />
            <Route path="/admin/list" element={<AdminLayout><CampaignList /></AdminLayout>} />
            <Route path="/admin/campaign/:id" element={<AdminLayout><CampaignDetail /></AdminLayout>} />
            <Route path="/admin/campaign/:id/edit" element={<AdminLayout><EditCampaign /></AdminLayout>} />
            <Route path="/admin/creators" element={<AdminLayout><CreatorListPage /></AdminLayout>} />
            <Route path="/admin/creator/:id" element={<AdminLayout><CreatorDetail /></AdminLayout>} />
            <Route path="/admin/members" element={<AdminLayout requireAdmin><MemberManagement /></AdminLayout>} />
            <Route path="/install" element={<Install />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
