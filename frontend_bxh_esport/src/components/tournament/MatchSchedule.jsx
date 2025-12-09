import { formatDate } from '../../utils/helpers';
import Card from '../common/Card';
import Loading from '../common/Loading';
import { normalizeImageUrl } from '../../utils/imageHelpers';

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

  const now = new Date();

  // BƯỚC 1: Phân tách luồng - Tách Upcoming và History
  const upcomingMatches = [];
  const historyMatches = [];

  (matches || []).forEach((m) => {
    if (!m.scheduledAt) return;
    const status = (m.status || '').toString().toUpperCase();
    
    if (status === 'PENDING') {
      upcomingMatches.push(m);
    } else if (['COMPLETED', 'DONE', 'CANCELLED'].includes(status)) {
      historyMatches.push(m);
    }
  });

  // BƯỚC 2: Sắp xếp
  // Upcoming: Tăng dần (gần nhất trước)
  upcomingMatches.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  
  // History: Giảm dần (mới nhất trước)
  historyMatches.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  // BƯỚC 3: Gom nhóm theo ngày
  const groupByDate = (matchList) => {
    const grouped = {};
    matchList.forEach((m) => {
      const matchDate = new Date(m.scheduledAt);
      const dateKey = formatDate(matchDate, 'EEEE, dd/MM/yyyy'); // "THỨ HAI, 09/12/2024"
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: matchDate,
          matches: []
        };
      }
      grouped[dateKey].matches.push(m);
    });
    return Object.keys(grouped).map(key => ({
      title: key,
      date: grouped[key].date,
      matches: grouped[key].matches
    }));
  };

  const upcomingGroups = groupByDate(upcomingMatches);
  const historyGroups = groupByDate(historyMatches);

  // Helper để xác định đội thắng
  const getWinningSide = (match) => {
    const scoreA = parseInt(match.team1Score || match.team_a_score) || 0;
    const scoreB = parseInt(match.team2Score || match.team_b_score) || 0;
    if (scoreA > scoreB) return 'A';
    if (scoreB > scoreA) return 'B';
    return 'DRAW';
  };

  // Component MatchRow với visual states
  const MatchRow = ({ match }) => {
    const status = (match.status || '').toString().toUpperCase();
    const winner = getWinningSide(match);
    const isCancelled = status === 'CANCELLED';
    const isCompleted = ['COMPLETED', 'DONE', 'FINISHED'].includes(status);
    const isPending = ['PENDING', 'SCHEDULED'].includes(status);

    // Extract team data (support both field naming conventions)
    const team1Name = match.team1?.name || match.team_a_name;
    const team2Name = match.team2?.name || match.team_b_name;
    const team1Logo = match.team1?.logo || match.team_a_avatar;
    const team2Logo = match.team2?.logo || match.team_b_avatar;
    const team1Score = match.team1Score ?? match.team_a_score ?? 0;
    const team2Score = match.team2Score ?? match.team_b_score ?? 0;

    // Styling logic
    const rowOpacity = isCancelled ? 'opacity-40' : 'opacity-100';
    const team1Bright = isCompleted && winner === 'A' ? 'text-white' : isCompleted ? 'text-gray-500' : 'text-white';
    const team2Bright = isCompleted && winner === 'B' ? 'text-white' : isCompleted ? 'text-gray-500' : 'text-white';
    const vsColor = isPending ? 'text-gray-500' : 'text-white';

    return (
      <Card className={`p-4 hover:border-purple-500/50 transition-colors ${rowOpacity}`}>
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* LEFT: Time/Status (col-span-2) */}
          <div className="col-span-2 text-sm">
            {isPending ? (
              <div className="text-gray-400">
                {formatDate(new Date(match.scheduledAt), 'HH:mm')}
              </div>
            ) : isCancelled ? (
              <div className="inline-block px-2 py-1 bg-red-900/20 text-red-400 rounded text-xs font-medium">
                ĐÃ HỦY
              </div>
            ) : (
              <div className="inline-block px-2 py-1 bg-green-900/20 text-green-400 rounded text-xs font-medium">
                KẾT THÚC
              </div>
            )}
          </div>

          {/* CENTER: Teams & Score (col-span-8) */}
          <div className="col-span-8">
            <div className="flex items-center justify-between">
              {/* Team A */}
              <div className={`flex items-center space-x-3 flex-1 ${team1Bright} transition-colors`}>
                {team1Logo ? (
                  <img
                    src={normalizeImageUrl(team1Logo)}
                    alt={team1Name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-logo.png';
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700" />
                )}
                <span className="font-semibold truncate">
                  {team1Name}
                </span>
              </div>

              {/* Score or VS */}
              <div className="mx-6 text-center min-w-[80px]">
                {isPending ? (
                  <span className={`${vsColor} font-medium text-sm`}>VS</span>
                ) : isCancelled ? (
                  <span className="text-gray-600 text-sm">- : -</span>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span className={`text-xl font-bold ${team1Bright}`}>
                      {team1Score}
                    </span>
                    <span className="text-gray-600">:</span>
                    <span className={`text-xl font-bold ${team2Bright}`}>
                      {team2Score}
                    </span>
                  </div>
                )}
              </div>

              {/* Team B */}
              <div className={`flex items-center space-x-3 flex-1 justify-end ${team2Bright} transition-colors`}>
                <span className="font-semibold truncate">
                  {team2Name}
                </span>
                {team2Logo ? (
                  <img
                    src={normalizeImageUrl(team2Logo)}
                    alt={team2Name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-logo.png';
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700" />
                )}
              </div>
            </div>

            {/* Tournament & Round Info */}
            {(match.tournamentName || match.round) && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                {match.tournamentName} {match.round && `• Vòng ${match.round}`}
              </div>
            )}
          </div>

          {/* RIGHT: Action Button (col-span-2) */}
          <div className="col-span-2 flex justify-end">
            <button 
              className="text-gray-400 hover:text-purple-400 transition-colors"
              onClick={() => {/* TODO: Navigate to match detail */}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* UPCOMING MATCHES SECTION */}
      {upcomingGroups.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="w-1 h-6 bg-purple-500 mr-3"></span>
            Trận đấu sắp diễn ra
          </h3>
          <div className="space-y-6">
            {upcomingGroups.map((group, idx) => (
              <div key={idx}>
                <div className="text-sm text-gray-400 mb-3 font-medium uppercase">
                  {group.title}
                </div>
                <div className="space-y-3">
                  {group.matches.map((m) => (
                    <MatchRow key={m.id} match={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTORY MATCHES SECTION */}
      {historyGroups.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="w-1 h-6 bg-gray-600 mr-3"></span>
            Lịch sử trận đấu
          </h3>
          <div className="space-y-6">
            {historyGroups.map((group, idx) => (
              <div key={idx}>
                <div className="text-sm text-gray-400 mb-3 font-medium uppercase">
                  {group.title}
                </div>
                <div className="space-y-3">
                  {group.matches.map((m) => (
                    <MatchRow key={m.id} match={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when both sections are empty */}
      {upcomingGroups.length === 0 && historyGroups.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Không có trận đấu nào
        </div>
      )}
    </div>
  );
};

