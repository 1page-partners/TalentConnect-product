import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import InfluencerWizard from "./pages/InfluencerWizard";
import NewCampaign from "./pages/admin/NewCampaign";
import NewCampaignEnhanced from "./pages/admin/NewCampaignEnhanced";
import CampaignList from "./pages/admin/CampaignList";
import CampaignDetail from "./pages/admin/CampaignDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/i/:token" element={<InfluencerWizard />} />
          <Route path="/admin/new" element={<NewCampaignEnhanced />} />
          <Route path="/admin/list" element={<CampaignList />} />
          <Route path="/admin/campaign/:id" element={<CampaignDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
