
import { GAS_URLS } from '../constants';

/**
 * Hàm fetch dữ liệu từ GAS, hỗ trợ xử lý lỗi kết nối và chuyển hướng.
 * Quan trọng: Không thêm custom headers để tránh lỗi CORS Preflight (OPTIONS request).
 */
export const fetchAllData = async (url: string): Promise<any[]> => {
  if (!url) return [];
  
  try {
    // Thêm tham số cache buster để tránh lấy dữ liệu cũ
    const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}action=read&_t=${Date.now()}`;
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow', // Bắt buộc cho GAS vì nó chuyển hướng sang googleusercontent
    });
    
    if (!response.ok) {
      throw new Error(`Lỗi HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.status === 'error') {
      throw new Error(data.message || 'Lỗi từ phía máy chủ Apps Script');
    }

    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('Lỗi API fetchAllData:', error);
    
    // Thông báo lỗi cụ thể cho "Failed to fetch" thường gặp ở GAS
    if (error.message === 'Failed to fetch') {
      alert(
        "KHÔNG THỂ KẾT NỐI MÁY CHỦ:\n\n" +
        "1. Hãy kiểm tra xem mã Apps Script đã được 'Deploy' chưa.\n" +
        "2. Đảm bảo quyền truy cập là 'Anyone' (Bất kỳ ai).\n" +
        "3. Kiểm tra kết nối Internet của bạn."
      );
    }
    
    return [];
  }
};

/**
 * Hàm lưu dữ liệu sang GAS.
 * Sử dụng text/plain để tránh kích hoạt CORS preflight (OPTIONS request).
 */
export const saveData = async (url: string, data: any) => {
  if (!url) return { status: 'error', message: 'URL không hợp lệ' };

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        // Sử dụng text/plain là kỹ thuật "Simple Request" để tránh lỗi CORS OPTIONS trên GAS
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'write', ...data }),
    });
    
    if (!response.ok) {
      throw new Error(`Lỗi HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Lỗi API saveData:', error);
    return { 
      status: 'error', 
      message: error.message === 'Failed to fetch' 
        ? 'Lỗi kết nối: Vui lòng kiểm tra quyền "Anyone" trong phần Deploy của Apps Script.' 
        : 'Không thể lưu dữ liệu. Hãy thử lại sau.' 
    };
  }
};

export const deleteData = async (url: string, id: string) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'delete', id }),
    });
    return await response.json();
  } catch (error) {
    console.error('Lỗi API deleteData:', error);
    return { status: 'error' };
  }
};
