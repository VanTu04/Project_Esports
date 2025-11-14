import React, { useEffect, useState } from 'react';
import tournamentService from '../../services/tournamentService';
import Card from '../../components/common/Card';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const Schedule = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoadingTournaments(true);
      try {
        const resp = await tournamentService.getAllTournaments();
        const data = resp?.data?.data ?? resp?.data ?? [];
        setTournaments(data.map(t => ({
          id: t.id,
          name: t.tournament_name || t.name,
          status: t.status || t.state || 'UNKNOWN',
          startDate: t.start_date || t.startDate || null,
          endDate: t.end_date || t.endDate || null,
          current_round: t.current_round || t.currentRound || 1,
        })));
        if (data.length > 0) setSelectedTournamentId(data[0].id);
      } catch (err) {
        console.error('Failed to load tournaments for schedule', err);
        setTournaments([]);
      } finally {
        setLoadingTournaments(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadMatches = async () => {
      if (!selectedTournamentId) {
        setMatches([]);
        return;
      }
      setLoading(true);
      try {
        const resp = await tournamentService.getTournamentMatches(selectedTournamentId, { round_number: 1 });
        const data = resp?.data ?? resp;
        // normalize
        const arr = Array.isArray(data) ? data : (data?.matches ?? data?.data ?? []);
        setMatches(arr);
      } catch (err) {
        console.error('Failed to load matches for schedule', err);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    loadMatches();
  }, [selectedTournamentId]);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8 flex gap-6 mt-20 w-full">
        <h1 className="sr-only">Lịch thi đấu</h1>

<aside className="w-1/4 border-r border-gray-800 p-6 bg-gradient-to-br from-[#031014] via-[#071018] to-[#081216]">
  <h2 className="text-lg font-semibold mb-4 text-cyan-400">Danh sách giải đấu</h2>
  {loadingTournaments ? (
    <div className="text-center py-8 text-gray-400">Đang tải...</div>
  ) : tournaments.length === 0 ? (
    <div className="text-center py-8 text-gray-400">Chưa có giải đấu</div>
  ) : (
    <div className="space-y-3">
      {tournaments
        .filter(t => t.status === 'COMPLETED') // chỉ lấy giải đã kết thúc
        .map((t) => {
          const isSelected = selectedTournamentId === t.id;
          const tournamentNameClass = 'text-gray-200';

          return (
            <div
              key={t.id}
              onClick={() => setSelectedTournamentId(t.id)}
              className={`p-3 rounded-lg cursor-pointer border ${isSelected ? 'border-cyan-500 bg-[#041f3c]' : 'border-transparent hover:border-neutral-700/40'}`}
            >
              <div className={`text-md font-semibold truncate ${tournamentNameClass}`}>
                {t.name}
              </div>
              <div className="text-sm text-gray-300">
                {t.startDate ? new Date(t.startDate).toLocaleDateString('vi-VN') : 'Chưa có lịch'} 
                {t.endDate && ` - ${new Date(t.endDate).toLocaleDateString('vi-VN')}`}
              </div>
              
            </div>
          );
        })}
    </div>
  )}
</aside>

        <section className="flex-1 p-6">
          <h2 className="text-xl text-white mb-4">Trận đấu</h2>
          {loading ? (
            <div className="text-gray-400">Đang tải...</div>
          ) : matches.length === 0 ? (
            <div className="text-gray-400">Chưa có trận nào</div>
          ) : (
            <div className="space-y-3">
              {matches.map(m => {
                const teamA = m.team_a_name || m.teamA?.team_name || m.teamA?.full_name || 'TBD';
                const teamB = m.team_b_name || m.teamB?.team_name || m.teamB?.full_name || (m.team_b_participant_id ? 'TBD' : 'BYE');
                const time = m.match_time ? new Date(m.match_time).toLocaleString('vi-VN') : 'Chưa có lịch';
                const status = (m.status || m.match_status || 'PENDING').toUpperCase();
                const isCompleted = status === 'COMPLETED';
                const isOngoing = status === 'ONGOING' || status === 'ACTIVE';
                return (
                  <Card key={m.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-neutral-800 rounded overflow-hidden flex items-center justify-center">
                            {/* team A avatar */}
                            {m.teamA?.logo ? <img src={m.teamA.logo} alt={teamA} className="h-full w-full object-cover" /> : <span className="text-xs text-gray-400">A</span>}
                          </div>
                          <div className="text-white font-semibold">{teamA}</div>
                        </div>

                        <div className="text-sm text-gray-400">vs</div>

                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-neutral-800 rounded overflow-hidden flex items-center justify-center">
                            {m.teamB?.logo ? <img src={m.teamB.logo} alt={teamB} className="h-full w-full object-cover" /> : <span className="text-xs text-gray-400">B</span>}
                          </div>
                          <div className="text-white font-semibold">{teamB}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm ${isOngoing ? 'text-green-300' : isCompleted ? 'text-gray-400 line-through' : 'text-yellow-300'}`}>{time}</div>
                        <div className="text-xs mt-1">
                          {isCompleted ? <span className="px-2 py-0.5 bg-gray-700 rounded-full">Hoàn thành</span> : isOngoing ? <span className="px-2 py-0.5 bg-green-700 rounded-full">Đang diễn ra</span> : <span className="px-2 py-0.5 bg-yellow-600 text-black rounded-full">Sắp diễn ra</span>}
                        </div>
                      </div>
                    </div>
                  </Card>
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

export default Schedule;
