
import React, { useState, useEffect, useRef } from 'react';
import { Student, Lesson } from '../types';
import { fetchAllData, saveData } from '../services/api';
import { GAS_URLS } from '../constants';
import { GeminiService } from '../services/geminiService';
import MathText from './MathText';
import VisualAidRenderer from './VisualAidRenderer';

interface Props {
  student: Student;
  apiKey: string;
}

const StudentDashboard: React.FC<Props> = ({ student, apiKey }) => {
  const [view, setView] = useState<'HOME' | 'RESULTS'>('HOME');
  const [lessonCode, setLessonCode] = useState('');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [answerImages, setAnswerImages] = useState<(string|null)[]>([]);
  const [results, setResults] = useState<{score: number, feedback: string}[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  const [isFloating, setIsFloating] = useState(false);
  const [manualFloating, setManualFloating] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const studentUsername = String(student.username || (student as any)['TÀI KHOẢN'] || (student as any)['TÊN ĐĂNG NHẬP'] || (student as any).tendangnhap || '');

  useEffect(() => {
    if (!activeLesson || !activeLesson.contentUrl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setIsFloating(true);
        } else {
          setIsFloating(false);
        }
      },
      { threshold: 0.1 }
    );

    if (videoContainerRef.current) {
      observer.observe(videoContainerRef.current);
    }

    return () => observer.disconnect();
  }, [activeLesson]);

  const loadStudentHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchAllData(GAS_URLS.RESULTS);
      const myHistory = data.filter((r: any) => 
        String(r['TÀI KHOẢN'] || r.username || '').trim() === studentUsername.trim()
      );
      setHistory(myHistory);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLesson = async () => {
    if (!lessonCode) return;
    setLoading(true);
    try {
      const data = await fetchAllData(GAS_URLS.LESSONS);
      const found = data.find((l: any) => 
        String(l.code || l['MÃ BÀI HỌC'] || l.lessonCode || '').trim().toUpperCase() === lessonCode.trim().toUpperCase()
      );
      
      if (found) {
        const rawQuestions = Array.isArray(found.questions) ? found.questions : [];
        const validQuestions = rawQuestions.filter((q: any) => q && String(q).trim().length > 0);
        const visualAids = typeof found.visualAids === 'string' ? JSON.parse(found.visualAids) : (found.visualAids || {});

        setActiveLesson({
          ...found,
          title: found.title || found['TÊN BÀI HỌC'],
          questions: validQuestions,
          visualAids: visualAids,
          contentUrl: found.contentUrl || found['LINK BÀI HỌC'] || '',
          contentType: found.contentType || found['ĐỊNH DẠNG'] || 'link',
          teacherId: found.teacherId || found['GIÁO VIÊN TẠO'] || found['giaovien'] || ''
        });
        setAnswers(Array(validQuestions.length).fill(''));
        setAnswerImages(Array(validQuestions.length).fill(null));
        setResults([]);
        setIsFloating(false);
        setManualFloating(false);
      } else {
        alert("Không tìm thấy bài học!");
      }
    } catch (e) {
      alert("Lỗi kết nối máy chủ bài học.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!activeLesson) return;
    setIsGrading(true);
    const gemini = new GeminiService(apiKey);
    const gradedResults: {score: number, feedback: string}[] = [];
    
    try {
      for (let i = 0; i < activeLesson.questions.length; i++) {
        const res = await gemini.gradeHomework(
          activeLesson.title,
          activeLesson.questions[i],
          answers[i] || "Học sinh nộp bài trống.",
          answerImages[i] || undefined
        );
        gradedResults.push(res);
      }
      setResults(gradedResults);
      const totalPoints = gradedResults.reduce((acc, curr) => acc + curr.score, 0);
      const avgScore = totalPoints / (gradedResults.length || 1);

      const studentFullName = String(student.fullName || (student as any)['HỌ TÊN HỌC SINH'] || (student as any)['HỌ TÊN'] || '');
      const studentGradeRaw = (student.grade || (student as any)['LỚP'] || (student as any)['LỚP HỌC'] || '');
      
      const gradeStr = String(studentGradeRaw).trim();
      const formattedGrade = gradeStr.toLowerCase().startsWith('lớp') ? gradeStr : `Lớp ${gradeStr}`;
      const studentNameWithClass = gradeStr ? `${studentFullName} - ${formattedGrade}` : studentFullName;

      await saveData(GAS_URLS.RESULTS, {
        'TÀI KHOẢN': studentUsername,
        'HỌ TÊN HỌC SINH': studentNameWithClass,
        'MÃ SỐ BÀI HỌC': activeLesson.code,
        'GIÁO VIÊN TẠO': activeLesson.teacherId || '',
        'TÊN BÀI HỌC': activeLesson.title,
        'TỔNG SỐ CÂU': activeLesson.questions.length,
        'ĐIỂM TỪNG CÂU': gradedResults.map(r => r.score).join(', '),
        'TỔNG ĐIỂM': avgScore.toFixed(1)
      });
      alert(`Đã hoàn tất! Điểm trung bình: ${avgScore.toFixed(1)}/10.`);
    } catch (err) {
      console.error("Lỗi khi chấm bài:", err);
      alert("Hệ thống gặp sự cố khi xử lý bài làm. Vui lòng thử lại sau.");
    } finally {
      setIsGrading(false);
    }
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

  const isPiPActive = isFloating || manualFloating;

  if (view === 'RESULTS') {
    return (
      <div className="max-w-7xl mx-auto pb-32 animate-in">
        <div className="flex items-center justify-between mb-8">
           <button 
             onClick={() => setView('HOME')} 
             className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-blue-100 hover:bg-blue-50 transition shadow-sm flex items-center gap-2"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
             Quay lại
           </button>
           <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">BẢNG KẾT QUẢ HỌC TẬP</h2>
        </div>

        <div className="bg-white rounded-[40px] border border-blue-100 shadow-xl overflow-hidden">
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                 <thead>
                    <tr className="bg-blue-50/50 border-b border-blue-100">
                       <th className="px-6 py-6 text-[10px] font-black text-blue-400 uppercase tracking-widest">HỌ TÊN</th>
                       <th className="px-6 py-6 text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">LỚP</th>
                       <th className="px-6 py-6 text-[10px] font-black text-blue-400 uppercase tracking-widest">BÀI HỌC</th>
                       <th className="px-6 py-6 text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">GIÁO VIÊN</th>
                       <th className="px-6 py-6 text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">SỐ CÂU</th>
                       <th className="px-6 py-6 text-[10px] font-black text-blue-400 uppercase tracking-widest">ĐIỂM CHI TIẾT</th>
                       <th className="px-6 py-6 text-[10px] font-black text-blue-400 uppercase tracking-widest text-right">TỔNG ĐIỂM</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-blue-50">
                    {history.map((r, idx) => {
                       const score = parseFloat(r['TỔNG ĐIỂM'] || '0');
                       const rawName = String(r['HỌ TÊN HỌC SINH'] || '');
                       const [name, grade] = rawName.includes(' - ') ? rawName.split(' - ') : [rawName, 'Chưa rõ'];
                       return (
                         <tr key={idx} className="hover:bg-blue-50/20 transition-all">
                            <td className="px-6 py-6 font-bold text-blue-900 text-xs uppercase">{name}</td>
                            <td className="px-6 py-6 text-center">
                               <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 whitespace-nowrap">{grade}</span>
                            </td>
                            <td className="px-6 py-6 font-bold text-blue-900 text-xs">{r['TÊN BÀI HỌC']}</td>
                            <td className="px-6 py-6 text-center text-[11px] font-black text-blue-400 uppercase whitespace-nowrap">{r['GIÁO VIÊN TẠO'] || 'AI System'}</td>
                            <td className="px-6 py-6 text-center font-black text-blue-900">{r['TỔNG SỐ CÂU']}</td>
                            <td className="px-6 py-6">
                               <p className="text-[10px] font-bold text-slate-400 tracking-tighter">{r['ĐIỂM TỪNG CÂU']}</p>
                            </td>
                            <td className="px-6 py-6 text-right">
                               <span className={`text-xl font-black ${score >= 8 ? 'text-green-600' : score >= 5 ? 'text-blue-600' : 'text-red-500'}`}>
                                 {r['TỔNG ĐIỂM']}
                               </span>
                            </td>
                         </tr>
                       );
                    })}
                    {history.length === 0 && !loading && (
                      <tr>
                        <td colSpan={7} className="py-20 text-center font-black text-blue-100 text-3xl uppercase tracking-widest">Chưa có dữ liệu</td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-32">
      {!activeLesson ? (
        <div className="space-y-6 mt-12">
          <div className="bg-white p-10 md:p-16 rounded-[40px] shadow-xl border border-blue-50 text-center max-w-xl mx-auto animate-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
            <div className="w-20 h-20 bg-blue-600 rounded-[24px] flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-blue-100">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>
            </div>
            <h2 className="text-3xl font-black text-blue-900 mb-2 uppercase tracking-tighter">PHÒNG HỌC TRỰC TUYẾN</h2>
            <p className="text-blue-500 font-bold mb-8 text-xs uppercase tracking-widest">Hệ thống giáo dục thông minh AI</p>
            <input 
              type="text" 
              value={lessonCode} 
              onChange={e => setLessonCode(e.target.value.toUpperCase())} 
              className="w-full border-2 border-blue-50 bg-blue-50/30 rounded-2xl p-5 text-center text-2xl font-black tracking-[0.1em] focus:border-blue-400 focus:bg-white outline-none transition-all uppercase text-blue-900 mb-6" 
              placeholder="NHẬP MÃ BÀI HỌC"
            />
            <button onClick={handleFetchLesson} disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-base hover:bg-blue-700 transition transform active:scale-95 shadow-lg shadow-blue-100 uppercase tracking-widest">
              {loading ? "ĐANG KẾT NỐI..." : "BẮT ĐẦU TIẾT HỌC"}
            </button>
            
            <div className="mt-8 pt-8 border-t border-blue-50">
               <button 
                 onClick={() => { setView('RESULTS'); loadStudentHistory(); }} 
                 className="flex items-center justify-center gap-3 w-full py-4 text-blue-600 font-black text-[11px] uppercase tracking-widest hover:bg-blue-50 rounded-2xl transition-all"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                 XEM KẾT QUẢ
               </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-blue-50 flex flex-wrap justify-between items-center gap-6">
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md">
                 {activeLesson.code.slice(0, 2)}
               </div>
               <div>
                  <MathText content={activeLesson.title} className="text-2xl font-black text-blue-900 uppercase tracking-tighter leading-tight" />
                  <div className="flex gap-3 mt-1">
                    <span className="text-[9px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black uppercase border border-blue-100">MÃ: {activeLesson.code}</span>
                    <span className="text-[9px] bg-green-50 text-green-600 px-3 py-1 rounded-full font-black uppercase border border-green-100">{student.fullName || (student as any)['HỌ TÊN HỌC SINH']}</span>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-3">
               {activeLesson.contentUrl && (
                  <button 
                    onClick={() => setManualFloating(!manualFloating)}
                    className={`px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border flex items-center gap-2 ${manualFloating ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'}`}
                    title="Ghim video (Hình trong hình)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    {manualFloating ? "Đang ghim" : "Ghim video"}
                  </button>
               )}
               <button onClick={() => setActiveLesson(null)} className="text-red-500 font-black uppercase text-[10px] tracking-widest bg-red-50 px-6 py-4 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100">Kết thúc</button>
            </div>
          </div>

          {activeLesson.contentUrl && (
            <div className="space-y-4" ref={videoContainerRef}>
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                  <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">Nội dung bài giảng</h3>
                </div>
                <div className="flex gap-4">
                  <a 
                    href={activeLesson.contentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    Mở link gốc
                  </a>
                </div>
              </div>
              
              <div className={`lesson-frame-container relative transition-all duration-500 ${isPiPActive ? 'opacity-20 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
                 <iframe 
                   src={getEmbedUrl(activeLesson.contentUrl)} 
                   className="w-full h-full bg-white" 
                   frameBorder="0" 
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                   allowFullScreen
                   title="Lesson Content"
                 ></iframe>
              </div>

              {isPiPActive && (
                <div className="fixed bottom-24 right-8 w-[320px] md:w-[450px] aspect-video z-[150] bg-white rounded-[24px] shadow-2xl border-4 border-white overflow-hidden animate-in group">
                   <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-between px-4">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-md">Đang xem bài giảng...</span>
                      <button 
                        onClick={() => { setManualFloating(false); setIsFloating(false); }}
                        className="text-white hover:text-red-400 transition-colors p-1"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                   </div>
                   <iframe 
                     src={getEmbedUrl(activeLesson.contentUrl)} 
                     className="w-full h-full" 
                     frameBorder="0" 
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                     allowFullScreen
                     title="Floating Content"
                   ></iframe>
                   <div className="absolute inset-0 border-2 border-blue-600/10 rounded-[24px] pointer-events-none"></div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
              <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">PHIẾU BÀI TẬP</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
               {activeLesson.questions.map((q, idx) => (
                 <div key={idx} className="bg-white p-8 rounded-[32px] border border-blue-50 shadow-sm flex flex-col gap-6">
                   <div className="flex items-start gap-4">
                      <span className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-lg shrink-0 border border-blue-100">
                        {idx + 1}
                      </span>
                      <div className="flex-grow pt-1">
                        <MathText content={q} className="font-semibold text-slate-800 text-[14px]" />
                      </div>
                   </div>

                   {activeLesson.visualAids?.[idx] && (
                     <VisualAidRenderer aid={activeLesson.visualAids[idx]} apiKey={apiKey} />
                   )}

                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">Lời giải của bạn:</label>
                     <textarea 
                       value={answers[idx]} 
                       onChange={e => { const a = [...answers]; a[idx] = e.target.value; setAnswers(a); }}
                       placeholder=""
                       className="w-full border-2 border-blue-50 bg-blue-50/10 rounded-2xl p-6 text-base font-medium text-slate-900 focus:bg-white focus:border-blue-400 outline-none transition-all resize-none min-h-[120px]"
                     />

                     {answers[idx].trim() && (
                       <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Xem trước bài làm:</p>
                          <MathText content={answers[idx]} className="text-[14px] italic text-slate-700" />
                       </div>
                     )}

                     <div className="relative">
                       <button className={`w-full py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${answerImages[idx] ? 'bg-green-600 text-white border-green-600' : 'bg-white text-blue-600 border-blue-100 hover:border-blue-400'}`}>
                         <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                            {answerImages[idx] ? "Ảnh đã đính kèm" : "Chụp ảnh bài làm từ vở"}
                         </span>
                       </button>
                       <input type="file" accept="image/*" onChange={e => {
                         if(e.target.files?.[0]) {
                            const reader = new FileReader();
                            reader.onload = () => {
                               const newImgs = [...answerImages];
                               newImgs[idx] = (reader.result as string).split(',')[1];
                               setAnswerImages(newImgs);
                            };
                            reader.readAsDataURL(e.target.files[0]);
                         }
                       }} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </div>
                   </div>

                   {results[idx] && (
                     <div className="p-6 bg-white text-slate-900 rounded-[24px] border-2 border-blue-100 shadow-lg shadow-blue-50/50 animate-in">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-blue-50">
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                             <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Hướng dẫn làm bài</span>
                          </div>
                          <span className="text-2xl font-black text-blue-600">{results[idx].score}/10</span>
                        </div>
                        <MathText content={results[idx].feedback} className="text-[14px] font-medium text-slate-700" />
                     </div>
                   )}
                 </div>
               ))}
            </div>
          </div>

          <div className="flex justify-center mt-12">
            <button 
              onClick={handleSubmit} 
              disabled={isGrading} 
              className="bg-blue-600 text-white px-16 py-6 rounded-2xl font-black text-lg hover:bg-blue-700 hover:scale-[1.02] transition transform shadow-xl shadow-blue-100 uppercase tracking-widest flex items-center gap-5"
            >
              {isGrading ? (
                <>
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>ĐANG CHẤM BÀI...</span>
                </>
              ) : "NỘP BÀI"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
