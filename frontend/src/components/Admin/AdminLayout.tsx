import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Utensils, ArrowLeft, Settings, ShieldCheck } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  const navItems = [
    { name: '仪表盘', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: '餐厅管理', path: '/admin/restaurants', icon: <Utensils size={20} /> },
    { name: '系统设置', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-tesla-black text-tesla-light overflow-hidden font-sans">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-tesla-dark border-r border-tesla-gray/30 flex flex-col z-20 shadow-2xl">
        <div className="p-6 border-b border-tesla-gray/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-tesla-red rounded flex items-center justify-center shadow-red-glow">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="font-bold text-white tracking-widest uppercase text-sm">Auth Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border ${
                  isActive
                    ? 'bg-tesla-red/10 border-tesla-red/50 text-white shadow-[0_0_15px_rgba(227,25,55,0.1)]'
                    : 'border-transparent hover:bg-tesla-gray/20 text-tesla-muted hover:text-tesla-light'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-tesla-gray/20">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-tesla-gray/20 text-tesla-muted hover:text-tesla-red transition-all duration-300"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">返回主地图</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-tesla-dark to-tesla-black relative custom-scrollbar">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-tesla-red/50 via-red-900/10 to-transparent"></div>
        <div className="p-8">
          {children}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3d3d3d; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e31937; }
      `}</style>
    </div>
  );
}
