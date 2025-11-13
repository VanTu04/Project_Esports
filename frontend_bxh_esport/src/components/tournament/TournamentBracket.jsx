import { useState, useEffect } from 'react';
import Button from '../common/Button';

/**
 * Component hiển thị Bracket Tournament dạng cây
 * Hiển thị các vòng đấu loại trực tiếp với kết nối trực quan
 * @param {boolean} compact - Chế độ compact với node nhỏ hơn
 */
export const TournamentBracket = ({ matches, onUpdateMatch, compact = false }) => {
  const [rounds, setRounds] = useState([]);

  useEffect(() => {
    if (!matches || matches.length === 0) return;

    // Group matches by round
    const roundsMap = {};
    matches.forEach(match => {
      const roundNum = match.round_number || 1;
      if (!roundsMap[roundNum]) {
        roundsMap[roundNum] = [];
      }
      roundsMap[roundNum].push(match);
    });

    // Convert to array and sort
    const roundsArray = Object.keys(roundsMap)
      .map(key => ({
        number: parseInt(key),
        matches: roundsMap[key].sort((a, b) => (a.match_order || 0) - (b.match_order || 0))
      }))
      .sort((a, b) => a.number - b.number);

    setRounds(roundsArray);
  }, [matches]);

  const getRoundName = (roundNumber, totalRounds) => {
    const remaining = totalRounds - roundNumber + 1;
    if (remaining === 1) return 'Chung kết';
    if (remaining === 2) return 'Bán kết';
    if (remaining === 3) return 'Tứ kết';
    if (remaining === 4) return '1/8';
    if (remaining === 5) return '1/16';
    return `Vòng ${roundNumber}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'border-green-500 bg-green-500/10';
      case 'LIVE':
        return 'border-amber-500 bg-amber-500/10 animate-pulse';
      case 'PENDING':
      default:
        return 'border-gray-600 bg-dark-400/50';
    }
  };

  const getWinnerStyle = (match, teamId) => {
    if (match.status !== 'COMPLETED') return '';
    if (match.winner_id === teamId) {
      return 'text-green-400 font-bold';
    }
    return 'text-gray-500 line-through';
  };

  if (rounds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-lg font-medium text-white mb-2">
          Chưa có trận đấu
        </h3>
        <p className="text-gray-400">
          Vui lòng bắt đầu giải đấu để tạo các trận đấu
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-8">
      <div className="inline-flex gap-8 min-w-max">
        {rounds.map((round, roundIndex) => (
          <div key={round.number} className="flex flex-col">
            {/* Round Header */}
            <div className="mb-6 text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50">
                <span className="text-sm font-bold text-cyan-300">
                  {getRoundName(round.number, rounds.length)}
                </span>
              </div>
            </div>

            {/* Matches */}
            <div className={`flex flex-col justify-around flex-1 ${compact ? 'gap-3' : 'gap-6'}`}>
              {round.matches.map((match, matchIndex) => (
                <div key={match.id} className="relative">
                  {/* Match Card */}
                  <div className={`
                    ${compact ? 'w-48' : 'w-64'} border-2 rounded-lg ${compact ? 'p-2' : 'p-4'} transition-all duration-200
                    hover:scale-105 hover:shadow-xl
                    ${getStatusColor(match.status)}
                  `}>
                    {/* Status Badge */}
                    <div className={`flex justify-between items-center ${compact ? 'mb-2' : 'mb-3'}`}>
                      <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-400`}>
                        #{match.match_order || matchIndex + 1}
                      </span>
                      {match.status === 'LIVE' && (
                        <span className={`px-1.5 py-0.5 ${compact ? 'text-[10px]' : 'text-xs'} font-bold text-red-400 bg-red-500/20 rounded animate-pulse`}>
                          🔴 LIVE
                        </span>
                      )}
                      {match.status === 'COMPLETED' && (
                        <span className={`px-1.5 py-0.5 ${compact ? 'text-[10px]' : 'text-xs'} font-bold text-green-400 bg-green-500/20 rounded`}>
                          ✓
                        </span>
                      )}
                    </div>

                    {/* Team 1 */}
                    <div className={`
                      flex items-center justify-between ${compact ? 'p-2' : 'p-3'} rounded
                      ${match.winner_id === match.team1_id 
                        ? 'bg-green-500/20 border-l-4 border-green-500' 
                        : 'bg-gradient-to-r from-gray-700/30 to-gray-800/30'
                      }
                      mb-2
                    `}>
                      <div className="flex-1 truncate">
                        <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold truncate ${match.winner_id === match.team1_id ? 'text-green-300' : 'text-white'}`}>
                          {match.Team1?.name || 'TBD'}
                        </p>
                      </div>
                      {match.score1 !== null && match.score1 !== undefined && (
                        <span className={`
                          ${compact ? 'text-base' : 'text-lg'} font-bold ml-2
                          ${match.winner_id === match.team1_id ? 'text-green-400' : 'text-gray-500'}
                        `}>
                          {match.score1}
                        </span>
                      )}
                    </div>

                    {/* VS Divider */}
                    <div className="text-center py-0.5">
                      <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-500 font-bold`}>VS</span>
                    </div>

                    {/* Team 2 */}
                    <div className={`
                      flex items-center justify-between ${compact ? 'p-2' : 'p-3'} rounded
                      ${match.winner_id === match.team2_id 
                        ? 'bg-green-500/20 border-l-4 border-green-500' 
                        : 'bg-gradient-to-r from-gray-700/30 to-gray-800/30'
                      }
                      ${compact ? 'mb-2' : 'mb-3'}
                    `}>
                      <div className="flex-1 truncate">
                        <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold truncate ${match.winner_id === match.team2_id ? 'text-green-300' : 'text-white'}`}>
                          {match.Team2?.name || match.team2_id ? 'TBD' : 'Bye'}
                        </p>
                      </div>
                      {match.score2 !== null && match.score2 !== undefined && (
                        <span className={`
                          ${compact ? 'text-base' : 'text-lg'} font-bold ml-2
                          ${match.winner_id === match.team2_id ? 'text-green-400' : 'text-gray-500'}
                        `}>
                          {match.score2}
                        </span>
                      )}
                    </div>

                    {/* Update Button - Only show for LIVE or COMPLETED matches and not in compact mode */}
                    {onUpdateMatch && match.status !== 'PENDING' && !compact && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="w-full"
                        onClick={() => onUpdateMatch(match)}
                      >
                        {match.status === 'COMPLETED' ? 'Chỉnh sửa kết quả' : 'Cập nhật kết quả'}
                      </Button>
                    )}
                    
                    {/* Pending status info */}
                    {match.status === 'PENDING' && (
                      <div className="text-center py-2">
                        <span className="text-xs text-gray-300">
                          ⏳ Chưa thể cập nhật
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Connection Line to Next Round */}
                  {roundIndex < rounds.length - 1 && (
                    <div className="absolute left-full top-1/2 w-8 border-t-2 border-primary-700/30">
                      {/* Horizontal line connecting to next round */}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Champion */}
        {rounds.length > 0 && rounds[rounds.length - 1].matches.length > 0 && (
          <div className="flex flex-col justify-center">
            {(() => {
              const finalMatch = rounds[rounds.length - 1].matches[0];
              const champion = finalMatch.status === 'COMPLETED' && finalMatch.winner_id
                ? (finalMatch.winner_id === finalMatch.team1_id ? finalMatch.Team1 : finalMatch.Team2)
                : null;

              if (champion) {
                return (
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="inline-flex items-center px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/50">
                        <span className="text-sm font-bold text-yellow-300">
                          🏆 Vô địch
                        </span>
                      </div>
                    </div>
                    <div className="w-64 border-4 border-yellow-500 rounded-lg p-6 bg-gradient-to-br from-yellow-500/20 to-amber-500/20">
                      <div className="text-6xl mb-4">👑</div>
                      <h3 className="text-xl font-bold text-yellow-400 mb-2">
                        {champion.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Đội vô địch giải đấu
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="text-center opacity-50">
                  <div className="mb-4">
                    <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-500/20 border border-gray-500/50">
                      <span className="text-sm font-bold text-gray-400">
                        🏆 Vô địch
                      </span>
                    </div>
                  </div>
                  <div className="w-64 border-2 border-dashed border-gray-600 rounded-lg p-6">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-lg font-medium text-gray-500 mb-2">
                      Chờ xác định
                    </h3>
                    <p className="text-sm text-gray-600">
                      Hoàn thành trận chung kết để xác định vô địch
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentBracket;
