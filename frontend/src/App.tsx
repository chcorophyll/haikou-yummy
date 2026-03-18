import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapPage from './pages/MapPage';
import AdminLayout from './components/Admin/AdminLayout';
import RestaurantManager from './components/Admin/RestaurantManager';
import { restaurantService } from './api/restaurantService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    pending: 0,
    total: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await restaurantService.listRestaurants(1000);
        const pending = data.filter(r => r.is_verified === false).length;
        const total = data.length;
        setStats({ pending, total, loading: false });
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white uppercase tracking-[0.2em]">后台概览</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: '待审核店铺', value: stats.loading ? '...' : stats.pending.toString(), color: 'text-tesla-red' },
            { label: '总活跃店铺', value: stats.loading ? '...' : stats.total.toString(), color: 'text-white' },
            { label: '系统状态', value: '正常', color: 'text-green-500' }
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl border border-tesla-gray/30 flex flex-col items-center">
              <span className="text-[10px] text-tesla-muted uppercase font-bold tracking-widest mb-2">{stat.label}</span>
              <span className={`text-3xl font-bold ${stat.color} tracking-tighter`}>{stat.value}</span>
            </div>
          ))}
        </div>
        <div className="glass-panel p-8 rounded-2xl border border-tesla-gray/30 flex flex-col items-center justify-center min-h-[300px] border-dashed">
          <p className="text-tesla-muted text-xs uppercase tracking-[0.3em]">系统指标监控模块开发中</p>
        </div>
      </div>
    </AdminLayout>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/restaurants" element={
          <AdminLayout>
            <RestaurantManager />
          </AdminLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
