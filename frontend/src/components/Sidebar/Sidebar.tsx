import { useEffect, useRef } from 'react';
import { Compass, MapPin, Heart } from 'lucide-react';
import { Restaurant } from '../../types/restaurant';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant | null) => void;
  selectedRestaurantId?: string | null;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  restaurants, 
  onSelectRestaurant,
  selectedRestaurantId,
  favoriteIds,
  onToggleFavorite
}: SidebarProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // 自动滚动到选中项
  useEffect(() => {
    if (selectedRestaurantId && listRef.current) {
      const element = document.getElementById(`rest-${selectedRestaurantId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedRestaurantId]);

  const displayedRestaurants = activeTab === 'saved' 
    ? restaurants.filter(r => favoriteIds.includes(r._id))
    : restaurants;

  return (
    <div className="w-full md:w-96 bg-tesla-black border-t md:border-t-0 md:border-l border-tesla-gray flex flex-col z-10 shadow-2xl transition-all duration-300">
      
      {/* Desktop Header */}
      <div className="hidden md:flex items-center p-6 border-b border-tesla-gray shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-10">
        <div className="w-10 h-10 flex items-center justify-center bg-tesla-red rounded shadow-red-glow mr-4">
          <MapPin size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-widest uppercase text-white leading-none">
          Yummy<span className="text-tesla-red">.</span>
        </h1>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-tesla-gray bg-tesla-dark">
        {[
          { id: 'map', icon: Compass, label: '探索地图' },
          { id: 'saved', icon: Heart, label: '我的收藏' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 flex flex-col items-center justify-center gap-1.5 transition-colors duration-300 relative ${
              activeTab === tab.id ? 'text-tesla-red' : 'text-tesla-muted hover:text-tesla-light'
            }`}
          >
            <div className="relative">
              <tab.icon size={18} />
              {tab.id === 'saved' && favoriteIds.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-tesla-red text-[8px] flex items-center justify-center rounded-full text-white shadow-red-glow">
                  {favoriteIds.length}
                </span>
              )}
            </div>
            <span className="text-xs uppercase tracking-widest font-semibold">{tab.label}</span>
            {activeTab === tab.id && (
               <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-tesla-red shadow-[0_0_8px_rgba(227,25,55,1)]" />
            )}
          </button>
        ))}
      </div>

      {/* Dynamic Content Area */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        <div className="sticky top-0 bg-tesla-black/90 backdrop-blur-sm z-10 -mx-4 px-4 py-2 border-b border-tesla-gray/30 mb-2 flex justify-between items-center">
           <h2 className="text-xs text-tesla-muted uppercase tracking-[0.2em] font-bold px-2">
            {activeTab === 'map' ? `发现美食 (${displayedRestaurants.length})` : `已收藏店铺 (${displayedRestaurants.length})`}
           </h2>
           {activeTab === 'saved' && displayedRestaurants.length > 0 && (
             <button 
              onClick={() => favoriteIds.forEach(id => onToggleFavorite(id))}
              className="text-[10px] text-tesla-red hover:underline uppercase font-bold tracking-widest px-2"
             >
              清空全部
             </button>
           )}
        </div>
        
        {displayedRestaurants.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-16 h-16 bg-tesla-gray/20 rounded-full flex items-center justify-center mb-4">
              <Heart size={30} className="text-tesla-muted/30" />
            </div>
            <p className="text-tesla-muted text-sm px-10">
              {activeTab === 'map' ? '正在加载海口美食...' : '还没有收藏任何店铺，在地图上点击“爱心”来收藏吧'}
            </p>
          </div>
        )}

        {displayedRestaurants.map(rest => (
           <div 
            key={rest._id} 
            id={`rest-${rest._id}`}
            onClick={() => onSelectRestaurant(rest)}
            className={`group flex bg-[#161616] rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer shadow-lg ${
              selectedRestaurantId === rest._id 
              ? 'border-tesla-red shadow-red-glow' 
              : 'border-tesla-gray hover:border-tesla-red/50 hover:shadow-red-glow'
            }`}
          >
            <div className="w-28 bg-tesla-gray flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
              <img 
                src={rest.images?.[0] || `https://placehold.co/200x200/222/555?text=Img`} 
                alt={rest.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
              />
              <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-white bg-tesla-red/90 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">
                  {rest.rating || 'New'}
                </span>
              </div>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-bold transition-colors duration-300 truncate ${
                    selectedRestaurantId === rest._id ? 'text-tesla-red' : 'text-white group-hover:text-tesla-red'
                  }`}>
                    {rest.name}
                  </h3>
                  <p className="text-[11px] text-tesla-muted mt-1 truncate">{rest.address || '海口市'}</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(rest._id);
                  }}
                  className={`p-1.5 rounded-full transition-all active:scale-90 ${
                    favoriteIds.includes(rest._id) 
                      ? 'bg-tesla-red/20 text-tesla-red shadow-[0_0_10px_rgba(227,25,55,0.3)]' 
                      : 'text-tesla-muted hover:bg-tesla-gray/30'
                  }`}
                >
                  <Heart size={16} fill={favoriteIds.includes(rest._id) ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-tesla-muted uppercase font-bold tracking-tighter">TEL</span>
                  <span className="text-xs font-mono text-tesla-light/90 hover:text-tesla-red transition-colors">
                    {rest.telephone || '暂无电话'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
