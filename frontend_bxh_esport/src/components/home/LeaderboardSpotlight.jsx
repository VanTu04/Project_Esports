import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import teamService from '../../services/teamService';
import Loading from '../common/Loading';
import { normalizeImageUrl } from '../../utils/imageHelpers';

const LeaderboardSpotlight = ({ mvpPlayer = null }) => {
  const navigate = useNavigate();
  const [topTeams, setTopTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopTeams();
  }, []);

  const fetchTopTeams = async () => {
    try {
      setLoading(true);
      const response = await teamService.getTopTeamsByWins(5);
      
      // Check if response is successful (code 0 means success in your API)
      if (response.data && response.data.code === 0) {
        setTopTeams(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching top teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const PodiumCard = ({ team, rank }) => {
    const medalColors = {
      1: { bg: 'from-yellow-600 to-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/50', ring: 'ring-yellow-400/50' },
      2: { bg: 'from-gray-400 to-gray-500', text: 'text-gray-300', glow: 'shadow-gray-500/50', ring: 'ring-gray-400/50' },
      3: { bg: 'from-orange-600 to-orange-700', text: 'text-orange-400', glow: 'shadow-orange-500/50', ring: 'ring-orange-400/50' },
    };

    const colors = medalColors[rank] || medalColors[3];
    const height = rank === 1 ? 'h-72' : rank === 2 ? 'h-64' : 'h-60';

    return (
      <div className={`relative flex flex-col items-center ${rank === 1 ? 'order-2 scale-110' : rank === 2 ? 'order-1' : 'order-3'}`}>
        {/* Rank Badge */}
        <div className={`absolute -top-4 z-10 w-12 h-12 bg-gradient-to-br ${colors.bg} rounded-full flex items-center justify-center shadow-lg ${colors.glow} ring-4 ring-gray-900`}>
          <span className="text-white font-black text-xl">#{rank}</span>
        </div>

        {/* Card */}
        <div className={`relative w-full ${height} bg-gradient-to-b from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl border-2 ${rank === 1 ? 'border-yellow-400/50' : rank === 2 ? 'border-gray-400/50' : 'border-orange-400/50'} overflow-hidden group hover:scale-105 transition-transform cursor-pointer`}
          onClick={() => navigate(`/teams/${team.id}`)}
        >
          {/* Glow Effect */}
          <div className={`absolute inset-0 bg-gradient-to-t ${colors.bg} opacity-10 group-hover:opacity-20 transition-opacity`} />
          
          {/* Crown for #1 */}
          {rank === 1 && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
              <svg className="w-10 h-10 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          )}

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center p-4 pt-6">
            {/* Team Logo */}
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center mb-3 ring-4 ${colors.ring} shadow-xl ${colors.glow} flex-shrink-0`}>
              {team?.logo || team?.avatar ? (
                <img 
                  src={normalizeImageUrl(team.logo || team.avatar)} 
                  alt={team.name} 
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => { 
                    e.currentTarget.onerror = null; 
                    e.currentTarget.src = '/default-avatar.png'; 
                  }}
                />
              ) : (
                <span className="text-3xl font-black text-white">
                  {team?.name?.charAt(0).toUpperCase() || 'T'}
                </span>
              )}
            </div>

            {/* Team Name - Fixed with better spacing and wrapping */}
            <h3 className={`text-lg font-black ${colors.text} text-center mb-3 px-2 line-clamp-2 min-h-[3rem] flex items-center`}>
              {team?.name || team?.team_name || 'Unknown Team'}
            </h3>

            {/* Stats - Compact layout */}
            <div className="space-y-1.5 text-center w-full">
              <div className="flex items-center justify-center gap-1.5 text-white">
                <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-sm">{team?.wins || 0} Thắng</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-gray-400">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-sm">{team?.losses || 0} Thua</span>
              </div>
              <div className={`text-xl font-black ${colors.text} pt-1`}>
                {team?.points || team?.total_points || 0} Điểm
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MVPCard = () => {
    if (!mvpPlayer) return null;

    return (
      <div className="relative bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30 overflow-hidden group hover:border-purple-400/50 transition-all">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse" />
        
        {/* Content */}
        <div className="relative flex items-center gap-6">
          {/* MVP Badge */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-purple-500/50 ring-4 ring-purple-400/30">
              {mvpPlayer?.avatar ? (
                <img src={mvpPlayer.avatar} alt={mvpPlayer.name} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-white">
                  {mvpPlayer?.name?.charAt(0).toUpperCase() || 'M'}
                </span>
              )}
            </div>
            {/* Star Icon */}
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg animate-spin-slow">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-xs font-black rounded-full uppercase">
                MVP Tuần
              </span>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              {mvpPlayer?.name || mvpPlayer?.username || 'Unknown Player'}
            </h3>
            <p className="text-purple-300 text-sm mb-3">
              {mvpPlayer?.team_name || 'Independent Player'}
            </p>
            
            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-bold">{mvpPlayer?.kills || 0} Kills</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-white font-bold">{mvpPlayer?.mvp_count || 0} MVP</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                <span className="text-white font-bold">{mvpPlayer?.winrate || 0}% WR</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-12 bg-gradient-to-b from-gray-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gradient-to-b from-gray-900/50 to-transparent">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Bảng Vinh Danh
          </h2>
          <button 
            onClick={() => navigate('/teams')}
            className="text-primary-400 hover:text-primary-300 text-sm font-semibold transition-colors"
          >
            Xem BXH đầy đủ →
          </button>
        </div>

        {/* Top 3 Teams Podium */}
        {topTeams.length > 0 && (
          <div className="mb-12">

            <div className="grid grid-cols-3 gap-6 items-end">
              {topTeams.slice(0, 3).map((team, index) => (
                <PodiumCard key={team.id} team={team} rank={index + 1} />
              ))}
            </div>
          </div>
        )}

        {/* MVP Player */}
        {mvpPlayer && (
          <div>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-purple-400">⭐</span>
              Cầu Thủ Xuất Sắc Tuần
            </h3>
            <MVPCard />
          </div>
        )}

        {/* Empty State */}
        {topTeams.length === 0 && !mvpPlayer && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800/50 rounded-full mb-4">
              <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">Chưa có dữ liệu bảng xếp hạng</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardSpotlight;
