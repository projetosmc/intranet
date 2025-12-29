import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageTransition } from './PageTransition';

export function MainLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
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