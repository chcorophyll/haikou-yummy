import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Edit, Trash2, Filter, Loader2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { restaurantService } from '../../api/restaurantService';
import { Restaurant } from '../../types/restaurant';
import RestaurantEditor from './RestaurantEditor';

export default function RestaurantManager() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Collapsible state
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    verified: false,
    unverified: false
  });

  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const data = await restaurantService.listRestaurants(200); 
      setRestaurants(data);
    } catch (err) {
      console.error('Failed to load restaurants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleToggleVerify = async (id: string, currentStatus: boolean) => {
    try {
      setActionLoading(id);
      await restaurantService.verifyRestaurant(id, !currentStatus);
      setRestaurants(prev => 
        prev.map(r => r._id === id ? { ...r, is_verified: !currentStatus } : r)
      );
    } catch (err) {
      console.error('Verify failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSave = async (id: string, data: Partial<Restaurant>) => {
    try {
      if (id) {
        const updated = await restaurantService.updateRestaurant(id, data);
        setRestaurants(prev => prev.map(r => r._id === id ? updated : r));
      } else {
        await restaurantService.createRestaurant({ ...data, is_verified: true });
        await fetchRestaurants();
      }
    } catch (err) {
      console.error('Save error', err);
      throw err;
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除餐厅 "${name}" 吗？此操作不可撤销。`)) return;
    try {
      setActionLoading(id);
      await restaurantService.deleteRestaurant(id);
      setRestaurants(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = restaurants.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.address?.toLowerCase().includes(search.toLowerCase())
  );

  const unverifiedList = filtered.filter(r => !r.is_verified);
  const verifiedList = filtered.filter(r => r.is_verified);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase">餐厅管理</h2>
          <p className="text-tesla-muted text-xs mt-1">审核、编辑及维护海口美食数据库</p>
        </div>
        <button 
          onClick={() => { setEditingRestaurant(null); setIsEditorOpen(true); }}
          className="bg-tesla-red hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-red-glow transition-all active:scale-95"
        >
          <Plus size={18} />
          新增餐厅
        </button>
      </div>

      <div className="flex items-center gap-4 bg-tesla-gray/10 p-4 rounded-2xl border border-tesla-gray/20">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tesla-muted" size={18} />
          <input 
            type="text" 
            placeholder="通过名称或地址搜索..."
            className="w-full bg-tesla-black border border-tesla-gray/30 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-tesla-red/50 focus:outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="p-2.5 rounded-xl border border-tesla-gray/30 text-tesla-muted hover:text-white transition-colors">
          <Filter size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-tesla-red mb-4" size={40} />
          <p className="text-tesla-muted text-sm uppercase tracking-widest">加载数据库中...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Unverified Section */}
          <div className="glass-panel border border-tesla-gray/30 rounded-2xl overflow-hidden shadow-2xl">
            <button 
              onClick={() => toggleSection('unverified')}
              className="w-full flex items-center justify-between px-6 py-4 bg-tesla-gray/20 hover:bg-tesla-gray/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedSections.unverified ? <ChevronDown size={20} className="text-tesla-red" /> : <ChevronRight size={20} className="text-tesla-muted" />}
                <span className="font-bold text-white uppercase tracking-widest text-sm">未审阅餐厅 ({unverifiedList.length})</span>
              </div>
              {!expandedSections.unverified && unverifiedList.length > 0 && (
                <span className="bg-tesla-red/20 text-tesla-red text-[10px] font-bold px-2 py-0.5 rounded-full border border-tesla-red/30">PENDING</span>
              )}
            </button>
            
            {expandedSections.unverified && (
              <div className="overflow-x-auto animate-in slide-in-from-top-2 duration-300">
                <RestaurantTable 
                  list={unverifiedList} 
                  actionLoading={actionLoading}
                  handleToggleVerify={handleToggleVerify}
                  handleDelete={handleDelete}
                  onEdit={(rest: Restaurant) => { setEditingRestaurant(rest); setIsEditorOpen(true); }}
                />
              </div>
            )}
          </div>

          {/* Verified Section */}
          <div className="glass-panel border border-tesla-gray/30 rounded-2xl overflow-hidden shadow-2xl">
            <button 
              onClick={() => toggleSection('verified')}
              className="w-full flex items-center justify-between px-6 py-4 bg-tesla-gray/20 hover:bg-tesla-gray/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedSections.verified ? <ChevronDown size={20} className="text-green-500" /> : <ChevronRight size={20} className="text-tesla-muted" />}
                <span className="font-bold text-white uppercase tracking-widest text-sm">已审阅餐厅 ({verifiedList.length})</span>
              </div>
              {!expandedSections.verified && verifiedList.length > 0 && (
                <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30">VERIFIED</span>
              )}
            </button>
            
            {expandedSections.verified && (
              <div className="overflow-x-auto animate-in slide-in-from-top-2 duration-300">
                <RestaurantTable 
                  list={verifiedList} 
                  actionLoading={actionLoading}
                  handleToggleVerify={handleToggleVerify}
                  handleDelete={handleDelete}
                  onEdit={(rest: Restaurant) => { setEditingRestaurant(rest); setIsEditorOpen(true); }}
                />
              </div>
            )}
          </div>

          {filtered.length === 0 && (
            <div className="py-20 text-center text-tesla-muted text-xs uppercase tracking-widest">
              未找到匹配的餐厅
            </div>
          )}
        </div>
      )}

      <RestaurantEditor 
        isOpen={isEditorOpen}
        restaurant={editingRestaurant}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

function RestaurantTable({ list, actionLoading, handleToggleVerify, handleDelete, onEdit }: any) {
  if (list.length === 0) {
    return (
      <div className="py-12 text-center text-tesla-muted text-[10px] uppercase tracking-widest border-t border-tesla-gray/10">
        此分类下暂无数据
      </div>
    );
  }

  return (
    <table className="w-full text-left text-sm border-collapse">
      <thead>
        <tr className="bg-tesla-gray/10 border-b border-tesla-gray/30 text-tesla-muted text-[10px] uppercase tracking-[0.2em] font-bold">
          <th className="px-6 py-4">餐厅名称</th>
          <th className="px-6 py-4">分类/区划</th>
          <th className="px-6 py-4">地址</th>
          <th className="px-6 py-4">状态</th>
          <th className="px-6 py-4 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-tesla-gray/10">
        {list.map((rest: Restaurant) => (
          <tr key={rest._id} className="hover:bg-tesla-red/5 transition-colors group">
            <td className="px-6 py-5">
              <div className="font-bold text-white group-hover:text-tesla-red transition-colors">{rest.name}</div>
              <div className="text-[10px] text-tesla-muted font-mono mt-1">{rest._id}</div>
            </td>
            <td className="px-6 py-5">
              <div className="flex flex-wrap gap-1">
                {rest.category?.slice(0, 2).map(cat => (
                  <span key={cat} className="px-2 py-0.5 bg-tesla-gray/20 rounded text-[9px] text-tesla-light border border-tesla-gray/30 uppercase">{cat}</span>
                ))}
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="max-w-[200px] truncate text-tesla-muted italic">{rest.address || '暂无地址'}</div>
            </td>
            <td className="px-6 py-5">
              <button 
                onClick={() => handleToggleVerify(rest._id, !!rest.is_verified)}
                disabled={actionLoading === rest._id}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                  rest.is_verified 
                    ? 'bg-green-500/10 text-green-500 border border-green-500/30' 
                    : 'bg-tesla-muted/10 text-tesla-muted border border-tesla-gray/30'
                }`}
              >
                {actionLoading === rest._id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : rest.is_verified ? (
                  <CheckCircle size={12} />
                ) : (
                  <XCircle size={12} />
                )}
                {rest.is_verified ? '已过审' : '待审核'}
              </button>
            </td>
            <td className="px-6 py-5 text-right">
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => onEdit(rest)}
                  className="p-2 rounded-lg bg-tesla-gray/10 hover:bg-tesla-gray/30 text-tesla-muted hover:text-white transition-all"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(rest._id, rest.name)}
                  disabled={actionLoading === rest._id}
                  className="p-2 rounded-lg bg-tesla-gray/10 hover:bg-tesla-red/20 text-tesla-muted hover:text-tesla-red transition-all"
                >
                  {actionLoading === rest._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
