
import React, { useState } from 'react';
import { UserRole } from '../types';
import { fetchAllData, saveData } from '../services/api';
import { GAS_URLS } from '../constants';

interface LoginProps {
  onLogin: (user: any, role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [tab, setTab] = useState<'TEACHER' | 'STUDENT' | 'REGISTER'>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [regData, setRegData] = useState({
    username: '', password: '', fullName: '', school: '', grade: '', email: '', phone: ''
  });

  const getValueByFlexibleKey = (obj: any, searchKeys: string[]) => {
    const objKeys = Object.keys(obj);
    for (const sKey of searchKeys) {
      if (obj[sKey] !== undefined) return obj[sKey];
      const foundKey = objKeys.find(k => {
        const normalizedK = k.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
        const normalizedS = sKey.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
        return normalizedK.includes(normalizedS) || normalizedS.includes(normalizedK);
      });
      if (foundKey) return obj[foundKey];
    }
    return undefined;
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const teachers = await fetchAllData(GAS_URLS.TEACHERS);
      const found = teachers.find((t: any) => {
        const u = getValueByFlexibleKey(t, ['username', 'taikhoan', 'user', 'TÀI KHOẢN']);
        const p = getValueByFlexibleKey(t, ['password', 'matkhau', 'pass', 'MẬT KHẨU']);
        return String(u || '').trim() === username.trim() && String(p || '').trim() === password.trim();
      });

      if (found) {
        onLogin(found, UserRole.TEACHER);
      } else {
        setError("Sai thông tin đăng nhập, vui lòng liên hệ quản trị viên!");
      }
    } catch (err: any) {
      setError("Lỗi kết nối máy chủ. Vui lòng kiểm tra lại URL Apps Script.");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const students = await fetchAllData(GAS_URLS.STUDENTS);
      const found = students.find((s: any) => {
        const u = getValueByFlexibleKey(s, ['username', 'tendangnhap', 'taikhoan', 'user', 'TÊN ĐĂNG NHẬP']);
        const p = getValueByFlexibleKey(s, ['password', 'matkhau', 'pass', 'MẬT KHẨU']);
        return String(u || '').trim() === username.trim() && String(p || '').trim() === password.trim();
      });

      if (found) {
        onLogin(found, UserRole.STUDENT);
      } else {
        setError("Sai thông tin đăng nhập, vui lòng liên hệ giáo viên của bạn!");
      }
    } catch (err: any) {
      setError("Lỗi kết nối hệ thống học sinh.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { 
        ...regData, 
        registrationDate: new Date().toLocaleString('vi-VN'),
        action: 'write'
      };
      const res = await saveData(GAS_URLS.STUDENTS, payload);
      if (res.status === 'success') {
        alert("Tuyệt vời! Bạn đã đăng ký thành công. Hãy đăng nhập để bắt đầu học tập.");
        setTab('STUDENT');
      } else {
        setError(res.message || "Đăng ký không thành công. Hãy thử lại sau.");
      }
    } catch (err) {
      setError("Không thể gửi yêu cầu đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-2xl rounded-[48px] overflow-hidden mt-10 border border-blue-50 relative">
      <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800"></div>
      
      <div className="flex bg-blue-50/50 p-1.5 m-6 rounded-3xl border border-blue-100 shadow-inner">
        <button className={`flex-1 py-4 text-xs font-black rounded-2xl transition-all uppercase tracking-widest ${tab === 'STUDENT' ? 'bg-white text-blue-600 shadow-md translate-y-[-1px]' : 'text-blue-300 hover:text-blue-400'}`} onClick={() => setTab('STUDENT')}>HỌC SINH</button>
        <button className={`flex-1 py-4 text-xs font-black rounded-2xl transition-all uppercase tracking-widest ${tab === 'TEACHER' ? 'bg-white text-blue-600 shadow-md translate-y-[-1px]' : 'text-blue-300 hover:text-blue-400'}`} onClick={() => setTab('TEACHER')}>GIÁO VIÊN</button>
        <button className={`flex-1 py-4 text-xs font-black rounded-2xl transition-all uppercase tracking-widest ${tab === 'REGISTER' ? 'bg-white text-blue-600 shadow-md translate-y-[-1px]' : 'text-blue-300 hover:text-blue-400'}`} onClick={() => setTab('REGISTER')}>ĐĂNG KÝ</button>
      </div>

      <div className="p-10 pt-4">
        <div className="text-center mb-10">
           <h3 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">
             {tab === 'REGISTER' ? 'Tạo tài khoản học sinh' : 'Đăng nhập hệ thống'}
           </h3>
           <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.3em] mt-2">Vui lòng cung cấp thông tin chính xác</p>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 text-red-600 text-[11px] rounded-2xl border border-red-100 font-black animate-bounce flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {tab !== 'REGISTER' ? (
          <form onSubmit={tab === 'TEACHER' ? handleTeacherLogin : handleStudentLogin} className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-blue-900/40 uppercase mb-2 ml-2 tracking-widest">Tên đăng nhập</label>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full border-2 border-blue-50 bg-blue-50/30 rounded-2xl p-5 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-blue-900 placeholder:text-blue-200" placeholder="Nhập ID cá nhân" />
            </div>
            <div>
              <label className="block text-[11px] font-black text-blue-900/40 uppercase mb-2 ml-2 tracking-widest">Mật mã bảo mật</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border-2 border-blue-50 bg-blue-50/30 rounded-2xl p-5 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-blue-900 placeholder:text-blue-200" placeholder="••••••••" />
            </div>
            <button disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-5 rounded-[24px] font-black text-sm hover:scale-[1.02] active:scale-95 transition transform shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 uppercase tracking-[0.2em]">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>ĐANG XÁC THỰC...</span>
                </>
              ) : "ĐĂNG NHẬP NGAY"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
             <div className="grid grid-cols-1 gap-4">
                <input required placeholder="Họ và tên đầy đủ" className="w-full border-2 border-blue-50 bg-blue-50/30 rounded-2xl p-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-500" onChange={e => setRegData({...regData, fullName: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                   <input required placeholder="Tên Trường" className="border-2 border-blue-50 bg-blue-50/30 rounded-2xl p-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-500" onChange={e => setRegData({...regData, school: e.target.value})} />
                   <input required placeholder="Lớp học" className="border-2 border-blue-50 bg-blue-50/30 rounded-2xl p-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-500" onChange={e => setRegData({...regData, grade: e.target.value})} />
                </div>
                <input type="email" required placeholder="Địa chỉ Email" className="w-full border-2 border-blue-50 bg-blue-50/30 rounded-2xl p-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-500" onChange={e => setRegData({...regData, email: e.target.value})} />
                <input required placeholder="Số điện thoại" className="w-full border-2 border-blue-50 bg-blue-50/30 rounded-2xl p-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-500" onChange={e => setRegData({...regData, phone: e.target.value})} />
                
                <div className="pt-4 border-t-2 border-blue-50 border-dashed mt-2 space-y-4">
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">Tạo thông tin đăng nhập mới</p>
                   <input required placeholder="ID Đăng nhập mới" className="w-full border-2 border-blue-50 bg-blue-50/30 rounded-2xl p-4 text-sm font-black text-blue-600 outline-none focus:border-blue-500" onChange={e => setRegData({...regData, username: e.target.value})} />
                   <input type="password" required placeholder="Mật khẩu bảo vệ" className="w-full border-2 border-blue-50 bg-blue-50/30 rounded-2xl p-4 text-sm font-black text-blue-600 outline-none focus:border-blue-500" onChange={e => setRegData({...regData, password: e.target.value})} />
                </div>
             </div>
             <button disabled={loading} className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-5 rounded-[24px] font-black text-sm hover:scale-[1.02] active:scale-95 transition transform shadow-2xl shadow-green-100 mt-4 uppercase tracking-widest">
               {loading ? "ĐANG TẠO HỒ SƠ..." : "XÁC NHẬN ĐĂNG KÝ"}
             </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
