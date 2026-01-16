
import React, { useState, useEffect, useMemo } from 'react';
import { Teacher, Lesson, VisualAid } from '../types';
import { fetchAllData, saveData } from '../services/api';
import { GAS_URLS, Icons } from '../constants';
import { GeminiService } from '../services/geminiService';
import MathText from './MathText';
import VisualAidRenderer from './VisualAidRenderer';
import ImageCropper from './ImageCropper';

interface Props {
  teacher: Teacher;
  apiKey: string;
}

const TeacherDashboard: React.FC<Props> = ({ teacher, apiKey }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [view, setView] = useState<'LIST' | 'CREATE' | 'RESULTS'>('LIST');
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [previewingLesson, setPreviewingLesson] = useState<Lesson | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawingIdx, setDrawingIdx] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  
  const [aiTopic, setAiTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Trung bình');
  const [numQuestions, setNumQuestions] = useState(10);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const [croppingIdx, setCroppingIdx] = useState<number | null>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);

  const myUser = teacher.username || (teacher as any).tendangnhap || (teacher as any)['TÀI KHOẢN'];

  useEffect(() => {
    loadLessons();
    loadResults();
  }, []);

  const loadLessons = async () => {
    try {
      const data = await fetchAllData(GAS_URLS.LESSONS);
      const myLessons = data.filter((l: any) => String(l.teacherId || l.giaovien || l['GIÁO VIÊN TẠO']).trim() === String(myUser).trim());
      setLessons(myLessons);
    } catch (e) { console.error(e); }
  };

  const loadResults = async () => {
    try {
      const data = await fetchAllData(GAS_URLS.RESULTS);
      setResults(data);
    } catch (e) { console.error(e); }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopyStatus(code);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleGenerateAISuggestions = async () => {
    if (!aiTopic.trim()) return alert("Vui lòng nhập chủ đề bài tập");
    setIsGenerating(true);
    setSuggestedQuestions([]);
    setSelectedIndices(new Set());
    
    const gemini = new GeminiService(apiKey);
    const suggestions = await gemini.generateExerciseSuggestions(aiTopic, difficulty, numQuestions);
    setSuggestedQuestions(suggestions);
    setIsGenerating(false);
  };

  const addSelectedQuestions = () => {
    const selected = suggestedQuestions.filter((_, i) => selectedIndices.has(i));
    if (selected.length === 0) return alert("Vui lòng chọn ít nhất một câu hỏi");
    
    const currentQuestions = editingLesson?.questions || [];
    const filteredCurrent = currentQuestions.filter(q => q.trim().length > 0);
    
    setEditingLesson(prev => ({
      ...prev,
      questions: [...filteredCurrent, ...selected]
    }));
    
    setSuggestedQuestions([]);
    setAiTopic('');
    alert(`Đã thêm ${selected.length} câu hỏi vào bài học!`);
  };

  const toggleSelection = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIndices(next);
  };

  const handleSaveLesson = async () => {
    if (!editingLesson?.title) return alert("Vui lòng nhập tên bài học");
    const validQuestions = (editingLesson.questions || []).filter(q => q && q.trim().length > 0);
    if (validQuestions.length === 0) return alert("Vui lòng nhập ít nhất một câu hỏi.");

    setLoading(true);
    const lessonToSave = {
      ...editingLesson,
      code: editingLesson.code || generateLessonCode(),
      teacherId: myUser,
      questions: validQuestions,
      visualAids: JSON.stringify(editingLesson.visualAids || {}),
      contentUrl: editingLesson.contentUrl || '',
      contentType: editingLesson.contentType || 'link'
    };

    const res = await saveData(GAS_URLS.LESSONS, lessonToSave);
    if (res.status === 'success') {
      alert("Đã lưu bài học thành công!");
      setEditingLesson(null);
      setView('LIST');
      loadLessons();
    }
    setLoading(false);
  };

  const handleAIDraw = async (idx: number, drawType: '2d' | '3d' | 'chart') => {
    const question = editingLesson?.questions?.[idx];
    if (!question) return;
    
    setDrawingIdx(idx);
    const gemini = new GeminiService(apiKey);
    const imageData = await gemini.generateTechnicalDrawing(question, drawType);
    
    if (imageData) {
      const aids = { ...(editingLesson?.visualAids || {}) };
      aids[idx] = { type: drawType === 'chart' ? 'chart' : (drawType === '3d' ? 'geometry_3d' : 'geometry_2d'), source: imageData, prompt: question };
      setEditingLesson(prev => ({ ...prev, visualAids: aids }));
    }
    setDrawingIdx(null);
  };

  const handleCropRequest = (idx: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCropperImage(reader.result as string);
        setCroppingIdx(idx);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const generateLessonCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 10; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    let finalUrl = url.trim();
    if (finalUrl.includes("youtube.com/watch?v=")) finalUrl = finalUrl.replace("watch?v=", "embed/");
    else if (finalUrl.includes("youtu.be/")) finalUrl = finalUrl.replace("youtu.be/", "youtube.com/embed/");
    if (finalUrl.includes("drive.google.com")) {
      if (finalUrl.includes("/view") || finalUrl.includes("/edit")) finalUrl = finalUrl.split('?')[0].replace(/\/view$/, "/preview").replace(/\/edit$/, "/preview");
      else if (!finalUrl.endsWith("/preview")) {
        const match = finalUrl.match(/\/file\/d\/([^\/]+)/);
        if (match && match[1]) finalUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    return finalUrl;
  };

  const filteredLessons = useMemo(() => {
    return lessons.filter(l => 
      l.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [lessons, searchTerm]);

  const filteredResults = useMemo(() => {
    return results.filter(r => {
        const creator = String(r['GIÁO VIÊN TẠO'] || r['giaovien'] || r.teacherId || '').trim();
        return creator === String(myUser).trim();
    });
  }, [results, myUser]);

  const handleOpenPreview = (l: any) => {
    const visualAids = typeof l.visualAids === 'string' ? JSON.parse(l.visualAids) : (l.visualAids || {});
    setPreviewingLesson({
      ...l,
      visualAids
    });
  };

  return (
    <div className="space-y-8 pb-10">
      {croppingIdx !== null && cropperImage && (
        <ImageCropper 
          imageUrl={cropperImage} 
          onClose={() => { setCroppingIdx(null); setCropperImage(null); }}
          onCrop={(base64) => {
            const aids = { ...(editingLesson?.visualAids || {}) };
            aids[croppingIdx] = { type: 'original_crop', source: base64 };
            setEditingLesson(prev => ({ ...prev, visualAids: aids }));
            setCroppingIdx(null);
          }}
        />
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b-2 border-blue-100 pb-0 overflow-x-auto scrollbar-hide bg-white/50 backdrop-blur rounded-t-[32px] px-6 pt-3">
        <button onClick={() => setView('LIST')} className={`px-10 py-5 rounded-t-2xl font-black text-xs transition-all uppercase tracking-widest ${view === 'LIST' ? 'bg-blue-600 text-white shadow-lg translate-y-0.5' : 'text-blue-400 hover:text-blue-600'}`}>KHO BÀI GIẢNG</button>
        <button onClick={() => { setEditingLesson({ questions: [''], visualAids: {}, contentType: 'link' }); setView('CREATE'); }} className={`px-10 py-5 rounded-t-2xl font-black text-xs transition-all uppercase tracking-widest ${view === 'CREATE' ? 'bg-blue-600 text-white shadow-lg translate-y-0.5' : 'text-blue-400 hover:text-blue-600'}`}>TẠO MỚI</button>
        <button onClick={() => setView('RESULTS')} className={`px-10 py-5 rounded-t-2xl font-black text-xs transition-all uppercase tracking-widest ${view === 'RESULTS' ? 'bg-blue-600 text-white shadow-lg translate-y-0.5' : 'text-blue-400 hover:text-blue-600'}`}>KẾT QUẢ</button>
      </div>

      {view === 'LIST' && (
        <div className="space-y-6">
          <div className="flex bg-white p-4 rounded-3xl border border-blue-100 shadow-sm items-center px-8 gap-4">
             <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm kiếm bài giảng theo tên hoặc mã số..." className="flex-grow bg-transparent outline-none font-bold text-blue-900 text-sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in">
            {filteredLessons.map((l: any) => (
              <div key={l.code} className="bg-white p-10 rounded-[40px] border border-blue-100 shadow-sm hover:shadow-2xl hover:border-blue-400 transition-all group flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                     <span className="bg-blue-50 text-blue-600 px-5 py-2 rounded-xl text-[10px] font-black tracking-widest border border-blue-100 uppercase">{l.code}</span>
                     <button 
                       onClick={() => handleCopyCode(l.code)} 
                       className={`p-2 rounded-lg transition-all ${copyStatus === l.code ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-400 hover:bg-blue-100'}`}
                       title="Copy mã bài học"
                     >
                        {copyStatus === l.code ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <Icons.Copy />
                        )}
                     </button>
                   </div>
                   <button 
                     onClick={() => handleOpenPreview(l)}
                     className="bg-white border border-blue-100 text-blue-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-blue-50 transition-all flex items-center gap-2"
                   >
                     <Icons.Eye />
                     Xem trước
                   </button>
                </div>
                <MathText content={l.title} className="font-black text-xl text-blue-900 mb-6 uppercase tracking-tighter line-clamp-2" />
                <button onClick={() => { setEditingLesson({ ...l, visualAids: typeof l.visualAids === 'string' ? JSON.parse(l.visualAids) : (l.visualAids || {}), contentType: l.contentType || 'link' }); setView('CREATE'); }} className="mt-auto w-full bg-blue-600 py-5 rounded-2xl text-[10px] font-black text-white hover:bg-blue-700 transition-all uppercase tracking-widest shadow-lg">CHỈNH SỬA</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'CREATE' && (
        <div className="max-w-7xl mx-auto space-y-10 animate-in relative pb-40">
           {/* Section 1: AI Question Generator */}
           <div className="bg-blue-900 p-12 rounded-[50px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
                 <div className="lg:col-span-5 space-y-8">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">GỢI Ý AI RA BÀI TẬP</h2>
                    <p className="text-blue-300 font-bold text-xs uppercase tracking-widest">Tạo bài tập nhanh theo yêu cầu</p>
                    
                    <div className="space-y-4">
                       <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest">Chủ đề bài tập</label>
                       <textarea 
                          value={aiTopic}
                          onChange={e => setAiTopic(e.target.value)}
                          className="w-full bg-blue-800/50 border-2 border-blue-700/50 rounded-3xl p-6 text-white font-bold text-sm focus:border-blue-400 outline-none transition-all resize-none h-32"
                          placeholder="VD: Phương trình bậc hai, Đạo hàm lớp 11, Lịch sử nhà Trần..."
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                         <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest">Mức độ khó</label>
                         <div className="grid grid-cols-1 gap-2">
                            {['Dễ', 'Trung bình', 'Khó'].map(lvl => (
                              <button 
                                key={lvl}
                                onClick={() => setDifficulty(lvl)}
                                className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${difficulty === lvl ? 'bg-white text-blue-900 shadow-xl' : 'bg-blue-800 text-blue-400 hover:bg-blue-700'}`}
                              >
                                {lvl}
                              </button>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-4">
                         <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest">Số lượng câu hỏi</label>
                         <div className="flex flex-col gap-2">
                           {[5, 10, 15, 20].map(count => (
                             <button
                               key={count}
                               onClick={() => setNumQuestions(count)}
                               className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${numQuestions === count ? 'bg-blue-500 text-white shadow-xl' : 'bg-blue-800 text-blue-400 hover:bg-blue-700'}`}
                             >
                               {count} Câu
                             </button>
                           ))}
                           <input 
                              type="number" 
                              min="1" 
                              max="30" 
                              value={numQuestions} 
                              onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
                              className="mt-1 w-full bg-blue-800/50 border-2 border-blue-700/50 rounded-xl p-3 text-white font-bold text-xs text-center focus:border-blue-400 outline-none transition-all"
                              placeholder="Số khác..."
                           />
                         </div>
                      </div>
                    </div>

                    <button 
                       onClick={handleGenerateAISuggestions}
                       disabled={isGenerating}
                       className="w-full bg-blue-500 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-400 transition transform active:scale-95 shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4"
                    >
                       {isGenerating ? (
                         <>
                            <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <span>AI ĐANG TƯ DUY...</span>
                         </>
                       ) : `BẮT ĐẦU TẠO ${numQuestions} CÂU HỎI`}
                    </button>
                 </div>

                 <div className="lg:col-span-7 bg-white/5 rounded-[40px] p-8 border border-white/10 flex flex-col min-h-[500px]">
                    {suggestedQuestions.length > 0 ? (
                      <div className="flex flex-col h-full">
                         <div className="flex-grow space-y-4 overflow-y-auto pr-4 custom-scrollbar max-h-[500px]">
                            {suggestedQuestions.map((q, i) => (
                               <div 
                                 key={i} 
                                 onClick={() => toggleSelection(i)}
                                 className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-start gap-4 ${selectedIndices.has(i) ? 'bg-white border-blue-400 shadow-lg scale-[1.01]' : 'bg-white border-transparent hover:border-blue-100 hover:scale-[1.01]'}`}
                               >
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 mt-1 ${selectedIndices.has(i) ? 'bg-blue-600 border-blue-600' : 'border-blue-100 bg-blue-50/50'}`}>
                                     {selectedIndices.has(i) && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                  </div>
                                  <div className="text-blue-900">
                                     <MathText content={q} className="text-[15px] font-bold text-blue-900" />
                                  </div>
                               </div>
                            ))}
                         </div>
                         <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
                            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Đã chọn {selectedIndices.size} câu hỏi</span>
                            <button onClick={addSelectedQuestions} className="bg-white text-blue-900 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition shadow-xl">Thêm vào bài giảng</button>
                         </div>
                      </div>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center text-center p-10">
                         <div className="w-20 h-20 bg-blue-800/50 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                      </div>
                         <p className="text-blue-300 font-bold text-sm uppercase tracking-tight">Nhập chủ đề và bấm tạo để nhận gợi ý từ AI</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Section 2: Main Lesson Editor */}
           <div className="bg-white p-12 rounded-[50px] shadow-2xl border border-blue-100 relative">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-5 space-y-8">
                  <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">BÀI GIẢNG</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">Tên bài học</label>
                      <button 
                        onClick={() => handleOpenPreview(editingLesson)}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100 flex items-center gap-2 mb-1"
                      >
                         <Icons.Eye />
                         Xem trước soạn thảo
                      </button>
                    </div>
                    <input type="text" value={editingLesson?.title || ''} onChange={e => setEditingLesson({...editingLesson, title: e.target.value})} className="w-full border-2 border-blue-50 rounded-3xl p-6 focus:border-blue-500 outline-none transition-all shadow-sm font-black text-blue-900 text-lg" placeholder="VD: Ôn tập đại số chương 1..." />
                  </div>

                  <div className="p-8 bg-blue-50 rounded-[40px] border border-blue-100 space-y-6">
                    <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">BÀI GIẢNG:</p>
                    
                    <div className="space-y-4">
                       <input 
                          type="text" 
                          value={editingLesson?.contentUrl || ''} 
                          onChange={e => setEditingLesson({...editingLesson, contentUrl: e.target.value})}
                          className="w-full border-2 border-white rounded-2xl p-4 focus:border-blue-500 outline-none transition-all font-bold text-blue-800 text-sm"
                          placeholder="Dán link bài giảng tại đây :"
                       />
                    </div>

                    <div className="space-y-4">
                       <label className="block text-[10px] font-bold text-blue-400 uppercase">Loại tài liệu</label>
                       <div className="grid grid-cols-3 gap-2">
                          {[
                            {id: 'video', label: 'Video'},
                            {id: 'document', label: 'Tài liệu'},
                            {id: 'link', label: 'Trang web'}
                          ].map(type => (
                            <button 
                               key={type.id}
                               onClick={() => setEditingLesson({...editingLesson, contentType: type.id as any})}
                               className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${editingLesson?.contentType === type.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-400'}`}
                            >
                               {type.label}
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-8 bg-blue-50 rounded-[40px] border border-blue-100 space-y-4">
                    <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Cấu trúc đề bài:</p>
                    <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-blue-100">
                       <span className="text-[11px] font-black text-blue-900 uppercase">Tổng số câu hỏi:</span>
                       <span className="text-xl font-black text-blue-600">{(editingLesson?.questions || []).filter(q => q.trim().length > 0).length}</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-8">
                  {(editingLesson?.questions || []).map((q, idx) => (
                    <div key={idx} className="p-10 border-2 border-blue-50 rounded-[48px] bg-white hover:border-blue-400 transition-all shadow-sm group/card">
                      <div className="flex justify-between items-center mb-8">
                         <span className="bg-blue-900 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                           CÂU {idx + 1}
                         </span>
                         <div className="flex gap-2">
                            <button onClick={() => handleAIDraw(idx, '2d')} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" /></svg>
                            </button>
                            <button onClick={() => handleAIDraw(idx, '3d')} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1" /></svg>
                            </button>
                            <button onClick={() => handleCropRequest(idx)} className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8" /></svg>
                            </button>
                            <button onClick={() => {
                              const n = [...(editingLesson?.questions || [])];
                              n.splice(idx, 1);
                              setEditingLesson({...editingLesson, questions: n});
                            }} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm ml-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                         </div>
                      </div>

                      <div className="space-y-6">
                        <textarea 
                          value={q} 
                          onChange={e => { const n = [...(editingLesson?.questions || [])]; n[idx] = e.target.value; setEditingLesson({...editingLesson, questions: n}); }}
                          className="w-full border-2 border-blue-50 bg-blue-50/20 rounded-[32px] p-8 text-base font-bold text-blue-900 focus:bg-white focus:border-blue-500 outline-none transition-all resize-none min-h-[150px]"
                          placeholder="Nội dung câu hỏi bài tập... Sử dụng $...$ cho công thức toán học."
                        />

                        {q.trim() && (
                          <div className="p-6 bg-blue-50/50 rounded-[24px] border border-blue-100">
                             <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-3">NỘI DUNG CÂU HỎI</p>
                             <MathText content={q} className="text-[15px] font-bold text-blue-900" />
                          </div>
                        )}
                      </div>

                      {drawingIdx === idx && (
                        <div className="mt-6 p-10 bg-blue-50 rounded-[32px] flex flex-col items-center justify-center border-2 border-dashed border-blue-200">
                          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">AI đang vẽ hình mô phỏng...</p>
                        </div>
                      )}

                      {editingLesson?.visualAids?.[idx] && (
                        <VisualAidRenderer 
                          aid={editingLesson.visualAids[idx]} 
                          apiKey={apiKey}
                          onRedraw={(newAid) => {
                            const aids = { ...(editingLesson.visualAids || {}) };
                            aids[idx] = newAid;
                            setEditingLesson(prev => ({ ...prev, visualAids: aids }));
                          }}
                        />
                      )}
                    </div>
                  ))}
                  <button onClick={() => setEditingLesson(prev => ({ ...prev, questions: [...(prev?.questions || []), ''] }))} className="w-full py-8 border-4 border-dashed border-blue-100 text-blue-300 font-black uppercase tracking-widest hover:border-blue-300 hover:text-blue-600 transition-all rounded-[48px] bg-white hover:bg-blue-50/30">
                    <span className="flex items-center justify-center gap-4">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                       Thêm câu hỏi thủ công
                    </span>
                  </button>
                </div>
              </div>
           </div>

           {/* Floating Save Controls */}
           <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-6">
              <div className="bg-white/95 backdrop-blur-2xl p-6 rounded-[40px] shadow-2xl border border-blue-100 flex gap-4 items-center">
                <button onClick={() => setView('LIST')} className="flex-1 py-5 font-black text-[11px] text-blue-400 uppercase tracking-widest hover:text-blue-600">Hủy soạn thảo</button>
                <button 
                   onClick={handleSaveLesson} 
                   disabled={loading} 
                   className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-500/20 active:scale-95"
                >
                  {loading ? "Đang ghi dữ liệu..." : "Lưu bài giảng & Phát hành"}
                </button>
              </div>
           </div>
        </div>
      )}

      {view === 'RESULTS' && (
        <div className="animate-in space-y-8">
           <div className="bg-white p-10 rounded-[48px] border border-blue-100 shadow-sm flex justify-between items-center">
              <div>
                 <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">KẾT QUẢ HỌC TẬP</h2>
                 <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-2">Bảng điểm chi tiết của học sinh</p>
              </div>
              <button onClick={loadResults} className="bg-blue-50 text-blue-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">LÀM MỚI DỮ LIỆU</button>
           </div>

           <div className="bg-white rounded-[48px] border border-blue-100 shadow-xl overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                       <tr className="bg-blue-50/50 border-b border-blue-100">
                          <th className="px-8 py-6 text-[10px] font-black text-blue-400 uppercase tracking-widest">HỌ TÊN HỌC SINH</th>
                          <th className="px-8 py-6 text-[10px] font-black text-blue-400 uppercase tracking-widest">LỚP</th>
                          <th className="px-8 py-6 text-[10px] font-black text-blue-400 uppercase tracking-widest">TÊN BÀI HỌC</th>
                          <th className="px-8 py-6 text-[10px] font-black text-blue-400 uppercase tracking-widest">TỔNG SỐ CÂU</th>
                          <th className="px-8 py-6 text-[10px] font-black text-blue-400 uppercase tracking-widest">ĐIỂM TỪNG CÂU</th>
                          <th className="px-8 py-6 text-[10px] font-black text-blue-400 uppercase tracking-widest">TỔNG ĐIỂM</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                       {filteredResults.map((r, idx) => {
                          const rawName = String(r['HỌ TÊN HỌC SINH'] || '');
                          const [name, grade] = rawName.includes(' - ') ? rawName.split(' - ') : [rawName, 'Chưa rõ'];
                          const totalScoreVal = parseFloat(r['TỔNG ĐIỂM'] || '0');
                          
                          return (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-all group">
                               <td className="px-8 py-6">
                                  <p className="font-black text-blue-900 text-sm uppercase">{name}</p>
                               </td>
                               <td className="px-8 py-6">
                                  <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">{grade}</span>
                               </td>
                               <td className="px-8 py-6">
                                  <p className="text-sm font-bold text-blue-800 line-clamp-1">{r['TÊN BÀI HỌC']}</p>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <span className="font-black text-blue-900">{r['TỔNG SỐ CÂU']}</span>
                               </td>
                               <td className="px-8 py-6">
                                  <p className="text-[10px] font-bold text-blue-400 tracking-tighter">{r['ĐIỂM TỪNG CÂU']}</p>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                     <span className={`text-2xl font-black ${totalScoreVal >= 8 ? 'text-green-600' : totalScoreVal >= 5 ? 'text-blue-600' : 'text-red-500'}`}>
                                        {r['TỔNG ĐIỂM']}
                                     </span>
                                     <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden w-24">
                                        <div 
                                          className={`h-full transition-all duration-500 ${totalScoreVal >= 8 ? 'bg-green-500' : totalScoreVal >= 5 ? 'bg-blue-600' : 'bg-red-500'}`} 
                                          style={{ width: `${Math.min(totalScoreVal * 10, 100)}%` }}
                                        ></div>
                                     </div>
                                  </div>
                               </td>
                            </tr>
                          );
                       })}
                       {filteredResults.length === 0 && (
                          <tr>
                             <td colSpan={6} className="py-32 text-center">
                                <p className="text-4xl font-black text-blue-50 uppercase tracking-widest">Chưa có kết quả</p>
                                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-4">Học sinh của bạn chưa hoàn thành bài tập nào</p>
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* Lesson Preview Modal */}
      {previewingLesson && (
        <div className="fixed inset-0 z-[500] bg-white overflow-y-auto custom-scrollbar flex flex-col animate-in">
           {/* Top bar */}
           <div className="bg-white border-b border-blue-100 px-8 py-6 flex justify-between items-center sticky top-0 z-50">
              <div className="flex items-center gap-4">
                 <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
                   CHẾ ĐỘ XEM TRƯỚC
                 </div>
                 <MathText content={previewingLesson.title} className="text-xl font-black text-blue-900 uppercase tracking-tight" />
              </div>
              <button 
                onClick={() => setPreviewingLesson(null)}
                className="bg-red-50 text-red-500 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-100"
              >
                Đóng xem thử
              </button>
           </div>

           {/* Content */}
           <div className="max-w-4xl mx-auto w-full px-8 py-12 space-y-12">
              {previewingLesson.contentUrl && (
                <div className="space-y-4">
                   <div className="flex items-center gap-2">
                      <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                      <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">Nội dung bài học</h3>
                   </div>
                   <div className="lesson-frame-container">
                      <iframe 
                        src={getEmbedUrl(previewingLesson.contentUrl)} 
                        className="w-full h-full" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                   </div>
                </div>
              )}

              <div className="space-y-8">
                 <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                    <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">Câu hỏi bài tập</h3>
                 </div>
                 {previewingLesson.questions.map((q, idx) => (
                    <div key={idx} className="bg-blue-50/30 p-8 rounded-[32px] border border-blue-100 flex flex-col gap-6">
                       <div className="flex gap-4 items-start">
                          <span className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-lg shrink-0">
                            {idx + 1}
                          </span>
                          <MathText content={q} className="text-[15px] font-bold text-blue-900 pt-1" />
                       </div>
                       {previewingLesson.visualAids?.[idx] && (
                          <VisualAidRenderer aid={previewingLesson.visualAids[idx]} apiKey={apiKey} />
                       )}
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic">Phần trả lời của học sinh sẽ hiển thị tại đây...</label>
                          <div className="w-full h-32 bg-white/50 border-2 border-dashed border-blue-100 rounded-2xl"></div>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="bg-blue-50 p-10 rounded-[40px] text-center">
                 <p className="text-blue-400 font-bold uppercase text-[10px] tracking-widest mb-4">Mô phỏng nộp bài</p>
                 <button className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest opacity-50 cursor-not-allowed">
                    Nộp bài cho AI
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
