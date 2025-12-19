import React, { useState, useEffect } from 'react';
// 🟢 部署时请取消下面这行的注释
import { createClient } from '@supabase/supabase-js'; 

import { 
  Book, Moon, Sun, Search, Calendar, User, Menu, X, ArrowLeft,
  Cloud, CloudRain, Smile, Meh, Frown, Heart, Coffee, MapPin,
  Flame, Ghost, Star, Snowflake, Wind, CloudLightning, CloudFog, Leaf,
  LogIn, LogOut, Plus, Image as ImageIcon, Loader2, Pin
} from 'lucide-react';

// ==========================================
// 👇 数据库配置
// ==========================================


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;



// --------------------------------------------------

const PROFILE = {
  name: "记录",
  avatar: "p2494705863.jpg", 
  bio: "欢迎你来，它在这里已经等你很久"
};

const LOGO_CONFIG = { left: "record", right: "this" };

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
  
  // 🔐 登录与交互状态
  const [session, setSession] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  
  // 修改：这里使用 username 而不是 email
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // 📝 写作表单状态
  const [newEntry, setNewEntry] = useState({ title: '', content: '', mood: 'calm', weather: 'sunny', location: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');

  // 初始化
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    fetchEntries();
    return () => subscription.unsubscribe();
  }, []);

  async function fetchEntries() {
    setLoading(true);
    try {
      // 📌 核心修改：先按 is_top 降序(true在前)，再按时间降序
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('is_top', { ascending: false }) 
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(item => {
        const dateObj = new Date(item.created_at);
        return {
          ...item,
          year: dateObj.getFullYear(),
          month: String(dateObj.getMonth() + 1).padStart(2, '0'),
          day: String(dateObj.getDate()).padStart(2, '0'),
          weekday: dateObj.toLocaleDateString('zh-CN', { weekday: 'short' }),
          time: dateObj.toLocaleTimeString('zh-CN', { hour12: false }), 
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

  // 🔐 登录处理 (支持纯用户名)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // 技巧：自动补全后缀，这样你在前台只用输 "ziao"
    const email = `${username}@admin.com`; 

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("登录失败：" + error.message);
    else { setShowLoginModal(false); setUsername(''); setPassword(''); }
    setLoading(false);
  };

  // 🚪 强力登出处理
  const handleLogout = async () => {
    // 1. 尝试告诉服务器我们要退出了
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error("服务器登出失败（可能是Token已失效），正在强制本地清除...", error);
    }

    // 2. 【关键】无论服务器是否成功，都强制清空本地状态
    setSession(null);
    
    // 3. 强制清理浏览器的“烂摊子” (清除 Supabase 存的 Token)
    localStorage.clear(); // 简单粗暴清空，或者你可以只清空 supabase 相关的 key
    
    // 4. 刷新页面，确保万无一失
    window.location.reload();
  };

  // 📌 切换置顶状态
  const togglePin = async (e, entry) => {
    e.stopPropagation(); // 防止触发点击进入详情
    if (!session) return;

    const newStatus = !entry.is_top;
    
    // 更新本地状态（为了UI即时反馈）
    setEntries(entries.map(item => 
        item.id === entry.id ? { ...item, is_top: newStatus } : item
    ));

    // 更新数据库
    const { error } = await supabase
        .from('entries')
        .update({ is_top: newStatus })
        .eq('id', entry.id);

    if (error) {
        alert("操作失败");
        fetchEntries(); // 如果失败，回滚数据
    } else {
        fetchEntries(); // 如果成功，重新排序
    }
  };

  // 图片上传 (保持不变)
  const handleImageUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage.from('diary_images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('diary_images').getPublicUrl(filePath);
      setUploadUrl(data.publicUrl);
    } catch (error) { alert('上传失败: ' + error.message); } finally { setUploading(false); }
  };

  // 提交日记
  const handleSubmitEntry = async () => {
    if (!newEntry.title || !newEntry.content) return alert("请至少填写标题和内容");
    setLoading(true);
    try {
      const images = uploadUrl ? [uploadUrl] : [];
      const { error } = await supabase.from('entries').insert([{
        title: newEntry.title,
        content: `<p>${newEntry.content.replace(/\n/g, '<br/>')}</p>`,
        mood: newEntry.mood,
        weather: newEntry.weather,
        location: newEntry.location || '未知地点',
        images: images,
      }]);
      if (error) throw error;
      setShowWriteModal(false);
      setNewEntry({ title: '', content: '', mood: 'calm', weather: 'sunny', location: '' });
      setUploadUrl('');
      fetchEntries();
    } catch (error) { alert('发布失败: ' + error.message); } finally { setLoading(false); }
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

      {/* 🔐 登录弹窗 (纯用户名版) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm p-8 rounded-2xl shadow-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-6 text-center">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs opacity-50 ml-1">USERNAME</label>
                <input 
                    type="text" 
                    placeholder="输入用户名" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    className="w-full p-3 rounded-lg border bg-transparent" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs opacity-50 ml-1">PASSWORD</label>
                <input 
                    type="password" 
                    placeholder="输入密码" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full p-3 rounded-lg border bg-transparent" 
                />
              </div>
              <div className="flex gap-2 pt-4">
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
              <input type="text" placeholder="Title" value={newEntry.title} onChange={e => setNewEntry({...newEntry, title: e.target.value})} className="w-full p-3 rounded-xl border bg-transparent text-lg font-bold" />
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
              <textarea placeholder="写下此刻的想法..." value={newEntry.content} onChange={e => setNewEntry({...newEntry, content: e.target.value})} className="w-full p-3 rounded-xl border bg-transparent min-h-[150px]" />
              <input type="text" placeholder="Location (optional)" value={newEntry.location} onChange={e => setNewEntry({...newEntry, location: e.target.value})} className="w-full p-2 rounded-lg border bg-transparent text-sm" />
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center relative">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploading} />
                {uploading ? <div className="flex items-center justify-center gap-2 text-rose-500"><Loader2 className="animate-spin h-5 w-5"/> Uploading...</div> : uploadUrl ? <img src={uploadUrl} alt="Preview" className="h-32 mx-auto rounded-lg object-cover" /> : <div className="text-gray-400 flex flex-col items-center gap-1"><ImageIcon className="h-6 w-6" /><span className="text-xs">点击上传图片</span></div>}
              </div>
              <button onClick={handleSubmitEntry} disabled={loading || uploading} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-rose-200">{loading ? 'Saving...' : 'Record Memory'}</button>
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
              <header className="mb-16 text-center">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-6 border-4 border-white shadow-xl">
                   <img src={PROFILE.avatar} onError={(e) => e.target.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"} alt="Me" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-2xl font-bold mb-2">{PROFILE.name}</h1>
                <p className={`text-sm italic ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{PROFILE.bio}</p>
              </header>
  
              <div className="relative pl-8 md:pl-0">
                <div className={`hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                {entries.map((entry, index) => (
                  <div key={entry.id || index} className={`group relative mb-16 md:flex items-center justify-between ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                    <div className={`hidden md:flex absolute left-1/2 top-8 -translate-x-1/2 w-4 h-4 rounded-full border-4 z-10 transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-rose-900 group-hover:border-rose-500' : 'bg-[#f8f5f2] border-rose-200 group-hover:border-rose-400'}`}></div>
                    <div className={`md:hidden absolute left-0 top-8 w-3 h-3 rounded-full border-2 -translate-x-1.5 ${darkMode ? 'bg-slate-900 border-rose-500' : 'bg-[#f8f5f2] border-rose-400'}`}></div>
                    <div className={`md:hidden absolute left-0 top-11 bottom-[-64px] w-px -translate-x-px ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                    
                    {/* 日期块 */}
                    <div className={`hidden md:block w-[45%] text-center ${index % 2 === 0 ? 'text-left pl-8' : 'text-right pr-8'}`}>
                      <div className={`text-5xl font-bold opacity-10 font-sans tracking-tighter ${darkMode ? 'text-white' : 'text-black'}`}>{entry.year}</div>
                      <div className={`text-sm font-medium uppercase tracking-widest ${darkMode ? 'text-rose-400' : 'text-rose-500'}`}>
                        {entry.month} / {entry.day} <span className="opacity-50 ml-1">{entry.weekday}</span>
                      </div>
                      <div className={`text-xs font-mono mt-1 opacity-60 ${darkMode ? 'text-rose-300' : 'text-rose-400'}`}>{entry.time}</div>
                    </div>
  
                    {/* 内容卡片 */}
                    <div onClick={() => { setActiveEntry(entry); setView('entry'); window.scrollTo(0,0); }} className={`w-full md:w-[45%] cursor-pointer transition-transform duration-300 hover:-translate-y-1`}>
                      <article className={`p-6 rounded-2xl shadow-sm border relative overflow-hidden ${darkMode ? 'bg-[#25262b] border-slate-800 hover:border-slate-700' : 'bg-white border-white hover:shadow-md'} ${entry.is_top ? 'ring-2 ring-rose-400/50' : ''}`}>
                        
                        {/* 📌 置顶图标 (只在置顶时或登录后显示) */}
                        { (entry.is_top || session) && (
                            <div 
                                onClick={(e) => togglePin(e, entry)}
                                className={`absolute top-4 right-4 z-20 p-2 rounded-full transition-all ${entry.is_top ? 'bg-rose-500 text-white' : 'bg-transparent text-gray-300 hover:bg-gray-100'}`}
                                title={entry.is_top ? "取消置顶" : "置顶"}
                            >
                                <Pin className={`h-4 w-4 ${entry.is_top ? 'fill-current' : ''}`} />
                            </div>
                        )}

                        <div className="md:hidden mb-3 text-rose-500">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold">{entry.day}</span>
                            <span className="text-xs uppercase">{entry.month}. {entry.year}</span>
                          </div>
                          <div className="text-xs opacity-60 font-mono">{entry.time} {entry.weekday}</div>
                        </div>
                        {entry.images && entry.images.length > 0 && <div className="h-40 w-full mb-4 rounded-lg overflow-hidden"><img src={entry.images[0]} className="w-full h-full object-cover" alt="Memory" /></div>}
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
                           <span className="text-[10px] opacity-60 font-mono">{activeEntry.time}</span>
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