import { useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { Restaurant } from '../../types/restaurant';

interface MapContainerProps {
  restaurants: Restaurant[];
  onSelectRestaurant?: (restaurant: Restaurant) => void;
  selectedRestaurantId?: string | null;
}

export default function MapContainer({ 
  restaurants, 
  onSelectRestaurant,
  selectedRestaurantId 
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    const key = import.meta.env.VITE_AMAP_KEY || '';
    const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE || '';
    
    if (!key) return;

    // Set security config before loading
    if (securityCode) {
      window._AMapSecurityConfig = {
        securityJsCode: securityCode,
      };
    }

    AMapLoader.load({
      key: key,
      version: '2.0',
      plugins: ['AMap.Marker', 'AMap.InfoWindow'],
    })
      .then((AMap) => {
        if (!mapContainer.current) return;
        
        mapRef.current = new AMap.Map(mapContainer.current, {
          viewMode: '3D',
          zoom: 13,
          center: [110.3294, 20.0174],
          mapStyle: 'amap://styles/dark',
        });
      })
      .catch((e) => {
        console.error('AMap Loader Error:', e);
      });

    return () => {
      mapRef.current?.destroy();
    };
  }, []);

  // Sync Markers when restaurants change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(marker => marker.setMap(null));
    markersRef.current = {};

    restaurants.forEach(restaurant => {
      const [lng, lat] = restaurant.location.coordinates;
      const marker = new window.AMap.Marker({
        position: [lng, lat],
        title: restaurant.name,
        offset: new window.AMap.Pixel(-10, -10),
        content: `<div class="w-5 h-5 bg-tesla-red rounded-full border-2 border-white shadow-[0_0_10px_rgba(227,25,55,0.8)] cursor-pointer"></div>`
      });

      marker.on('click', () => {
        if (onSelectRestaurant) {
          onSelectRestaurant(restaurant);
        }
      });

      marker.setMap(mapRef.current);
      markersRef.current[restaurant._id] = marker;
    });

    if (restaurants.length > 0) {
      mapRef.current.setFitView();
    }
  }, [restaurants, onSelectRestaurant]);

  // Handle selected restaurant highlight
  useEffect(() => {
    if (!mapRef.current || !selectedRestaurantId) return;
    
    const marker = markersRef.current[selectedRestaurantId];
    if (marker) {
      mapRef.current.setCenter(marker.getPosition());
      mapRef.current.setZoom(16);
    }
  }, [selectedRestaurantId]);

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: '#1c1c1e' }}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {!import.meta.env.VITE_AMAP_KEY && (
        <div className="absolute inset-0 flex items-center justify-center bg-tesla-dark/90 z-[100] p-6 text-center backdrop-blur-sm">
          <div className="glass-panel p-8 rounded-2xl max-w-sm border-t border-tesla-red/50 shadow-red-glow">
            <h3 className="text-tesla-red font-bold text-xl mb-3 uppercase tracking-[0.15em]">地图模式: 数据预览</h3>
            <p className="text-tesla-muted text-sm leading-relaxed mb-6">
              已加载 {restaurants.length} 家餐厅。配置 <code className="bg-black text-tesla-red px-1 py-0.5 rounded">VITE_AMAP_KEY</code> 后即可查看真实地图底图。
            </p>
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-tesla-red to-transparent opacity-50"></div>
          </div>
        </div>
      )}
    </div>
  );
}
