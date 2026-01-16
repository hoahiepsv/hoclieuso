
import React, { useState, useEffect } from 'react';
import { fetchAllData, saveData } from '../services/api';
import { GAS_URLS } from '../constants';
import MathText from './MathText';

const AdminDashboard: React.FC = () => {
  const [activeDs, setActiveDs] = useState<keyof typeof GAS_URLS>('TEACHERS');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeDs]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchAllData(GAS_URLS[activeDs]);
      setData(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleEdit = (item: any) => {
    setEditingItem({ ...item });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const res = await saveData(GAS_URLS[activeDs], editingItem);
      if (res.status === 'success') {
        alert("Cập nhật thành công!");
        setEditingItem(null);
        loadData();
      } else {
        alert("Lỗi: " + (res.message || "Không thể cập nhật"));
      }
    } catch (e) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsSaving(false);
    }
  };

  const renderCellValue = (val: any) => {
    const strVal = String(val || '');
    if (strVal.includes('$')) {
      return <MathText content={strVal} className="text-[11px]" />;
    }
    return strVal;
  };

  // Helper to render input fields based on the selected tab
  const renderEditFields = () => {
    if (!editingItem) return null;

    const fieldsByTab: Record<string, { label: string, key: string }[]> = {
      TEACHERS: [
        { label: 'Tài khoản', key: 'TÀI KHOẢN' },
        { label: 'Mật khẩu', key: 'MẬT KHẨU' },
        { label: 'Họ tên giáo viên', key: 'HỌ TÊN GIÁO VIÊN' },
        { label: 'Email', key: 'EMAIL' },
        { label: 'Số điện thoại', key: 'SỐ ĐIỆN THOẠI' },
      ],
      STUDENTS: [
        { label: 'Tên đăng nhập', key: 'TÊN ĐĂNG NHẬP' },
        { label: 'Mật khẩu', key: 'MẬT KHẨU' },
        { label: 'Họ tên học sinh', key: 'HỌ TÊN HỌC SINH' },
        { label: 'Trường', key: 'TRƯỜNG' },
        { label: 'Lớp', key: 'LỚP' },
        { label: 'Email', key: 'EMAIL' },
        { label: 'Số điện thoại', key: 'SỐ ĐIỆN THOẠI' },
      ],
      LESSONS: [
        { label: 'Mã bài học', key: 'MÃ BÀI HỌC' },
        { label: 'Tên bài học', key: 'TÊN BÀI HỌC' },
        { label: 'Giáo viên tạo', key: 'GIÁO VIÊN TẠO' },
        { label: 'Link bài học', key: 'LINK BÀI HỌC' },
        { label: 'Định dạng', key: 'ĐỊNH DẠNG' },
      ],
      RESULTS: [
        { label: 'Tài khoản', key: 'TÀI KHOẢN' },
        { label: 'Họ tên học sinh', key: 'HỌ TÊN HỌC SINH' },
        { label: 'Tên bài học', key: 'TÊN BÀI HỌC' },
        { label: 'Tổng điểm', key: 'TỔNG ĐIỂM' },
      ]
    };

    const fields = fieldsByTab[activeDs] || [];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(field => (
          <div key={field.key} className={field.label === 'Tên bài học' || field.label === 'Link bài học' ? 'md:col-span-2' : ''}>
            <label className="block text-[10px] font-black text-blue-900/40 uppercase mb-2 tracking-widest ml-2">{field.label}</label>
            <input 
               type="text" 
               value={editingItem[field.key] || ''} 
               onChange={e => setEditingItem({...editingItem, [field.key]: e.target.value})}
               className="w-full bg-blue-50/50 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 outline-none font-bold text-blue-900 text-sm"
               placeholder={`Nhập ${field.label.toLowerCase()}`}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white p-8 rounded-[48px] shadow-2xl border border-blue-100 h-[calc(100vh-200px)] flex flex-col overflow-hidden relative">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tighter flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065z" /></svg>
          </div>
          QUẢN TRỊ HỆ THỐNG
        </h2>
        <button onClick={loadData} className="bg-blue-50 text-blue-600 p-3 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
          <svg className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      <div className="flex gap-2 border-b border-blue-50 mb-6 overflow-x-auto scrollbar-hide shrink-0">
        {(Object.keys(GAS_URLS) as Array<keyof typeof GAS_URLS>).map(key => (
          <button 
            key={key}
            onClick={() => setActiveDs(key)}
            className={`px-8 py-4 font-black text-[10px] rounded-t-3xl transition-all uppercase tracking-widest whitespace-nowrap ${activeDs === key ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-blue-600'}`}
          >
            {key === 'TEACHERS' ? 'GIÁO VIÊN' : key === 'STUDENTS' ? 'HỌC SINH' : key === 'LESSONS' ? 'BÀI HỌC' : 'KẾT QUẢ'}
          </button>
        ))}
      </div>

      <div className="flex-grow overflow-hidden bg-gray-50/30 rounded-[32px] border border-blue-50 shadow-inner">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-blue-900/10 gap-4">
             <div className="w-12 h-12 border-4 border-blue-900/5 border-t-blue-600 rounded-full animate-spin"></div>
             <p className="font-black text-xs uppercase tracking-[0.5em]">Đang tải dữ liệu</p>
          </div>
        ) : (
          <div className="h-full overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-white/90 backdrop-blur z-20">
                <tr className="border-b border-blue-100">
                  {data.length > 0 && Object.keys(data[0]).map(header => (
                    <th key={header} className="px-6 py-5 text-[10px] font-black text-blue-400 uppercase tracking-widest">{header}</th>
                  ))}
                  <th className="px-6 py-5 text-[10px] font-black text-blue-400 uppercase tracking-widest text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50 transition-all text-[11px] font-medium group">
                    {Object.values(row).map((val: any, i) => (
                      <td key={i} className="px-6 py-4 text-blue-900 max-w-[200px] truncate group-hover:max-w-none group-hover:whitespace-normal transition-all">
                        {renderCellValue(val)}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-3">
                         <button onClick={() => handleEdit(row)} className="text-blue-600 font-black hover:underline uppercase">Sửa</button>
                         <button className="text-red-600 font-black hover:underline uppercase">Xoá</button>
                       </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && <tr><td colSpan={15} className="py-32 text-center text-blue-900/10 font-black text-5xl uppercase italic">Trống</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dynamic Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[250] bg-blue-900/40 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] shadow-2xl p-10 max-w-2xl w-full border border-blue-100 animate-in overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-xl font-black text-blue-900 uppercase tracking-tighter">SỬA THÔNG TIN {activeDs === 'TEACHERS' ? 'GIÁO VIÊN' : activeDs === 'STUDENTS' ? 'HỌC SINH' : activeDs === 'LESSONS' ? 'BÀI HỌC' : 'KẾT QUẢ'}</h3>
                    <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mt-1">Cập nhật dữ liệu hệ thống</p>
                 </div>
                 <button onClick={() => setEditingItem(null)} className="text-gray-300 hover:text-red-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="space-y-6">
                 {renderEditFields()}
              </div>

              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="w-full mt-8 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3"
              >
                 {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                 ) : "Lưu thay đổi"}
              </button>
           </div>
        </div>
      )}

      <div className="mt-6 text-[10px] font-bold text-gray-300 uppercase tracking-[0.5em] text-center shrink-0">
         Data Management System v2.1
      </div>
    </div>
  );
};

export default AdminDashboard;
