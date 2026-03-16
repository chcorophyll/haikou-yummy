import { Compass, User, MapPin } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
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
           <h2 className="text-xs text-tesla-muted uppercase tracking-[0.2em] font-bold">附近热门</h2>
        </div>
        
        {/* Mock Shop Card */}
        {[1,2,3,4,5].map(i => (
           <div key={i} className="group flex bg-[#161616] rounded-xl overflow-hidden border border-tesla-gray hover:border-tesla-red/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-red-glow">
            <div className="w-28 bg-tesla-gray flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
              <img src={`https://placehold.co/200x200/222/555?text=Img+${i}`} alt="Food" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
              <div className="absolute top-2 left-2 z-20">
                <span className="text-[10px] font-bold text-white bg-tesla-red/90 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">Top</span>
              </div>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-tesla-red transition-colors duration-300">正宗吴日彪蒜香猪牛排</h3>
                <p className="text-[11px] text-tesla-muted mt-1 truncate">水巷口街...</p>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] uppercase tracking-wider text-tesla-light border border-tesla-gray/50 px-1.5 py-0.5 rounded bg-tesla-gray/20">小吃</span>
                <span className="text-sm font-semibold text-white">¥25<span className="text-[10px] text-tesla-muted"> /人</span></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
