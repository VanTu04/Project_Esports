import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../common/Card';
import { Loading } from '../common/Loading';
import Button from '../common/Button';
import TournamentInfo from './TournamentInfo';
import TournamentTeams from './TournamentTeams';
import TournamentMatches from './TournamentMatches';
import LeaderboardTable from './LeaderboardTable';
import RegistrationButton from './RegistrationButton';
import tournamentService from '../../services/tournamentService';
import rewardService from '../../services/rewardService';
import { resolveTeamLogo } from '../../utils/imageHelpers';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES, ROUTES } from '../../utils/constants';
import PublicLayout from '../layout/PublicLayout';

export const TournamentDetail = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useNotification();

  // Check if this is a public route (not admin/dashboard route)
  const isPublicRoute = location.pathname.startsWith('/tournaments') && !location.pathname.includes('/admin');

  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [teamLogos, setTeamLogos] = useState({});
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' or 'matches'
  // Match modal state moved into `TournamentMatches` to keep detail file focused on data loading
  const [isRecording, setIsRecording] = useState(false);
  const [isRecorded, setIsRecorded] = useState(false);
  const [leaderboard, setLeaderboard] = useState(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [creatingRound, setCreatingRound] = useState(false);
  const [selectedRound, setSelectedRound] = useState(1);
  const [isUserTeamRegistered, setIsUserTeamRegistered] = useState(false);
  const { user } = useAuth();
  const isAdmin = user && Number(user.role) === USER_ROLES.ADMIN;
  const isTeamManager = user && Number(user.role) === USER_ROLES.TEAM_MANAGER;
  const isTeam = user && (Number(user.role) === 3 || Number(user.role) === USER_ROLES.TEAM_MANAGER);

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  // `selectedRound` synchronization handled inside `TournamentMatches` component
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
        // Lấy tất cả participants (cả WAITING_APPROVAL và APPROVED)
        const teamsRes = await tournamentService.getParticipants(tournamentId);
        const rawTeams = teamsRes.data || [];
        const normalizedTeams = (Array.isArray(rawTeams) ? rawTeams : []).map(t => ({
          ...t,
          // `logo` is the normalized URL used by the UI; `logo_url` keeps raw value from backend
          logo: resolveTeamLogo(t),
          logo_url: t.logo_url ?? t.avatar ?? t.logo ?? null
        }));
        
        // Filter chỉ lấy APPROVED để hiển thị
        const approvedTeams = normalizedTeams.filter(t => 
          (t.status || '').toString().toUpperCase() === 'APPROVED'
        );
        setTeams(approvedTeams);

        // Build a quick map id -> normalized logo URL for fast lookup when matches only contain participant ids
        const map = {};
        approvedTeams.forEach(t => {
          if (t && (t.id || t.user_id)) {
            const logoUrl = t.logo || resolveTeamLogo(t);
            if (t.id) map[t.id] = logoUrl;
            if (t.user_id) map[t.user_id] = logoUrl;
          }
        });
        setTeamLogos(map);
        
        // Check if current user's team is registered (bất kể status)
        if (user && isTeam) {
          const userTeamRegistered = normalizedTeams.some(t => 
            (t.user_id === user.id || t.id === user.id) && 
            ['WAITING_APPROVAL', 'APPROVED'].includes((t.status || '').toString().toUpperCase())
          );
          setIsUserTeamRegistered(userTeamRegistered);
        }
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
        // flatten (use backend-provided shape directly)
        const matchesData = roundsMatches.flat();
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

  // Status badge helper moved to TournamentInfo (imported there and used by other components)

  const getMatchStatusBadge = (matchOrStatus) => {
    // Accept either the full match object or a status string for backward compatibility
    let status = 'PENDING';
    let matchTime = null;
    let scheduledReachedFlag = false;
    if (!matchOrStatus) matchOrStatus = {};
    if (typeof matchOrStatus === 'string') {
      status = matchOrStatus;
    } else if (typeof matchOrStatus === 'object') {
      status = (matchOrStatus.status || 'PENDING').toString().toUpperCase();
      matchTime = matchOrStatus.match_time ?? matchOrStatus.scheduled_time ?? matchOrStatus.scheduledAt ?? null;
      scheduledReachedFlag = !!matchOrStatus.__scheduledReached;
    }

    // BYE detection: if this is a BYE/walkover match, don't show any badge
    const isBye = (obj) => {
      if (!obj || typeof obj !== 'object') return false;
      if (obj.is_bye || obj.bye || obj.walkover || obj.isWalkover) return true;
      if (obj.result_type === 'BYE' || obj.result === 'BYE') return true;
      // if one side is missing and server used teamA as bye team
      if (!obj.team_b_participant_id && (obj.team_a_participant_id || obj.teamA || obj.team_a_name)) return true;
      return false;
    };
    if (isBye(matchOrStatus)) {
      return null;
    }

    // If there's no scheduled time or scheduled time is in the future, show 'Chưa diễn ra'
    if (!matchTime) {
      return (<span className={`px-2 py-1 rounded-full text-xs font-medium border bg-gray-700/10 text-gray-300 border-gray-700/20`}>Chưa diễn ra</span>);
    }
    const scheduledMs = new Date(matchTime).getTime();
    if (!Number.isNaN(scheduledMs) && scheduledMs > Date.now() && !scheduledReachedFlag) {
      return (<span className={`px-2 py-1 rounded-full text-xs font-medium border bg-gray-700/10 text-gray-300 border-gray-700/20`}>Chưa diễn ra</span>);
    }

    const badges = {
      // PENDING: treat as ongoing and editable
      PENDING: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Đang diễn ra' },
      // COMPLETED: finished but still editable (allow result edits)
      COMPLETED: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', label: 'Hoàn thành' },
      // DONE: finished and locked (no edits allowed)
      DONE: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', label: 'Hoàn thành' },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  const isByeMatch = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    if (obj.is_bye || obj.bye || obj.walkover || obj.isWalkover) return true;
    if (obj.result_type === 'BYE' || obj.result === 'BYE') return true;
    if (!obj.team_b_participant_id && (obj.team_a_participant_id || obj.teamA || obj.team_a_name)) return true;
    return false;
  };

  const getTeamDisplayName = (matchObj, side = 'a') => {
    if (!matchObj || typeof matchObj !== 'object') return (side === 'a' ? 'TBD' : 'TBD');
    const s = side === 'a' ? 'a' : 'b';
    // try flat names first
    if (s === 'a') {
      if (matchObj.team_a_name) return matchObj.team_a_name;
    } else {
      if (matchObj.team_b_name) return matchObj.team_b_name;
    }

    // try nested teamA/teamB objects
    const teamObj = (s === 'a' ? (matchObj.teamA ?? matchObj.team_a ?? matchObj.team_a_team) : (matchObj.teamB ?? matchObj.team_b ?? matchObj.team_b_team));
    if (teamObj) {
      return teamObj.team_name || teamObj.name || teamObj.teamName || teamObj.displayName || teamObj.username || teamObj.fullName || teamObj.name_en || teamObj.title || 'TBD';
    }

    // try generic fallbacks
    if (matchObj["team_" + s + "_name"]) return matchObj["team_" + s + "_name"];
    if (matchObj["team" + s.toUpperCase() + "_name"]) return matchObj["team" + s.toUpperCase() + "_name"];

    // BYE detection
    if (isByeMatch(matchObj) && s === 'a') {
      // BYE often carried in teamA
      return matchObj.team_a_name || matchObj.teamA?.team_name || matchObj.teamA?.name || 'BYE';
    }

    return (s === 'a' ? 'TBD' : 'TBD');
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

  // NOTE: normalizeMatch removed — rely on backend to provide canonical match shape.

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

        // Use returned match from server when available to keep state canonical
        const returnedMatch = wrapper?.data?.match ?? wrapper?.match ?? null;
        if (returnedMatch) {
          // Merge server match directly into local state. Avoid calling missing helpers.
          const scheduledMs = returnedMatch.match_time ? new Date(returnedMatch.match_time).getTime() : null;
          const reached = scheduledMs !== null && !Number.isNaN(scheduledMs) && scheduledMs <= Date.now();
          setMatches(prev => prev.map(m => m.id === matchId ? ({ ...m, ...returnedMatch, __scheduledReached: reached }) : m));
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
                // After result update, mark as COMPLETED (still editable until marked DONE)
                status: 'COMPLETED'
              };
            }
            return m;
          }));
        }
        return true;
      } else {
        showError(wrapper?.message || 'Không thể cập nhật kết quả');
        return false;
      }
    } catch (error) {
      console.error('handleUpdateScore error', error);
      showError(error?.response?.data?.message || error?.message || 'Không thể cập nhật kết quả');
      return false;
    }
  };

  const handleUpdateTime = async (matchId, scheduledTime) => {
    try {
      const payload = { match_time: new Date(scheduledTime).toISOString() };
      console.debug('Updating match schedule', { matchId, payload });
      const response = await tournamentService.updateMatchSchedule(matchId, payload);
      console.debug('updateMatchSchedule response raw:', response);
      let wrapper;
      if (response && typeof response === 'object' && response.code !== undefined) wrapper = response;
      else if (response && typeof response === 'object' && response.data && response.data.code !== undefined) wrapper = response.data;
      else if (typeof response !== 'object') wrapper = { code: 0, data: response, message: '' };
      else wrapper = response;

      if (wrapper?.code === 0) {
        showSuccess(wrapper?.message || 'Cập nhật thời gian thành công!');
        // Update match time locally without reloading everything
        const scheduledMs = new Date(payload.match_time).getTime();
        const reached = !Number.isNaN(scheduledMs) && scheduledMs <= Date.now();
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, match_time: payload.match_time, __scheduledReached: reached } : m));
        return true;
      } else {
        // Try multiple locations for server message and fall back to generic text
        const serverMsg = wrapper?.message || wrapper?.data?.message || wrapper?.error || 'Không thể cập nhật thời gian';
        console.warn('updateMatchSchedule non-OK response wrapper:', wrapper, 'raw response:', response);
        showError(serverMsg);
        return false;
      }
    } catch (error) {
      // Log full error for debugging and show best available message to user
      console.error('handleUpdateTime error (full):', error);
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Không thể cập nhật thời gian';
      showError(serverMsg);
      return false;
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
        // Also mark existing matches as COMPLETED so UI shows them as finished
        // (backend may later mark matches as DONE when fully locked).
        try {
          setMatches(prev => prev.map(m => ({ ...m, status: 'COMPLETED' })));
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

  // Modal state moved into TournamentMatches component

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

  // Expose debug payload to window without rendering it as a React child
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.__TOURNAMENT_DEBUG = { tournament, normalizedRewards };
        console.debug && console.debug('TournamentDetail: tournament payload', { tournament, normalizedRewards });
      }
    } catch (e) {
      // ignore
    }
  }, [tournament, normalizedRewards]);

  // Build a mapping rank -> reward amount (number) for easy lookup by LeaderboardTable
  const rewardsMap = (Array.isArray(normalizedRewards) ? normalizedRewards : []).reduce((map, r) => {
    const rank = Number(r?.rank ?? r?.position ?? r?.place ?? r?.rank_number ?? NaN);
    if (!Number.isNaN(rank)) {
      const amount = Number(r?.reward_amount ?? r?.amount ?? r?.reward ?? r?.value ?? 0) || 0;
      map[rank] = amount;
    }
    return map;
  }, {});

  if (loading) {
    const loadingContent = (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Đang tải dữ liệu..." />
      </div>
    );
    return isPublicRoute ? <PublicLayout>{loadingContent}</PublicLayout> : loadingContent;
  }

  if (!tournament) {
    const errorContent = (
      <div className="p-8 text-center">
        <p className="text-gray-300">Không tìm thấy giải đấu</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Quay lại
        </Button>
      </div>
    );
    return isPublicRoute ? <PublicLayout>{errorContent}</PublicLayout> : errorContent;
  }

  const groupedMatches = groupMatchesByRound();
  const currentRoundNumber = tournament?.current_round || 1;
  const currentRoundMatches = groupedMatches[currentRoundNumber] || [];
  // A round is considered finished when all matches are COMPLETED or DONE
  const roundFinished = currentRoundMatches.length > 0 && currentRoundMatches.every(m => {
    const s = (m?.status || '').toString().toUpperCase();
    return s === 'COMPLETED' || s === 'DONE';
  });
  // Consider tournament finished (for UI actions) when all matches across all rounds are DONE
  const allMatches = matches || [];
  const allRoundsDone = allMatches.length > 0 && allMatches.every(m => (m?.status || '').toString().toUpperCase() === 'DONE');

  // Leaderboard normalization moved into `LeaderboardTable` for clarity.

  // Check tournament status
  const tournamentStatus = (tournament?.status || '').toString().toUpperCase();
  const isPending = tournamentStatus === 'PENDING';
  const isActive = tournamentStatus === 'ACTIVE';
  const isCompleted = tournamentStatus === 'COMPLETED';
  const showMatchesTab = isActive || isCompleted;
  const showLeaderboardTab = tournament?.leaderboard_saved === 1 || tournament?.leaderboard_saved === true;

  // Wrap content with PublicLayout if user is not logged in
  const content = (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Prefer going back in browser history when possible so users
                  // return to their previous page. Fall back to HOME route.
                  try {
                    if (window && window.history && window.history.length > 1) {
                      return navigate(-1);
                    }
                  } catch (e) {
                    // ignore and fallback
                  }
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
            
            {/* Register button - only show for teams who haven't registered and tournament is PENDING */}
            {isPending && isTeam && !isUserTeamRegistered && (
              <div className="min-w-[200px]">
                <RegistrationButton 
                  tournament={tournament} 
                  isTeamView={true}
                  onRegistrationChange={(status) => {
                    // Sau khi đăng ký thành công, chỉ cập nhật state local
                    if (status?.status === 'WAITING_APPROVAL' || status?.status === 'APPROVED') {
                      // Set ngay để ẩn nút đăng ký
                      setIsUserTeamRegistered(true);
                    }
                  }}
                />
              </div>
            )}
          </div>

        {/* Thông tin giải đấu */}
        <TournamentInfo
          tournament={tournament}
          teamsLength={teams.length}
          matchesLength={matches.length}
          normalizedRewards={normalizedRewards}
          formatDateTime={(d) => (d ? new Date(d).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}) : '')}
          isTeamView={false}
          isAdmin={isAdmin}
          handleStartNewRound={isAdmin ? handleStartNewRound : undefined}
          creatingRound={creatingRound}
          teams={teams}
        />

        {/* Tabs */}
        <div className="border-b border-primary-700/20">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('teams')}
              className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'teams' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-300 hover:text-primary-300 hover:border-primary-400/50'
              }`}
            >
              Danh sách đội
            </button>
            {showMatchesTab && (
              <button
                onClick={() => setActiveTab('matches')}
                className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === 'matches' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-300 hover:text-primary-300 hover:border-primary-400/50'
                }`}
              >
                Danh sách trận
              </button>
            )}
            {showLeaderboardTab && (
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
                  activeTab === 'leaderboard' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-300 hover:text-primary-300 hover:border-primary-400/50'
                }`}
              >
                Bảng xếp hạng
              </button>
            )}
          </div>
        </div>

        {/* Tab Content - Teams */}
        {activeTab === 'teams' && (
          <TournamentTeams
            teams={teams}
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
            handleUpdateTime={handleUpdateTime}
            handleUpdateScore={handleUpdateScore}
            findTeamLogo={findTeamLogo}
            handleStartNewRound={handleStartNewRound}
            creatingRound={creatingRound}
            handleRecordRanking={handleRecordRanking}
            isRecording={isRecording}
          />
        )}

        {/* Tab Content - Leaderboard */}
        {activeTab === 'leaderboard' && showLeaderboardTab && (
          <LeaderboardTable data={leaderboard} loading={leaderboardLoading} rewards={rewardsMap} showRewardColumn={false} />
        )}
        </div>

        {/* Modals moved into `TournamentMatches` to keep this container focused on data and tabs */}

      </div>
  );

  // If this is a public route (/tournaments/:id), wrap with PublicLayout
  if (isPublicRoute) {
    return <PublicLayout>{content}</PublicLayout>;
  }

  // If this is an admin/dashboard route, return content directly (already wrapped by DashboardLayout)
  return content;
};

export default TournamentDetail;
