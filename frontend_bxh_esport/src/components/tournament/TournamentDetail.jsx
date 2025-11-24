import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Loading } from '../common/Loading';
import Button from '../common/Button';
import TournamentInfo from './TournamentInfo';
import TournamentTeams from './TournamentTeams';
import TournamentMatches from './TournamentMatches';
import LeaderboardTable from './LeaderboardTable';
import tournamentService from '../../services/tournamentService';
import rewardService from '../../services/rewardService';
import { resolveTeamLogo } from '../../utils/imageHelpers';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES, ROUTES } from '../../utils/constants';

export const TournamentDetail = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [teamLogos, setTeamLogos] = useState({});
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' or 'matches'
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isUpdateScoreModalOpen, setIsUpdateScoreModalOpen] = useState(false);
  const [isUpdateTimeModalOpen, setIsUpdateTimeModalOpen] = useState(false);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isRecorded, setIsRecorded] = useState(false);
  const [leaderboard, setLeaderboard] = useState(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [creatingRound, setCreatingRound] = useState(false);
  const [selectedRound, setSelectedRound] = useState(1);
  const { user } = useAuth();
  const isAdmin = user && Number(user.role) === USER_ROLES.ADMIN;
  const isTeamManager = user && Number(user.role) === USER_ROLES.TEAM_MANAGER;

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  useEffect(() => {
    if (tournament) setSelectedRound(tournament?.current_round || 1);
  }, [tournament]);
// Auto-create next round removed: manual creation only to avoid unexpected round generation
  const loadData = async () => {
    try {
      setLoading(true);
      // Lấy thông tin giải đấu
      const tournamentRes = await tournamentService.getTournamentById(tournamentId);
      // Normalize API wrapper: backend returns { code, status, message, data }
      const wrapper = tournamentRes?.data ?? tournamentRes;
      const tournamentData = wrapper?.data ?? wrapper;
      setTournament(tournamentData);

      // Fetch rewards separately from dedicated endpoint to ensure canonical data
      try {
        const rResp = await rewardService.getTournamentRewards(tournamentId);
        const wrapperR = rResp?.data ?? rResp;
        const payloadR = wrapperR?.data ?? wrapperR;
        let rewardsArray = [];
        if (Array.isArray(payloadR)) rewardsArray = payloadR;
        else if (Array.isArray(payloadR?.rewards)) rewardsArray = payloadR.rewards;
        else if (Array.isArray(payloadR?.data)) rewardsArray = payloadR.data;
        setRewards(rewardsArray);
      } catch (e) {
        console.debug('No rewards for tournament or failed to fetch:', e?.message || e);
        setRewards([]);
      }

      // Lấy danh sách đội và chuẩn hoá logo
      try {
        const teamsRes = await tournamentService.getParticipants(tournamentId, 'APPROVED');
        const rawTeams = teamsRes.data || [];
        const normalizedTeams = (Array.isArray(rawTeams) ? rawTeams : []).map(t => ({
          ...t,
          // `logo` is the normalized URL used by the UI; `logo_url` keeps raw value from backend
          logo: resolveTeamLogo(t),
          logo_url: t.logo_url ?? t.avatar ?? t.logo ?? null
        }));
        setTeams(normalizedTeams);

        // Build a quick map id -> normalized logo URL for fast lookup when matches only contain participant ids
        const map = {};
        normalizedTeams.forEach(t => {
          if (t && (t.id || t.user_id)) {
            const logoUrl = t.logo || resolveTeamLogo(t);
            if (t.id) map[t.id] = logoUrl;
            if (t.user_id) map[t.user_id] = logoUrl;
          }
        });
        setTeamLogos(map);
      } catch {
        setTeams([]);
      }

      // Lấy danh sách trận đấu: fetch tất cả vòng (1..total_rounds)
      try {
        const totalRounds = tournamentData?.total_rounds || tournamentData?.totalRounds || 1;

        // Nếu totalRounds nhỏ (<=1) vẫn gọi 1 lần
        const roundsToFetch = Math.max(1, Number(totalRounds));

        const matchPromises = [];
        for (let r = 1; r <= roundsToFetch; r++) {
          matchPromises.push(
            tournamentService.getTournamentMatches(tournamentId, { round_number: r })
              .then(res => {
                // Normalize multiple possible response shapes from backend:
                // 1) Axios response: res.data -> { code, status, message, data: { matches: [...] } }
                // 2) Direct wrapper: { code, data: { matches } }
                // 3) Older shapes: { matches: [...] } or array
                if (Array.isArray(res)) return res;
                const wrapper = res?.data ?? res;
                const payload = wrapper?.data ?? wrapper;

                if (Array.isArray(payload)) return payload;
                if (Array.isArray(payload?.matches)) return payload.matches;
                if (Array.isArray(payload?.data)) return payload.data;
                // fallback: some code returns payload.matches directly
                if (Array.isArray(wrapper?.matches)) return wrapper.matches;

                return [];
              })
              .catch((err) => {
                console.warn('Failed to fetch matches for round', r, err);
                return [];
              })
          );
        }

        const roundsMatches = await Promise.all(matchPromises);
        // flatten and normalize
        const matchesData = roundsMatches.flat().map(normalizeMatch);
        // enrich matches with logos from teamLogos map (if available)
        const enriched = matchesData.map(m => {
          const aId = m.team_a_participant_id ?? m.teamA?.id ?? null;
          const bId = m.team_b_participant_id ?? m.teamB?.id ?? null;
          const aLogo = aId ? teamLogos[aId] : null;
          const bLogo = bId ? teamLogos[bId] : null;
          return {
            ...m,
            team_a_logo: m.team_a_logo ?? m.teamA?.logo_url ?? aLogo ?? null,
            team_b_logo: m.team_b_logo ?? m.teamB?.logo_url ?? bLogo ?? null,
            teamA: m.teamA ? { ...m.teamA, logo_url: m.teamA.logo_url ?? aLogo } : m.teamA,
            teamB: m.teamB ? { ...m.teamB, logo_url: m.teamB.logo_url ?? bLogo } : m.teamB,
          };
        });
        setMatches(enriched);
      } catch (err) {
        console.error('loadData getTournamentMatches error', err);
        setMatches([]);
      }

      setLoading(false);
    } catch {
      showError('Không thể tải dữ liệu giải đấu');
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toString().toUpperCase();
    const map = {
      PENDING: { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Chờ (PENDING)' },
      ACTIVE: { badge: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Đang diễn ra' },
      COMPLETED: { badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', label: 'Đã cập nhật kết quả' },
      DONE: { badge: 'bg-gray-700/20 text-gray-300 border-gray-700/30', label: 'Đã hoàn tất (DONE)' },
      CANCELLED: { badge: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Hủy' }
    };
    const item = map[s] || { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: status || 'Chờ' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${item.badge} ${item.badge.includes('bg-') ? '' : ''}`}>
        {item.label}
      </span>
    );
  };

  const getMatchStatusBadge = (status) => {
    const badges = {
      PENDING: { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30', label: 'Chưa diễn ra' },
      COMPLETED: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Đang diễn ra' },
      DONE: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', label: 'Đã kết thúc' }
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  const groupMatchesByRound = () => {
    const grouped = {};
    matches.forEach(match => {
      const roundNum = match.round_number || 1;
      if (!grouped[roundNum]) grouped[roundNum] = [];
      grouped[roundNum].push(match);
    });
    return grouped;
  };

  // Chuẩn hoá object match từ nhiều shape khác nhau của backend
  const normalizeMatch = (m) => {
    if (!m) return m;
    return {
      ...m,
      id: m.id ?? m.match_id,
      round_number: m.round_number ?? m.round ?? m.roundNumber ?? 1,
      match_time: m.match_time ?? m.scheduled_time ?? m.scheduledAt ?? m.time ?? m.matchTime ?? null,
      team_a_participant_id: m.team_a_participant_id ?? m.teamA?.id ?? m.teamAId ?? m.team_a_id ?? m.team_a_id,
      team_b_participant_id: m.team_b_participant_id ?? m.teamB?.id ?? m.teamBId ?? m.team_b_id ?? m.team_b_id,
      team_a_name: m.team_a_name ?? m.teamA?.team_name ?? m.teamA?.name ?? m.teamA_name ?? m.teamAName,
      team_b_name: m.team_b_name ?? m.teamB?.team_name ?? m.teamB?.name ?? m.teamB_name ?? m.teamBName,
      score_team_a: m.score_team_a ?? m.score_a ?? m.score1 ?? m.scoreA ?? (m.scores ? m.scores[0] : null),
      score_team_b: m.score_team_b ?? m.score_b ?? m.score2 ?? m.scoreB ?? (m.scores ? m.scores[1] : null),
      point_team_a: m.point_team_a ?? m.point_a ?? m.pointsA ?? null,
      point_team_b: m.point_team_b ?? m.point_b ?? m.pointsB ?? null,
      winner_participant_id: m.winner_participant_id ?? m.winner_id ?? m.winner ?? null,
      status: m.status ?? m.match_status ?? m.state ?? 'PENDING'
    };
  };

  const findTeamLogo = (teamOrId) => {
    if (!teamOrId) return null;

    // If caller passed an id (number or numeric string), try to resolve from `teams` state
    let teamObj = null;
    if (typeof teamOrId === 'object') {
      teamObj = teamOrId;
    } else {
      const id = Number(teamOrId);
      if (!Number.isNaN(id)) {
        // Prefer fast map lookup which contains normalized logo URLs
        const logoFromMap = teamLogos[id];
        if (logoFromMap) return logoFromMap;

        teamObj = teams.find(t => t.id === id || t.user_id === id || t.team_id === id) || null;
      }
    }

    // If we resolved a full team object, prefer its pre-normalized `logo` property
    if (teamObj) return teamObj.logo || resolveTeamLogo(teamObj);

    // If a string was passed, treat as URL/logo token
    if (typeof teamOrId === 'string') return resolveTeamLogo({ logo: teamOrId });

    return null;
  };

  const handleOpenScoreModal = (match) => {
    setSelectedMatch(match);
    // prefill scores if available
    setScoreA(match?.score_team_a ?? match?.score_a ?? match?.score1 ?? '');
    setScoreB(match?.score_team_b ?? match?.score_b ?? match?.score2 ?? '');
    setIsUpdateScoreModalOpen(true);
  };

  const handleOpenTimeModal = (match) => {
    setSelectedMatch(match);
    setIsUpdateTimeModalOpen(true);
  };

  const handleCloseModals = () => {
    setSelectedMatch(null);
    setIsUpdateScoreModalOpen(false);
    setIsUpdateTimeModalOpen(false);
    setScoreA('');
    setScoreB('');
  };

  const handleUpdateScore = async (matchId, sA, sB) => {
    try {
      const a = Number(sA ?? 0);
      const b = Number(sB ?? 0);

      // Call numeric-score endpoint which stores score_team_a/score_team_b and computes points
      const response = await tournamentService.updateMatchScore(matchId, a, b);
      console.debug('updateMatchScore response raw:', response);
      let wrapper;
      if (response && typeof response === 'object' && response.code !== undefined) wrapper = response;
      else if (response && typeof response === 'object' && response.data && response.data.code !== undefined) wrapper = response.data;
      else if (typeof response !== 'object') wrapper = { code: 0, data: response, message: '' };
      else wrapper = response;

      if (wrapper?.code === 0) {
        showSuccess(wrapper?.message || 'Cập nhật kết quả thành công!');
        handleCloseModals();

        // Use returned match from server when available to keep state canonical
        const returnedMatch = wrapper?.data?.match ?? wrapper?.match ?? null;
        if (returnedMatch) {
          setMatches(prev => prev.map(m => m.id === matchId ? ({ ...m, ...normalizeMatch(returnedMatch) }) : m));
        } else {
          // Fallback optimistic update if server doesn't return match
          setMatches(prev => prev.map(m => {
            if (m.id === matchId) {
              return {
                ...m,
                score_team_a: a,
                score_team_b: b,
                winner_participant_id: a > b ? m.team_a_participant_id : (b > a ? m.team_b_participant_id : null),
                point_team_a: a > b ? 2 : (a === b ? 1 : 0),
                point_team_b: b > a ? 2 : (a === b ? 1 : 0),
                status: 'COMPLETED'
              };
            }
            return m;
          }));
        }
      } else {
        showError(wrapper?.message || 'Không thể cập nhật kết quả');
      }
    } catch (error) {
      console.error('handleUpdateScore error', error);
      showError(error?.response?.data?.message || error?.message || 'Không thể cập nhật kết quả');
    }
  };

  const handleUpdateTime = async (matchId, scheduledTime) => {
    try {
      const payload = { match_time: new Date(scheduledTime).toISOString() };
      console.debug('Updating match schedule', { matchId, payload, status: selectedMatch?.status });
      const response = await tournamentService.updateMatchSchedule(matchId, payload);
      console.debug('updateMatchSchedule response raw:', response);
      let wrapper;
      if (response && typeof response === 'object' && response.code !== undefined) wrapper = response;
      else if (response && typeof response === 'object' && response.data && response.data.code !== undefined) wrapper = response.data;
      else if (typeof response !== 'object') wrapper = { code: 0, data: response, message: '' };
      else wrapper = response;

      if (wrapper?.code === 0) {
        showSuccess(wrapper?.message || 'Cập nhật thời gian thành công!');
        handleCloseModals();
        // Update match time locally without reloading everything
        const scheduledMs = new Date(payload.match_time).getTime();
        const reached = !Number.isNaN(scheduledMs) && scheduledMs <= Date.now();
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, match_time: payload.match_time, __scheduledReached: reached } : m));
      } else {
        // Try multiple locations for server message and fall back to generic text
        const serverMsg = wrapper?.message || wrapper?.data?.message || wrapper?.error || 'Không thể cập nhật thời gian';
        console.warn('updateMatchSchedule non-OK response wrapper:', wrapper, 'raw response:', response);
        showError(serverMsg);
      }
    } catch (error) {
      // Log full error for debugging and show best available message to user
      console.error('handleUpdateTime error (full):', error);
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Không thể cập nhật thời gian';
      showError(serverMsg);
    }
  };

  const handleStartNewRound = async () => {
    try {
      setCreatingRound(true);
      const response = await tournamentService.startNextRound(tournamentId);
      console.debug('startNextRound response raw:', response);
      let wrapper;
      if (response && typeof response === 'object' && response.code !== undefined) wrapper = response;
      else if (response && typeof response === 'object' && response.data && response.data.code !== undefined) wrapper = response.data;
      else if (typeof response !== 'object') wrapper = { code: 0, data: response, message: '' };
      else wrapper = response;

      if (wrapper?.code === 0) {
        const nextRound = wrapper?.data?.round_number ?? wrapper?.round_number;
        showSuccess(wrapper?.message || `Tạo vòng ${nextRound} thành công!`);

        // Ensure the UI reflects the new round by reloading full tournament data.
        // Previously we attempted to append only the new matches; that can miss
        // shapes or nested payloads returned by the backend. A full reload is
        // simpler and more reliable.
        try {
          await loadData();
          // After reload, switch to matches tab and the new round
          setActiveTab('matches');
          setSelectedRound(nextRound);
        } catch (err) {
          console.warn('Could not reload tournament after creating round', err);
        }
      } else {
        showError(response?.message || 'Không thể tạo vòng mới');
      }
    } catch (error) {
      showError(error?.response?.data?.message || error?.message || 'Không thể tạo vòng mới');
    } finally {
      setCreatingRound(false);
    }
  };

  // Modal state for creating next round (replace window.confirm)
  const [showCreateRoundModal, setShowCreateRoundModal] = useState(false);
  const openCreateRoundModal = () => setShowCreateRoundModal(true);
  const closeCreateRoundModal = () => setShowCreateRoundModal(false);

  const confirmCreateRound = async () => {
    closeCreateRoundModal();
    await handleStartNewRound();
  };

  const handleRecordRanking = async () => {
    try {
      setIsRecording(true);
      const resp = await tournamentService.recordRanking(tournamentId);
      console.debug('recordRanking response raw:', resp);
      // Normalize response wrapper patterns (match other handlers)
      let wrapper;
      if (resp && typeof resp === 'object' && resp.code !== undefined) wrapper = resp;
      else if (resp && typeof resp === 'object' && resp.data && resp.data.code !== undefined) wrapper = resp.data;
      else if (typeof resp !== 'object') wrapper = { code: 0, data: resp, message: '' };
      else wrapper = resp;

      if (wrapper?.code === 0) {
        showSuccess(wrapper?.message || 'Ghi bảng xếp hạng thành công');
        // Mark leaderboard_saved on the tournament so UI reflects persisted state
        setTournament(prev => ({ ...prev, leaderboard_saved: 1 }));
        setIsRecorded(true);
      } else {
        // Try to extract server message from multiple locations
        const serverMsg = wrapper?.message || wrapper?.data?.message || wrapper?.error || 'Không thể ghi bảng xếp hạng';
        console.warn('recordRanking non-OK response wrapper:', wrapper, 'raw response:', resp);
        showError(serverMsg);
      }
    } catch (err) {
      console.error('handleRecordRanking error', err);
      showError(err?.response?.data?.message || err?.message || 'Không thể ghi bảng xếp hạng');
    } finally {
      setIsRecording(false);
    }
  };

  // Prefer canonical rewards fetched from rewards endpoint; fall back to tournament.rewards/prizes
  const normalizedRewards = (Array.isArray(rewards) && rewards.length > 0)
    ? rewards
    : (tournament && (Array.isArray(tournament.rewards) ? tournament.rewards : (Array.isArray(tournament.prizes) ? tournament.prizes : []))) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-300">Không tìm thấy giải đấu</p>
        <Button onClick={() => navigate('/admin/tournaments')} className="mt-4">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const groupedMatches = groupMatchesByRound();
  const currentRoundNumber = tournament?.current_round || 1;
  const currentRoundMatches = groupedMatches[currentRoundNumber] || [];
  const roundFinished = currentRoundMatches.length > 0 && currentRoundMatches.every(m => m.status === 'COMPLETED');
  // Consider tournament finished (for UI actions) when all matches across all rounds are DONE
  const allMatches = matches || [];
  const allRoundsDone = allMatches.length > 0 && allMatches.every(m => (m?.status || '').toString().toUpperCase() === 'DONE');

  // Normalize leaderboard rows into the shape expected by `LeaderboardTable`.
  // LeaderboardTable expects items like: { rank, team: { logo, name }, wins, losses, points }
  const normalizedLeaderboard = (Array.isArray(leaderboard) ? leaderboard : []).map((row, idx) => {
    // row may be: { team: { id, name, logo_url } } or { team_id, team_name, logo_url } or simple objects from blockchain
    const rawTeam = row?.team ?? null;

    // prefer explicit logo_url fields, then nested team.logo, then other common keys
    const rawLogo = row?.team?.logo_url ?? row?.team?.logo ?? row?.logo ?? row?.team_logo ?? row?.avatar ?? row?.team?.avatar ?? null;
    const rawName = row?.team?.name ?? row?.team_name ?? row?.name ?? row?.username ?? row?.wallet ?? null;

    const teamObj = rawTeam && typeof rawTeam === 'object' ? rawTeam : {
      id: row?.team_id ?? row?.id ?? null,
      name: rawName || `Team ${row?.team_id ?? (idx + 1)}`,
      logo_url: rawLogo
    };

    // ensure logo URL is normalized so <img> can load it
    const logoUrl = resolveTeamLogo(teamObj.logo_url ? { logo: teamObj.logo_url } : (teamObj || { logo: rawLogo }));

    return {
      rank: row?.rank ?? (idx + 1),
      team: {
        logo: logoUrl,
        name: teamObj.name || ('-' ),
      },
      wins: row?.wins ?? row?.win ?? row?.wins_count ?? 0,
      losses: row?.losses ?? row?.loss ?? row?.losses_count ?? 0,
      points: row?.points ?? row?.score ?? row?.total_points ?? 0,
    };
  });

  return (
    <div className="min-h-screen bg-dark-400 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Always navigate back to home to ensure consistent UX when returning
                // from detail page as requested by product.
                return navigate(ROUTES.HOME || '/');
              }}
            >
              Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">{tournament.name}</h1>
              <p className="text-gray-300 text-sm">{tournament.game_name || 'Esports'}</p>
              {tournament?.prize_pool != null && (
                <div className="text-sm text-yellow-300 mt-1">Giải thưởng: {tournament.prize_pool} ETH</div>
              )}
              
            </div>
          </div>
        </div>

        {/* Thông tin giải đấu */}
        <TournamentInfo
          tournament={tournament}
          teamsLength={teams.length}
          matchesLength={matches.length}
          normalizedRewards={normalizedRewards}
          getStatusBadge={getStatusBadge}
          formatDateTime={(d) => (d ? new Date(d).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}) : '')}
          isTeamView={isTeamManager}
          isAdmin={isAdmin}
          handleStartNewRound={handleStartNewRound}
          openCreateRoundModal={openCreateRoundModal}
          creatingRound={creatingRound}
          teams={teams}
        />

       

        {/* Show Register button for non-admin users when tournament is PENDING */}
        

        {/* Tabs */}
        <div className="border-b border-primary-700/20">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('teams')}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'teams' ? 'border-cyan-300 text-cyan-300' : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
              }`}
            >
              Danh sách đội
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'matches' ? 'border-cyan-300 text-cyan-300' : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
              }`}
            >
              Danh sách trận
            </button>
            <button
              onClick={async () => {
                setActiveTab('leaderboard');
                setLeaderboardLoading(true);
                try {
                  const resp = await tournamentService.getFinalLeaderboard(tournamentId);
                  let raw = [];
                  if (resp?.code === 0 && resp?.data?.leaderboard) raw = resp.data.leaderboard;
                  else if (resp?.data && Array.isArray(resp.data.leaderboard)) raw = resp.data.leaderboard;
                  else if (Array.isArray(resp)) raw = resp;
                  else if (resp?.leaderboard) raw = resp.leaderboard;

                  setLeaderboard(Array.isArray(raw) ? raw : raw?.leaderboard ?? []);
                } catch (err) {
                  console.error('Failed to load leaderboard', err);
                  setLeaderboard([]);
                } finally {
                  setLeaderboardLoading(false);
                }
              }}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'leaderboard' ? 'border-cyan-300 text-cyan-300' : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
              }`}
            >
              Bảng xếp hạng
            </button>
          </div>
        </div>

        {/* Tab Content - Teams */}
        {activeTab === 'teams' && (
          <TournamentTeams
            teams={teams}
            getStatusBadge={getStatusBadge}
            findTeamLogo={findTeamLogo}
          />
        )}

        {/* Tab Content - Matches */}
        {activeTab === 'matches' && (
          <TournamentMatches
            groupedMatchesMap={groupedMatches}
            selectedRound={selectedRound}
            setSelectedRound={setSelectedRound}
            tournament={tournament}
            isTeamView={false}
            isAdmin={isAdmin}
            getMatchStatusBadge={getMatchStatusBadge}
            handleOpenTimeModal={handleOpenTimeModal}
            handleOpenScoreModal={handleOpenScoreModal}
            findTeamLogo={findTeamLogo}
            handleStartNewRound={handleStartNewRound}
            openCreateRoundModal={openCreateRoundModal}
            creatingRound={creatingRound}
            handleRecordRanking={handleRecordRanking}
            isRecording={isRecording}
          />
        )}

        {/* Tab Content - Leaderboard */}
        {activeTab === 'leaderboard' && (
          <LeaderboardTable data={normalizedLeaderboard} loading={leaderboardLoading} />
        )}
      </div>

      {/* Modals */}
      {showCreateRoundModal && (
        <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">Xác nhận tạo vòng tiếp theo</h2>
              <p className="text-gray-300">Sau khi tạo vòng tiếp theo, kết quả các trận ở vòng trước sẽ không thể sửa. Bạn có chắc muốn tiếp tục?</p>
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={closeCreateRoundModal}>Hủy</Button>
                <Button variant="primary" className="flex-1" onClick={confirmCreateRound} disabled={creatingRound}>{creatingRound ? 'Đang tạo...' : 'Xác nhận'}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {isUpdateTimeModalOpen && selectedMatch && (
  <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <Card className="w-full max-w-md">
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">
          <svg className="w-6 h-6 inline mr-2 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Cập nhật thời gian thi đấu
        </h2>

        {/* Match Info */}
        <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-lg p-3 border border-primary-500/30 text-center">
          <span className="text-white font-semibold">
            {selectedMatch.team_a_name || 'TBD'} VS {selectedMatch.team_b_name || 'TBD'}
          </span>
        </div>

        {/* Scheduled Time */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Chọn ngày & giờ thi đấu
          </label>
          <input
            type="datetime-local"
            defaultValue={selectedMatch.match_time ? new Date(selectedMatch.match_time).toISOString().slice(0, 16) : ''}
            className="w-full px-3 py-2 bg-white border border-primary-700/30 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500"
            id="scheduledTime"
            disabled={selectedMatch.status === 'COMPLETED'}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleCloseModals}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => {
              if (selectedMatch.status === 'COMPLETED') {
                showError('Không thể gán lịch cho trận đấu đã kết thúc.');
                return;
              }
              const scheduledTime = document.getElementById('scheduledTime').value;
              if (!scheduledTime) {
                showError('Vui lòng chọn thời gian');
                return;
              }
              handleUpdateTime(selectedMatch.id, scheduledTime);
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Cập nhật
          </Button>
        </div>
      </div>
    </Card>
  </div>
)}
      {isUpdateScoreModalOpen && selectedMatch && (
        <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">Cập nhật kết quả</h2>

              <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-lg p-3 border border-primary-500/30 text-center">
                <span className="text-white font-semibold">
                  {selectedMatch.team_a_name || 'Team A'} VS {selectedMatch.team_b_name || 'Team B'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Điểm {selectedMatch.team_a_name || 'A'}</label>
                  <input
                    type="number"
                    min="0"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-primary-700/30 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Điểm {selectedMatch.team_b_name || 'B'}</label>
                  <input
                    type="number"
                    min="0"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-primary-700/30 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={handleCloseModals}>Hủy</Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={scoreA === '' || scoreB === '' || Number(scoreA) === Number(scoreB)}
                  onClick={() => {
                    const a = scoreA === '' ? 0 : Number(scoreA);
                    const b = scoreB === '' ? 0 : Number(scoreB);
                    handleUpdateScore(selectedMatch.id, a, b);
                  }}
                >
                  Xác nhận kết quả
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};

export default TournamentDetail;
