import React, { useState, useEffect } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Card from "../../components/common/Card";
import LeaderboardTable from '../../components/tournament/LeaderboardTable';
import { apiClient } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import tournamentService from '../../services/tournamentService';

const Home = () => {
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);

  const [selectedGameId, setSelectedGameId] = useState(null);
  const [selectedGameName, setSelectedGameName] = useState(null);

  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [selectedSeasonName, setSelectedSeasonName] = useState(null);
  const [selectedSeasonObj, setSelectedSeasonObj] = useState(null);

  const [tournaments, setTournaments] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [loadingTournamentLeaderboard, setLoadingTournamentLeaderboard] = useState(false);

  // Load games & seasons
  useEffect(() => {
    const loadGames = async () => {
      setLoadingGames(true);
      try {
        const res = await apiClient.get(API_ENDPOINTS.GAMES);
        const gamesData = res?.data?.data ?? res?.data ?? [];

        // Load seasons for each game
        const gamesWithSeasons = await Promise.all(
          gamesData.map(async game => {
            try {
              const seasonsRes = await apiClient.get(`${API_ENDPOINTS.SEASONS}/game/${game.id}`);
              const seasonsData = seasonsRes?.data?.data ?? seasonsRes?.data ?? [];
              const formattedSeasons = seasonsData.map(s => ({
                id: s.id,
                name: s.season_name || s.name,
                start_date: s.start_date,
                end_date: s.end_date,
                isCurrent: s.status === 'ONGOING' || s.is_current === true || s.is_current === 1
              }));
              return { id: game.id, name: game.game_name || game.name, seasons: formattedSeasons };
            } catch {
              return { id: game.id, name: game.game_name || game.name, seasons: [] };
            }
          })
        );

        setGames(gamesWithSeasons);

        if (gamesWithSeasons.length > 0) {
          const firstGame = gamesWithSeasons[0];
          setSelectedGameId(firstGame.id);
          setSelectedGameName(firstGame.name);

          const currentSeason = firstGame.seasons.find(s => s.isCurrent) || firstGame.seasons[0];
          if (currentSeason) {
            setSelectedSeasonId(currentSeason.id);
            setSelectedSeasonName(currentSeason.name);
            setSelectedSeasonObj(currentSeason);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingGames(false);
      }
    };

    loadGames();
  }, []);

  // Load tournaments
  useEffect(() => {
    const loadTournaments = async () => {
      setLoadingTournaments(true);
      try {
        const resp = await tournamentService.getAllTournaments();
        console.log('Tournaments response:', resp);

        const data = resp?.data?.data ?? resp?.data ?? [];
        // Không filter theo season để chắc chắn hiện tất cả
        const formattedTournaments = data.map(t => ({
          id: t.id,
          name: t.tournament_name || t.name || 'Unknown',
          status: t.status || 'unknown',
          startDate: t.start_date || t.startDate,
          endDate: t.end_date || t.endDate,
          description: t.description || ''
        }));

        setTournaments(formattedTournaments);

        if (formattedTournaments.length > 0 && !selectedTournamentId) {
          setSelectedTournamentId(formattedTournaments[0].id);
          setSelectedTournament(formattedTournaments[0]);
        }
      } catch (err) {
        console.error('Load tournaments error:', err);
        setTournaments([]);
      } finally {
        setLoadingTournaments(false);
      }
    };

    loadTournaments();
  }, [selectedSeasonId]);

  // Update selectedTournament when selectedTournamentId changes
  useEffect(() => {
    if (selectedTournamentId && tournaments.length > 0) {
      const t = tournaments.find(t => t.id === selectedTournamentId);
      setSelectedTournament(t || null);
    }
  }, [selectedTournamentId, tournaments]);

  // Load leaderboard for selected tournament
  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!selectedTournamentId) return;
      setLoadingTournamentLeaderboard(true);
      try {
        const resp = await tournamentService.getFinalLeaderboard(selectedTournamentId);
        // Backend returns { code, status, message, data: { tournamentId, leaderboard } }
        let raw = [];
        if (resp?.code === 0 && resp?.data?.leaderboard) raw = resp.data.leaderboard;
        else if (resp?.data && Array.isArray(resp.data.leaderboard)) raw = resp.data.leaderboard;
        else if (Array.isArray(resp)) raw = resp;
        else if (resp?.leaderboard) raw = resp.leaderboard;

        const rows = (raw || []).map((r, idx) => ({
          rank: idx + 1,
          team: { name: r.fullname || r.username || r.team_name || r.wallet || 'Unknown', logo: r.avatar || r.logo || null },
          wins: r.wins ?? 0,
          losses: r.losses ?? 0,
          points: r.score ?? r.points ?? r.total_points ?? 0
        }));

        setLeaderboardRows(rows);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        setLeaderboardRows([]);
      } finally {
        setLoadingTournamentLeaderboard(false);
      }
    };

    loadLeaderboard();
  }, [selectedTournamentId]);
    const STATUS_MAP = {
  COMPLETED: { label: 'Đã kết thúc', color: 'bg-gray-600 text-white' },
  PENDING: { label: 'Sắp diễn ra', color: 'bg-yellow-500 text-white' },
  ACTIVE: { label: 'Đang diễn ra', color: 'bg-gray-400 text-white' }
};


  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <Header />

      <main className="flex flex-1 mt-20">
        {/* Danh sách giải đấu */}
        <aside className="w-1/4 border-r border-gray-800 p-6 bg-gradient-to-br from-[#031014] via-[#071018] to-[#081216]">
          <h2 className="text-lg font-semibold mb-4 text-cyan-400">Danh sách giải đấu</h2>
          {loadingTournaments ? (
            <div className="text-center py-8 text-gray-400">Đang tải...</div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Chưa có giải đấu</div>
          ) : (
                  <div className="space-y-3">
        {tournaments.map((t) => {
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
                {t.registration && (
                  <div className="mt-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-dark-600 text-gray-200">{t.registration.label}</span>
                  </div>
                )}
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

        {/* BXH giải đấu */}
        <section className="w-1/2 p-8 space-y-10">
          <div>
            <h1 className="text-2xl font-bold">
              {selectedTournamentId ? `BXH giải đấu: ${selectedTournament ? selectedTournament.name : `#${selectedTournamentId}`}` : 'Chọn giải đấu để xem BXH'}
            </h1>
          </div>
          <Card>
            <LeaderboardTable data={leaderboardRows} loading={loadingTournamentLeaderboard} />
          </Card>
        </section>

        <aside className="w-1/4 border-l border-gray-800 p-6 bg-gradient-to-br from-[#031014] via-[#071018] to-[#081216]">
          <h2 className="text-lg font-semibold mb-4 text-cyan-400">Chi tiết giải đấu</h2>
          {selectedTournament ? (
            <div className="space-y-2">
              <p>Tên: {selectedTournament.name}</p>
              {selectedTournament.startDate && <p>Thời gian: {new Date(selectedTournament.startDate).toLocaleDateString('vi-VN')} - {selectedTournament.endDate ? new Date(selectedTournament.endDate).toLocaleDateString('vi-VN') : '...'} </p>}
              <p>
                Trạng thái: 
                <span className={`ml-2 px-2 py-0.5 rounded-full ${
                  (STATUS_MAP[selectedTournament.status] || STATUS_MAP.unknown).color
                }`}>
                  {(STATUS_MAP[selectedTournament.status] || STATUS_MAP.unknown).label}
                </span>
              </p>

            </div>
          ) : (
            <p className="text-gray-400">Chưa chọn giải đấu</p>
          )}
        </aside>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
