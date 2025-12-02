import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import favoriteTeamService from '../../services/favoriteTeamService';
import { TeamCard } from '../../components/team/TeamCard';
import { useNotification } from '../../context/NotificationContext';

export const FavoriteTeams = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadFavoriteTeams();
    }
  }, [user]);

  const loadFavoriteTeams = async () => {
    try {
      setLoading(true);
      const data = await favoriteTeamService.getFavoriteTeams();
      setTeams(data.teams || []);
    } catch (error) {
      console.error(error);
      showError('Không thể tải danh sách đội yêu thích');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteChange = (teamId, isFavorite) => {
    // Remove team from list if unfavorited
    if (!isFavorite) {
      setTeams(teams.filter(team => team.id !== teamId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Đội yêu thích</h1>
          <p className="text-gray-400">Danh sách các đội bạn đang theo dõi</p>
        </div>
        <div className="text-sm text-gray-400">
          {teams.length} đội
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Chưa có đội yêu thích</h3>
          <p className="text-gray-500 mb-6">Hãy khám phá và thêm các đội bạn yêu thích vào danh sách</p>
          <a
            href="/teams"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Khám phá đội
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              isFavorite={true}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      )}

      
    </div>
  );
};