import { Compass, User, MapPin } from 'lucide-react';
import { Restaurant } from '../../types/restaurant';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
  selectedRestaurantId?: string | null;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  restaurants, 
  onSelectRestaurant,
  selectedRestaurantId 
}: SidebarProps) {
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
          { id: 'saved', icon: User, label: '我的收藏' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 flex flex-col items-center justify-center gap-1.5 transition-colors duration-300 relative ${
              activeTab === tab.id ? 'text-tesla-red' : 'text-tesla-muted hover:text-tesla-light'
            }`}
          >
            <tab.icon size={18} />
            <span className="text-xs uppercase tracking-widest font-semibold">{tab.label}</span>
            {activeTab === tab.id && (
               <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-tesla-red shadow-[0_0_8px_rgba(227,25,55,1)]" />
            )}
          </button>
        ))}
      </div>

      {/* Dynamic Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        <div className="sticky top-0 bg-tesla-black/90 backdrop-blur-sm z-10 -mx-4 px-4 py-2 border-b border-tesla-gray/30 mb-2">
           <h2 className="text-xs text-tesla-muted uppercase tracking-[0.2em] font-bold px-2">
            发现美食 ({restaurants.length})
           </h2>
        </div>
        
        {restaurants.length === 0 && (
          <div className="text-center py-10">
            <p className="text-tesla-muted text-sm">正在加载海口美食...</p>
          </div>
        )}

        {restaurants.map(rest => (
           <div 
            key={rest._id} 
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
              <div className="absolute top-2 left-2 z-20">
                <span className="text-[10px] font-bold text-white bg-tesla-red/90 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">
                  {rest.rating || 'New'}
                </span>
              </div>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className={`text-sm font-bold transition-colors duration-300 ${
                  selectedRestaurantId === rest._id ? 'text-tesla-red' : 'text-white group-hover:text-tesla-red'
                }`}>
                  {rest.name}
                </h3>
                <p className="text-[11px] text-tesla-muted mt-1 truncate">{rest.address || '海口市'}</p>
              </div>
              <div className="flex justify-between items-center mt-3">
                <div className="flex gap-1 flex-wrap">
                  {rest.category.slice(0, 1).map(cat => (
                    <span key={cat} className="text-[10px] uppercase tracking-wider text-tesla-light border border-tesla-gray/50 px-1.5 py-0.5 rounded bg-tesla-gray/20">
                      {cat}
                    </span>
                  ))}
                </div>
                <span className="text-sm font-semibold text-white whitespace-nowrap">
                  {rest.price_per_person ? `¥${rest.price_per_person}` : '-'}
                  <span className="text-[10px] text-tesla-muted ml-0.5">/人</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
