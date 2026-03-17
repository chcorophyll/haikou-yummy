import { useState } from 'react';
import { X, Send, MapPin, Store, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { restaurantService } from '../../api/restaurantService';
import { Restaurant } from '../../types/restaurant';

declare global {
  interface Window {
    AMap: any;
  }
}

interface RestaurantSubmissionProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RestaurantSubmission({ isOpen, onClose }: RestaurantSubmissionProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    reason: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let enrichedData: Partial<Restaurant> = {
        name: formData.name,
        address: formData.address,
        is_verified: false,
        category: ['社区推荐'],
        location: { type: 'Point', coordinates: [110.3294, 20.0174] } 
      };

      // Call Amap to enrich data
      if (window.AMap) {
        await new Promise<void>((resolve) => {
          window.AMap.plugin(['AMap.PlaceSearch'], () => {
            const placeSearch = new window.AMap.PlaceSearch({
              city: '海口',
              pageSize: 1,
              extensions: 'all'
            });

            placeSearch.search(formData.name, (status: string, result: any) => {
              if (status === 'complete' && result.poiList && result.poiList.pois.length > 0) {
                const poi = result.poiList.pois[0];
                
                // Align with backend schema and clean data
                const rawCategories = poi.type ? poi.type.split(';').filter(Boolean) : [];
                const cleanedCategories = rawCategories.filter((cat: string) => 
                  !['餐饮服务', '公司企业', '生活服务', '地名地址信息'].includes(cat)
                );

                enrichedData = {
                  ...enrichedData,
                  name: poi.name || formData.name,
                  address: poi.address ? `海口市${poi.adname || ''}${poi.address}` : formData.address,
                  telephone: poi.tel ? poi.tel.split(';')[0].split('/')[0] : undefined,
                  category: cleanedCategories.length > 0 ? cleanedCategories : ['社区推荐'],
                  location: {
                    type: 'Point',
                    coordinates: [poi.location.lng, poi.location.lat]
                  }
                };
              }
              resolve();
            });
          });
        });
      }

      await restaurantService.createRestaurant(enrichedData);
      setStep('success');
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-tesla-black/90 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="glass-panel w-full max-w-lg bg-tesla-dark border border-tesla-red/30 rounded-3xl shadow-[0_0_50px_rgba(227,25,55,0.2)] overflow-hidden relative animate-in slide-in-from-bottom-10 duration-500">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-tesla-gray/20 rounded-full text-tesla-muted transition-colors">
          <X size={20} />
        </button>

        {step === 'form' ? (
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white tracking-widest uppercase">发现宝藏店?</h2>
              <p className="text-tesla-muted text-xs mt-2 uppercase tracking-widest">在这里告诉我们，让更多人尝到海口美味</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <Store size={14} className="text-tesla-red" />
                  <label className="text-[10px] font-bold text-tesla-muted uppercase tracking-widest">店名 (必填)</label>
                </div>
                <input 
                  type="text" 
                  required
                  placeholder="如：美兰区某冷饮店..."
                  className="w-full bg-tesla-black border border-tesla-gray/30 rounded-2xl px-5 py-4 text-sm text-white focus:border-tesla-red/50 focus:outline-none transition-all placeholder:text-tesla-gray/50 shadow-inner"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <MapPin size={14} className="text-tesla-red" />
                  <label className="text-[10px] font-bold text-tesla-muted uppercase tracking-widest">大概地址 / 标志建筑</label>
                </div>
                <input 
                  type="text" 
                  placeholder="如：博爱南路靠近xxx..."
                  className="w-full bg-tesla-black border border-tesla-gray/30 rounded-2xl px-5 py-4 text-sm text-white focus:border-tesla-red/50 focus:outline-none transition-all placeholder:text-tesla-gray/50 shadow-inner"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <MessageSquare size={14} className="text-tesla-red" />
                  <label className="text-[10px] font-bold text-tesla-muted uppercase tracking-widest">推荐理由 (让我们垂涎三尺)</label>
                </div>
                <textarea 
                  rows={3}
                  placeholder="这家的糟粕醋真的绝了..."
                  className="w-full bg-tesla-black border border-tesla-gray/30 rounded-2xl px-5 py-4 text-sm text-white focus:border-tesla-red/50 focus:outline-none transition-all placeholder:text-tesla-gray/50 shadow-inner resize-none"
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-tesla-red hover:bg-red-700 text-white rounded-2xl font-bold uppercase tracking-[0.2em] shadow-red-glow transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
                提交给管理员
              </button>
            </form>
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-widest uppercase mb-3">提交成功!</h2>
            <p className="text-tesla-muted text-sm leading-relaxed mb-10">
              感谢您的分享！管理员审核后，<br/>您的发现将点亮海口美食地图。
            </p>
            <button 
              onClick={onClose}
              className="w-full py-4 border border-tesla-gray text-tesla-light hover:bg-tesla-gray/10 rounded-2xl font-bold uppercase tracking-[0.2em] transition-all active:scale-95"
            >
              返回地图
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
