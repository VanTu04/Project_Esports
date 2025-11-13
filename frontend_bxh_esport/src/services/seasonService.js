import { apiClient } from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Service xử lý các API liên quan đến Season
 */

// Lấy danh sách tất cả mùa giải
export const getAllSeasons = async (status = null, gameId = null) => {
  try {
    const params = {};
    if (status !== null && status !== undefined && status !== '') {
      params.status = status;
    }
    if (gameId !== null && gameId !== undefined && gameId !== '') {
      params.gameId = gameId;
    }
    
    const response = await apiClient.get(API_ENDPOINTS.SEASONS, { params });
    return response;
  } catch (error) {
    console.error('getAllSeasons error:', error);
    throw error;
  }
};

// Lấy thông tin mùa giải theo ID
export const getSeasonById = async (id) => {
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.SEASONS}/${id}`);
    return response;
  } catch (error) {
    console.error('getSeasonById error:', error);
    throw error;
  }
};

// Lấy danh sách mùa giải theo game
export const getSeasonsByGameId = async (gameId) => {
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.SEASONS}/game/${gameId}`);
    return response;
  } catch (error) {
    console.error('getSeasonsByGameId error:', error);
    throw error;
  }
};

// Tạo mùa giải mới (Admin only)
export const createSeason = async (seasonData) => {
  try {
    // Transform data để match với backend format
    const backendData = {
      gameId: seasonData.game_id,
      seasonName: seasonData.season_name,
      description: seasonData.description || null,
      start_date: seasonData.start_date || null,
      end_date: seasonData.end_date || null,
      status: seasonData.status || 'PREPARING'
    };
    
    console.log('Creating season with data:', backendData);
    
    const response = await apiClient.post(API_ENDPOINTS.SEASONS, backendData);
    return response;
  } catch (error) {
    console.error('createSeason error:', error);
    throw error;
  }
};

// Cập nhật thông tin mùa giải (Admin only)
export const updateSeason = async (id, seasonData) => {
  try {
    // Transform data để match với backend format
    const backendData = {
      season_name: seasonData.season_name,
      description: seasonData.description || null,
      start_date: seasonData.start_date || null,
      end_date: seasonData.end_date || null,
      status: seasonData.status
    };
    
    // Chỉ gửi các fields có giá trị
    Object.keys(backendData).forEach(key => {
      if (backendData[key] === undefined) {
        delete backendData[key];
      }
    });
    
    const response = await apiClient.put(`${API_ENDPOINTS.SEASONS}/${id}`, backendData);
    return response;
  } catch (error) {
    console.error('updateSeason error:', error);
    throw error;
  }
};

// Xóa mùa giải (Admin only)
export const deleteSeason = async (id) => {
  try {
    const response = await apiClient.delete(`${API_ENDPOINTS.SEASONS}/${id}`);
    return response;
  } catch (error) {
    console.error('deleteSeason error:', error);
    throw error;
  }
};
