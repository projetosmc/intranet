import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div
        className="flex flex-col min-h-screen"
        style={{ marginLeft: 256 }}
      >
        <Topbar />
        
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}