import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import favoriteTeamService from '../../services/favoriteTeamService';
import { TeamCard } from '../../components/team/TeamCard';
import { useNotification } from '../../context/NotificationContext';
import PublicLayout from '../../components/layout/PublicLayout';
import { HeartIcon, SparklesIcon } from '@heroicons/react/24/outline';

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

  // Show loading if user is not loaded yet
  if (!user || loading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-dark-500 via-dark-400 to-dark-500">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-900/20 via-primary-800/10 to-dark-500 border-b border-primary-700/20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-500/50"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-xl border border-primary-500/30">
              <HeartIcon className="h-8 w-8 text-primary-400" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Đội yêu thích
              </h1>
              <p className="text-lg text-gray-400">
                Theo dõi và cổ vũ cho những đội bạn yêu thích
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-dark-400/50 rounded-lg border border-primary-700/30">
              <SparklesIcon className="h-5 w-5 text-primary-400" />
              <span className="text-white font-semibold">{teams.length}</span>
              <span className="text-gray-400">đội</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {teams.length === 0 ? (
          <div className="bg-gradient-to-br from-dark-400 to-dark-500 rounded-2xl p-12 text-center border border-primary-700/20 shadow-2xl">
            <div className="max-w-md mx-auto">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-600/20 blur-3xl rounded-full"></div>
                <div className="relative bg-gradient-to-br from-primary-500/10 to-primary-600/5 rounded-full p-6 inline-block border border-primary-500/20">
                  <HeartIcon className="w-16 h-16 text-primary-400" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-3">
                Chưa có đội yêu thích
              </h3>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Hãy khám phá và thêm các đội bạn yêu thích vào danh sách để không bỏ lỡ bất kỳ trận đấu nào
              </p>
              
              <Link
                to="/teams"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-primary-500/50 transform hover:scale-105"
              >
                <SparklesIcon className="w-5 h-5" />
                Khám phá đội
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
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
    </div>
    </PublicLayout>
  );
};