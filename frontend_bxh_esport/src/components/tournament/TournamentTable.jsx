import { TournamentActions } from './TournamentActions';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

export const TournamentTable = ({ 
  tournaments,
  onViewRanking,
  onCreateRanking,
  onDelete,
  onOpenTeamApproval,
  onStartTournament,
  onOpenRegistration,
  onEdit,
  getStatusBadge 
}) => {
  const navigate = useNavigate();
  
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
              Thời gian
            </th>

            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Số vòng
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Vòng hiện tại
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
          {tournaments.map((tournament, index) => (
            <tr key={tournament.id} className="hover:bg-dark-300/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                #{tournament.id}
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <div 
                  className="text-sm font-medium text-white hover:text-primary-400 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/tournaments/${tournament.id}`)}
                >
                  {tournament.name || tournament.tournament_name}
                </div>

                {tournament.description && (
                  <div className="text-xs text-gray-400 truncate max-w-xs">
                    {tournament.description}
                  </div>
                )}

                {/* Đội chờ duyệt */}
                {tournament.status === 'upcoming' && tournament.teams?.pending > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Button
                      onClick={() => onOpenTeamApproval(tournament)}
                      variant="outline"
                      size="xs"
                      className="!text-yellow-400 !border-yellow-500/30 !bg-yellow-500/20 hover:!bg-yellow-500/30"
                    >
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {tournament.teams.pending} đội chờ duyệt
                    </Button>
                  </div>
                )}
              </td>

              {/*THỜI GIAN */}
              <td className="px-6 py-4 text-sm text-gray-400">
                {
                  (() => {
                    // Prefer explicit start_date/end_date, fall back to start_time/end_time from backend
                    const start = tournament.start_date || tournament.start_time || null;
                    const end = tournament.end_date || tournament.end_time || null;

                    if (start && end) {
                      try {
                        return (
                          <div>
                            <div className="text-white">{new Date(start).toLocaleDateString('vi-VN')}</div>
                            <div className="text-xs">đến {new Date(end).toLocaleDateString('vi-VN')}</div>
                          </div>
                        );
                      } catch (e) {
                        return <span className="italic text-gray-500">Định dạng thời gian không hợp lệ</span>;
                      }
                    }

                    return <span className="italic text-gray-500">Chưa xác định</span>;
                  })()
                }
              </td>

              {/* Số vòng */}
              <td className="px-6 py-4 text-sm text-white text-center">
                {tournament.total_rounds ?? '-'}
              </td>

              {/* Vòng hiện tại */}
              <td className="px-6 py-4 text-sm text-white text-center">
                {tournament.current_round ?? '-'}
              </td>

              {/* Trạng thái */}
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge?.(tournament)}
              </td>

              {/* Thao tác */}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <TournamentActions
                  tournament={tournament}
                  onViewRanking={onViewRanking}
                  onDelete={onDelete}
                  onStartTournament={onStartTournament}
                  onOpenRegistration={onOpenRegistration}
                  onEdit={onEdit}
                  isLastRow={index === tournaments.length - 1}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
