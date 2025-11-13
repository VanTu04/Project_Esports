import { apiClient } from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Service xử lý các API liên quan đến Game
 */

// Lấy danh sách tất cả game
export const getAllGames = async (status = null) => {
  try {
    const params = status !== null ? { status } : {};
    const response = await apiClient.get(API_ENDPOINTS.GAMES, { params });
    return response;
  } catch (error) {
    console.error('getAllGames error:', error);
    throw error;
  }
};

// Lấy thông tin game theo ID
export const getGameById = async (id) => {
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.GAMES}/${id}`);
    return response;
  } catch (error) {
    console.error('getGameById error:', error);
    throw error;
  }
};

// Tạo game mới (Admin only)
export const createGame = async (gameData) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.GAMES, gameData);
    return response;
  } catch (error) {
    console.error('createGame error:', error);
    throw error;
  }
};

// Cập nhật thông tin game (Admin only)
export const updateGame = async (id, gameData) => {
  try {
    const response = await apiClient.put(`${API_ENDPOINTS.GAMES}/${id}`, gameData);
    return response;
  } catch (error) {
    console.error('updateGame error:', error);
    throw error;
  }
};

// Xóa game (Admin only)
export const deleteGame = async (id) => {
  try {
    const response = await apiClient.delete(`${API_ENDPOINTS.GAMES}/${id}`);
    return response;
  } catch (error) {
    console.error('deleteGame error:', error);
    throw error;
  }
};
