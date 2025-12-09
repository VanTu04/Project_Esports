import { apiClient } from './api';
import { API_ENDPOINTS } from '../utils/constants';

const favoriteTeamService = {
  // Add team to favorites
  addFavoriteTeam: async (teamId) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.FAVORITE_TEAMS, { team_id: teamId });
      const payload = res && res.data ? res.data : res;
      return payload.data || payload;
    } catch (error) {
      console.error('favoriteTeamService.addFavoriteTeam error', error);
      throw error;
    }
  },

  // Remove team from favorites
  removeFavoriteTeam: async (teamId) => {
    try {
      const res = await apiClient.delete(`${API_ENDPOINTS.FAVORITE_TEAMS}/${teamId}`);
      const payload = res && res.data ? res.data : res;
      return payload.data || payload;
    } catch (error) {
      console.error('favoriteTeamService.removeFavoriteTeam error', error);
      throw error;
    }
  },

  // Get all favorite teams
  getFavoriteTeams: async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.FAVORITE_TEAMS);
      const payload = res && res.data ? res.data : res;
      if (payload && payload.data) return payload.data;
      return payload;
    } catch (error) {
      console.error('favoriteTeamService.getFavoriteTeams error', error);
      throw error;
    }
  },

  // Check if team is favorited
  checkFavoriteTeam: async (teamId) => {
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.FAVORITE_TEAMS}/check/${teamId}`);
      const payload = res && res.data ? res.data : res;
      if (payload && payload.data) return payload.data;
      return payload;
    } catch (error) {
      console.error('favoriteTeamService.checkFavoriteTeam error', error);
      throw error;
    }
  },

  // Get favorite status for multiple teams
  getFavoriteStatus: async (teamIds) => {
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.FAVORITE_TEAMS}/status`, { team_ids: teamIds });
      const payload = res && res.data ? res.data : res;
      if (payload && payload.data) return payload.data;
      return payload;
    } catch (error) {
      console.error('favoriteTeamService.getFavoriteStatus error', error);
      throw error;
    }
  },

  // Toggle favorite (add if not favorited, remove if already favorited)
  toggleFavoriteTeam: async (teamId, isFavorite) => {
    try {
      if (isFavorite) {
        return await favoriteTeamService.removeFavoriteTeam(teamId);
      } else {
        return await favoriteTeamService.addFavoriteTeam(teamId);
      }
    } catch (error) {
      console.error('favoriteTeamService.toggleFavoriteTeam error', error);
      throw error;
    }
  },
  // Get followers of a team (users who favorited this team)
  getFollowers: async (teamId) => {
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.TEAMS}/${teamId}/followers`);
      const payload = res && res.data ? res.data : res;
      if (payload && payload.data) return payload.data;
      return payload;
    } catch (error) {
      console.error('favoriteTeamService.getFollowers error', error);
      throw error;
    }
  },

  // Get following list for a user/team (teams that user follows)
  getFollowing: async (userId) => {
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.TEAMS}/${userId}/following`);
      const payload = res && res.data ? res.data : res;
      if (payload && payload.data) return payload.data;
      return payload;
    } catch (error) {
      console.error('favoriteTeamService.getFollowing error', error);
      throw error;
    }
  }
};

export default favoriteTeamService;
