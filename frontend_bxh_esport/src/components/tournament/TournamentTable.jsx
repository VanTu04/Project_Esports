import { TournamentActions } from './TournamentActions';

/**
 * Component hiển thị bảng danh sách giải đấu
 */
export const TournamentTable = ({ 
  tournaments,
  onViewRanking,
  onCreateRanking,
  onDelete,
  onOpenTeamApproval,
  getStatusBadge 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-primary-700/20">
        <thead className="bg-dark-300">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Tên Giải đấu
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Game
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Thời gian
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-primary-700/20">
          {tournaments.map(tournament => (
            <tr key={tournament.id} className="hover:bg-dark-300/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                #{tournament.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-white">
                  {tournament.name || tournament.tournament_name}
                </div>
                {tournament.description && (
                  <div className="text-xs text-gray-400 truncate max-w-xs">
                    {tournament.description}
                  </div>
                )}
                {/* Ghi chú đội chờ duyệt - Chỉ hiển thị khi giải đấu sắp diễn ra */}
                {tournament.status === 'upcoming' && tournament.teams?.pending > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      onClick={() => onOpenTeamApproval(tournament)}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors cursor-pointer"
                    >
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {tournament.teams.pending} đội chờ duyệt
                    </button>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-400">
                {tournament.game_name || tournament.game || '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-400">
                {tournament.start_date && tournament.end_date ? (
                  <div>
                    <div className="text-white">{new Date(tournament.start_date).toLocaleDateString('vi-VN')}</div>
                    <div className="text-xs">đến {new Date(tournament.end_date).toLocaleDateString('vi-VN')}</div>
                  </div>
                ) : (
                  'Chưa xác định'
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(tournament.status || 'draft')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <TournamentActions
                  tournament={tournament}
                  onViewRanking={onViewRanking}
                  onCreateRanking={onCreateRanking}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
