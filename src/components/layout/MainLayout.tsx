import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalLoadingIndicator } from './GlobalLoadingIndicator';
import { GlobalLoadingProvider, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { UrgentAnnouncementPopup } from '@/components/announcements/UrgentAnnouncementPopup';
import { MCTechBadge } from './MCTechBadge';
function MainLayoutContent() {
  const {
    isLoading
  } = useGlobalLoading();
  return <div className="min-h-screen bg-background">
      <GlobalLoadingIndicator isLoading={isLoading} />
      <Sidebar />
      
      {/* Popup de comunicados urgentes */}
      <UrgentAnnouncementPopup />
      
      <div className="flex flex-col min-h-screen" style={{
      marginLeft: 288
    }}>
        <Topbar />
        
        <main className="flex-1 p-6 overflow-auto px-0 py-0 pl-0 pt-0 pr-0 pb-[10px]">
          <Outlet />
        </main>
      </div>
      
      <MCTechBadge />
    </div>;
}
export function MainLayout() {
  return <GlobalLoadingProvider>
      <MainLayoutContent />
    </GlobalLoadingProvider>;
}