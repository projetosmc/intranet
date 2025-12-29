import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PermissionRoute } from "@/components/PermissionRoute";
import HomePage from "./pages/HomePage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import StatusPage from "./pages/StatusPage";
import SupportPage from "./pages/SupportPage";
import RoomReservationPage from "./pages/RoomReservationPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import KnowledgeBaseListPage from "./pages/KnowledgeBaseListPage";
import KnowledgeBaseDetailPage from "./pages/KnowledgeBaseDetailPage";
import KnowledgeBaseEditorPage from "./pages/KnowledgeBaseEditorPage";
import KnowledgeBaseAdminPage from "./pages/KnowledgeBaseAdminPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminAnnouncementsPage from "./pages/AdminAnnouncementsPage";
import AdminProfilesPage from "./pages/AdminProfilesPage";
import AuthPage from "./pages/AuthPage";
import SetupAdminPage from "./pages/SetupAdminPage";
import ProfilePage from "./pages/ProfilePage";
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
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/setup-admin" element={<ProtectedRoute><SetupAdminPage /></ProtectedRoute>} />
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<HomePage />} />
              <Route path="/comunicados" element={<AnnouncementsPage />} />
              <Route path="/comunicados/:id" element={<AnnouncementsPage />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/suporte" element={<SupportPage />} />
              <Route path="/reserva-salas" element={<RoomReservationPage />} />
              <Route path="/base-conhecimento" element={<KnowledgeBasePage />} />
              <Route path="/base-conhecimento-ti" element={<KnowledgeBaseListPage />} />
              <Route path="/base-conhecimento-ti/:id" element={<KnowledgeBaseDetailPage />} />
              <Route path="/base-conhecimento-ti/novo" element={<PermissionRoute><KnowledgeBaseEditorPage /></PermissionRoute>} />
              <Route path="/base-conhecimento-ti/:id/editar" element={<PermissionRoute><KnowledgeBaseEditorPage /></PermissionRoute>} />
              <Route path="/perfil" element={<ProfilePage />} />
              {/* Rotas administrativas com verificação de permissão */}
              <Route path="/admin/configuracoes" element={<PermissionRoute><AdminSettingsPage /></PermissionRoute>} />
              <Route path="/admin/comunicados" element={<PermissionRoute><AdminAnnouncementsPage /></PermissionRoute>} />
              <Route path="/admin/perfis" element={<PermissionRoute><AdminProfilesPage /></PermissionRoute>} />
              <Route path="/admin/base-conhecimento" element={<PermissionRoute><KnowledgeBaseAdminPage /></PermissionRoute>} />
              {/* Redireciona rotas antigas para as novas */}
              <Route path="/admin/usuarios" element={<Navigate to="/admin/perfis" replace />} />
              <Route path="/admin/auditoria" element={<Navigate to="/admin/configuracoes" replace />} />
              <Route path="/admin/sistemas" element={<Navigate to="/admin/configuracoes" replace />} />
              <Route path="/admin/reserva-salas" element={<Navigate to="/admin/configuracoes" replace />} />
              <Route path="/admin/faqs" element={<Navigate to="/suporte" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
