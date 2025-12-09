import React, { useState, useEffect } from "react";
import PublicLayout from "../../components/layout/PublicLayout";
import HeroSlider from "../../components/home/HeroSlider";
import GameFilter from "../../components/home/GameFilter";
import MatchCenter from "../../components/home/MatchCenter";
import FeaturedTournaments from "../../components/home/FeaturedTournaments";
import LeaderboardSpotlight from "../../components/home/LeaderboardSpotlight";
import tournamentService from '../../services/tournamentService';
import matchService from '../../services/matchService';
import { getAllGames } from '../../services/gameService';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  
  // Hero slider tournaments (hot tournaments for registration)
  const [heroTournaments, setHeroTournaments] = useState([]);
  
  // All tournaments for filtering
  const [allTournaments, setAllTournaments] = useState([]);
  
  // Matches
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  
  // Games list
  const [games, setGames] = useState([]);

  useEffect(() => {
    let mounted = true;
    
    const loadAllData = async () => {
      setLoading(true);
      try {
        // Fetch all tournaments in parallel
        const [pendingResp, ongoingResp, completedResp] = await Promise.all([
          tournamentService.getAllTournaments({ status: 'PENDING', isReady: 1 }).catch(() => ({ data: [] })),
          tournamentService.getAllTournaments({ status: 'ACTIVE', isReady: 1 }).catch(() => ({ data: [] })),
          tournamentService.getAllTournaments({ status: 'COMPLETED' }).catch(() => ({ data: [] })),
        ]);

        const extractArray = (resp) => {
          const payload = resp?.data ?? resp;
          if (Array.isArray(payload)) return payload;
          if (Array.isArray(payload.tournaments)) return payload.tournaments;
          if (Array.isArray(payload.data)) return payload.data;
          return [];
        };

        const pendingArr = extractArray(pendingResp);
        const ongoingArr = extractArray(ongoingResp);
        const completedArr = extractArray(completedResp);

        if (!mounted) return;

        // Set hero tournaments (top 5 pending/registration tournaments)
        setHeroTournaments(pendingArr.slice(0, 5));

        // Combine all tournaments for featured section
        const allArr = [...pendingArr, ...ongoingArr, ...completedArr];
        setAllTournaments(allArr);

        // Fetch games
        try {
          const gamesResp = await getAllGames('ACTIVE').catch(() => ({ data: [] }));
          if (mounted) {
            const gamesData = gamesResp?.data?.data || gamesResp?.data || gamesResp || [];
            setGames(Array.isArray(gamesData) ? gamesData : []);
          }
        } catch (gamesErr) {
          console.error('Failed to load games:', gamesErr);
        }

        // Fetch matches theo status
        try {
          const [liveResp, upcomingResp] = await Promise.all([
            matchService.getMatchesByStatus('live').catch(() => ({ data: [] })),
            matchService.getMatchesByStatus('upcoming').catch(() => ({ data: [] })),
          ]);

          if (mounted) {
            const liveData = extractArray(liveResp);
            let upcomingData = extractArray(upcomingResp);
            
            // Sort by match_time và lấy 5 trận gần nhất
            if (Array.isArray(upcomingData)) {
              upcomingData = upcomingData
                .filter(m => m.match_time || m.matchTime)
                .sort((a, b) => {
                  const timeA = new Date(a.match_time || a.matchTime).getTime();
                  const timeB = new Date(b.match_time || b.matchTime).getTime();
                  return timeA - timeB;
                })
                .slice(0, 5);
            }
            
            setLiveMatches(liveData);
            setUpcomingMatches(upcomingData);
          }
        } catch (matchErr) {
          console.error('Failed to load matches:', matchErr);
        }

      } catch (err) {
        console.error('Load home data error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAllData();
    return () => { mounted = false; };
  }, []);

  // Filter tournaments by selected game
  const filteredTournaments = selectedGame
    ? allTournaments.filter(t => t.game_id === selectedGame)
    : allTournaments;
    
  // Get selected game name
  const selectedGameName = selectedGame 
    ? games.find(g => g.id === selectedGame)?.name || games.find(g => g.id === selectedGame)?.game_name || ''
    : '';

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg">Đang tải...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#0e0e0e] text-white">
        {/* Hero Slider Section */}
        {heroTournaments.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-8">
            <HeroSlider tournaments={heroTournaments} />
          </section>
        )}

        {/* Game Filter Section */}
        <GameFilter 
          selectedGame={selectedGame} 
          onGameSelect={setSelectedGame}
          games={games}
        />

        {/* Match Center Section */}
        <MatchCenter 
          liveMatches={liveMatches} 
          upcomingMatches={upcomingMatches}
          games={games}
          selectedGame={selectedGame}
          onGameSelect={setSelectedGame}
        />

        {/* Featured Tournaments Section */}
        <FeaturedTournaments 
          tournaments={filteredTournaments}
          games={games}
          selectedGameName={selectedGameName}
        />

        {/* Leaderboard Spotlight Section */}
        <LeaderboardSpotlight />
      </div>
    </PublicLayout>
  );
};

export default Home;
