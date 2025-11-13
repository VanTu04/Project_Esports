import React, { useState, useEffect } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import teamService from '../../services/teamService';
import matchService from '../../services/matchService';
import { apiClient } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';

const Home = () => {
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);

  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);

  const [rankings, setRankings] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loadingRankings, setLoadingRankings] = useState(true);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  // derive selected season object for display
  const selectedGameObj = games.find((g) => g.id === selectedGameId);
  const selectedSeasonObj = selectedGameObj
    ? selectedGameObj.seasons.find((s) => s.id === selectedSeasonId)
    : null;

  // Load games and seasons
  useEffect(() => {
    const loadGamesAndSeasons = async () => {
      setLoadingGames(true);
      try {
        // Load all games - response format: { code: 0, data: [...] }
        const gamesRes = await apiClient.get(API_ENDPOINTS.GAMES);
        const gamesData = gamesRes?.data || [];
        
        if (!Array.isArray(gamesData) || gamesData.length === 0) {
          console.log('No games found');
          setGames([]);
          setLoadingGames(false);
          return;
        }
        
        // Load seasons for each game
        const gamesWithSeasons = await Promise.all(
          gamesData.map(async (game) => {
            try {
              // API endpoint: /seasons/game/:gameId - response format: { code: 0, data: [...] }
              const seasonsRes = await apiClient.get(`${API_ENDPOINTS.SEASONS}/game/${game.id}`);
              const seasonsData = seasonsRes?.data || [];
              
              // Format seasons
              const formattedSeasons = seasonsData.map(season => ({
                id: season.id,
                name: season.season_name || season.name,
                duration: season.start_date && season.end_date 
                  ? `${new Date(season.start_date).toLocaleDateString('vi-VN')} - ${new Date(season.end_date).toLocaleDateString('vi-VN')}`
                  : 'Chưa có thông tin',
                isCurrent: season.status === 'ONGOING' || season.is_current === 1 || season.is_current === true,
                start_date: season.start_date,
                end_date: season.end_date,
                status: season.status
              }));
              
              return {
                id: game.id,
                name: game.game_name || game.name,
                seasons: formattedSeasons
              };
            } catch (err) {
              console.error(`Failed to load seasons for game ${game.id}:`, err);
              return {
                id: game.id,
                name: game.game_name || game.name,
                seasons: []
              };
            }
          })
        );
        
        setGames(gamesWithSeasons);
        
        // Auto-select first game and first season (or current season)
        if (gamesWithSeasons.length > 0) {
          const firstGame = gamesWithSeasons[0];
          setSelectedGame(firstGame.name);
          setSelectedGameId(firstGame.id);
          
          // Try to find current season, otherwise use first season
          const currentSeason = firstGame.seasons.find(s => s.isCurrent);
          const defaultSeason = currentSeason || firstGame.seasons[0];
          
          if (defaultSeason) {
            setSelectedSeason(defaultSeason.name);
            setSelectedSeasonId(defaultSeason.id);
          }
        }
      } catch (err) {
        console.error('Failed to load games:', err);
        setGames([]);
      } finally {
        setLoadingGames(false);
      }
    };
    
    loadGamesAndSeasons();
  }, []);

  // Load rankings when season changes
  useEffect(() => {
    const loadRankings = async () => {
      if (!selectedSeasonId) {
        setRankings([]);
        setLoadingRankings(false);
        return;
      }

      setLoadingRankings(true);
      try {
        const response = await apiClient.get(`${API_ENDPOINTS.RANKING_BOARD}/season/${selectedSeasonId}`);
        const rankingsData = response?.data || [];
        
        // Format rankings data
        const formattedRankings = rankingsData.map(item => ({
          team: item.team_name || item.teamName || 'Unknown Team',
          wins: item.wins || 0,
          losses: item.losses || 0,
          points: item.points || item.total_points || 0,
          teamId: item.team_id || item.teamId
        }));
        
        // Sort by points descending
        formattedRankings.sort((a, b) => b.points - a.points);
        
        setRankings(formattedRankings);
      } catch (err) {
        console.error('Failed to load rankings:', err);
        setRankings([]);
      } finally {
        setLoadingRankings(false);
      }
    };

    loadRankings();
  }, [selectedSeasonId]);

  // Load tournaments when season changes
  useEffect(() => {
    const loadTournaments = async () => {
      if (!selectedSeasonId) {
        setTournaments([]);
        setLoadingTournaments(false);
        return;
      }

      setLoadingTournaments(true);
      try {
        const response = await apiClient.get(`${API_ENDPOINTS.RANKING_BOARD}/season/${selectedSeasonId}`);
        const tournamentsData = response?.data || [];
        
        // Format tournaments data
        const formattedTournaments = tournamentsData.map(item => ({
          id: item.id,
          name: item.tournament_name || item.tournamentName || 'Unknown Tournament',
          status: item.status || 'unknown',
          startDate: item.start_date || item.startDate,
          endDate: item.end_date || item.endDate,
          description: item.description || ''
        }));
        
        setTournaments(formattedTournaments);
      } catch (err) {
        console.error('Failed to load tournaments:', err);
        setTournaments([]);
      } finally {
        setLoadingTournaments(false);
      }
    };

    loadTournaments();
  }, [selectedSeasonId]);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <Header />

  <main className="flex flex-1 mt-20">
        {/* Cột trái: Game + Mùa giải */}
        <aside className="w-1/4 border-r border-gray-800 p-6 bg-gradient-to-br from-[#031014] via-[#071018] to-[#081216]">
          <h2 className="text-2xl font-bold mb-6 text-cyan-400">
            Trò chơi & Mùa giải
          </h2>

          {loadingGames ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Chưa có trò chơi nào</div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => {
                const isOpen = selectedGameId === game.id;
              return (
                <div key={game.id} className="">
                  {/* Game header (keeps original list feel) */}
                  <div
                    onClick={() => {
                      if (isOpen) {
                        setSelectedGame(null);
                        setSelectedGameId(null);
                      } else {
                        setSelectedGame(game.name);
                        setSelectedGameId(game.id);
                        // default to the first season when opening a game
                        if (game.seasons.length > 0) {
                          setSelectedSeason(game.seasons[0].name);
                          setSelectedSeasonId(game.seasons[0].id);
                        }
                      }
                    }}
                    className={`flex items-center justify-between cursor-pointer mb-3 transition-all rounded overflow-hidden mx-3 ${
                      isOpen ? 'bg-gradient-to-r from-[#041517] to-transparent' : 'bg-transparent hover:bg-neutral-800/10'
                    }`}
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-stretch w-full">
                      {/* cyan left stripe only when selected; reserve 1px width to avoid layout shift */}
                      <div className={isOpen ? 'w-1 bg-cyan-500' : 'w-1 bg-transparent'} />
                      <div className="flex-1 px-4 py-3 bg-transparent">
                        <div className="text-xs text-cyan-300 uppercase tracking-wide font-semibold">
                          {game.name ? game.name.split(' ')[0] : 'Game'}
                        </div>
                        <div className="text-2xl font-bold text-white truncate">{game.name || 'Unknown Game'}</div>
                        <div className="text-xs text-gray-400 mt-1">{game.seasons?.length || 0} mùa</div>
                      </div>
                    </div>
                  </div>

                  {/* Seasons list (indented, keeps original UX) */}
                  {isOpen && (
                    <ul className="pl-6 border-l border-neutral-700 space-y-2 pb-2 animate-fadeIn">
                      {game.seasons.map((seasonObj) => {
                        const active = selectedSeasonId === seasonObj.id;
                        return (
                          <li key={seasonObj.id}>
                            <button
                              onClick={() => {
                                setSelectedSeason(seasonObj.name);
                                setSelectedSeasonId(seasonObj.id);
                              }}
                              className={`w-full text-left flex items-center justify-between gap-3 text-sm transition px-2 py-2 rounded ${
                                active ? 'bg-cyan-500/80 text-black font-semibold' : 'text-gray-300 hover:bg-neutral-800/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`h-2 w-2 rounded-full ${active ? 'bg-black' : 'bg-gray-500'}`} />
                                <div className="flex flex-col text-left">
                                  <span className="truncate">{seasonObj.name}</span>
                                  <span className="text-xs text-gray-400">{seasonObj.duration}</span>
                                </div>
                              </div>
                              <div>
                                {seasonObj.isCurrent && (
                                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Đang diễn ra</span>
                                )}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
            </div>
          )}
        </aside>

  {/* Cột giữa: Bảng xếp hạng */}
  <section className="w-1/2 p-8 space-y-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {selectedGame} – {selectedSeason}
              </h1>
              {selectedSeasonObj && (
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                  <span>{selectedSeasonObj.duration}</span>
                  {selectedSeasonObj.isCurrent && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Mùa đang diễn ra</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bảng xếp hạng */}
          <Card>
            <h2 className="text-lg font-semibold mb-3 text-cyan-400">
              🏆 Bảng Xếp Hạng
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-800 text-left text-sm">
                <thead className="bg-gray-900 text-gray-400">
                  <tr>
                    <th className="p-3 border-b border-gray-700">#</th>
                    <th className="p-3 border-b border-gray-700">Đội</th>
                    <th className="p-3 border-b border-gray-700">Thắng</th>
                    <th className="p-3 border-b border-gray-700">Thua</th>
                    <th className="p-3 border-b border-gray-700">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRankings ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
                        </div>
                      </td>
                    </tr>
                  ) : rankings.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400">
                        Chưa có dữ liệu xếp hạng
                      </td>
                    </tr>
                  ) : (
                    rankings.map((team, i) => (
                      <tr key={`${team.team}-${i}`} className="hover:bg-gray-800 transition">
                        <td className="p-3">{i + 1}</td>
                        <td className="p-3 font-semibold">{team.team}</td>
                        <td className="p-3">{team.wins}</td>
                        <td className="p-3">{team.losses}</td>
                        <td className="p-3 text-cyan-400">{team.points}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* Cột phải: Giải đấu */}
        <aside className="w-1/4 border-l border-gray-800 p-6 bg-gradient-to-br from-[#031014] via-[#071018] to-[#081216]">
          <h2 className="text-lg font-semibold mb-4 text-cyan-400">🏅 Giải Đấu</h2>
          {loadingTournaments ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Chưa có giải đấu
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:bg-gray-800 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white text-sm">{tournament.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tournament.status === 'ONGOING' 
                        ? 'bg-green-500 text-white' 
                        : tournament.status === 'COMPLETED'
                        ? 'bg-gray-600 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {tournament.status === 'ONGOING' ? 'Đang diễn ra' 
                        : tournament.status === 'COMPLETED' ? 'Đã kết thúc'
                        : tournament.status === 'REGISTRATION' ? 'Đang đăng ký'
                        : 'Sắp diễn ra'}
                    </span>
                  </div>
                  {tournament.startDate && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(tournament.startDate).toLocaleDateString('vi-VN')}
                      {tournament.endDate && ` - ${new Date(tournament.endDate).toLocaleDateString('vi-VN')}`}
                    </p>
                  )}
                  {tournament.description && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{tournament.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      </main>

      <Footer />
    </div>
  );
};

export default Home;

const FeatureCard = ({ title, description, icon }) => (
  <div className="bg-dark-500 p-6 rounded-lg border border-primary-700/30 hover:border-primary-600 transition-colors">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

