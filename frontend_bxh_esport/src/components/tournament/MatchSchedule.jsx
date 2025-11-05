import { formatDate } from '../../utils/helpers';
import { formatMatchScore } from '../../utils/formatters';
import Card from '../common/Card';
import Loading from '../common/Loading';

export const MatchSchedule = ({ matches, loading }) => {
  if (loading) {
    return <Loading />;
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Không có trận đấu nào
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Card key={match.id} hover className="p-4">
          <div className="flex items-center justify-between">
            {/* Team 1 */}
            <div className="flex items-center gap-3 flex-1">
              <img
                src={match.team1?.logo || '/default-team.png'}
                alt={match.team1?.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h4 className="font-semibold text-white">{match.team1?.name}</h4>
                <p className="text-sm text-gray-400">{match.team1?.region}</p>
              </div>
            </div>

            {/* Score or Time */}
            <div className="flex flex-col items-center px-6">
              {match.status === 'completed' ? (
                <>
                  <div className="text-2xl font-bold text-primary-500">
                    {formatMatchScore(match.team1Score, match.team2Score)}
                  </div>
                  <span className="text-xs text-gray-400">Kết thúc</span>
                </>
              ) : match.status === 'live' ? (
                <>
                  <div className="text-red-500 font-bold animate-pulse">LIVE</div>
                  <span className="text-xs text-gray-400">Đang diễn ra</span>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-300">
                    {formatDate(match.scheduledAt, 'HH:mm')}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(match.scheduledAt, 'dd/MM')}
                  </span>
                </>
              )}
            </div>

            {/* Team 2 */}
            <div className="flex items-center gap-3 flex-1 flex-row-reverse">
              <img
                src={match.team2?.logo || '/default-team.png'}
                alt={match.team2?.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="text-right">
                <h4 className="font-semibold text-white">{match.team2?.name}</h4>
                <p className="text-sm text-gray-400">{match.team2?.region}</p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

