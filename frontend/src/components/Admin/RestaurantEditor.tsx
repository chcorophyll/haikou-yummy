import { useState, useEffect } from 'react';
import { X, Save, Loader2, MapPin, Phone, Tag, Info } from 'lucide-react';
import { Restaurant } from '../../types/restaurant';

interface RestaurantEditorProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Restaurant>) => Promise<void>;
}

export default function RestaurantEditor({ restaurant, isOpen, onClose, onSave }: RestaurantEditorProps) {
  const [formData, setFormData] = useState<Partial<Restaurant>>({});
  const [saving, setSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurant) {
      setFormData({ ...restaurant });
    } else {
      setFormData({
        name: '',
        address: '',
        telephone: '',
        category: [],
        images: [],
        location: { type: 'Point', coordinates: [110.3294, 20.0174] }
      });
    }
    setError(null);
  }, [restaurant, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('请输入饭店名称，以便我们为您匹配精准信息');
      return;
    }
    setError(null);
    
    setSaving(true);
    try {
      await onSave(restaurant?._id || '', formData);
      onClose();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const fetchAmapData = async () => {
    if (!formData.name?.trim() || !window.AMap) return;
    
    setIsFetching(true);
    try {
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
              
              const rawCategories = poi.type ? poi.type.split(';').filter(Boolean) : [];
              const cleanedCategories = rawCategories.filter((cat: string) => 
                !['餐饮服务', '公司企业', '生活服务', '地名地址信息'].includes(cat)
              );

              const photos = poi.photos || [];
              const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200";
              const imageUrl = photos.length > 0 ? photos[0].url : DEFAULT_IMAGE;

              setFormData(prev => ({
                ...prev,
                name: poi.name || prev.name,
                address: poi.address ? `海口市${poi.adname || ''}${poi.address}` : prev.address,
                telephone: poi.tel ? poi.tel.split(';')[0].split('/')[0] : prev.telephone,
                category: cleanedCategories.length > 0 ? cleanedCategories : (prev.category || []),
                images: [imageUrl],
                location: {
                  type: 'Point',
                  coordinates: [poi.location.lng, poi.location.lat]
                }
              }));
              setError(null);
            }
            resolve();
          });
        });
      });
    } finally {
      setIsFetching(false);
    }
  };

  const updateCoords = (idx: number, val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    const newCoords = [...(formData.location?.coordinates || [0, 0])];
    newCoords[idx] = num;
    setFormData({
      ...formData,
      location: { type: 'Point', coordinates: newCoords as [number, number] }
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-tesla-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="glass-panel w-full max-w-2xl bg-tesla-dark border border-tesla-gray/30 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-tesla-gray/20 bg-tesla-gray/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tesla-red/10 rounded-xl flex items-center justify-center">
              <Info className="text-tesla-red" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wider uppercase">{restaurant ? '编辑餐厅' : '新增餐厅'}</h2>
              <p className="text-tesla-muted text-[10px] uppercase tracking-widest mt-0.5">数据校准与维护</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-tesla-gray/20 rounded-full text-tesla-muted transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-tesla-muted uppercase tracking-widest ml-1">餐厅名称</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className={`flex-1 bg-tesla-black border ${error ? 'border-tesla-red animate-shake' : 'border-tesla-gray/30'} rounded-xl px-4 py-3 text-sm text-white focus:border-tesla-red/50 focus:outline-none transition-all placeholder:text-tesla-gray/50`}
                  value={formData.name || ''}
                  onChange={e => {
                    setFormData({...formData, name: e.target.value});
                    if (error) setError(null);
                  }}
                  placeholder="店名 (必填)"
                />
                <button
                  type="button"
                  onClick={fetchAmapData}
                  disabled={isFetching || !formData.name}
                  className="px-3 bg-tesla-gray/20 hover:bg-tesla-red/20 text-tesla-muted hover:text-tesla-red rounded-xl border border-tesla-gray/30 transition-all flex items-center justify-center disabled:opacity-50"
                  title="从高德地图匹配数据"
                >
                  {isFetching ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                </button>
              </div>
              {error && <p className="text-tesla-red text-[10px] uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-tesla-muted uppercase tracking-widest ml-1">联系电话</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-tesla-muted" size={16} />
                <input 
                  type="text" 
                  className="w-full bg-tesla-black border border-tesla-gray/30 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-tesla-red/50 focus:outline-none transition-all font-mono"
                  value={formData.telephone || ''}
                  onChange={e => setFormData({...formData, telephone: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-tesla-muted uppercase tracking-widest ml-1">详细地址</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-tesla-muted" size={16} />
              <input 
                type="text" 
                className="w-full bg-tesla-black border border-tesla-gray/30 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-tesla-red/50 focus:outline-none transition-all"
                value={formData.address || ''}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>

          {/* Location / Coords */}
          <div className="p-4 bg-tesla-black/40 rounded-2xl border border-tesla-gray/20 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="text-tesla-red" size={16} />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">坐标校准 (Lng, Lat)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] text-tesla-muted uppercase tracking-tighter">经度 Longitude</span>
                <input 
                  type="number" step="0.000001"
                  className="w-full bg-tesla-black border border-tesla-gray/30 rounded-lg px-3 py-2 text-xs text-tesla-red font-mono focus:border-tesla-red outline-none"
                  value={formData.location?.coordinates[0] || ''}
                  onChange={e => updateCoords(0, e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-tesla-muted uppercase tracking-tighter">纬度 Latitude</span>
                <input 
                  type="number" step="0.000001"
                  className="w-full bg-tesla-black border border-tesla-gray/30 rounded-lg px-3 py-2 text-xs text-tesla-red font-mono focus:border-tesla-red outline-none"
                  value={formData.location?.coordinates[1] || ''}
                  onChange={e => updateCoords(1, e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="text-tesla-red" size={16} />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">分类标签 (逗号分隔)</span>
            </div>
            <input 
              type="text" 
              className="w-full bg-tesla-black border border-tesla-gray/30 rounded-xl px-4 py-3 text-sm text-white focus:border-tesla-red/50 focus:outline-none transition-all"
              value={formData.category?.join(', ') || ''}
              onChange={e => setFormData({...formData, category: e.target.value.split(',').map(s => s.trim())})}
              placeholder="例如: 海南粉, 老字号"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="text-tesla-red" size={16} />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">店面展示图</span>
            </div>
            <div className="space-y-3">
              {formData.images && formData.images.length > 0 && (
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-tesla-gray/30 group">
                  <img src={formData.images[0]} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-tesla-black/60 to-transparent flex items-end p-4">
                    <span className="text-[10px] text-white font-bold tracking-widest uppercase opacity-70">预览图预览</span>
                  </div>
                </div>
              )}
              <input 
                type="text" 
                className="w-full bg-tesla-black border border-tesla-gray/30 rounded-xl px-4 py-3 text-xs text-tesla-red font-mono focus:border-tesla-red outline-none"
                placeholder="图片 URL 地址"
                value={formData.images?.[0] || ''}
                onChange={e => setFormData({...formData, images: [e.target.value]})}
              />
              <p className="text-[9px] text-tesla-muted uppercase tracking-tighter ml-1">高德地图 API 封面或外部图片链接</p>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-tesla-gray/20 flex gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-tesla-gray/30 rounded-xl text-xs font-bold uppercase tracking-widest text-tesla-muted hover:bg-tesla-gray/10 transition-all active:scale-95"
          >
            取消
          </button>
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-tesla-red hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-red-glow transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            保存资料
          </button>
        </div>
      </div>
    </div>
  );
}
