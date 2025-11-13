import React, { useState, useEffect } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import teamService from '../../services/teamService';
import matchService from '../../services/matchService';

const Home = () => {
  const games = [
    {
      name: "League of Legends",
      seasons: [
        { name: "Mùa Xuân 2025", duration: "01 Feb - 30 Apr 2025", isCurrent: false },
        { name: "MSI 2025", duration: "10 May - 25 May 2025", isCurrent: false },
        { name: "Worlds 2025", duration: "15 Oct - 05 Nov 2025", isCurrent: true },
      ],
    },
    {
      name: "Valorant",
      seasons: [
        { name: "Split 1", duration: "01 Mar - 30 Apr 2025", isCurrent: false },
        { name: "Masters Tokyo", duration: "12 Jun - 22 Jun 2025", isCurrent: false },
        { name: "Champions 2025", duration: "20 Nov - 30 Nov 2025", isCurrent: false },
      ],
    },
    {
      name: "DOTA 2",
      seasons: [
        { name: "The International", duration: "25 Aug - 10 Sep 2025", isCurrent: false },
        { name: "Major Paris", duration: "05 Jun - 15 Jun 2025", isCurrent: false },
        { name: "Major Singapore", duration: "20 Jul - 30 Jul 2025", isCurrent: false },
      ],
    },
  ];

  // find the globally current season (if any) so the middle table can show the active season
  const current = (() => {
    for (const g of games) {
      for (const s of g.seasons) {
        if (s.isCurrent) return { game: g.name, season: s };
      }
    }
    return null;
  })();

  const [selectedGame, setSelectedGame] = useState(current ? current.game : "League of Legends");
  const [selectedSeason, setSelectedSeason] = useState(current ? current.season.name : games[0].seasons[0].name);

  const [rankings, setRankings] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loadingRankings, setLoadingRankings] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  // derive selected season object for display (contains duration, isCurrent)
  const selectedGameObj = games.find((g) => g.name === selectedGame);
  const selectedSeasonObj = selectedGameObj
    ? selectedGameObj.seasons.find((s) => s.name === selectedSeason)
    : null;

  const news = [
    {
      title: "Top Plays - Swiss Stage",
      date: "October 21, 2025",
      img: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=200&q=80",
    },
    {
      title: "Worlds Unlocked 2025",
      date: "October 10, 2025",
      img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    },
    {
      title: "Sentinels Join LCS 2026",
      date: "October 5, 2025",
      img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=200&q=80",
    },
  ];

  // Fallback sample data used if API is unavailable
  const fallbackRankings = [
    { team: "T1", wins: 10, losses: 2, points: 30 },
    { team: "Gen.G", wins: 9, losses: 3, points: 27 },
    { team: "KT Rolster", wins: 7, losses: 5, points: 21 },
  ];

  const fallbackSchedule = [
    { date: "Nov 2, 2025", match: "T1 vs Gen.G", time: "18:00" },
    { date: "Nov 3, 2025", match: "KT vs DRX", time: "17:00" },
  ];

  useEffect(() => {
    const loadRankings = async () => {
      setLoadingRankings(true);
      try {
        const res = await teamService.getTeamRankings();
        // server may return { rankings: [...] } or an array directly
        if (Array.isArray(res)) setRankings(res);
        else if (res && Array.isArray(res.rankings)) setRankings(res.rankings);
        else setRankings(fallbackRankings);
      } catch (err) {
        console.error('Failed to load rankings', err);
        setRankings(fallbackRankings);
      } finally {
        setLoadingRankings(false);
      }
    };

    const loadSchedule = async () => {
      setLoadingSchedule(true);
      try {
        const res = await matchService.getUpcomingMatches();
        if (Array.isArray(res)) setSchedule(res);
        else if (res && Array.isArray(res.matches)) setSchedule(res.matches);
        else setSchedule(fallbackSchedule);
      } catch (err) {
        console.error('Failed to load schedule', err);
        setSchedule(fallbackSchedule);
      } finally {
        setLoadingSchedule(false);
      }
    };

    loadRankings();
    loadSchedule();
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <Header />

  <main className="flex flex-1 mt-20">
        {/* Cột trái: Game + Mùa giải */}
        <aside className="w-1/4 border-r border-gray-800 p-6 bg-gradient-to-br from-[#031014] via-[#071018] to-[#081216]">
          <h2 className="text-2xl font-bold mb-6 text-cyan-400">
            Trò chơi & Mùa giải
          </h2>

          <div className="space-y-4">
            {games.map((game) => {
              const isOpen = selectedGame === game.name;
              return (
                <div key={game.name} className="">
                  {/* Game header (keeps original list feel) */}
                  <div
                    onClick={() => {
                      if (isOpen) setSelectedGame(null);
                      else {
                        setSelectedGame(game.name);
                        // default to the first season when opening a game
                        setSelectedSeason(game.seasons[0].name);
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
                        <div className="text-xs text-cyan-300 uppercase tracking-wide font-semibold">{game.name.split(' ')[0]}</div>
                        <div className="text-2xl font-bold text-white truncate">{game.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{game.seasons.length} mùa</div>
                      </div>
                    </div>
                  </div>

                  {/* Seasons list (indented, keeps original UX) */}
                  {isOpen && (
                    <ul className="pl-6 border-l border-neutral-700 space-y-2 pb-2 animate-fadeIn">
                      {game.seasons.map((seasonObj) => {
                        const active = selectedSeason === seasonObj.name;
                        return (
                          <li key={seasonObj.name}>
                            <button
                              onClick={() => setSelectedSeason(seasonObj.name)}
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
        </aside>

  {/* Cột giữa: Bảng xếp hạng + Lịch thi đấu */}
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
                  {rankings.map((team, i) => (
                    <tr key={`${team.team}-${i}`} className="hover:bg-gray-800 transition">
                      <td className="p-3">{i + 1}</td>
                      <td className="p-3 font-semibold">{team.team}</td>
                      <td className="p-3">{team.wins}</td>
                      <td className="p-3">{team.losses}</td>
                      <td className="p-3 text-cyan-400">{team.points}</td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </Card>

          {/* Lịch thi đấu */}
          <Card>
            <h2 className="text-lg font-semibold mb-3 text-cyan-400">
              ⚔️ Lịch Thi Đấu
            </h2>
            <div className="space-y-3">
              {schedule.map((m, i) => (
                <div
                  key={i}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex justify-between hover:bg-gray-800 transition"
                >
                  <div>
                    <p className="text-gray-400 text-sm">{m.date}</p>
                    <p className="font-semibold">{m.match}</p>
                  </div>
                  <span className="text-cyan-400 font-bold">{m.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Cột phải: Tin tức */}
        <aside className="w-1/4 border-l border-gray-800 p-6 bg-gradient-to-br from-[#031014] via-[#071018] to-[#081216]">
          <h2 className="text-lg font-semibold mb-4 text-cyan-400">📰 Tin tức</h2>
          <div className="space-y-4">
            {news.map((n, i) => (
              <div
                key={i}
                className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-lg transition"
              >
                <img
                  src={n.img}
                  alt={n.title}
                  className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm text-white">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{n.date}</p>
                </div>
              </div>
            ))}
          </div>
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

