import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { MainLayout } from "@/components/layout/MainLayout";
import HomePage from "./pages/HomePage";
import ToolsPage from "./pages/ToolsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import StatusPage from "./pages/StatusPage";
import SupportPage from "./pages/SupportPage";
import AdminToolsPage from "./pages/AdminToolsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/ferramentas" element={<ToolsPage />} />
              <Route path="/comunicados" element={<AnnouncementsPage />} />
              <Route path="/comunicados/:id" element={<AnnouncementsPage />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/suporte" element={<SupportPage />} />
              <Route path="/admin/ferramentas" element={<AdminToolsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
