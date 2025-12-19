import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'; // ✅ 这一行必须存在！
import { 
  Book, Moon, Sun, Search, Calendar, User, Menu, X, ArrowLeft,
  Cloud, CloudRain, Smile, Meh, Frown, Heart, Coffee, MapPin,
  Flame, Ghost, Star, Snowflake, Wind, CloudLightning, CloudFog, Leaf
} from 'lucide-react';

// ==========================================
// 👇 数据库连接配置 (生产环境)
// ==========================================

// 读取环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// 初始化客户端
// 如果环境变量没填，给个 null 防止直接报错白屏
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// ==========================================
// 👇 您的个人信息配置
// ==========================================
const PROFILE = {
  name: "My Recordings",
  avatar: "p2494705863.jpg", 
  bio: "\"记录\""
};

const LOGO_CONFIG = {
  left: "record",   
  right: "this"     
};

// ... 图标组件 ...
const MoodIcon = ({ mood, className }) => {
  switch(mood) {
    case 'happy': return <Smile className={`text-amber-500 ${className}`} />; 
    case 'sad': return <Frown className={`text-blue-500 ${className}`} />;   
    case 'excited': return <Heart className={`text-rose-500 ${className}`} />; 
    case 'angry': return <Flame className={`text-red-500 ${className}`} />;    
    case 'tired': return <Coffee className={`text-stone-500 ${className}`} />; 
    case 'scared': return <Ghost className={`text-purple-500 ${className}`} />; 
    case 'cool': return <Star className={`text-yellow-400 ${className}`} />;   
    case 'calm': return <Leaf className={`text-green-500 ${className}`} />;    
    default: return <Meh className={`text-gray-500 ${className}`} />;          
  }
};

const WeatherIcon = ({ weather, className }) => {
  switch(weather) {
    case 'sunny': return <Sun className={`text-orange-400 ${className}`} />;           
    case 'rain': return <CloudRain className={`text-blue-400 ${className}`} />;        
    case 'cloudy': return <Cloud className={`text-slate-400 ${className}`} />;         
    case 'snow': return <Snowflake className={`text-cyan-400 ${className}`} />;        
    case 'windy': return <Wind className={`text-slate-500 ${className}`} />;           
    case 'thunder': return <CloudLightning className={`text-yellow-500 ${className}`} />; 
    case 'fog': return <CloudFog className={`text-slate-400 ${className}`} />;         
    default: return <Sun className={`text-orange-400 ${className}`} />;
  }
};

export default function App() {
  const [entries, setEntries] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState('home'); 
  const [activeEntry, setActiveEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  // 组件加载时获取数据
  useEffect(() => {
    if (!supabase) {
      console.error("Supabase client not initialized. Check your environment variables.");
      setErrorMsg("未检测到数据库配置，请在 Vercel 设置环境变量 (VITE_SUPABASE_URL, VITE_SUPABASE_KEY)。");
      setLoading(false);
      return;
    }
    fetchEntries();
  }, []);

  async function fetchEntries() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false });
      // 🔍🔍🔍 这里是新增的调试代码
      console.log("🛠️ Supabase 原始数据 (data):", data);
      console.log("🛠️ Supabase 错误信息 (error):", error);
      
      if (data && data.length === 0) {
        console.warn("⚠️ 注意：Supabase 返回了一个空数组。请检查：1. 数据库里是否有数据？ 2. RLS (Row Level Security) 策略是否允许公开读取？");
      }
      // 🔍🔍🔍 调试代码结束

      if (error) throw error;

      const formattedData = (data || []).map(item => {
        let dateObj;
        if (item.date) {
            dateObj = new Date(item.date);
        } else {
            dateObj = new Date(item.created_at);
        }

        if (isNaN(dateObj.getTime())) {
            dateObj = new Date(); 
        }

        return {
          ...item,
          year: dateObj.getFullYear(),
          month: String(dateObj.getMonth() + 1).padStart(2, '0'),
          day: String(dateObj.getDate()).padStart(2, '0'),
          images: item.images || [] 
        };
      });
      setEntries(formattedData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setErrorMsg("无法加载日记，请检查数据库连接或表结构。");
    } finally {
      setLoading(false);
    }
  }

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleEntryClick = (entry) => {
    setActiveEntry(entry);
    setView('entry');
    window.scrollTo(0, 0);
  };

  const handleBackHome = () => {
    setView('home');
    setActiveEntry(null);
  };

  const filteredEntries = entries.filter(entry => 
    entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-[#1a1b1e] text-slate-200' : 'bg-[#f8f5f2] text-slate-800'} font-serif`}>
      
      {/* 顶部极简导航 */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${darkMode ? 'bg-[#1a1b1e]/90 border-slate-800' : 'bg-[#f8f5f2]/90 border-[#e5e0d8]'} backdrop-blur-sm border-b`}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleBackHome}>
            <div className={`p-2 rounded-lg transition-transform group-hover:rotate-12 ${darkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-100 text-rose-500'}`}>
              <Book className="h-5 w-5" />
            </div>
            <span className="text-lg font-medium tracking-wide">
              {LOGO_CONFIG.left}
              <span className={`font-bold ${darkMode ? 'text-rose-400' : 'text-rose-500'}`}>
                {LOGO_CONFIG.right}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block relative">
               <input 
                  type="text" 
                  placeholder="搜索记忆..." 
                  className={`pl-9 pr-4 py-1.5 rounded-full text-sm w-48 transition-all focus:w-64 focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 focus:border-rose-500' : 'bg-white border-[#e5e0d8] focus:border-rose-400'} border`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
            </div>
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-800 text-yellow-500' : 'hover:bg-rose-100 text-slate-600'}`}>
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* 主体内容 */}
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-60">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mb-4"></div>
             <p>正在从云端加载记忆...</p>
           </div>
        ) : errorMsg ? (
            <div className="text-center py-20 text-red-500">
              <p>{errorMsg}</p>
            </div>
        ) : (
           view === 'home' ? (
            <div className="animate-fade-in-up">
              {/* 头部欢迎语 */}
              <header className="mb-16 text-center">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-6 border-4 border-white shadow-xl">
                   <img 
                      src={PROFILE.avatar} 
                      onError={(e) => e.target.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"}
                      alt="Me" 
                      className="w-full h-full object-cover" 
                   />
                </div>
                <h1 className="text-2xl font-bold mb-2">{PROFILE.name}</h1>
                <p className={`text-sm italic ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{PROFILE.bio}</p>
              </header>
  
              <div className="relative pl-8 md:pl-0">
                <div className={`hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
  
                {filteredEntries.map((entry, index) => (
                  <div key={entry.id || index} className={`group relative mb-16 md:flex items-center justify-between ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                    
                    {/* 时间轴上的点 (Desktop) */}
                    <div className={`hidden md:flex absolute left-1/2 top-8 -translate-x-1/2 w-4 h-4 rounded-full border-4 z-10 transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-rose-900 group-hover:border-rose-500' : 'bg-[#f8f5f2] border-rose-200 group-hover:border-rose-400'}`}></div>
  
                    {/* 移动端的时间线 (Mobile only) */}
                    <div className={`md:hidden absolute left-0 top-8 w-3 h-3 rounded-full border-2 -translate-x-1.5 ${darkMode ? 'bg-slate-900 border-rose-500' : 'bg-[#f8f5f2] border-rose-400'}`}></div>
                    <div className={`md:hidden absolute left-0 top-11 bottom-[-64px] w-px -translate-x-px ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
  
                    {/* 日期块 (宽屏显示在另一侧) */}
                    <div className={`hidden md:block w-[45%] text-center ${index % 2 === 0 ? 'text-left pl-8' : 'text-right pr-8'}`}>
                      <div className={`text-5xl font-bold opacity-10 font-sans tracking-tighter ${darkMode ? 'text-white' : 'text-black'}`}>{entry.year}</div>
                      <div className={`text-sm font-medium uppercase tracking-widest ${darkMode ? 'text-rose-400' : 'text-rose-500'}`}>{entry.month} / {entry.day}</div>
                    </div>
  
                    {/* 内容卡片 */}
                    <div 
                      onClick={() => handleEntryClick(entry)}
                      className={`w-full md:w-[45%] cursor-pointer transition-transform duration-300 hover:-translate-y-1`}
                    >
                      <article className={`p-6 rounded-2xl shadow-sm border relative overflow-hidden ${darkMode ? 'bg-[#25262b] border-slate-800 hover:border-slate-700' : 'bg-white border-white hover:shadow-md'}`}>
                        {/* 移动端日期 */}
                        <div className="md:hidden flex items-baseline gap-2 mb-3 text-rose-500">
                          <span className="text-xl font-bold">{entry.day}</span>
                          <span className="text-xs uppercase">{entry.month}. {entry.year}</span>
                        </div>
  
                        {/* 图片预览 */}
                        {entry.images && entry.images.length > 0 && (
                          <div className="h-40 w-full mb-4 rounded-lg overflow-hidden">
                             <img src={entry.images[0]} className="w-full h-full object-cover" alt="Memory" />
                          </div>
                        )}
  
                        <div className="flex items-center gap-3 mb-3">
                          <MoodIcon mood={entry.mood} className="w-5 h-5" />
                          <WeatherIcon weather={entry.weather} className="w-5 h-5" />
                          <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{entry.location || 'Unknown'}</span>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-2 leading-tight">{entry.title}</h3>
                        <div className={`text-sm line-clamp-3 leading-relaxed opacity-80 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} dangerouslySetInnerHTML={{__html: entry.content}}></div>
                      </article>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredEntries.length === 0 && (
                 <div className="text-center py-20 opacity-50">
                   <Coffee className="w-12 h-12 mx-auto mb-4 stroke-1" />
                   <p>还没有日记，去 Supabase 数据库写一篇吧...</p>
                 </div>
              )}
            </div>
          ) : (
            /* --- 日记详情视图 --- */
            <div className="animate-fade-in max-w-2xl mx-auto">
               <button 
                  onClick={handleBackHome}
                  className={`group mb-8 flex items-center gap-2 text-sm font-medium transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-black'}`}
                >
                  <div className={`p-1.5 rounded-full transition-colors ${darkMode ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-white group-hover:bg-gray-100'}`}>
                     <ArrowLeft className="h-4 w-4" />
                  </div>
                  返回时间线
                </button>
  
                <article>
                  {/* 头部信息 */}
                  <header className="mb-10 text-center">
                     <div className={`inline-flex items-center gap-6 px-6 py-2 rounded-full mb-6 ${darkMode ? 'bg-slate-800/50' : 'bg-white/60'}`}>
                        <div className="flex flex-col items-center">
                           <span className="text-xs uppercase opacity-50">Date</span>
                           <span className="font-bold font-sans">{activeEntry.year}.{activeEntry.month}.{activeEntry.day}</span>
                        </div>
                        <div className={`w-px h-8 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                        <div className="flex flex-col items-center">
                           <span className="text-xs uppercase opacity-50">Mood</span>
                           <MoodIcon mood={activeEntry.mood} className="w-5 h-5 mt-0.5" />
                        </div>
                        <div className={`w-px h-8 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                        <div className="flex flex-col items-center">
                           <span className="text-xs uppercase opacity-50">Weather</span>
                           <WeatherIcon weather={activeEntry.weather} className="w-5 h-5 mt-0.5" />
                        </div>
                     </div>
                     
                     <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{activeEntry.title}</h1>
                     <div className="flex items-center justify-center gap-2 text-sm opacity-60">
                        <MapPin className="w-4 h-4" /> {activeEntry.location || 'Unknown'}
                     </div>
                  </header>
  
                  {/* 正文 */}
                  <div className={`prose prose-lg max-w-none prose-p:leading-loose ${darkMode ? 'prose-invert prose-p:text-slate-300' : 'prose-p:text-slate-700'}`}>
                     {activeEntry.images && activeEntry.images.length > 0 && (
                        <div className="not-prose mb-10">
                          <img src={activeEntry.images[0]} alt="Memory" className="w-full rounded-xl shadow-lg" />
                          <div className="text-center text-xs mt-2 opacity-50 italic">Captured on {activeEntry.date || activeEntry.created_at?.split('T')[0]}</div>
                        </div>
                     )}
                     <div dangerouslySetInnerHTML={{ __html: activeEntry.content }} />
                  </div>
  
                  {/* 底部装饰 */}
                  <div className="mt-16 text-center opacity-30">
                     <div className="inline-block w-12 h-1 bg-current rounded-full mb-2"></div>
                     <div className="text-xs font-serif italic">End of Entry</div>
                  </div>
                </article>
            </div>
          )
        )}
      </main>

      {/* 底部简易 Footer */}
      <footer className={`py-6 text-center text-xs tracking-wider opacity-40 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        <p>WRITTEN WITH ♥ IN 2025</p>
        <p>Begin 2025年9月22日</p>
      </footer>
    </div>
  );
}