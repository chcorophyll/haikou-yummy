import { useState, useEffect } from 'react';
import { Search, Map as MapIcon, Menu } from 'lucide-react';
import MapContainer from './components/Map/MapContainer';
import Sidebar from './components/Sidebar/Sidebar';
import { restaurantService } from './api/restaurantService';
import { Restaurant } from './types/restaurant';

function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedId(restaurant._id);
    // If we are on small screens, we might want to switch tabs or views, 
    // but for the desktop layout, both are visible.
  };

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
          restaurants={restaurants} 
          onSelectRestaurant={handleSelectRestaurant}
          selectedRestaurantId={selectedId}
        />

        {/* Floating Search Bar (Desktop) */}
        <div className="hidden md:block absolute top-6 left-6 right-6 z-10 max-w-md">
          <div className="glass-panel rounded-full flex items-center px-4 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-tesla-gray/30 focus-within:border-tesla-red/50 focus-within:shadow-[0_0_15px_rgba(227,25,55,0.3)] transition-all duration-300">
            <Search size={20} className="text-tesla-muted" />
            <input 
              type="text" 
              placeholder="搜索海口的美食、店铺或地址..."
              className="bg-transparent border-none outline-none ml-3 flex-1 text-white placeholder-tesla-muted text-sm"
            />
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
      </div>

      {/* Sidebar Panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        restaurants={restaurants}
        onSelectRestaurant={handleSelectRestaurant}
        selectedRestaurantId={selectedId}
      />
      
    </div>
  );
}

export default App;
