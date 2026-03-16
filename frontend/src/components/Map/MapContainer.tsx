import { useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

interface MapContainerProps {
  onMapLoaded?: (map: any) => void;
}

export default function MapContainer({ onMapLoaded }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const key = import.meta.env.VITE_AMAP_KEY || '';
    if (!key) return; // Prevent loading failure without key

    AMapLoader.load({
      key: key,
      version: '2.0',
      plugins: ['AMap.Marker', 'AMap.InfoWindow'],
    })
      .then((AMap) => {
        if (!mapContainer.current) return;
        
        mapRef.current = new AMap.Map(mapContainer.current, {
          viewMode: '3D', // 3D aesthetic
          zoom: 13,
          center: [110.3294, 20.0174], // Haikou coords
          mapStyle: 'amap://styles/dark', // Tesla visual fit
        });

        if (onMapLoaded) {
          onMapLoaded(mapRef.current);
        }
      })
      .catch((e) => {
        console.error('AMap Loader Error:', e);
      });

    return () => {
      mapRef.current?.destroy();
    };
  }, [onMapLoaded]);

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: '#1c1c1e' }}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {!import.meta.env.VITE_AMAP_KEY && (
        <div className="absolute inset-0 flex items-center justify-center bg-tesla-dark/90 z-[100] p-6 text-center backdrop-blur-sm">
          <div className="glass-panel p-8 rounded-2xl max-w-sm border-t border-tesla-red/50 shadow-red-glow">
            <h3 className="text-tesla-red font-bold text-xl mb-3 uppercase tracking-[0.15em]">地图加载受限</h3>
            <p className="text-tesla-muted text-sm leading-relaxed mb-6">
              由于本项目未配置高德地图 Web Key，地图目前处于 Mock 状态。您可以在 <code className="bg-black text-tesla-red px-1 py-0.5 rounded">.env</code> 文件中配置 <code className="bg-black text-tesla-red px-1 py-0.5 rounded">VITE_AMAP_KEY</code> 激活真实地图。
            </p>
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-tesla-red to-transparent opacity-50"></div>
          </div>
        </div>
      )}
    </div>
  );
}
