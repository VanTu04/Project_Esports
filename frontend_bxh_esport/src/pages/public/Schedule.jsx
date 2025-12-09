import React, { useEffect, useState } from 'react';
import tournamentService from '../../services/tournamentService';
import Card from '../../components/common/Card';
import PublicLayout from '../../components/layout/PublicLayout';
import TournamentMatches from '../../components/tournament/TournamentMatches';
import LeaderboardTable from '../../components/tournament/LeaderboardTable';
import rewardService from '../../services/rewardService';
import { useNotification } from '../../context/NotificationContext';

const Schedule = () => {
  const { showError, showSuccess } = useNotification();
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [allTournaments, setAllTournaments] = useState([]);
  const [games, setGames] = useState([]);
  const [gamesFiltered, setGamesFiltered] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [tournamentsForGame, setTournamentsForGame] = useState([]);
  const [checkingMatches, setCheckingMatches] = useState(false);
  const [groupedMatchesMap, setGroupedMatchesMap] = useState({});
  const [selectedRound, setSelectedRound] = useState(1);
  const [selectedTournamentObj, setSelectedTournamentObj] = useState(null);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLeaderboardInline, setShowLeaderboardInline] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardRewards, setLeaderboardRewards] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading tournaments...');
        
        // Request all tournaments without pagination limit
        const resp = await tournamentService.getAllTournaments({ hasMatches: 1, limit: 50 });
        console.log('📦 Raw response:', resp);
        
        const payload = resp?.data?.data ?? resp?.data ?? resp ?? {};
        console.log('📦 Payload:', payload);
        
        let data = [];
        if (Array.isArray(payload)) {
          data = payload;
        } else if (Array.isArray(payload.tournaments)) {
          data = payload.tournaments;
        } else if (Array.isArray(payload.data)) {
          data = payload.data;
        } else {
          data = [];
        }

        console.log('✅ Tournaments count:', data.length);
        console.log('📋 First tournament:', data[0]);
        
        setAllTournaments(data);

        // Group by game
        const map = {};
        data.forEach(t => {
          const gid = t.game_id ?? t.game?.id ?? t.gameId ?? 'unknown_game';
          const gname = t.game?.name || t.game?.game_name || t.game_name || t.gameName || String(gid);
          
          if (!map[gid]) {
            map[gid] = { 
              id: gid, 
              name: gname || 'Khác', 
              tournaments: [] 
            };
          }
          
          map[gid].tournaments.push({
            id: t.id,
            name: t.tournament_name || t.name || t.title,
            status: t.status || 'UNKNOWN',
            startDate: t.start_date || t.startDate || null,
            endDate: t.end_date || t.endDate || null,
            raw: t,
          });
        });

        const gamesArr = Object.values(map);
        console.log('🎮 Games:', gamesArr.length);
        
        setGames(gamesArr);

        // Because backend now supports `hasMatches`, the payload already contains
        // only tournaments that have at least one match. Group and filter by game
        // and pick a sensible default without extra per-tournament API calls.
        setCheckingMatches(false);
        const filtered = gamesArr.filter(g => g.tournaments && g.tournaments.length > 0);
        setGamesFiltered(filtered);

        // Default to first game from filtered list if present, otherwise first game overall
        const defaultGame = (filtered.length > 0 ? filtered[0] : gamesArr[0]);
        if (defaultGame) {
          setSelectedGameId(defaultGame.id);
          setTournamentsForGame(defaultGame.tournaments);
          if (defaultGame.tournaments.length > 0) {
            const firstTournament = defaultGame.tournaments[0];
            console.log('🎯 Selected tournament:', firstTournament);
            setSelectedTournamentId(firstTournament.id);
            setSelectedTournamentObj(firstTournament.raw);
          }
        } else {
          console.warn('⚠️ No games with matches found');
        }

        if (gamesArr.length > 0) {
          const firstGame = gamesArr[0];
          // older fallback handled above when filtering fails
        } else {
          console.warn('⚠️ No games found');
        }
      } catch (err) {
        console.error('❌ Failed to load tournaments:', err);
        const errorMsg = err?.response?.status === 429 
          ? 'Quá nhiều yêu cầu. Vui lòng đợi một chút và thử lại.' 
          : 'Không thể tải danh sách giải đấu';
        showError(errorMsg);
        setAllTournaments([]);
        setGames([]);
        setTournamentsForGame([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showError]);

  useEffect(() => {
    const loadMatches = async () => {
      if (!selectedTournamentId) {
        console.log('⚠️ No tournament selected');
        setGroupedMatchesMap({});
        setSelectedTournamentObj(null);
        return;
      }
      
      setMatchesLoading(true);
      try {
        console.log('🔄 Loading matches for tournament:', selectedTournamentId);
        
        // Find tournament to get total rounds
        const tournament = allTournaments.find(t => t.id === selectedTournamentId);
        const totalRounds = tournament?.total_rounds || tournament?.totalRounds || 3;
        
        console.log('📊 Total rounds:', totalRounds);
        
        // First, fetch participants to build team logo map (similar to TournamentDetail)
        let teamLogos = {};
        try {
          const participantsResp = await tournamentService.getParticipants(selectedTournamentId, 'APPROVED');
          const teams = participantsResp.data || [];
          teams.forEach(t => {
            const logoUrl = t.logo_url || t.avatar || t.logo || null;
            if (t.id) teamLogos[t.id] = logoUrl;
            if (t.user_id) teamLogos[t.user_id] = logoUrl;
            if (t.team_id) teamLogos[t.team_id] = logoUrl;
          });
          console.log('👥 Team logos map:', teamLogos);
        } catch (e) {
          console.warn('⚠️ Failed to load team logos:', e);
        }
        
        // Load matches for all rounds
        let allMatches = [];
        for (let round = 1; round <= totalRounds; round++) {
          try {
            console.log(`🔄 Loading round ${round}...`);
            const resp = await tournamentService.getTournamentMatches(selectedTournamentId, { round_number: round });
            console.log(`📦 Round ${round} response:`, resp);
            
            // Thêm delay nhỏ để tránh rate limit
            if (round < totalRounds) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const respObj = resp ?? {};
            let roundMatches = [];
            
            // Normalize response structure
            if (Array.isArray(respObj)) {
              roundMatches = respObj;
            } else if (Array.isArray(respObj.matches)) {
              roundMatches = respObj.matches;
            } else if (Array.isArray(respObj.data)) {
              roundMatches = respObj.data;
            } else if (Array.isArray(respObj.data?.matches)) {
              roundMatches = respObj.data.matches;
            } else if (Array.isArray(respObj.data?.data)) {
              roundMatches = respObj.data.data;
            } else if (Array.isArray(respObj.data?.data?.matches)) {
              roundMatches = respObj.data.data.matches;
            }
            
            // Enrich matches with team logos
            const enrichedMatches = roundMatches.map(m => {
              const aId = m.team_a_participant_id ?? m.teamA?.id ?? null;
              const bId = m.team_b_participant_id ?? m.teamB?.id ?? null;
              return {
                ...m,
                team_a_logo: m.team_a_logo || teamLogos[aId] || m.teamA?.logo_url || null,
                team_b_logo: m.team_b_logo || teamLogos[bId] || m.teamB?.logo_url || null,
                teamA: m.teamA ? { ...m.teamA, logo_url: m.teamA.logo_url || teamLogos[aId] } : m.teamA,
                teamB: m.teamB ? { ...m.teamB, logo_url: m.teamB.logo_url || teamLogos[bId] } : m.teamB
              };
            });
            
            console.log(`✅ Round ${round} matches:`, enrichedMatches.length);
            allMatches = [...allMatches, ...enrichedMatches];
          } catch (roundErr) {
            console.warn(`⚠️ Failed to load round ${round}:`, roundErr);
            // Continue loading other rounds even if one fails
          }
        }

        console.log('✅ Total matches loaded:', allMatches.length);
        console.log('📋 First match:', allMatches[0]);

        // Group by round
        const grouped = {};
        allMatches.forEach(m => {
          const r = m.round_number ?? m.round ?? m.current_round ?? m.roundIndex ?? 1;
          const key = Number.isFinite(Number(r)) ? Number(r) : 1;
          
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(m);
        });

        console.log('📊 Grouped matches:', grouped);

        // Sort by time within each round
        Object.keys(grouped).forEach(k => {
          grouped[k].sort((a, b) => {
            const ta = a.match_time ? new Date(a.match_time).getTime() : 0;
            const tb = b.match_time ? new Date(b.match_time).getTime() : 0;
            return ta - tb;
          });
        });

        setGroupedMatchesMap(grouped);

        // Update tournament object
        const found = allTournaments.find(t => t.id === selectedTournamentId);
        console.log('🎯 Found tournament:', found);
        
        setSelectedTournamentObj(found);
        
        // Set round mặc định: tìm vòng có trận gần nhất
        let defaultRound = found?.current_round ?? found?.currentRound ?? found?.currentRoundNumber ?? 1;
        
        // Kiểm tra vòng mặc định có trận không, nếu không thì tìm vòng có trận gần nhất
        const defaultRoundMatches = grouped[defaultRound] || [];
        if (!defaultRoundMatches.some(m => m.match_time)) {
          // Tìm vòng trước có trận
          let foundRound = false;
          for (let i = defaultRound - 1; i >= 1; i--) {
            const roundMatches = grouped[i] || [];
            if (roundMatches.some(m => m.match_time)) {
              defaultRound = i;
              foundRound = true;
              break;
            }
          }
          // Nếu không có vòng trước, tìm vòng sau
          if (!foundRound) {
            const totalRounds = found?.total_rounds || Object.keys(grouped).length || 1;
            for (let i = defaultRound + 1; i <= totalRounds; i++) {
              const roundMatches = grouped[i] || [];
              if (roundMatches.some(m => m.match_time)) {
                defaultRound = i;
                break;
              }
            }
          }
        }
        
        setSelectedRound(defaultRound);
        
        console.log('✅ Matches loaded successfully');
      } catch (err) {
        console.error('❌ Failed to load matches:', err);
        const errorMsg = err?.response?.status === 429 
          ? 'Quá nhiều yêu cầu. Vui lòng đợi một chút và thử lại.' 
          : 'Không thể tải lịch thi đấu';
        showError(errorMsg);
        setGroupedMatchesMap({});
        setSelectedTournamentObj(null);
      } finally {
        setMatchesLoading(false);
      }
    };
    
    loadMatches();
  }, [selectedTournamentId, allTournaments, showError]);

  // When selected tournament changes, default to showing leaderboard if tournament is finished
  useEffect(() => {
    const s = (selectedTournamentObj?.status || '').toString().toUpperCase();
    if (s === 'COMPLETED' ) {
      setShowLeaderboardInline(true);
    } else {
      setShowLeaderboardInline(false);
    }
  }, [selectedTournamentObj]);

  // Load leaderboard when requested inline (same as TournamentDetail)
  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!selectedTournamentId || !showLeaderboardInline) return;
      setLeaderboardLoading(true);
      try {
        // Try getFinalLeaderboard (from blockchain) - same as TournamentDetail
        let leaderboard = null;
        try {
          const resp = await tournamentService.getFinalLeaderboard(selectedTournamentId);
          // Normalize response: backend returns { code: 0, data: { leaderboard } }
          const wrapper = resp?.data ?? resp;
          const payload = wrapper?.data ?? wrapper;
          
          if (Array.isArray(payload?.leaderboard)) {
            leaderboard = payload.leaderboard;
          } else if (Array.isArray(payload)) {
            leaderboard = payload;
          }
          
          if (leaderboard && leaderboard.length > 0) {
            setLeaderboardData(leaderboard);
          }
        } catch (e) {
          console.warn('⚠️ getFinalLeaderboard failed (tournament not completed or not recorded):', e?.message);
        }

        // load rewards map
        try {
          const rResp = await rewardService.getTournamentRewards(selectedTournamentId);
          const wrapperR = rResp?.data ?? rResp;
          const payloadR = wrapperR?.data ?? wrapperR;
          let rewardsArray = Array.isArray(payloadR) ? payloadR : (Array.isArray(wrapperR?.rewards) ? wrapperR.rewards : []);
          const map = {};
          rewardsArray.forEach(r => {
            const rk = Number(r.rank ?? r.position ?? r.place ?? NaN);
            if (!Number.isNaN(rk)) map[rk] = Number(r.reward_amount ?? r.reward ?? r.amount ?? 0) || 0;
          });
          setLeaderboardRewards(map);
        } catch (e) {
          console.warn('⚠️ Failed to load rewards:', e?.message);
          setLeaderboardRewards({});
        }
      } catch (err) {
        console.error('❌ Failed to load leaderboard', err);
        if (err?.response?.status !== 429) {
          // Chỉ hiển lỗi nếu không phải 429 (vì 429 đã được xử lý ở trên)
          setLeaderboardData([]);
        }
      } finally {
        setLeaderboardLoading(false);
      }
    };
    loadLeaderboard();
  }, [showLeaderboardInline, selectedTournamentId]);

  // Helper: compute simple standings from groupedMatchesMap when no leaderboard API exists
  const computeStandingsFromMatches = (grouped) => {
    try {
      const map = {}; // key -> { teamName, wins, losses, draws, score, totalMatches, avatar, wallet, opponentIds }
      const rounds = grouped || {};
      
      // First pass: build team data
      Object.keys(rounds).forEach(rk => {
        const matches = rounds[rk] || [];
        matches.forEach(m => {
          const aId = m.team_a_participant_id ?? m.teamA?.id ?? m.team_a_id ?? m.team_a ?? m.teamA?.team_id ?? null;
          const bId = m.team_b_participant_id ?? m.teamB?.id ?? m.team_b_id ?? m.team_b ?? m.teamB?.team_id ?? null;
          const aName = m.team_a_name || m.teamA?.team_name || m.teamA?.name || m.team1?.name || `Team ${aId || 'A'}`;
          const bName = m.team_b_name || m.teamB?.team_name || m.teamB?.name || m.team2?.name || `Team ${bId || 'B'}`;
          const aScore = Number(m.score_team_a ?? m.team1Score ?? m.score_a ?? m.score_a_team ?? m.scoreA ?? 0) || 0;
          const bScore = Number(m.score_team_b ?? m.team2Score ?? m.score_b ?? m.score_b_team ?? m.scoreB ?? 0) || 0;
          const aLogo = m.team_a_logo || m.teamA?.logo_url || null;
          const bLogo = m.team_b_logo || m.teamB?.logo_url || null;

          const keyA = String(aId ?? aName);
          const keyB = String(bId ?? bName);

          if (!map[keyA]) map[keyA] = { 
            teamName: aName, 
            wins: 0, 
            losses: 0, 
            draws: 0, 
            score: 0, 
            totalMatches: 0, 
            avatar: aLogo, 
            wallet: null,
            opponentIds: []
          };
          if (!map[keyB]) map[keyB] = { 
            teamName: bName, 
            wins: 0, 
            losses: 0, 
            draws: 0, 
            score: 0, 
            totalMatches: 0, 
            avatar: bLogo, 
            wallet: null,
            opponentIds: []
          };
          
          // Update avatar if we now have logo (in case first match didn't have it)
          if (!map[keyA].avatar && aLogo) map[keyA].avatar = aLogo;
          if (!map[keyB].avatar && bLogo) map[keyB].avatar = bLogo;

          map[keyA].totalMatches += 1;
          map[keyB].totalMatches += 1;
          map[keyA].score += aScore;
          map[keyB].score += bScore;
          
          // Track opponent IDs for Buchholz calculation
          map[keyA].opponentIds.push(keyB);
          map[keyB].opponentIds.push(keyA);

          if (aScore > bScore) {
            map[keyA].wins += 1;
            map[keyB].losses += 1;
          } else if (bScore > aScore) {
            map[keyB].wins += 1;
            map[keyA].losses += 1;
          } else {
            map[keyA].draws += 1;
            map[keyB].draws += 1;
          }
        });
      });

      // Convert map to sorted array
      let arr = Object.values(map).map((v, idx) => ({
        rank: null,
        teamName: v.teamName,
        avatar: v.avatar,
        wallet: v.wallet,
        score: v.score,
        wins: v.wins,
        losses: v.losses,
        draws: v.draws,
        totalMatches: v.totalMatches,
        buchholzScore: 0, // Will calculate in second pass
        opponentIds: v.opponentIds
      }));
      
      // Sort by wins desc, then score desc
      arr.sort((a, b) => {
        if ((b.wins - a.wins) !== 0) return b.wins - a.wins;
        return (b.score || 0) - (a.score || 0);
      });
      
      // Assign rank and calculate Buchholz score
      const indexMap = {}; // teamName -> array index for quick lookup
      arr.forEach((row, idx) => {
        indexMap[row.teamName] = idx;
      });
      
      arr = arr.map((row, i) => {
        // Calculate Buchholz: sum of opponent scores
        const buchholz = row.opponentIds.reduce((sum, oppId) => {
          const oppIndex = indexMap[oppId];
          if (oppIndex !== undefined) {
            return sum + (arr[oppIndex]?.score || 0);
          }
          return sum;
        }, 0);
        
        return { 
          ...row, 
          rank: i + 1,
          buchholzScore: buchholz
        };
      });
      
      return arr;
    } catch (e) {
      console.error('computeStandingsFromMatches error', e);
      return [];
    }
  };

  const getMatchStatusBadge = (m) => {
    const status = (m.status || m.match_status || 'PENDING').toString().toUpperCase();
    const colors = {
      PENDING: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      COMPLETED: 'bg-green-500/20 text-green-300 border border-green-500/30',
      ACTIVE: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      DONE: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
      CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30'
    };
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-neutral-800 text-gray-300'}`}>
        {status}
      </span>
    );
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
        <main className="flex gap-0 mb-0 flex-1">
          {/* Left Sidebar: Games */}
          <aside className="w-[22%] border-r border-primary-500/10 p-4 bg-gradient-to-b from-primary-700/5 to-dark-600 flex-shrink-0 overflow-y-auto backdrop-blur-sm h-full">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">Trò chơi</h2>
                {checkingMatches && (
                  <div className="flex items-center gap-1">
                    <svg className="animate-spin h-3 w-3 text-primary-400" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  </div>
                )}
              </div>
              <div className="h-px bg-gradient-to-r from-primary-500/50 to-transparent"></div>
            </div>
            
            {loading ? (
              <div className="text-gray-400 text-sm">Đang tải...</div>
            ) : games.length === 0 ? (
              <div className="text-gray-400 text-sm">Chưa có giải đấu nào</div>
            ) : (
              <div className="space-y-3">
                {(gamesFiltered.length > 0 ? gamesFiltered : games).map(g => {
                  const isSelectedGame = selectedGameId === g.id;
                  return (
                    <div key={String(g.id)}>
                      <button
                        onClick={() => {
                          console.log('🎮 Selected game:', g.name);
                          setSelectedGameId(g.id);
                          setTournamentsForGame(g.tournaments);
                          
                          if (g.tournaments.length > 0) {
                            setSelectedTournamentId(g.tournaments[0].id);
                            setSelectedTournamentObj(g.tournaments[0].raw);
                          } else {
                            setSelectedTournamentId(null);
                            setSelectedTournamentObj(null);
                          }
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between gap-3 transition-all border ${
                          isSelectedGame 
                            ? 'border-primary-500/10 bg-gradient-to-b from-primary-700/5 to-dark-600 text-white shadow-lg shadow-primary-500/30' 
                            : 'bg-dark-400 text-gray-300 hover:bg-dark-300 border-primary-700/20 hover:border-primary-500/30'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold truncate ${
                            isSelectedGame ? 'text-lg text-white' : 'text-base'
                          }`}>{g.name}</div>
                          <div className={`text-sm mt-0.5 ${
                            isSelectedGame ? 'text-gray-200' : 'text-gray-400'
                          }`}>{g.tournaments.length} giải đấu</div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className={`text-xs px-2 py-1 rounded-md font-medium ${
                            isSelectedGame 
                              ? 'bg-white/20 text-white' 
                              : 'bg-primary-500/10 text-primary-400'
                          }`}>
                            {g.tournaments.length}
                          </div>
                        </div>
                      </button>

                      {/* Tournaments for selected game */}
                      {isSelectedGame && g.tournaments.length > 0 && (
                        <div className="mt-2 space-y-2 pl-3 border-l-2 border-primary-500/30">
                          {g.tournaments.map(t => {
                            const status = (t.status || '').toString().toUpperCase();
                            const getStatusBadge = () => {
                              if (status === 'COMPLETED') return { text: 'Kết thúc', class: 'bg-green-500/20 text-green-400' };
                              if (status === 'ACTIVE') return { text: 'Đang diễn ra', class: 'bg-blue-500/20 text-blue-400' };
                              if (status === 'UPCOMING') return { text: 'Sắp tới', class: 'bg-yellow-500/20 text-yellow-400' };
                              return { text: 'Chờ', class: 'bg-gray-500/20 text-gray-400' };
                            };
                            const badge = getStatusBadge();
                            
                            return (
                              <button
                                key={t.id}
                                onClick={() => {
                                  console.log('🏆 Selected tournament:', t.name);
                                  setSelectedTournamentId(t.id);
                                  setSelectedTournamentObj(t.raw);
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all border ${
                                  selectedTournamentId === t.id 
                                    ? 'border-primary-500/10 bg-gradient-to-b from-primary-700/5 to-dark-600 text-white shadow-md shadow-primary-500/10' 
                                    : 'bg-dark-400/50 text-gray-300 hover:bg-dark-300 border-primary-700/10 hover:border-primary-500/20'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className={`truncate flex-1 leading-tight ${
                                    selectedTournamentId === t.id ? 'font-semibold text-base text-white' : 'text-sm'
                                  }`}>{t.name}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${badge.class} whitespace-nowrap font-medium`}>
                                    {badge.text}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </aside>

          {/* Center: Matches or Leaderboard */}
          <section className="flex-1 p-6 border-r border-gray-800 overflow-y-auto h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-white">{showLeaderboardInline ? 'Bảng xếp hạng' : 'Lịch thi đấu'}</h2>
              {selectedTournamentObj?.status === 'COMPLETED' && (
                <button
                  onClick={() => setShowLeaderboardInline(prev => !prev)}
                  className="px-3 py-1.5 rounded text-sm font-medium transition-colors bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                >
                  {showLeaderboardInline ? 'Xem trận đấu' : 'Xem BXH'}
                </button>
              )}
            </div>
            
            {matchesLoading && !showLeaderboardInline ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
                  <div>Đang tải lịch thi đấu...</div>
                </div>
              </div>
            ) : leaderboardLoading && showLeaderboardInline ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
                  <div>Đang tải bảng xếp hạng...</div>
                </div>
              </div>
            ) : !selectedTournamentId ? (
              <div className="text-center py-12">
                <div className="text-gray-400">Vui lòng chọn giải để xem chi tiết</div>
              </div>
            ) : showLeaderboardInline ? (
              <div>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-white truncate">
                    {selectedTournamentObj?.tournament_name || selectedTournamentObj?.name || 'Giải đấu'}
                  </div>
                </div>
                <div className="bg-dark-400 rounded-lg border border-primary-700/20 overflow-hidden">
                  <LeaderboardTable 
                    data={leaderboardData} 
                    loading={leaderboardLoading} 
                    rewards={leaderboardRewards}
                    showRewardColumn={true}
                  />
                </div>
              </div>
            ) : Object.keys(groupedMatchesMap).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400">Giải đấu chưa có trận nào</div>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-white truncate">
                    {selectedTournamentObj?.tournament_name || selectedTournamentObj?.name || 'Giải đấu'}
                  </div>
                </div>

                <TournamentMatches
                    groupedMatchesMap={Object.fromEntries(
                      Object.entries(groupedMatchesMap).map(([round, matches]) => [
                        round,
                        matches.filter(m => m.match_time) // Chỉ hiển thị trận có lịch
                      ])
                    )}
                    selectedRound={selectedRound}
                    setSelectedRound={setSelectedRound}
                    tournament={selectedTournamentObj}
                    isTeamView={false}
                    isAdmin={false}
                    getMatchStatusBadge={getMatchStatusBadge}
                    handleUpdateTime={async () => false}
                    handleUpdateScore={async () => false}
                    findTeamLogo={() => null}
                    handleStartNewRound={async () => {}}
                    creatingRound={false}
                    handleRecordRanking={async () => {}}
                    isRecording={false}
                    showRoundSelector={false}
                  />
              </div>
            )}
          </section>

          {/* Right Sidebar: Tournament Details & Controls */}
          <aside className="w-[18%] border-l border-primary-700/20 p-3 bg-gradient-to-b from-primary-700/5 to-dark-600 flex-shrink-0 overflow-y-auto h-full">
            {!selectedTournamentId ? (
              <div className="text-center py-16">
                <div className="text-gray-400 text-sm">Chọn giải đấu<br/>để xem thông tin</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tournament Info */}
                <div className="bg-dark-400 rounded-xl p-4 border border-primary-700/20">
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-white">Chi tiết giải đấu</h3>
                    <div className="h-px bg-gradient-to-r from-primary-500/50 to-transparent mt-2"></div>
                  </div>
                  
                  {selectedTournamentObj?.image && (
                    <div className="mb-4 -mx-4 -mt-4">
                      <img
                        src={selectedTournamentObj.image}
                        alt={selectedTournamentObj?.name}
                        className="w-full h-32 object-cover rounded-t-xl"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-dark-300/50">
                      <span className="text-xs text-gray-400">Trạng thái</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                        selectedTournamentObj?.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                        selectedTournamentObj?.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {selectedTournamentObj?.status === 'COMPLETED' ? 'Đã kết thúc' :
                         selectedTournamentObj?.status === 'ACTIVE' ? 'Đang diễn ra' :
                         'Chưa bắt đầu'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-dark-300/50">
                        <div className="text-xs text-gray-400 mb-1">Tổng vòng</div>
                        <div className="text-sm font-bold text-white">
                          {selectedTournamentObj?.total_rounds || selectedTournamentObj?.totalRounds || Object.keys(groupedMatchesMap).length || 1}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-dark-300/50">
                        <div className="text-xs text-gray-400 mb-1">Vòng hiện tại</div>
                        <div className="text-sm font-bold text-primary-400">
                          {selectedRound || selectedTournamentObj?.current_round || 1}
                        </div>
                      </div>
                    </div>
                    
                    {selectedTournamentObj?.start_date && (
                      <div className="p-2 rounded-lg bg-dark-300/50">
                        <div className="text-xs text-gray-400 mb-1">Ngày bắt đầu</div>
                        <div className="text-sm font-medium text-white">
                          {new Date(selectedTournamentObj.start_date).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    )}
                    
                    {selectedTournamentObj?.end_date && (
                      <div className="p-2 rounded-lg bg-dark-300/50">
                        <div className="text-xs text-gray-400 mb-1">Ngày kết thúc</div>
                        <div className="text-sm font-medium text-white">
                          {new Date(selectedTournamentObj.end_date).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    )}

                    {selectedTournamentObj?.total_team && (
                      <div className="p-2 rounded-lg bg-dark-300/50">
                        <div className="text-xs text-gray-400 mb-1">Tổng đội tham gia</div>
                        <div className="text-sm font-bold text-white">{selectedTournamentObj.total_team} đội</div>
                      </div>
                    )}

                    {selectedTournamentObj?.total_prize && (
                      <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                        <div className="text-xs text-yellow-400 mb-1">Tổng giải thưởng</div>
                        <div className="text-sm font-bold text-yellow-400">{Number(selectedTournamentObj.total_prize).toFixed(4)} ETH</div>
                      </div>
                    )}

                    {selectedTournamentObj?.registration_fee && (
                      <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/20">
                        <div className="text-xs text-gray-400 mb-1">Phí đăng ký</div>
                        <div className="text-sm font-bold text-primary-400">{Number(selectedTournamentObj.registration_fee).toFixed(4)} ETH</div>
                      </div>
                    )}
                  </div>

                  {/* Xóa link "Xem chi tiết giải đấu" - người dùng có thể click vào logo hoặc click trực tiếp vào tên giải */}
                </div>

                {/* Round Navigation - hiển thị tất cả vòng, chỉ enable vòng có trận */}
                {Object.keys(groupedMatchesMap).length > 0 && (
                  <div className="bg-dark-400 rounded-xl p-4 border border-primary-700/20">
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-white">Chọn vòng đấu</h3>
                      <div className="h-px bg-gradient-to-r from-primary-500/50 to-transparent mt-2"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: selectedTournamentObj?.total_rounds || Object.keys(groupedMatchesMap).length || 1 }).map((_, idx) => {
                        const roundNum = idx + 1;
                        const isSelected = selectedRound === roundNum;
                        const roundMatches = groupedMatchesMap[roundNum] || [];
                        const hasScheduledMatches = roundMatches.some(m => m.match_time);
                        
                        const handleRoundClick = () => {
                          // Nếu đang xem bảng xếp hạng, chuyển sang xem trận đấu
                          if (showLeaderboardInline) {
                            setShowLeaderboardInline(false);
                          }
                          
                          if (hasScheduledMatches) {
                            setSelectedRound(roundNum);
                          } else {
                            // Tìm vòng trước đó có trận
                            for (let i = roundNum - 1; i >= 1; i--) {
                              const prevRoundMatches = groupedMatchesMap[i] || [];
                              if (prevRoundMatches.some(m => m.match_time)) {
                                setSelectedRound(i);
                                return;
                              }
                            }
                            // Nếu không có vòng trước, tìm vòng sau
                            const totalRounds = selectedTournamentObj?.total_rounds || Object.keys(groupedMatchesMap).length || 1;
                            for (let i = roundNum + 1; i <= totalRounds; i++) {
                              const nextRoundMatches = groupedMatchesMap[i] || [];
                              if (nextRoundMatches.some(m => m.match_time)) {
                                setSelectedRound(i);
                                return;
                              }
                            }
                          }
                        };
                        
                        return (
                          <button
                            key={roundNum}
                            onClick={handleRoundClick}
                            disabled={!hasScheduledMatches}
                            className={`py-2.5 rounded-lg text-sm font-bold transition-all border ${
                              isSelected
                                ? 'border-primary-500/10 bg-gradient-to-b from-primary-700/5 to-dark-600 text-white shadow-lg shadow-primary-500/30'
                                : hasScheduledMatches
                                ? 'bg-dark-300 text-gray-300 hover:border-primary-500/10 hover:bg-gradient-to-b hover:from-primary-700/5 hover:to-dark-600 border-primary-700/20'
                                : 'bg-dark-500/50 text-gray-600 cursor-not-allowed opacity-40 border-transparent'
                            }`}
                          >
                            <span className="truncate">Vòng {roundNum}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </main>
      </div>
    </PublicLayout>
  );
};

export default Schedule;