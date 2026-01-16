
import React from 'react';

export const APP_NAME = "E-LEARNING";
export const COPYRIGHT = "Create by Hoà Hiệp AI – 0983.676.470";

export const GAS_URLS = {
  TEACHERS: "https://script.google.com/macros/s/AKfycbwc9Teu6s5U66DfXFzN2MyKhyj6IHFQJzgO5DOIghEwErJo3B3RMceB6_843b8QHklS/exec",
  STUDENTS: "https://script.google.com/macros/s/AKfycbxfaZs9jmTpG7BRXtr5WGZMQV0CaJbqEddShSWBot5vuLFHakA1pIKN_wcIO3b7SQJp/exec",
  LESSONS: "https://script.google.com/macros/s/AKfycbz6UUlgXaVh4OsivhwdeyoYh7NLHwadhrZtsQdOcwJEY6jRpbFFSKhvXSwPCcCJMoVp/exec",
  RESULTS: "https://script.google.com/macros/s/AKfycbzyjwhDRHITz67iZtHFJbxTR2nn2QBdhobWI9gDxVLGWiKR7IZymJwCNX0TTPffllwi/exec"
};

export const Icons = {
  Teacher: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
  ),
  Student: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>
  ),
  Admin: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065z" /></svg>
  ),
  Copy: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
  ),
  Eye: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
  )
};
