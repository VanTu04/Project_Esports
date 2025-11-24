import React from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';

export const getStatusBadge = (status) => {
  const s = (status || '').toString().toUpperCase();
  const map = {
    PENDING: { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Chờ (PENDING)' },
    COMPLETED: { badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', label: 'Đã cập nhật kết quả' },
    DONE: { badge: 'bg-gray-700/20 text-gray-300 border-gray-700/30', label: 'Đã hoàn tất (DONE)' },
    CANCELLED: { badge: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Hủy' }
  };
  const item = map[s] || { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: status || 'Chờ' };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${item.badge} ${item.badge.includes('bg-') ? '' : ''}`}>
      {item.label}
    </span>
  );
};

const TournamentInfo = ({
  tournament,
  teamsLength,
  matchesLength,
  normalizedRewards,
  formatDateTime,
  isTeamView,
  isAdmin,
  handleStartNewRound,
  creatingRound,
  teams = [],
}) => {
  return (
    <Card padding="lg">
      <h2 className="text-xl font-bold text-white mb-4">Thông tin giải đấu</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg p-4 border border-primary-500/30 bg-primary-500/10">
          <span className="text-gray-300 text-sm">Vòng đấu</span>
          <p className="text-2xl font-bold text-white">{tournament.current_round || 0}/{tournament.total_rounds || 0}</p>
        </div>
        <div className="rounded-lg p-4 border border-blue-500/30 bg-blue-500/10">
          <span className="text-gray-300 text-sm">Số đội</span>
          <p className="text-2xl font-bold text-white">{teamsLength}</p>
        </div>
        <div className="rounded-lg p-4 border border-green-500/30 bg-green-500/10">
          <span className="text-gray-300 text-sm">Trận đấu</span>
          <p className="text-2xl font-bold text-white">{matchesLength}</p>
        </div>
        <div className="rounded-lg p-4 border border-yellow-500/30 bg-yellow-500/10">
          <span className="text-gray-300 text-sm">Trạng thái</span>
          <p className="text-lg font-bold text-yellow-400">{tournament.status || 'PENDING'}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-5 rounded-lg border border-primary-500/10 bg-gradient-to-b from-primary-700/5 to-dark-600">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold text-gray-400">Phí đăng ký</div>
                <div className="mt-1 text-3xl font-extrabold text-white leading-none">{tournament.registration_fee != null ? `${tournament.registration_fee}` : (tournament.entry_fee != null ? `${tournament.entry_fee}` : (tournament.prize_pool ? `${tournament.prize_pool}` : '-'))}</div>
                <div className="text-sm text-gray-400">ETH</div>
              </div>
              <div className="text-right">{getStatusBadge(tournament.status)}</div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-cyan-300 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="text-xs font-bold text-gray-400">Bắt đầu</div>
                  <div className="text-gray-200">{tournament.start_date ? formatDateTime(tournament.start_date) : 'Chưa có'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-300 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="text-xs font-bold text-gray-400">Kết thúc</div>
                  <div className="text-gray-200">{tournament.end_date ? formatDateTime(tournament.end_date) : 'Chưa có'}</div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {isTeamView && String(tournament.status).toUpperCase() === 'PENDING' && (tournament.isReady === 1 || tournament.is_ready === 1 || tournament.isReady === true) ? (
                <Button onClick={() => window.location.href = '/team-managers/tournaments'} className="w-full py-3 text-lg" variant="primary">Đăng ký ngay</Button>
              ) : null}
            </div>
          </div>

          <aside className="md:col-span-1 p-4 rounded-lg border border-primary-700/10 bg-gradient-to-r from-primary-900/5 to-primary-700/5">
            <h4 className="text-sm font-bold text-gray-400 mb-2">Phần thưởng</h4>
            <div className="w-full">
              {(!normalizedRewards || normalizedRewards.length === 0) ? (
                tournament.prize_pool ? <div className="text-sm text-gray-200">Tổng: {tournament.prize_pool}</div> : <div className="text-sm text-gray-500">Chưa có thông tin</div>
              ) : (
                <div className="w-full">
                  <table className="w-full text-xs text-left table-fixed">
                    <caption className="sr-only">Top rewards</caption>
                    <thead>
                      <tr>
                        <th className="w-1/4 px-3 py-2 text-xs font-semibold text-white bg-primary-700/95">Rank</th>
                        <th className="w-3/4 px-3 py-2 text-xs font-semibold text-white bg-primary-700/95">Reward</th>
                      </tr>
                    </thead>
                    <tbody>
                      {normalizedRewards.slice(0, 8).map((r, idx) => {
                        const rank = r.rank ?? (idx + 1);
                        const rawAmount = r.amount ?? r.reward_amount ?? r.value ?? r.prize ?? '-';
                        const amount = rawAmount === '-' || rawAmount == null ? 'Chưa có' : `${rawAmount} ETH`;
                        const rankClass = idx === 0 ? 'text-2xl font-extrabold text-white' : idx === 1 ? 'text-xl font-bold text-white' : idx === 2 ? 'text-lg font-semibold text-white' : 'text-base font-medium text-white';
                        const rewardClass = idx === 0 ? 'text-2xl font-extrabold text-yellow-200' : idx === 1 ? 'text-xl font-bold text-yellow-200' : idx === 2 ? 'text-lg font-semibold text-yellow-300' : 'text-base font-medium text-yellow-300';
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white/3' : ''}>
                            <td className={`px-4 py-3 ${rankClass}`}>#{rank}</td>
                            <td className={`px-4 py-3 ${rewardClass}`}>{amount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Card>
  );
};

export default TournamentInfo;
