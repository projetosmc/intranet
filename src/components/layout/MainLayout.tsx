import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalLoadingIndicator } from './GlobalLoadingIndicator';
import { GlobalLoadingProvider, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { UrgentAnnouncementPopup } from '@/components/announcements/UrgentAnnouncementPopup';
import { MCTechBadge } from './MCTechBadge';

const pageTransition: Transition = {
  type: "tween",
  duration: 0.25,
  ease: [0.25, 0.46, 0.45, 0.94],
};

function MainLayoutContent() {
  const { isLoading } = useGlobalLoading();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <GlobalLoadingIndicator isLoading={isLoading} />
      <Sidebar />
      
      {/* Popup de comunicados urgentes */}
      <UrgentAnnouncementPopup />
      
      <div className="flex flex-col min-h-screen lg:ml-72">
        <Topbar />
        
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={pageTransition}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      <MCTechBadge />
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