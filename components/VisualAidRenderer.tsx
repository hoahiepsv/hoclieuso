
import React, { useState } from 'react';
import { VisualAid } from '../types';
import { GeminiService } from '../services/geminiService';

interface Props {
  aid: VisualAid;
  apiKey?: string;
  onRedraw?: (newAid: VisualAid) => void;
  onCopyOriginal?: () => void;
}

const VisualAidRenderer: React.FC<Props> = ({ aid, apiKey, onRedraw, onCopyOriginal }) => {
  const [isRedrawing, setIsRedrawing] = useState(false);
  const [redrawPrompt, setRedrawPrompt] = useState('');
  const [showRedrawInput, setShowRedrawInput] = useState(false);

  const handleRedraw = async () => {
    if (!redrawPrompt) return;
    setIsRedrawing(true);
    const gemini = new GeminiService(apiKey);
    const type = aid.type === 'chart' ? 'chart' : (aid.type === 'geometry_3d' ? '3d' : '2d');
    const newImage = await gemini.generateTechnicalDrawing(`${aid.prompt || ''}. Lưu ý thêm: ${redrawPrompt}`, type as any);
    
    if (newImage && onRedraw) {
      onRedraw({ ...aid, source: newImage, prompt: `${aid.prompt}. ${redrawPrompt}` });
    }
    setIsRedrawing(false);
    setShowRedrawInput(false);
  };

  return (
    <div className="relative group/aid mt-4">
      <div className="bg-white rounded-[32px] overflow-hidden border-2 border-blue-50 shadow-sm relative">
        {isRedrawing && (
          <div className="absolute inset-0 z-10 bg-blue-900/40 backdrop-blur flex flex-col items-center justify-center text-white">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="font-black text-[10px] uppercase tracking-widest">AI đang vẽ lại...</p>
          </div>
        )}
        
        <img src={aid.source} alt="Visual Aid" className="w-full h-auto object-contain min-h-[200px]" />

        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover/aid:opacity-100 transition-opacity">
          <button 
            onClick={() => setShowRedrawInput(!showRedrawInput)}
            className="bg-blue-600 text-white p-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Vẽ lại</span>
          </button>
          <button 
            onClick={onCopyOriginal}
            className="bg-white text-blue-600 border border-blue-100 p-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Dùng hình gốc</span>
          </button>
        </div>
      </div>

      {showRedrawInput && (
        <div className="mt-4 p-6 bg-blue-50 rounded-[24px] border border-blue-100 animate-in">
          <label className="block text-[10px] font-black text-blue-900/50 uppercase mb-2 tracking-widest">Lý do vẽ lại / Yêu cầu chi tiết</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={redrawPrompt}
              onChange={(e) => setRedrawPrompt(e.target.value)}
              placeholder="VD: Thêm tên các đỉnh A, B, C; tô màu đỏ cho cột lớn nhất..."
              className="flex-grow p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none text-sm font-bold text-blue-900"
            />
            <button 
              onClick={handleRedraw}
              className="bg-blue-600 text-white px-6 rounded-xl font-black text-[10px] uppercase tracking-widest"
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualAidRenderer;
