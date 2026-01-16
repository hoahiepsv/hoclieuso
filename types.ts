
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  GUEST = 'GUEST'
}

export interface Teacher {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface Student {
  id: string;
  username: string;
  fullName: string;
  school: string;
  grade: string;
  email: string;
  phone: string;
  registrationDate?: string;
}

export interface Lesson {
  stt: string;
  code: string;
  title: string;
  teacherId: string;
  contentUrl?: string; // Link to PDF/Video/PPT/Drive
  contentType?: 'video' | 'document' | 'link'; // Loại tài liệu
  questions: string[]; 
  visualAids?: { [key: number]: VisualAid }; 
}

export interface VisualAid {
  type: 'chart' | 'geometry_2d' | 'geometry_3d' | 'illustration' | 'table' | 'original_crop';
  source: string; 
  prompt?: string;
}

export interface ExamResult {
  stt: string;
  username: string;
  fullName: string;
  classCode: string;
  lessonName: string;
  lessonCode?: string;
  questionDetail: string;
  scores: string;
  totalScore: string;
}

export interface AppState {
  apiKey: string;
  currentUser: any | null;
  role: UserRole;
}
