
import React, { useEffect, useRef } from 'react';

interface MathTextProps {
  content: string;
  className?: string;
}

const MathText: React.FC<MathTextProps> = ({ content, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Hàm render an toàn bằng MathJax
      const renderMath = () => {
        if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
          (window as any).MathJax.typesetPromise([containerRef.current]).catch((err: any) => {
            console.error('MathJax rendering error:', err);
          });
        }
      };

      // Xử lý Markdown cơ bản trước khi đưa vào container
      const formattedContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-blue-800">$1</strong>')
        .replace(/^\s*[\-\*]\s+(.*)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul class="my-3">$1</ul>')
        .replace(/\n/g, '<br/>');

      containerRef.current.innerHTML = formattedContent;
      
      // Chạy MathJax sau khi DOM đã cập nhật
      renderMath();
    }
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className={`math-type-render break-words text-slate-800 ${className}`}
    />
  );
};

export default MathText;
