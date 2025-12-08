import React from 'react';
import { MatchSchedule } from '../../components/tournament/MatchSchedule';
import { API_URL } from '../../utils/constants';

const ScheduleList = ({ matches = [], loading = false }) => {
  // 🔍 Debug log
  console.log('📊 [ScheduleList] Received:', {
    matchesCount: matches?.length,
    loading,
    matches: matches?.slice(0, 2) // First 2 for inspection
  });

  const resolveAvatar = (obj) => {
    if (!obj) return null;

    const candidates = [
      obj.avatar,
      obj.logo,
      obj.team?.avatar,
      obj.team_avatar,
      obj.avatar_url,
    ];

    let url = candidates.find((c) => c) || null;
    if (!url) return null;

    try {
      url = String(url).trim();
      const lastHttp = url.lastIndexOf('http');
      if (lastHttp > 0) url = url.substring(lastHttp);

      if (url.startsWith('//')) {
        return `${window.location.protocol}${url}`;
      }
      if (url.startsWith('/')) {
        return `${API_URL}${url}`;
      }
      if (!url.startsWith('http')) {
        return `http://${url}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  // ✅ Validate matches
  if (!Array.isArray(matches)) {
    console.warn('⚠️ [ScheduleList] matches is not an array:', typeof matches);
    return <MatchSchedule matches={[]} loading={loading} />;
  }

  // ✅ Map with detailed logging
  const mapped = matches.map((m, index) => {
    const rawStatus = m.status || m.match_status || '';
    const scheduledAt = m.match_time || m.scheduled_time || m.created_at || m.match_date || null;
    
    // 🔍 Debug first match
    if (index === 0) {
      console.log('📊 [ScheduleList] First match mapping:', {
        id: m.id,
        rawStatus,
        scheduledAt,
        teamA: m.teamA?.team_name || m.team1?.name,
        teamB: m.teamB?.team_name || m.team2?.name
      });
    }

    return {
      id: m.id || m.match_id,

      team1: {
        name:
          m.teamA?.team_name ||
          m.teamA?.name ||
          m.team1?.team_name ||
          m.team1?.name ||
          'Team 1',
        logo: resolveAvatar(m.teamA || m.team1),
        region: m.teamA?.region || '',
      },

      team2: {
        name:
          m.teamB?.team_name ||
          m.teamB?.name ||
          m.team2?.team_name ||
          m.team2?.name ||
          'Team 2',
        logo: resolveAvatar(m.teamB || m.team2),
        region: m.teamB?.region || '',
      },

      team1Score: m.score_team_a ?? m.team1Score ?? m.score_a ?? 0,
      team2Score: m.score_team_b ?? m.team2Score ?? m.score_b ?? 0,

      // ✅ CRITICAL: Keep lowercase for MatchSchedule
      status: rawStatus.toString().toLowerCase(),

      // ✅ CRITICAL: Ensure scheduledAt is not null
      scheduledAt: scheduledAt || new Date().toISOString(),

      tournamentName:
        m.tournament?.name || m.tournament_name || m.tournamentName || '',

      matchFormat: m.match_format || m.format || '',

      round: m.round_number ?? m.round ?? m.roundNumber ?? null,
    };
  });

  console.log('✅ [ScheduleList] Mapped count:', mapped.length);

  return <MatchSchedule matches={mapped} loading={loading} />;
};

export default ScheduleList;