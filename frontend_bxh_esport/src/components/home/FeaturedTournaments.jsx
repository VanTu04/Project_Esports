import React, { useState } from 'react';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { TournamentCard } from '../tournament/TournamentCard';
import { useNavigate } from 'react-router-dom';

const FeaturedTournaments = ({ tournaments = [], games = [], selectedGameName = '' }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'registration', 'ongoing'
  const navigate = useNavigate();

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

  // Use shared TournamentCard component for consistent card UI

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
