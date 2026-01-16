
import React, { useRef, useState, useEffect } from 'react';

interface Props {
  imageUrl: string;
  onCrop: (base64: string) => void;
  onClose: () => void;
}

const ImageCropper: React.FC<Props> = ({ imageUrl, onCrop, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;
    image.onload = () => {
      setImg(image);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = image.width;
        canvasRef.current.height = image.height;
        ctx?.drawImage(image, 0, 0);
      }
    };
  }, [imageUrl]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setStartPos({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current || !img) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(img, 0, 0);
    
    // Draw overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Clear crop area
    const w = x - startPos.x;
    const h = y - startPos.y;
    ctx.clearRect(startPos.x, startPos.y, w, h);
    ctx.drawImage(img, startPos.x, startPos.y, w, h, startPos.x, startPos.y, w, h);
    
    // Draw border
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 4;
    ctx.strokeRect(startPos.x, startPos.y, w, h);
    
    setCropRect({ x: startPos.x, y: startPos.y, w, h });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const confirmCrop = () => {
    if (!cropRect.w || !cropRect.h || !img) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.abs(cropRect.w);
    tempCanvas.height = Math.abs(cropRect.h);
    const ctx = tempCanvas.getContext('2d');
    
    const x = cropRect.w > 0 ? cropRect.x : cropRect.x + cropRect.w;
    const y = cropRect.h > 0 ? cropRect.y : cropRect.y + cropRect.h;

    ctx?.drawImage(img, x, y, Math.abs(cropRect.w), Math.abs(cropRect.h), 0, 0, Math.abs(cropRect.w), Math.abs(cropRect.h));
    onCrop(tempCanvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-[300] bg-blue-900/80 backdrop-blur-md flex items-center justify-center p-10">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl h-full flex flex-col overflow-hidden">
        <div className="p-8 border-b border-blue-50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-blue-900 uppercase tracking-tighter">KHOANH VÙNG ẢNH GỐC</h3>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Dùng chuột quét chọn vùng nội dung cần sao chép</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div ref={containerRef} className="flex-grow overflow-auto bg-gray-100 p-8 flex items-start justify-center cursor-crosshair">
          <canvas 
            ref={canvasRef} 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="shadow-2xl bg-white max-w-full"
          />
        </div>

        <div className="p-8 border-t border-blue-50 flex justify-end gap-4 bg-white">
          <button onClick={onClose} className="px-8 py-4 font-black text-[11px] text-blue-400 uppercase tracking-widest">Hủy bỏ</button>
          <button 
            onClick={confirmCrop}
            disabled={!cropRect.w}
            className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition shadow-xl disabled:opacity-50"
          >
            Xác nhận cắt ảnh
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
