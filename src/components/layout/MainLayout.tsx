import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageTransition } from './PageTransition';
import { GlobalLoadingIndicator } from './GlobalLoadingIndicator';
import { GlobalLoadingProvider, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { UrgentAnnouncementPopup } from '@/components/announcements/UrgentAnnouncementPopup';

function MainLayoutContent() {
  const location = useLocation();
  const { isLoading } = useGlobalLoading();

  return (
    <div className="min-h-screen bg-background">
      <GlobalLoadingIndicator isLoading={isLoading} />
      <Sidebar />
      
      {/* Popup de comunicados urgentes */}
      <UrgentAnnouncementPopup />
      
      <div
        className="flex flex-col min-h-screen"
        style={{ marginLeft: 256 }}
      >
        <Topbar />
        
        <main className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export function MainLayout() {
  return (
    <GlobalLoadingProvider>
      <MainLayoutContent />
    </GlobalLoadingProvider>
  );
}