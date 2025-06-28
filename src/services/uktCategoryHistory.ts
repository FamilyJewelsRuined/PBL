import axios from 'axios';

const API_URL = 'https://ti054c04.agussbn.my.id/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface UKTCategoryHistory {
  id_riwayat: number;
  nim: string;
  id_kategori_ukt: number;
  tanggal_perubahan: string;
}

export interface CreateUKTCategoryHistoryRequest {
  nim: string;
  id_kategori_ukt: number;
  tanggal_perubahan: string;
}

class UKTCategoryHistoryService {
  // Get all UKT category history
  async getAllHistory(): Promise<UKTCategoryHistory[]> {
    const response = await axios.get(`${API_URL}/riwayat-kategori-ukt`, {
      headers: getAuthHeaders(),
    });
    return response.data.data || [];
  }

  // Get UKT category history by NIM
  async getHistoryByNIM(nim: string): Promise<UKTCategoryHistory[]> {
    const response = await axios.get(`${API_URL}/riwayat-kategori-ukt/nim/${nim}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data || [];
  }

  // Create new UKT category history
  async createHistory(data: CreateUKTCategoryHistoryRequest): Promise<any> {
    const response = await axios.post(
      `${API_URL}/riwayat-kategori-ukt`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  }

  // Update UKT category history
  async updateHistory(id: number, data: Partial<CreateUKTCategoryHistoryRequest>): Promise<any> {
    const response = await axios.put(
      `${API_URL}/riwayat-kategori-ukt/${id}`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  }

  // Delete UKT category history
  async deleteHistory(id: number): Promise<any> {
    const response = await axios.delete(`${API_URL}/riwayat-kategori-ukt/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  }

  // Get UKT category history by date range
  async getHistoryByDateRange(startDate: string, endDate: string): Promise<UKTCategoryHistory[]> {
    const response = await axios.get(`${API_URL}/riwayat-kategori-ukt/date-range`, {
      params: { start_date: startDate, end_date: endDate },
      headers: getAuthHeaders(),
    });
    return response.data.data || [];
  }
}

const uktCategoryHistoryService = new UKTCategoryHistoryService();
export default uktCategoryHistoryService; 