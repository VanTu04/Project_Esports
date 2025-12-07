import React, { useMemo } from 'react';
import { formatDate } from '../../utils/helpers';
import { MatchSchedule } from '../tournament/MatchSchedule';

const MatchCenter = ({ liveMatches = [], upcomingMatches = [], games = [], selectedGame = null }) => {

  // Combine and deduplicate by ID
  const allMatches = useMemo(() => {
    const seen = new Set();
    const combined = [];
    [...(upcomingMatches || []), ...(liveMatches || [])].forEach((m) => {
      if (m.id && !seen.has(m.id)) {
        seen.add(m.id);
        combined.push(m);
      } else if (!m.id) {
        combined.push(m);
      }
    });
    return combined;
  }, [upcomingMatches, liveMatches]);

  const filteredMatches = useMemo(() => {
    if (!selectedGame) return allMatches;
    return allMatches.filter(m => m.tournament?.game_id === selectedGame);
  }, [allMatches, selectedGame]);

  // Keep only matches scheduled within 5 days window: 2 days before today + today + 2 days after
  const dateFilteredMatches = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    start.setDate(start.getDate() - 2); // 2 days before today
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    end.setDate(end.getDate() + 3); // today + 2 days after (exclusive end)

    return (filteredMatches || [])
      .filter((m) => {
        const raw = m.match_time || m.matchTime || m.scheduled_time || m.scheduledAt || m.scheduled_at;
        if (!raw) return false;
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return false;
        return d >= start && d < end;
      })
      .map((m) => {
        const teamAName = m.team_a_name || m.team1Name || 'TBD';
        const teamBName = m.team_b_name || m.team2Name || 'TBD';
        const scheduledAt = m.match_time || m.matchTime || m.scheduled_time || m.scheduledAt || null;
        const team1Score = m.score_team_a ?? m.scoreA ?? m.team1Score ?? 0;
        const team2Score = m.score_team_b ?? m.scoreB ?? m.team2Score ?? 0;
        
        // Get team avatars directly from match object
        const team1Logo = m.team_a_avatar || m.team_a_logo || null;
        const team2Logo = m.team_b_avatar || m.team_b_logo || null;
        
        return {
          id: m.id,
          scheduledAt,
          team1: { name: teamAName, logo: team1Logo },
          team2: { name: teamBName, logo: team2Logo },
          team1Score,
          team2Score,
          tournamentName: m.tournament?.name || m.tournamentName || m.tournament_name || '',
          round: m.round || m.round_number || null,
          status: m.status || '',
        };
      });
  }, [filteredMatches, games]);



  return (
    <div className="py-8 bg-gradient-to-b from-gray-900/50 to-transparent">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg className="w-7 h-7 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Trung tâm trận đấu
          </h2>
          <a href="/schedule" className="text-primary-400 hover:text-primary-300 text-sm font-semibold transition-colors">Xem lịch đầy đủ →</a>
        </div>

        {/* Matches list (filtered by `selectedGame` prop from parent, next 7 days) */}
        <MatchSchedule loading={false} matches={dateFilteredMatches} />
      </div>
    </div>
  );
};

export default MatchCenter;
