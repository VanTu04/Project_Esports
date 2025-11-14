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

  useEffect(() => {
    const load = async () => {
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
     <main className="flex mt-20 mb-0"> {/* main flex container */}
  {/* Sidebar */}
  <aside className="w-1/4 border-r border-gray-800 p-6 bg-gradient-to-br from-[#031014] via-[#071018] to-[#081216] flex-shrink-0">
    <h2 className="text-lg text-gray-300 mb-3">Giải đấu</h2>
    <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-5rem)]">
      {tournaments
        .filter(t => {
          const status = (t.status || '').toUpperCase();
          return ['ONGOING','ACTIVE','PENDING','UPCOMING','REGISTRATION'].includes(status);
        })
        .map(t => {
          const status = (t.status || '').toUpperCase();
          const isOngoing = status === 'ONGOING' || status === 'ACTIVE';
          const isRegistration = ['PENDING','UPCOMING','REGISTRATION'].includes(status);
          const isSelected = selectedTournamentId === t.id;

          const handleClick = () => {
            setSelectedTournamentId(t.id);
            if (isRegistration) alert('Giải đấu đang trong thời gian đăng ký');
          };

          return (
            <button
              key={t.id}
              onClick={handleClick}
              className={`w-full text-left px-3 py-2 rounded flex items-center justify-between gap-3 ${
                isSelected ? 'bg-cyan-600 text-white' : 'bg-neutral-900 text-gray-300 hover:bg-neutral-800'
              }`}
            >
              <div>
                <div className={`font-semibold ${isOngoing ? 'text-green-300' : 'text-yellow-300'}`}>{t.name}</div>
                {t.startDate && (
                  <div className="text-xs text-gray-400">
                    {new Date(t.startDate).toLocaleDateString('vi-VN')} - {t.endDate ? new Date(t.endDate).toLocaleDateString('vi-VN') : '...'}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${isOngoing ? 'bg-green-700 text-white' : 'bg-yellow-600 text-black'}`}>
                  Đang diễn ra
                </span>
              </div>
            </button>
          );
        })}
    </div>
  </aside>
<section className="flex-1 p-6">
  <h2 className="text-xl text-white mb-4">Trận đấu</h2>
  {loading ? (
    <div className="text-gray-400">Đang tải...</div>
  ) : matches.length === 0 ? (
    <div className="text-gray-400">Chưa có trận nào</div>
  ) : (
    <div className="space-y-3">
      {matches.filter(m => m.match_time).map(m => {
  const teamA = m.team_a_name || m.teamA?.team_name || m.teamA?.full_name || 'TBD';
  const teamB = m.team_b_name || m.teamB?.team_name || m.teamB?.full_name || (m.team_b_participant_id ? 'TBD' : 'BYE');
  const time = new Date(m.match_time).toLocaleString('vi-VN');
  const status = (m.status || m.match_status || 'PENDING').toUpperCase();
  const isCompleted = status === 'COMPLETED';
  const isOngoing = status === 'ONGOING' || status === 'ACTIVE';
  const round = m.round_number || m.current_round || 1;

  return (
    <Card key={m.id}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
        {/* Team Info */}
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-neutral-800 rounded overflow-hidden flex items-center justify-center">
              {m.teamA?.logo ? <img src={m.teamA.logo} alt={teamA} className="h-full w-full object-cover" /> : <span className="text-xs text-gray-400">A</span>}
            </div>
            <div className="text-white font-semibold">{teamA}</div>
          </div>

          <div className="text-sm text-gray-400">vs</div>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-neutral-800 rounded overflow-hidden flex items-center justify-center">
              {m.teamB?.logo ? <img src={m.teamB.logo} alt={teamB} className="h-full w-full object-cover" /> : <span className="text-xs text-gray-400">B</span>}
            </div>
            <div className="text-white font-semibold">{teamB}</div>
          </div>
        </div>

        {/* Match Info */}
        <div className="text-right mt-2 md:mt-0 flex flex-col items-end">
          {round && <div className="text-sm text-cyan-400 mb-1">Vòng {round}</div>}
          <div className={`text-sm ${isOngoing ? 'text-green-300' : isCompleted ? 'text-gray-400 line-through' : 'text-yellow-300'}`}>{time}</div>
          <div className="text-xs mt-1">
            {isCompleted ? (
              <span className="px-2 py-0.5 bg-gray-700 rounded-full">Hoàn thành</span>
            ) : isOngoing ? (
              <span className="px-2 py-0.5 bg-green-700 rounded-full">Đang diễn ra</span>
            ) : (
              <span className="px-2 py-0.5 bg-yellow-600 text-black rounded-full">Đang trong thời gian đăng ký</span>
            )}
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
