import { useState, useEffect, useCallback } from 'react';
import { Search, Map as MapIcon, Menu, Plus } from 'lucide-react';
import MapContainer from '../components/Map/MapContainer';
import Sidebar from '../components/Sidebar/Sidebar';
import RestaurantSubmission from '../components/Submission/RestaurantSubmission';
import { restaurantService } from '../api/restaurantService';
import { Restaurant } from '../types/restaurant';

export default function MapPage() {
  const [activeTab, setActiveTab] = useState('map');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('haikou_yummy_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSubmission, setShowSubmission] = useState(false);

  useEffect(() => {
    localStorage.setItem('haikou_yummy_favorites', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const handleToggleFavorite = useCallback((id: string) => {
    setFavoriteIds(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await restaurantService.listRestaurants();
        setRestaurants(data);
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.search-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRestaurant = useCallback((restaurant: Restaurant | null) => {
    setSelectedId(restaurant ? restaurant._id : null);
    setShowSuggestions(false);
  }, []);

  const categories = ['海南粉', '清补凉', '糟粕醋', '老爸茶', '海鲜', '火锅', '甜品'];

  const filteredRestaurants = restaurants.filter(rest => {
    const matchesSearch = !searchQuery || 
      rest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rest.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rest.category?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !activeCategory || 
      rest.category?.includes(activeCategory);
    
    return matchesSearch && matchesCategory;
  });

  const suggestions = searchQuery.length > 1 
    ? restaurants
        .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5)
    : [];

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-tesla-dark overflow-hidden font-sans text-tesla-light selection:bg-tesla-red selection:text-white">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-tesla-black border-b border-tesla-gray z-20 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center bg-tesla-red rounded opacity-90">
            <MapIcon size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-[0.2em] uppercase text-white leading-none">Yummy</h1>
        </div>
        <button className="text-tesla-light hover:text-tesla-red transition-colors">
          <Menu size={24} />
        </button>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer 
          restaurants={filteredRestaurants} 
          onSelectRestaurant={handleSelectRestaurant}
          selectedRestaurantId={selectedId}
          favoriteIds={favoriteIds}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Floating Search Bar (Desktop) */}
        <div className="hidden md:block absolute top-6 left-6 right-6 z-10 max-w-md search-container">
          <div className="relative">
            <div className="glass-panel rounded-2xl flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-tesla-gray/30 focus-within:border-tesla-red/50 focus-within:shadow-[0_0_15px_rgba(227,25,55,0.3)] transition-all duration-300 overflow-hidden">
              <div className="flex items-center px-4 py-3">
                <Search size={20} className="text-tesla-muted" />
                <input 
                  type="text" 
                  placeholder="搜索海口的美食、店铺或地址..."
                  className="bg-transparent border-none outline-none ml-3 flex-1 text-white placeholder-tesla-muted text-sm"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-tesla-muted hover:text-tesla-red transition-colors text-xs font-bold uppercase tracking-tighter"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="border-t border-tesla-gray/30 bg-tesla-black/40 backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
                  {suggestions.map(s => (
                    <button
                      key={s._id}
                      onClick={() => handleSelectRestaurant(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-tesla-red/10 flex flex-col transition-colors border-b border-tesla-gray/10 last:border-none"
                    >
                      <span className="text-sm font-bold text-white">{s.name}</span>
                      <span className="text-[10px] text-tesla-muted truncate">{s.address || '海口市'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Tags */}
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  !activeCategory 
                    ? 'bg-tesla-red border-tesla-red text-white shadow-red-glow' 
                    : 'bg-tesla-black/60 border-tesla-gray text-tesla-muted hover:border-tesla-red/50'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    activeCategory === cat 
                      ? 'bg-tesla-red border-tesla-red text-white shadow-red-glow' 
                      : 'bg-tesla-black/60 border-tesla-gray text-tesla-muted hover:border-tesla-red/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {loading && (
          <div className="absolute inset-0 bg-tesla-dark/50 backdrop-blur-sm z-[150] flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-tesla-muted border-t-tesla-red rounded-full animate-spin mb-4 shadow-red-glow" />
              <p className="text-tesla-muted text-sm uppercase tracking-widest animate-pulse">Loading Taste of Haikou...</p>
            </div>
          </div>
        )}

        {/* Floating Add Button (Community Submission) */}
        {!loading && (
          <button 
            onClick={() => setShowSubmission(true)}
            className="absolute bottom-10 right-10 z-30 w-14 h-14 bg-tesla-red hover:bg-red-700 text-white rounded-full shadow-[0_0_20px_rgba(227,25,55,0.5)] flex items-center justify-center transition-all hover:scale-110 active:scale-90 group group-hover:shadow-[0_0_30px_rgba(227,25,55,0.8)]"
            title="推荐新店"
          >
            <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
            <div className="absolute right-full mr-4 bg-tesla-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-tesla-red/30 text-[10px] font-bold uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              推荐宝藏店
            </div>
          </button>
        )}
      </div>

      <RestaurantSubmission 
        isOpen={showSubmission} 
        onClose={() => setShowSubmission(false)} 
      />

      {/* Sidebar Panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        restaurants={filteredRestaurants}
        onSelectRestaurant={handleSelectRestaurant}
        selectedRestaurantId={selectedId}
        favoriteIds={favoriteIds}
        onToggleFavorite={handleToggleFavorite}
      />
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
