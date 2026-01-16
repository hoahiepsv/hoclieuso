
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    // Priority: 1. Passed key, 2. Environment key
    const finalKey = apiKey || (process.env.API_KEY as string);
    this.ai = new GoogleGenAI({ apiKey: finalKey });
  }

  private getTechnicalSystemInstruction() {
    return `Bạn là một chuyên gia giáo dục AI trong hệ thống E-LEARNING.
    NHIỆM VỤ: Trình bày nội dung giáo dục với công thức toán học chuyên nghiệp như MathType.
    
    QUY TẮC TRÌNH BÀY (BẮT BUỘC):
    1. CÔNG THỨC TOÁN HỌC:
       - Sử dụng mã LaTeX chuẩn để MathJax có thể hiển thị dạng MathType.
       - Tất cả biến số, hằng số, ký hiệu toán học PHẢI đặt trong dấu $ (ví dụ: $x$, $\alpha$, $2x + 1 = 0$).
       - Các công thức phức tạp hoặc kết quả cuối cùng hãy đặt trong $$...$$ để hiển thị ở dòng riêng (ví dụ: $$x = \frac{-b \pm \sqrt{\Delta}}{2a}$$).
    2. TRÌNH BÀY VĂN BẢN:
       - Sử dụng Markdown: **in đậm** cho các thuật ngữ quan trọng.
       - Sử dụng danh sách (bullet points) cho các bước giải bài tập.
    3. NGÔN NGỮ: Tiếng Việt sư phạm, rõ ràng, dễ hiểu. Tránh hiển thị mã code thô ra màn hình.`;
  }

  async generateExerciseSuggestions(topic: string, difficulty: string, count: number = 10): Promise<string[]> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: `${this.getTechnicalSystemInstruction()}\nHãy tạo ra đúng ${count} câu hỏi bài tập về chủ đề: "${topic}" với mức độ: "${difficulty}". 
            Đảm bảo các công thức đều nằm trong dấu $ hoặc $$. Trả về JSON mảng ${count} chuỗi.` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Gemini Error:", error);
      return [];
    }
  }

  async gradeHomework(lessonTitle: string, question: string, answer: string, base64AnswerImage?: string): Promise<{ score: number, feedback: string }> {
    try {
      const parts: any[] = [
        { text: `Bài học: ${lessonTitle}\nCâu hỏi: ${question}\nTrả lời: ${answer}` }
      ];
      if (base64AnswerImage) parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64AnswerImage } });
      parts.push({ text: `${this.getTechnicalSystemInstruction()}\nChấm điểm bài làm (thang 10). Feedback phải dùng $...$ cho công thức và giải thích chi tiết lỗi sai nếu có. Trả về JSON {score: number, feedback: string}.` });

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING }
            },
            required: ['score', 'feedback']
          }
        }
      });
      return JSON.parse(response.text || '{"score": 0, "feedback": "Lỗi hệ thống"}');
    } catch (error) {
      return { score: 0, feedback: "Không thể chấm bài lúc này." };
    }
  }

  async generateTechnicalDrawing(prompt: string, type: '2d' | '3d' | 'chart'): Promise<string> {
    try {
      const model = type === '3d' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
      const response = await this.ai.models.generateContent({
        model: model,
        contents: { parts: [{ text: `Vẽ hình học ${type} chuyên nghiệp: ${prompt}. Nền trắng, nét vẽ đen, phong cách toán học.` }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      return "";
    } catch (error) {
      return "";
    }
  }
}
