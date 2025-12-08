import React from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { formatTxHash, formatExplorerUrl } from '../../utils/formatters';
import RegistrationButton from './RegistrationButton';

export const getStatusBadge = (status) => {
  const s = (status || '').toString().toUpperCase();
  const map = {
    PENDING: { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Sắp diễn ra' },
    COMPLETED: { badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', label: 'Đã cập nhật kết quả' },
    DONE: { badge: 'bg-gray-700/20 text-gray-300 border-gray-700/30', label: 'Đã hoàn tất' },
    CANCELLED: { badge: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Hủy' }
  };
  const item = map[s] || { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: status || 'Chờ' };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${item.badge} ${item.badge.includes('bg-') ? '' : ''}`}>
      {item.label}
    </span>
  );
};

import { API_URL } from '../../utils/constants';

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
  
  // Show distribution column only when tournament.reward_distributed === 1
  const showDistribution = (tournament?.reward_distributed === 1 || tournament?.reward_distributed === '1');
  const rewardsColClass = showDistribution ? 'md:col-span-2' : 'md:col-span-1';
  const rankHeaderWidth = showDistribution ? 'w-1/6' : 'w-1/4';
  const rewardHeaderWidth = showDistribution ? 'w-2/6' : 'w-3/4';
  const distributionHeaderWidth = 'w-3/6';

  return (
    <Card padding="lg">
      {/* Header với ảnh */}
      <div className="flex items-center gap-6 mb-6">
        {tournament.image && (
          <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-primary-500/50 bg-dark-400 flex-shrink-0 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <img 
              src={tournament.image.startsWith('http') ? tournament.image : `${API_URL}${tournament.image}`}
              alt={tournament.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" text-anchor="middle" dominant-baseline="middle" fill="%23cbd5e1"%3E🏆%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Thông tin giải đấu</h2>
          {tournament.description && (
            <p className="text-sm text-gray-400 max-w-2xl line-clamp-2">{tournament.description}</p>
          )}
        </div>
      </div>
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
          <div className="md:col-span-1 p-5 rounded-lg border border-primary-500/10 bg-gradient-to-b from-primary-700/5 to-dark-600">
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
              <RegistrationButton tournament={tournament} isTeamView={isTeamView} />
            </div>
          </div>

          {/* Center column: rewards */}
          <div className={`${rewardsColClass} p-4 rounded-lg border border-primary-700/10 bg-gradient-to-r from-primary-900/5 to-primary-700/5`}>
            <h4 className="text-sm font-bold text-gray-400 mb-2 text-center">Phần thưởng</h4>
            <div className="w-full">
              {/* Debug info - remove after checking */}
              {console.log('🎁 Rewards Debug:', { normalizedRewards, prize_pool: tournament.prize_pool })}
              
              {(!normalizedRewards || normalizedRewards.length === 0) ? (
                tournament.prize_pool ? (
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-extrabold text-yellow-300">{tournament.prize_pool} ETH</div>
                    <div className="text-xs text-gray-400">Tổng giải thưởng</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">Chưa có thông tin phần thưởng</div>
                )
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-xs text-left table-fixed">
                    <caption className="sr-only">Top rewards</caption>
                    <thead>
                      <tr>
                        <th className={`${rankHeaderWidth} px-3 py-2 text-xs font-semibold text-white bg-primary-700/95`}>Hạng</th>
                        <th className={`${rewardHeaderWidth} px-3 py-2 text-xs font-semibold text-white bg-primary-700/95`}>Phần thưởng</th>
                        {showDistribution && (
                          <th className={`${distributionHeaderWidth} px-3 py-2 text-xs font-semibold text-white bg-primary-700/95`}>Phân phối</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {normalizedRewards.slice(0, 12).map((r, idx) => {
                        const rank = r.rank ?? (idx + 1);
                        const rawAmount = r.amount ?? r.reward_amount ?? r.value ?? r.prize ?? '-';
                        const amount = rawAmount === '-' || rawAmount == null ? 'Chưa có' : `${rawAmount} ETH`;
                        const rankClass = idx === 0 ? 'text-2xl font-extrabold text-white' : idx === 1 ? 'text-xl font-bold text-white' : idx === 2 ? 'text-lg font-semibold text-white' : 'text-base font-medium text-white';
                        const rewardClass = idx === 0 ? 'text-2xl font-extrabold text-yellow-200' : idx === 1 ? 'text-xl font-bold text-yellow-200' : idx === 2 ? 'text-lg font-semibold text-yellow-300' : 'text-base font-medium text-yellow-300';

                        const distributedAt = r.distributed_at ?? r.distributedAt ?? r.reward_distributed_at ?? null;
                        const txHash = r.hash ?? r.tx_hash ?? r.distributed_tx_hash ?? null;
                        const block = r.blockNumber ?? r.block_number ?? null;

                        return (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white/3' : ''}>
                            <td className={`px-4 py-3 ${rankClass}`}>#{rank}</td>
                            <td className={`px-4 py-3 ${rewardClass}`}>{amount}</td>
                            {showDistribution && (
                              <td className="px-4 py-3 text-sm text-gray-200">
                                {distributedAt || txHash || block ? (
                                  <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                                    <span className="text-gray-400 mr-2">{distributedAt ? (formatDateTime ? formatDateTime(distributedAt) : String(distributedAt)) : ''}</span>
                                    {block ? <span className="text-gray-400 mr-2">• #{block}</span> : null}
                                    {txHash ? (
                                      <a href={(formatExplorerUrl ? formatExplorerUrl(txHash) : `https://etherscan.io/tx/${txHash}`)} target="_blank" rel="noreferrer" className="text-primary-300 hover:underline">{formatTxHash ? formatTxHash(txHash) : txHash}</a>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span>—</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

         
        </div>
      </div>
    </Card>
  );
};

export default TournamentInfo;
