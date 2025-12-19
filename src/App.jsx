import React, { useState, useEffect } from 'react';

import { createClient } from '@supabase/supabase-js'; 

import { 
  Book, Moon, Sun, Search, Calendar, User, Menu, X, ArrowLeft,
  Cloud, CloudRain, Smile, Meh, Frown, Heart, Coffee, MapPin,
  Flame, Ghost, Star, Snowflake, Wind, CloudLightning, CloudFog, Leaf,
  LogIn, LogOut, Plus, Image as ImageIcon, Loader2
} from 'lucide-react';

// ==========================================
// 👇 数据库配置
// ==========================================


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;


// --- 🟡 Preview Mock (仅供在线预览，部署时请删除整个 Mock 块) ---
// ⚠️ 注意：Mock 模式下无法真正登录和上传图片
// const supabase = {
//   auth: {
//     getSession: () => Promise.resolve({ data: { session: null } }),
//     onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
//     signInWithPassword: () => Promise.resolve({ error: { message: "预览模式无法登录，请在本地配置 Supabase" } }),
//     signOut: () => Promise.resolve({})
//   },
//   from: () => ({
//     select: () => ({
//       order: () => Promise.resolve({
//         data: [{
//           id: 1,
//           title: "预览模式数据",
//           content: "<p>这是模拟数据。请在本地配置真实数据库以启用登录和写入功能。</p>",
//           mood: "happy",
//           weather: "sunny",
//           created_at: new Date().toISOString(),
//           location: "Virtual Space",
//           images: []
//         }],
//         error: null
//       })
//     })
//   })
// };
// --------------------------------------------------

const PROFILE = {
  name: "My Recordings",
  avatar: "p2494705863.jpg", 
  bio: "\"记录生活，连接此刻\""
};

const LOGO_CONFIG = { left: "record", right: "this" };

// ... 图标组件 (保持不变) ...
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
  
  // 🔐 登录与交互状态
  const [session, setSession] = useState(null); // 当前登录用户
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 📝 写作表单状态
  const [newEntry, setNewEntry] = useState({ title: '', content: '', mood: 'calm', weather: 'sunny', location: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');

  // 初始化：获取用户 session 和日记数据
  useEffect(() => {
    if (!supabase) return;

    // 1. 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. 监听登录状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // 3. 获取日记
    fetchEntries();

    return () => subscription.unsubscribe();
  }, []);

  async function fetchEntries() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 🕒 日期处理核心逻辑：直接使用 created_at
      const formattedData = (data || []).map(item => {
        const dateObj = new Date(item.created_at); // UTC 时间
        return {
          ...item,
          // 格式化为本地显示的年、月、日
          year: dateObj.getFullYear(),
          month: String(dateObj.getMonth() + 1).padStart(2, '0'),
          day: String(dateObj.getDate()).padStart(2, '0'),
          weekday: dateObj.toLocaleDateString('zh-CN', { weekday: 'short' }), // "周一"
          images: item.images || [] 
        };
      });
      setEntries(formattedData);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  // 🔐 登录处理
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
    }
    setLoading(false);
  };

  // 🚪 登出处理
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 📤 图片上传处理
  const handleImageUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 上传到 'diary_images' 桶
      const { error: uploadError } = await supabase.storage
        .from('diary_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 获取公开链接
      const { data } = supabase.storage.from('diary_images').getPublicUrl(filePath);
      setUploadUrl(data.publicUrl);
    } catch (error) {
      alert('上传失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // 💾 保存日记
  const handleSubmitEntry = async () => {
    if (!newEntry.title || !newEntry.content) return alert("请至少填写标题和内容");
    
    setLoading(true);
    try {
      const images = uploadUrl ? [uploadUrl] : [];
      
      const { error } = await supabase.from('entries').insert([{
        title: newEntry.title,
        content: `<p>${newEntry.content.replace(/\n/g, '<br/>')}</p>`, // 简单处理换行
        mood: newEntry.mood,
        weather: newEntry.weather,
        location: newEntry.location || '未知地点',
        images: images,
        // created_at 会由数据库自动生成
      }]);

      if (error) throw error;

      setShowWriteModal(false);
      setNewEntry({ title: '', content: '', mood: 'calm', weather: 'sunny', location: '' });
      setUploadUrl('');
      fetchEntries(); // 重新加载列表
    } catch (error) {
      alert('发布失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry => 
    entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-[#1a1b1e] text-slate-200' : 'bg-[#f8f5f2] text-slate-800'} font-serif relative`}>
      
      {/* 导航栏 */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${darkMode ? 'bg-[#1a1b1e]/90 border-slate-800' : 'bg-[#f8f5f2]/90 border-[#e5e0d8]'} backdrop-blur-sm border-b`}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')}>
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-100 text-rose-500'}`}>
              <Book className="h-5 w-5" />
            </div>
            <span className="text-lg font-medium tracking-wide">
              {LOGO_CONFIG.left}<span className={`font-bold ${darkMode ? 'text-rose-400' : 'text-rose-500'}`}>{LOGO_CONFIG.right}</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* 登录/登出/写日记 按钮 */}
            {session ? (
              <>
                <button onClick={() => setShowWriteModal(true)} className="p-2 rounded-full hover:bg-rose-100 text-rose-500 transition-colors" title="写日记">
                  <Plus className="h-5 w-5" />
                </button>
                <button onClick={handleLogout} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`} title="退出">
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`} title="登录">
                <LogIn className="h-5 w-5" />
              </button>
            )}
            
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-800 text-yellow-500' : 'hover:bg-rose-100 text-slate-600'}`}>
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* 🔐 登录弹窗 */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm p-8 rounded-2xl shadow-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-6 text-center">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 rounded-lg border bg-transparent" />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded-lg border bg-transparent" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 p-2 rounded-lg border opacity-70">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 p-2 rounded-lg bg-rose-500 text-white font-bold">{loading ? '...' : 'Login'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📝 写日记弹窗 */}
      {showWriteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">New Memory</h2>
              <button onClick={() => setShowWriteModal(false)}><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Title (e.g. 今天的日落)" 
                value={newEntry.title}
                onChange={e => setNewEntry({...newEntry, title: e.target.value})}
                className="w-full p-3 rounded-xl border bg-transparent text-lg font-bold"
              />
              
              <div className="flex gap-2">
                <select value={newEntry.mood} onChange={e => setNewEntry({...newEntry, mood: e.target.value})} className="flex-1 p-2 rounded-lg border bg-transparent text-sm">
                  <option value="calm">Calm 🍃</option>
                  <option value="happy">Happy 😊</option>
                  <option value="sad">Sad 😔</option>
                  <option value="excited">Excited ❤️</option>
                </select>
                <select value={newEntry.weather} onChange={e => setNewEntry({...newEntry, weather: e.target.value})} className="flex-1 p-2 rounded-lg border bg-transparent text-sm">
                  <option value="sunny">Sunny ☀️</option>
                  <option value="cloudy">Cloudy ☁️</option>
                  <option value="rain">Rain 🌧️</option>
                </select>
              </div>

              <textarea 
                placeholder="写下此刻的想法..." 
                value={newEntry.content}
                onChange={e => setNewEntry({...newEntry, content: e.target.value})}
                className="w-full p-3 rounded-xl border bg-transparent min-h-[150px]"
              />

              <input 
                type="text" 
                placeholder="Location (optional)" 
                value={newEntry.location}
                onChange={e => setNewEntry({...newEntry, location: e.target.value})}
                className="w-full p-2 rounded-lg border bg-transparent text-sm"
              />

              {/* 图片上传区域 */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-rose-500"><Loader2 className="animate-spin h-5 w-5"/> Uploading...</div>
                ) : uploadUrl ? (
                  <img src={uploadUrl} alt="Preview" className="h-32 mx-auto rounded-lg object-cover" />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center gap-1">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-xs">点击上传图片</span>
                  </div>
                )}
              </div>

              <button 
                onClick={handleSubmitEntry}
                disabled={loading || uploading}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-rose-200"
              >
                {loading ? 'Saving...' : 'Record Memory'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主体内容 */}
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        {loading && entries.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-60">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mb-4"></div>
             <p>正在从云端加载记忆...</p>
           </div>
        ) : (
           view === 'home' ? (
            <div className="animate-fade-in-up">
              {/* Header */}
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
  
              {/* Timeline */}
              <div className="relative pl-8 md:pl-0">
                <div className={`hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
  
                {entries.map((entry, index) => (
                  <div key={entry.id || index} className={`group relative mb-16 md:flex items-center justify-between ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                    {/* Dots & Lines */}
                    <div className={`hidden md:flex absolute left-1/2 top-8 -translate-x-1/2 w-4 h-4 rounded-full border-4 z-10 transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-rose-900 group-hover:border-rose-500' : 'bg-[#f8f5f2] border-rose-200 group-hover:border-rose-400'}`}></div>
                    <div className={`md:hidden absolute left-0 top-8 w-3 h-3 rounded-full border-2 -translate-x-1.5 ${darkMode ? 'bg-slate-900 border-rose-500' : 'bg-[#f8f5f2] border-rose-400'}`}></div>
                    <div className={`md:hidden absolute left-0 top-11 bottom-[-64px] w-px -translate-x-px ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
  
                    {/* Date Block (使用 created_at 转换后的日期) */}
                    <div className={`hidden md:block w-[45%] text-center ${index % 2 === 0 ? 'text-left pl-8' : 'text-right pr-8'}`}>
                      <div className={`text-5xl font-bold opacity-10 font-sans tracking-tighter ${darkMode ? 'text-white' : 'text-black'}`}>{entry.year}</div>
                      <div className={`text-sm font-medium uppercase tracking-widest ${darkMode ? 'text-rose-400' : 'text-rose-500'}`}>
                        {entry.month} / {entry.day} <span className="opacity-50 ml-1">{entry.weekday}</span>
                      </div>
                    </div>
  
                    {/* Entry Card */}
                    <div onClick={() => { setActiveEntry(entry); setView('entry'); window.scrollTo(0,0); }} className={`w-full md:w-[45%] cursor-pointer transition-transform duration-300 hover:-translate-y-1`}>
                      <article className={`p-6 rounded-2xl shadow-sm border relative overflow-hidden ${darkMode ? 'bg-[#25262b] border-slate-800 hover:border-slate-700' : 'bg-white border-white hover:shadow-md'}`}>
                        {/* Mobile Date */}
                        <div className="md:hidden flex items-baseline gap-2 mb-3 text-rose-500">
                          <span className="text-xl font-bold">{entry.day}</span>
                          <span className="text-xs uppercase">{entry.month}. {entry.year}</span>
                        </div>
                        {/* Images */}
                        {entry.images && entry.images.length > 0 && (
                          <div className="h-40 w-full mb-4 rounded-lg overflow-hidden">
                             <img src={entry.images[0]} className="w-full h-full object-cover" alt="Memory" />
                          </div>
                        )}
                        {/* Meta */}
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
            </div>
          ) : (
            /* Detail View */
            <div className="animate-fade-in max-w-2xl mx-auto">
               <button onClick={() => setView('home')} className={`group mb-8 flex items-center gap-2 text-sm font-medium transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-black'}`}>
                  <ArrowLeft className="h-4 w-4" /> 返回时间线
                </button>
                <article>
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
                  <div className={`prose prose-lg max-w-none prose-p:leading-loose ${darkMode ? 'prose-invert prose-p:text-slate-300' : 'prose-p:text-slate-700'}`}>
                     {activeEntry.images && activeEntry.images.map((img, idx) => (
                        <div key={idx} className="not-prose mb-10">
                          <img src={img} alt="Memory" className="w-full rounded-xl shadow-lg" />
                        </div>
                     ))}
                     <div dangerouslySetInnerHTML={{ __html: activeEntry.content }} />
                  </div>
                  <div className="mt-16 text-center opacity-30">
                     <div className="inline-block w-12 h-1 bg-current rounded-full mb-2"></div>
                     <div className="text-xs font-serif italic">End of Entry</div>
                  </div>
                </article>
            </div>
          )
        )}
      </main>

      <footer className={`py-6 text-center text-xs tracking-wider opacity-40 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        <p>WRITTEN WITH ♥ IN 2025</p>
        <p>Begin 2025年9月22日</p>
      </footer>
    </div>
  );
}