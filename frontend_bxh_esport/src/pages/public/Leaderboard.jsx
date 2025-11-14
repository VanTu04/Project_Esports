import { useEffect, useState } from 'react';
import tournamentService from '../../services/tournamentService';
import LeaderboardTable from '../../components/tournament/LeaderboardTable';
import { MatchSchedule } from '../../components/tournament/MatchSchedule';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Card from '../../components/common/Card';

export const Leaderboard = ({ tournamentId: initialTournamentId }) => {
  const [matchesByRound, setMatchesByRound] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [apiLeaderboards, setApiLeaderboards] = useState({});
  const [selectedTournamentId, setSelectedTournamentId] = useState(initialTournamentId || null);

  // Load tournaments
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const resp = await tournamentService.getAllTournaments();
        const data = resp?.data?.data ?? resp?.data ?? resp ?? [];
        const mapped = Array.isArray(data)
          ? data.map(t => ({
              id: t.id,
              name: t.tournament_name || t.name,
              status: t.status || t.state || 'UNKNOWN',
              startDate: t.start_date || t.startDate || null,
              endDate: t.end_date || t.endDate || null,
              total_rounds: t.total_rounds || t.totalRounds || 0,
            }))
          : [];
        setTournaments(mapped);
        if (!selectedTournamentId && mapped.length > 0) setSelectedTournamentId(mapped[0].id);
      } catch (err) {
        console.error('Failed to load tournaments', err);
      }
    };
    loadTournaments();
  }, []);

  // Load matches when tournament changes
  useEffect(() => {
    if (selectedTournamentId) loadMatches(selectedTournamentId);
  }, [selectedTournamentId]);

  const loadMatches = async (tId) => {
    setLoading(true);
    try {
      const tournament = await tournamentService.getTournamentById(tId);
      const totalRounds = tournament?.total_rounds || tournament?.totalRounds || 1;

      const roundsData = [];
      for (let round = 1; round <= totalRounds; round++) {
        // call existing service to get matches for a tournament+round
        const matchesResp = await tournamentService.getTournamentMatches(tId, { round_number: round });
        const arr = matchesResp?.data ?? matchesResp ?? [];
        const rawMatches = Array.isArray(arr) ? arr : (arr.matches || arr.data || []);

        const normalized = (rawMatches || [])
          .map(m => ({
            ...m,
            status: (m.status || m.match_status || '').toString().toUpperCase(),
            match_time: m.match_time || m.scheduled_time || m.scheduledAt || null,
          }))
          .filter(m => ['ACTIVE', 'COMPLETED', 'PENDING'].includes(m.status))
          .sort((a, b) => {
            const ta = a.match_time ? new Date(a.match_time).getTime() : 0;
            const tb = b.match_time ? new Date(b.match_time).getTime() : 0;
            return ta - tb;
          });

        roundsData.push({ round, matches: normalized });
      }

      setMatchesByRound(roundsData);

      // Try to fetch leaderboard from blockchain first (preferred). Fallback to backend leaderboard API.
      let usedBlockchain = false;
      try {
        const bxhResp = await tournamentService.getFinalLeaderboard(tId);
        const bxhData = bxhResp?.data ?? bxhResp ?? [];
        if (Array.isArray(bxhData) && bxhData.length > 0) {
          const grouped = {};
          bxhData.forEach(item => {
            const r = item.round_number ?? item.round ?? item.roundIndex ?? 1;
            if (!grouped[r]) grouped[r] = [];
            grouped[r].push({
              rank: item.rank ?? item.position ?? item.index ?? null,
              team: { name: item.team_name || item.team || item.player || item.team?.name, logo: item.team_logo || item.logo },
              wins: item.wins ?? item.win_count ?? item.wins_count ?? 0,
              losses: item.losses ?? item.loss_count ?? 0,
              points: item.points ?? item.score ?? item.totalPoints ?? 0,
              raw: item,
            });
          });
          Object.keys(grouped).forEach(r => grouped[r].sort((a,b)=> (a.rank||0) - (b.rank||0)));
          setApiLeaderboards(grouped);
          usedBlockchain = true;
        }
      } catch (bxhErr) {
        console.debug('Blockchain leaderboard not available', bxhErr);
      }

      if (!usedBlockchain) {
        try {
          const lbResp = await tournamentService.getTournamentLeaderboard(tId);
          const lbData = lbResp?.data ?? lbResp ?? [];
          if (Array.isArray(lbData) && lbData.length > 0) {
            const grouped = {};
            lbData.forEach(item => {
              const r = item.round_number ?? item.round ?? 1;
              if (!grouped[r]) grouped[r] = [];
              grouped[r].push({
                rank: item.rank ?? item.position ?? null,
                team: { name: item.team_name || item.team || item.team?.name, logo: item.team_logo || item.logo },
                wins: item.wins ?? item.win_count ?? 0,
                losses: item.losses ?? item.loss_count ?? 0,
                points: item.points ?? item.score ?? 0,
              });
            });
            Object.keys(grouped).forEach(r => grouped[r].sort((a,b)=> (a.rank||0) - (b.rank||0)));
            setApiLeaderboards(grouped);
          }
        } catch (e) {
          console.debug('No API leaderboard, using computed standings', e);
        }
      }
    } catch (err) {
      console.error(err);
      setMatchesByRound([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <Header />

      <main className="flex mt-20 mb-0">
        {/* Sidebar giải đấu */}
        <aside className="w-1/4 border-r border-gray-800 p-6 bg-gradient-to-br from-[#031014] via-[#071018] to-[#081216] flex-shrink-0">
          <h2 className="text-lg text-gray-300 mb-3">Giải đấu</h2>
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-5rem)]">
            {tournaments.map(t => {
              const status = (t.status || '').toUpperCase();
              const isOngoing = status === 'ONGOING' || status === 'ACTIVE';
              const isSelected = selectedTournamentId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTournamentId(t.id)}
                  className={`w-full text-left px-3 py-2 rounded flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-cyan-600 text-white' : 'bg-neutral-900 text-gray-300 hover:bg-neutral-800'
                  }`}
                >
                  <div>
                    <div className={`font-semibold ${isOngoing ? 'text-green-300' : 'text-yellow-300'}`}>
                      {t.name}
                    </div>
                    {t.startDate && (
                      <div className="text-xs text-gray-400">
                        {new Date(t.startDate).toLocaleDateString('vi-VN')} - {t.endDate ? new Date(t.endDate).toLocaleDateString('vi-VN') : '...'}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isOngoing ? 'bg-green-700 text-white' : 'bg-yellow-600 text-black'}`}>
                      {isOngoing ? 'Đang diễn ra' : 'Sắp/Đã'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Nội dung bảng xếp hạng */}
        <section className="flex-1 p-6">
          <h2 className="text-3xl font-bold text-white mb-4">Bảng xếp hạng</h2>

          {loading ? (
            <div className="text-gray-400">Đang tải...</div>
          ) : matchesByRound.length === 0 ? (
            <div className="text-gray-400">Chưa có dữ liệu bảng xếp hạng</div>
          ) : (
            <div className="space-y-8">
              {matchesByRound.map(({ round, matches }) => {
                // compute simple standings from matches: wins/losses/points per team
                const standingsMap = {};
                (matches || []).forEach(m => {
                  const teamA = m.team_a_name || m.teamA?.team_name || m.team1?.name || m.team1?.full_name || 'Team A';
                  const teamB = m.team_b_name || m.teamB?.team_name || m.team2?.name || m.team2?.full_name || 'Team B';
                  if (!standingsMap[teamA]) standingsMap[teamA] = { team: { name: teamA, logo: m.teamA?.logo || m.team1?.logo }, wins: 0, losses: 0, points: 0 };
                  if (!standingsMap[teamB]) standingsMap[teamB] = { team: { name: teamB, logo: m.teamB?.logo || m.team2?.logo }, wins: 0, losses: 0, points: 0 };

                  const scoreA = m.team_a_score ?? m.team1Score ?? m.team1_score ?? m.teamA?.score ?? 0;
                  const scoreB = m.team_b_score ?? m.team2Score ?? m.team2_score ?? m.teamB?.score ?? 0;

                  if (m.status === 'COMPLETED' || m.status === 'FINISHED') {
                    if (scoreA > scoreB) {
                      standingsMap[teamA].wins += 1;
                      standingsMap[teamB].losses += 1;
                      standingsMap[teamA].points += 3;
                    } else if (scoreB > scoreA) {
                      standingsMap[teamB].wins += 1;
                      standingsMap[teamA].losses += 1;
                      standingsMap[teamB].points += 3;
                    } else {
                      standingsMap[teamA].points += 1;
                      standingsMap[teamB].points += 1;
                    }
                  }
                });

                // prefer API leaderboard for this round if available
                const apiForRound = apiLeaderboards?.[round];

                let standings = [];
                if (apiForRound && Array.isArray(apiForRound) && apiForRound.length > 0) {
                  standings = apiForRound.map((s, i) => ({ rank: s.rank ?? i + 1, team: s.team, wins: s.wins, losses: s.losses, points: s.points }));
                } else {
                  standings = Object.values(standingsMap).map(s => ({
                    rank: null,
                    team: s.team,
                    wins: s.wins,
                    losses: s.losses,
                    points: s.points,
                  })).sort((a, b) => b.points - a.points || b.wins - a.wins);

                  standings.forEach((s, i) => s.rank = i + 1);
                }

                return (
                  <div key={round}>
                    <h3 className="text-2xl font-semibold text-white mb-3">Vòng {round}</h3>
                    <Card className="mb-4">
                      <MatchSchedule matches={matches} loading={loading} />
                    </Card>
                    <Card>
                      <LeaderboardTable data={standings} loading={loading} showTime />
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};
