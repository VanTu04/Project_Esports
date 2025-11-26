import { formatDate } from '../../utils/helpers';
import { formatMatchScore } from '../../utils/formatters';
import Card from '../common/Card';
import Loading from '../common/Loading';
import { API_BACKEND } from '../../utils/constants';

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

  // Group matches by formatted scheduled time
  const grouped = {};
  (matches || []).forEach((m) => {
    if (!m.scheduledAt) return;
    const key = formatDate(m.scheduledAt, 'dd/MM HH:mm');
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });

  // helper to normalize logo URLs (fix duplicated host, relative paths, etc.)
  const normalizeLogoUrl = (raw) => {
    if (!raw) return null;
    try {
      let url = String(raw).trim();
      const lastHttp = url.lastIndexOf('http');
      if (lastHttp > 0) url = url.substring(lastHttp);
      if (url.startsWith('//')) url = (window?.location?.protocol || 'https:') + url;
      if (url.startsWith('/')) return `${API_BACKEND || ''}${url}`;
      if (!url.startsWith('http')) return `http://${url}`;
      return url;
    } catch (e) {
      return raw;
    }
  };

  // Convert to array and sort by actual date
  const groupArray = Object.keys(grouped).map((k) => ({
    time: k,
    date: new Date(grouped[k][0].scheduledAt),
    matches: grouped[k],
  })).sort((a, b) => a.date - b.date);

  return (
    <div className="space-y-6">
      {groupArray.map((grp) => (
        <div key={grp.time} className="space-y-3">
          <div className="max-w-6xl mx-auto w-full px-8">
            <div className="text-xl text-gray-300 font-semibold mb-2">{grp.time}</div>
          </div>

          {grp.matches.map((match) => (
            <Card key={match.id} hover className="p-8 max-w-6xl mx-auto w-full">
              <div className="flex items-center justify-center w-full">
                <div className="flex-1 text-right pr-2">
                  <h4 className="text-2xl font-semibold text-white">{match.team1?.name}</h4>
                </div>

                <div className="flex-none flex items-center gap-3">
                  {match.team1?.logo ? (
                    <img
                      src={normalizeLogoUrl(match.team1.logo)}
                      alt={match.team1?.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default-avatar.png'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-700/20" />
                  )}

                  <div className="flex flex-col items-center px-3">
                    {(() => {
                      const st = (match.status || '').toString().toLowerCase();
                      const isPending = ['pending', 'scheduled'].includes(st);
                      const t1 = (match.team1Score ?? 0);
                      const t2 = (match.team2Score ?? 0);
                      const isLive = ['live', 'in_progress', 'ongoing', 'running'].includes((match.status || '').toString().toLowerCase());

                      if (isPending) {
                        return (
                          <>
                            <div className="text-3xl font-bold text-gray-300">VS</div>
                            <div className="text-base text-gray-400 mt-1">Sắp diễn ra</div>
                          </>
                        );
                      }

                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <div className={`text-3xl font-bold transition-colors duration-300 ${isLive ? 'text-red-400 animate-pulse' : (t1 > t2 ? 'text-primary-500' : 'text-white')}`}>{t1}</div>
                            <div className="text-sm text-gray-300">/</div>
                            <div className={`text-3xl font-bold transition-colors duration-300 ${isLive ? 'text-red-400 animate-pulse' : (t2 > t1 ? 'text-primary-500' : 'text-white')}`}>{t2}</div>
                          </div>
                          <div className="text-base text-gray-400 mt-1">{(() => {
                            const isCompleted = ['completed', 'done', 'finished'].includes(st);
                            const isLive = ['live', 'in_progress', 'ongoing', 'running'].includes(st);
                            if (isCompleted) return 'Kết thúc';
                            if (isLive) return 'Đang diễn ra';
                            return 'Sắp diễn ra';
                          })()}</div>
                        </>
                      );
                    })()}
                  </div>

                  {match.team2?.logo ? (
                    <img
                      src={normalizeLogoUrl(match.team2.logo)}
                      alt={match.team2?.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default-avatar.png'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-700/20" />
                  )}
                </div>

                <div className="flex-1 text-left pl-2">
                  <h4 className="text-2xl font-semibold text-white">{match.team2?.name}</h4>
                </div>
              </div>

              <div className="border-t border-primary-500/10 mt-4 pt-3">
                <div className="text-center text-base text-primary-500 font-semibold">
                  {match.tournamentName ? (
                    <>
                      {match.tournamentName}
                      {match.round ? <span className="text-gray-300 font-medium"> &bull; Vòng {match.round}</span> : null}
                    </>
                  ) : ''}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
};

