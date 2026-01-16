
import React, { useState, useEffect } from 'react';
import { UserRole, AppState } from './types';
import { COPYRIGHT, APP_NAME } from './constants';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(() => {
    const savedKey = localStorage.getItem('elearning_api_key');
    return {
      apiKey: savedKey || process.env.API_KEY || '',
      currentUser: null,
      role: UserRole.GUEST,
    };
  });

  const [isEditingKey, setIsEditingKey] = useState(!appState.apiKey);
  const [tempApiKey, setTempApiKey] = useState(appState.apiKey);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ user: '', pass: '' });

  const handleLogout = () => {
    setAppState(prev => ({ ...prev, currentUser: null, role: UserRole.GUEST }));
  };

  const handleLogin = (user: any, role: UserRole) => {
    setAppState(prev => ({ ...prev, currentUser: user, role }));
    setShowAdminLogin(false);
  };

  const handleSaveApiKey = () => {
    if (isEditingKey) {
      localStorage.setItem('elearning_api_key', tempApiKey);
      setAppState(prev => ({ ...prev, apiKey: tempApiKey }));
      setIsEditingKey(false);
    } else {
      setIsEditingKey(true);
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCreds.user === "lehoahiep" && adminCreds.pass === "Lhh249111") {
      handleLogin({ username: "Admin", fullName: "Hòa Hiệp AI" }, UserRole.ADMIN);
      setAdminCreds({ user: '', pass: '' });
    } else {
      alert("Thông tin quản trị không chính xác!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative pb-24 bg-[#F8FAFC]">
      {/* Background Accent */}
      <div className="fixed top-0 left-0 w-full h-64 bg-blue-600 -z-10 opacity-[0.03]"></div>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-[60] border-b border-blue-100 px-4 md:px-12 py-4 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row justify-between items-center gap-4">
          
          {/* Logo Section */}
          <div className="w-full lg:w-auto flex justify-between items-center">
            <div className="flex items-center gap-3 md:gap-4 group cursor-pointer" onClick={() => handleLogout()}>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100 group-hover:scale-105 transition-transform">
                E
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-black text-blue-900 uppercase tracking-tighter leading-none">{APP_NAME}</h1>
                <p className="text-[7px] md:text-[9px] text-blue-400 font-bold tracking-widest uppercase mt-1">AI-POWERED PLATFORM</p>
              </div>
            </div>

            {/* User info for Mobile */}
            <div className="flex lg:hidden items-center gap-2">
              {appState.currentUser && (
                <button onClick={handleLogout} className="bg-blue-50 text-blue-600 p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* API Key Management Area - Visible on both Mobile & Desktop */}
          <div className="w-full lg:flex-grow lg:max-w-xl flex flex-col sm:flex-row items-center gap-2 bg-blue-50/30 p-3 lg:p-0 rounded-2xl lg:bg-transparent">
            <div className="relative flex-grow w-full">
              <input
                type={isEditingKey ? "text" : "password"}
                value={tempApiKey}
                disabled={!isEditingKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className={`w-full text-[11px] font-bold py-3 px-4 rounded-xl border-2 transition-all outline-none ${
                  isEditingKey 
                    ? "border-blue-400 bg-white text-blue-900 shadow-md" 
                    : "border-transparent bg-white/50 text-blue-300"
                }`}
                placeholder="Nhập API Key để kích hoạt AI..."
              />
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <button 
                onClick={handleSaveApiKey}
                className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  isEditingKey 
                    ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700" 
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                }`}
              >
                {isEditingKey ? "LƯU" : "CHỈNH SỬA"}
              </button>
              <button 
                onClick={() => setShowGuide(true)}
                className="flex-1 sm:flex-none px-3 py-3 bg-white border-2 border-blue-100 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm"
              >
                HƯỚNG DẪN
              </button>
            </div>
          </div>

          {/* Desktop User Info */}
          <div className="hidden lg:flex items-center gap-4">
            {appState.currentUser && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[8px] text-blue-400 font-black uppercase tracking-widest mb-0.5">{appState.role}</p>
                  <p className="text-sm font-bold text-blue-900">
                    {appState.currentUser.fullName || appState.currentUser['HỌ TÊN HỌC SINH'] || appState.currentUser['HỌ TÊN GIÁO VIÊN'] || "Người dùng"}
                  </p>
                </div>
                <button onClick={handleLogout} className="bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 container mx-auto max-w-full relative z-10">
        {!appState.currentUser ? (
          <Login onLogin={handleLogin} />
        ) : (
          <div className="animate-in">
            {appState.role === UserRole.TEACHER && <TeacherDashboard teacher={appState.currentUser} apiKey={appState.apiKey} />}
            {appState.role === UserRole.STUDENT && <StudentDashboard student={appState.currentUser} apiKey={appState.apiKey} />}
            {appState.role === UserRole.ADMIN && <AdminDashboard />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/95 backdrop-blur-md border-t border-blue-50 py-4 px-10 fixed bottom-0 w-full z-[100] flex flex-wrap items-center justify-between gap-4">
         <div className="flex items-center gap-3">
           <span className="text-[9px] font-black text-blue-900 uppercase tracking-widest">{APP_NAME} EDU SYSTEM</span>
         </div>
         <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-5 py-2 rounded-full border border-blue-100">
            {COPYRIGHT}
         </div>
      </footer>

      {/* Gemini API Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-md animate-in">
          <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl p-6 md:p-10 max-w-2xl w-full border border-blue-100 relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setShowGuide(false)} className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-300 hover:text-red-500 transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="mb-6 md:mb-8 pr-8">
               <h3 className="text-xl md:text-2xl font-black text-blue-900 uppercase tracking-tighter">HƯỚNG DẪN TẠO MÃ GEMINI API</h3>
               <p className="text-[9px] md:text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-2">Kích hoạt bộ não AI cho hệ thống</p>
            </div>
            
            <div className="space-y-3 md:space-y-4 text-[13px] md:text-sm font-medium text-slate-700">
               <div className="flex gap-3 md:gap-4 items-start p-3 md:p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black shrink-0 text-xs">B1</span>
                  <p className="pt-1">Truy cập link: <a href="https://aistudio.google.com/app/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-black underline break-all">https://aistudio.google.com/app/api-keys</a></p>
               </div>
               <div className="flex gap-3 md:gap-4 items-start p-3 md:p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black shrink-0 text-xs">B2</span>
                  <p className="pt-1">Bấm <strong>Create APIKey</strong> (phía trên bên phải)</p>
               </div>
               <div className="flex gap-3 md:gap-4 items-start p-3 md:p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black shrink-0 text-xs">B3</span>
                  <p className="pt-1">Tại ô <strong>Name your key</strong>: &lt;nhập tuỳ ý&gt;. Vd: <code className="bg-blue-100 px-2 py-0.5 rounded">Key1</code></p>
               </div>
               <div className="flex gap-3 md:gap-4 items-start p-3 md:p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black shrink-0 text-xs">B4</span>
                  <p className="pt-1">Tại ô <strong>Choose an imported project</strong>: chọn <strong>Default Gemini Project</strong></p>
               </div>
               <div className="flex gap-3 md:gap-4 items-start p-3 md:p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black shrink-0 text-xs">B5</span>
                  <p className="pt-1">Bấm <strong>Create key</strong></p>
               </div>
               <div className="flex gap-3 md:gap-4 items-start p-3 md:p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black shrink-0 text-xs">B6</span>
                  <div>
                    <p className="pt-1">Copy mã API Key (có dạng ngẫu nhiên).</p>
                    <p className="text-[10px] text-slate-400 mt-1 italic break-all">Vd: AIHjdJKKyAafadasdSpBxm_Z1wjZ9qm_uafdfsfsdiOxDkk</p>
                  </div>
               </div>
               <div className="flex gap-3 md:gap-4 items-start p-3 md:p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black shrink-0 text-xs">B7</span>
                  <p className="pt-1">Mở phần mềm ra, bấm <strong>CHỈNH SỬA</strong> và dán mã API này vào ô nhập liệu.</p>
               </div>
               <div className="flex gap-3 md:gap-4 items-start p-3 md:p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black shrink-0 text-xs">B8</span>
                  <p className="pt-1">Bấm <strong>Lưu</strong>.</p>
               </div>
            </div>

            <button 
              onClick={() => setShowGuide(false)}
              className="w-full mt-6 md:mt-8 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl transition-all text-xs"
            >
              ĐÃ HIỂU
            </button>
          </div>
        </div>
      )}

      {/* Admin Button */}
      <button 
        onClick={() => setShowAdminLogin(true)}
        className="fixed bottom-24 right-6 opacity-0 hover:opacity-100 transition-all bg-blue-900 text-white px-3 py-1.5 rounded-lg text-[8px] font-black z-[100] uppercase tracking-widest"
      >
        ADMIN
      </button>

      {/* Admin Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-md animate-in">
          <div className="bg-white rounded-[40px] shadow-2xl p-10 max-sm w-full border border-blue-100 relative overflow-hidden">
            <button onClick={() => setShowAdminLogin(false)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="text-center mb-8">
               <h3 className="text-xl font-black text-blue-900 uppercase tracking-tighter">QUẢN TRỊ VIÊN</h3>
               <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mt-2">Bảo mật hệ thống</p>
            </div>
            <form onSubmit={handleAdminAuth} className="space-y-4">
               <input type="text" placeholder="Tên đăng nhập" required className="w-full bg-blue-50 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 outline-none transition-all font-bold text-blue-900 text-sm" value={adminCreds.user} onChange={e => setAdminCreds({...adminCreds, user: e.target.value})} />
               <input type="password" placeholder="Mật khẩu" required className="w-full bg-blue-50 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 outline-none transition-all font-bold text-blue-900 text-sm" value={adminCreds.pass} onChange={e => setAdminCreds({...adminCreds, pass: e.target.value})} />
               <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all text-sm mt-2">XÁC THỰC</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
