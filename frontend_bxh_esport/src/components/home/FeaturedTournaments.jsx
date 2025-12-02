import React, { useState } from 'react';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

const FeaturedTournaments = ({ tournaments = [], games = [], selectedGameName = '' }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'registration', 'ongoing'
  const navigate = useNavigate();

  // Calculate total prize from rewards array
  const calculateTotalPrize = (tournament) => {
    if (tournament?.rewards && Array.isArray(tournament.rewards)) {
      return tournament.rewards.reduce((sum, reward) => sum + (Number(reward.reward_amount) || 0), 0);
    }
    return tournament?.prize || tournament?.prize_pool || tournament?.total_prize || 0;
  };
  
  // Get game name by id
  const getGameName = (gameId) => {
    const game = games.find(g => g.id === gameId);
    return game?.name || game?.game_name || '';
  };

  const filteredTournaments = (() => {
    const statusUpper = (t) => (t?.status || '').toString().toUpperCase();
    const isReady = (t) => t?.isReady === 1 || t?.is_ready === 1;
    
    // Lọc theo filter
    let filtered = tournaments.filter((tournament) => {
      const status = statusUpper(tournament);
      const ready = isReady(tournament);
      
      if (filter === 'all') return true;
      if (filter === 'registration') {
        return status === 'PENDING' && ready;
      }
      if (filter === 'ongoing') {
        return status === 'ACTIVE' && ready;
      }
      return true;
    });

    // Sắp xếp theo thời gian: giải sắp diễn ra trước
    filtered.sort((a, b) => {
      const dateA = new Date(a.start_date || a.startDate);
      const dateB = new Date(b.start_date || b.startDate);
      return dateA - dateB;
    });
    
    // Giới hạn tối đa: tab "Tất cả" hiển thị 9 giải, các tab khác 6 giải
    const maxDisplay = filter === 'all' ? 9 : 6;
    return filtered.slice(0, maxDisplay);
  })();

  const TournamentCard = ({ tournament }) => {
    const statusUpper = (tournament?.status || '').toString().toUpperCase();
    const isReady = tournament?.isReady === 1 || tournament?.is_ready === 1;
    const isRegistrationOpen = statusUpper === 'PENDING' || statusUpper === 'REGISTRATION' || isReady;
    const currentTeams = tournament?.participants?.length || tournament?.participants_count || 0;
    const maxTeams = tournament?.total_team || tournament?.max_teams || 32;
    const progress = maxTeams > 0 ? (currentTeams / maxTeams) * 100 : 0;
    const registrationFee = tournament?.registration_fee || tournament?.entry_fee || 0;

    return (
      <div className="group bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/20 transform hover:-translate-y-1">
        {/* Banner Image */}
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900">
          {tournament?.banner || tournament?.image ? (
            <img
              src={tournament.banner || tournament.image}
              alt={tournament.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          )}
          
          {/* Game Icon Overlay */}
          {tournament?.game_icon && (
            <div className="absolute top-3 left-3 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
              <img
                src={tournament.game_icon}
                alt="Game"
                className="w-full h-full object-contain p-1"
              />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            {isRegistrationOpen ? (
              <span className="px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Đang mở đăng ký
              </span>
            ) : statusUpper === 'ACTIVE' || statusUpper === 'ONGOING' ? (
              <span className="px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-lg">
                Đang diễn ra
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-lg">
                Đã kết thúc
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Tournament Name & Game Name */}
          <div>
            <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
              {tournament?.name || tournament?.tournament_name}
              {tournament?.game_id && (
                <span className="text-sm text-primary-400 font-normal ml-2">
                  ({getGameName(tournament.game_id)})
                </span>
              )}
            </h3>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Prize Pool */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-gray-400">Giải thưởng</p>
                <p className="font-bold text-yellow-400 truncate">
                  {calculateTotalPrize(tournament)} ETH
                </p>
              </div>
            </div>

            {/* Entry Fee */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-gray-400">Phí tham gia</p>
                <p className="font-bold text-blue-400 truncate">
                  {registrationFee > 0 ? `${registrationFee} ETH` : 'Miễn phí'}
                </p>
              </div>
            </div>
          </div>

          {/* Teams Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Số đội tham gia</span>
              <span className="text-sm font-bold text-white">
                {currentTeams}/{maxTeams} Slots
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-2 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  progress >= 90
                    ? 'bg-gradient-to-r from-red-600 to-red-500'
                    : progress >= 50
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-500'
                    : 'bg-gradient-to-r from-green-600 to-green-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                {progress >= 90 && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                )}
              </div>
            </div>
            
            {progress >= 90 && (
              <p className="text-xs text-red-400 mt-1 font-semibold">⚠️ Sắp hết slot!</p>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              if (isRegistrationOpen) {
                navigate(`/tournaments/${tournament.id}/register`);
              } else {
                navigate(`/tournaments/${tournament.id}`);
              }
            }}
            className={`w-full py-3 rounded-lg font-bold transition-all transform group-hover:scale-105 ${
              isRegistrationOpen
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white shadow-lg shadow-primary-500/30'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {isRegistrationOpen ? 'Tham gia ngay' : 'Xem chi tiết'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <svg className="w-8 h-8 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Giải đấu nổi bật{selectedGameName && <span className="text-primary-400">- {selectedGameName}</span>}
          </h2>
          <a href="/tournaments" className="text-primary-400 hover:text-primary-300 text-sm font-semibold transition-colors">
            Xem tất cả →
          </a>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('registration')}
            className={`px-6 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              filter === 'registration'
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            {filter === 'registration' && (
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
            Đang mở đăng ký
          </button>
          <button
            onClick={() => setFilter('ongoing')}
            className={`px-6 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              filter === 'ongoing'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            {filter === 'ongoing' && (
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
            Đang diễn ra
          </button>
        </div>

        {/* Tournament Grid */}
        {filteredTournaments.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800/50 rounded-full mb-4">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">Không có giải đấu nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedTournaments;
