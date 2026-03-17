import { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { Restaurant } from '../../types/restaurant';

interface MapContainerProps {
  restaurants: Restaurant[];
  onSelectRestaurant?: (restaurant: Restaurant | null) => void;
  selectedRestaurantId?: string | null;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
}

export default function MapContainer({ 
  restaurants, 
  onSelectRestaurant,
  selectedRestaurantId,
  favoriteIds,
  onToggleFavorite
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const userMarkerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const drivingRef = useRef<any>(null);
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationTargetId, setNavigationTargetId] = useState<string | null>(null);

  useEffect(() => {
    const key = import.meta.env.VITE_AMAP_KEY || '';
    const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE || '';
    
    if (!key) return;

    if (securityCode) {
      window._AMapSecurityConfig = {
        securityJsCode: securityCode,
      };
    }

    AMapLoader.load({
      key: key,
      version: '2.0',
      plugins: ['AMap.Marker', 'AMap.InfoWindow', 'AMap.Geolocation', 'AMap.Driving'],
    })
      .then((AMap) => {
        if (!mapContainer.current) return;
        
        const map = new AMap.Map(mapContainer.current, {
          viewMode: '3D',
          zoom: 13,
          center: [110.3294, 20.0174],
          mapStyle: 'amap://styles/dark',
        });
        mapRef.current = map;

        const infoWindow = new AMap.InfoWindow({
          offset: new AMap.Pixel(0, -25),
          isCustom: true,
        });
        infoWindowRef.current = infoWindow;

        // Click on map to deselect
        map.on('click', () => {
          if (onSelectRestaurant) {
            onSelectRestaurant(null);
          }
          infoWindow.close();
        });

        // Initialize Geolocation
        const geolocation = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 10000,
          offset: [20, 20],
          zoomToAccuracy: false,
          position: 'RB',
          showButton: false, // Custom markers
          showMarker: false,
          showCircle: false,
        });

        geolocation.getCurrentPosition((status: string, result: any) => {
          if (status === 'complete') {
            const pos: [number, number] = [result.position.lng, result.position.lat];
            setUserLocation(pos);
            
            // Tesla style Blue Dot
            userMarkerRef.current = new AMap.Marker({
              position: pos,
              content: `
                <div class="relative">
                  <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(59,130,246,0.8)] z-50"></div>
                  <div class="absolute -inset-2 bg-blue-500/30 rounded-full animate-ping"></div>
                </div>
              `,
              offset: new AMap.Pixel(-8, -8),
              zIndex: 100,
            });
            userMarkerRef.current.setMap(map);
          }
        });

        // Initialize Driving service
        drivingRef.current = new AMap.Driving({
          map: map,
          panel: '', // No heavy UI panel
          hideMarkers: true, // we use our own
          autoFitView: true,
        });
      })
      .catch((e) => {
        console.error('AMap Loader Error:', e);
      });

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [onSelectRestaurant]);

  // 同步标记点并调整视野
  useEffect(() => {
    if (!mapRef.current || !window.AMap) return;

    // 清理旧标记
    Object.values(markersRef.current).forEach(marker => marker.setMap(null));
    markersRef.current = {};

    restaurants.forEach(restaurant => {
      const [lng, lat] = restaurant.location.coordinates;
      const isSelected = selectedRestaurantId === restaurant._id;
      
      const marker = new window.AMap.Marker({
        position: [lng, lat],
        offset: new window.AMap.Pixel(-10, -10),
        zIndex: isSelected ? 110 : 100,
        content: `
          <div class="relative group">
            <div class="w-5 h-5 ${isSelected ? 'bg-white scale-125 z-20 shadow-[0_0_20px_#fff]' : 'bg-tesla-red'} rounded-full border-2 border-white shadow-[0_0_10px_rgba(227,25,55,0.8)] cursor-pointer transition-all duration-500 hover:scale-110"></div>
            ${isSelected ? '<div class="absolute -inset-2 bg-white/30 rounded-full animate-ping"></div>' : ''}
          </div>
        `
      });

      marker.on('click', (e: any) => {
        if (onSelectRestaurant) onSelectRestaurant(restaurant);
        e.originEvent.stopPropagation();
      });

      marker.setMap(mapRef.current);
      markersRef.current[restaurant._id] = marker;
    });

    // 自动重置视野以包围所有元素
    if (!selectedRestaurantId && !isNavigating) {
      const markersToFit = Object.values(markersRef.current);
      if (userMarkerRef.current) markersToFit.push(userMarkerRef.current);
      
      if (markersToFit.length > 0) {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.setFitView(markersToFit, false, [80, 80, 80, 80]);
          }
        }, 400);
      }
    }
  }, [restaurants, selectedRestaurantId, isNavigating, userLocation]);

  // 处理选中状态及信息窗口
  useEffect(() => {
    if (!mapRef.current || !infoWindowRef.current) return;
    
    if (selectedRestaurantId) {
      const restaurant = restaurants.find(r => r._id === selectedRestaurantId);
      const marker = markersRef.current[selectedRestaurantId];
      
      if (marker && restaurant) {
        // 重构：选中时视野自适应（包含用户和目标饭店）
        const pointsToFit = [marker.getPosition()];
        if (userLocation) {
          pointsToFit.push(new (window as any).AMap.LngLat(userLocation[0], userLocation[1]));
        }

        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.setFitView(pointsToFit, false, [100, 100, 100, 100], 15);
          }
        }, 100);
        
        const isTarget = navigationTargetId === restaurant._id;
        const isFavorite = favoriteIds.includes(restaurant._id);
        
        const content = document.createElement('div');
        content.className = "glass-panel p-4 rounded-xl border border-tesla-red/50 shadow-red-glow min-w-[240px] bg-tesla-black/95 text-white animate-in fade-in zoom-in duration-300";
        
        let buttonHtml = '';
        if (isNavigating && isTarget) {
          buttonHtml = `
            <button id="nav-btn" class="flex-1 bg-tesla-red hover:bg-red-700 text-white text-[11px] flex items-center justify-center gap-2 font-bold py-2 rounded-lg transition-all transform active:scale-95 uppercase tracking-widest shadow-red-glow">
              退出导航
            </button>
          `;
        } else if (isNavigating && !isTarget) {
          buttonHtml = `
            <button id="nav-btn" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] flex items-center justify-center gap-2 font-bold py-2 rounded-lg transition-all transform active:scale-95 uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              切换为终点
            </button>
          `;
        } else {
          buttonHtml = `
            <button id="nav-btn" class="flex-1 bg-tesla-red hover:bg-red-700 text-white text-[11px] flex items-center justify-center gap-2 font-bold py-2 rounded-lg transition-all transform active:scale-95 uppercase tracking-widest shadow-red-glow">
              出发导航
            </button>
          `;
        }

        content.innerHTML = `
          <div class="flex flex-col gap-2">
            <div class="flex justify-between items-center border-b border-tesla-gray pb-2 mb-1">
              <h3 class="text-tesla-red font-bold text-base uppercase tracking-wider truncate mr-4">${restaurant.name}</h3>
              <button id="fav-btn" class="p-1.5 rounded-full transition-all active:scale-90 ${
                isFavorite 
                  ? 'bg-tesla-red/20 text-tesla-red shadow-[0_0_10px_rgba(227,25,55,0.3)]' 
                  : 'text-tesla-muted hover:bg-tesla-gray/30'
              }">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFavorite ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </button>
            </div>
            <div class="space-y-1.5 pt-1">
              <div class="flex items-start gap-2">
                <span class="text-[10px] text-tesla-muted uppercase font-bold w-12 flex-shrink-0 mt-0.5">地址</span>
                <span class="text-xs text-tesla-light leading-relaxed">${restaurant.address || '海口市'}</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-[10px] text-tesla-muted uppercase font-bold w-12 flex-shrink-0 mt-0.5">电话</span>
                <span class="text-xs text-tesla-red font-semibold select-all font-mono">${restaurant.telephone || '暂无电话'}</span>
              </div>
            </div>
            <div class="mt-3 flex gap-2">
              ${buttonHtml}
            </div>
          </div>
        `;

        setTimeout(() => {
          const navBtn = document.getElementById('nav-btn');
          const favBtn = document.getElementById('fav-btn');

          if (navBtn) {
            navBtn.onclick = () => {
              if (isNavigating && isTarget) {
                clearNavigation();
              } else {
                startNavigation(restaurant);
              }
            };
          }

          if (favBtn) {
            favBtn.onclick = () => {
              onToggleFavorite(restaurant._id);
              // Simple immediate UI feedback for fav button
              const isNowFavorite = !favoriteIds.includes(restaurant._id);
              favBtn.classList.toggle('text-tesla-red', isNowFavorite);
              favBtn.classList.toggle('text-tesla-muted', !isNowFavorite);
              favBtn.classList.toggle('bg-tesla-red/20', isNowFavorite);
              const svg = favBtn.querySelector('svg');
              if (svg) svg.setAttribute('fill', isNowFavorite ? 'currentColor' : 'none');
            };
          }
        }, 10);
        
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapRef.current, marker.getPosition());
      }
    } else {
      infoWindowRef.current.close();
    }
  }, [selectedRestaurantId, restaurants, isNavigating, navigationTargetId, favoriteIds, onToggleFavorite]);

  const startNavigation = (restaurant: Restaurant) => {
    if (!userLocation || !drivingRef.current || !mapRef.current || !window.AMap) {
      console.warn('导航组件尚未完全加载或定位失效', { userLocation, hasDriving: !!drivingRef.current });
      alert('请确保已允许位置授权且地图加载完成');
      return;
    }
    
    setIsNavigating(true);
    setNavigationTargetId(restaurant._id);
    infoWindowRef.current.close();

    const [destLng, destLat] = restaurant.location.coordinates;
    drivingRef.current.clear();
    
    // 显式使用 LngLat 对象，确保 AMap 2.0 内部识别准确
    const startPos = new window.AMap.LngLat(userLocation[0], userLocation[1]);
    const endPos = new window.AMap.LngLat(destLng, destLat);
    
    console.log('开始导航规划:', { from: startPos.toString(), to: endPos.toString() });

    drivingRef.current.search(
      startPos,
      endPos,
      (status: string, result: any) => {
        if (status === 'complete' && result.routes && result.routes.length > 0) {
          console.log('导航路径规划成功');
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.setFitView(undefined, false, [100, 100, 140, 100]);
            }
          }, 400);
        } else {
          console.error('导航规划失败详细信息:', status, result);
          setIsNavigating(false);
          
          let errorMsg = '地图规划服务暂时不可用';
          if (status === 'no_data') {
            errorMsg = '抱歉，找不到这两个地点之间的驾车路线（可能跨海或距离过远）';
          } else if (status === 'error') {
            errorMsg = `导航服务报错: ${result.info || '未知错误'}`;
          } else if (status === 'timeout') {
            errorMsg = '规划超时，请检查您的网络连接';
          }
          
          alert(`${errorMsg}。如果是在模拟位置，请确保起点和终点都在海口市区内。`);
        }
      }
    );
  };

  const clearNavigation = () => {
    if (drivingRef.current) {
      drivingRef.current.clear();
      setIsNavigating(false);
      setNavigationTargetId(null);
      // 退出导航后恢复全景视野
      const markersToFit = Object.values(markersRef.current);
      if (userMarkerRef.current) markersToFit.push(userMarkerRef.current);
      if (mapRef.current) {
        mapRef.current.setFitView(markersToFit, false, [80, 80, 80, 80]);
      }
    }
  };

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: '#1c1c1e' }}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* 增强版取消导航按钮，类似 Google Maps 的悬浮操作条 */}
      {isNavigating && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 animate-in slide-in-from-bottom-8 duration-500">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center border-tesla-red/30 shadow-red-glow">
            <span className="text-white text-[10px] uppercase font-bold tracking-widest mr-3">导航进行中</span>
            <button 
              onClick={clearNavigation}
              className="px-4 py-1.5 bg-tesla-red hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-full transition-all active:scale-95"
            >
              退出导航
            </button>
          </div>
        </div>
      )}

      {!import.meta.env.VITE_AMAP_KEY && (
        <div className="absolute inset-0 flex items-center justify-center bg-tesla-dark/90 z-[100] p-6 text-center backdrop-blur-sm">
          <div className="glass-panel p-8 rounded-2xl max-w-sm border-t border-tesla-red/50 shadow-red-glow">
            <h3 className="text-tesla-red font-bold text-xl mb-3 uppercase tracking-[0.15em]">地图模式: 数据预览</h3>
            <p className="text-tesla-muted text-sm leading-relaxed mb-6">
              配置 <code className="bg-black text-tesla-red px-1 py-0.5 rounded">VITE_AMAP_KEY</code> 后开启实景地图与导航。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
