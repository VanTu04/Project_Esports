import { useEffect, useState } from 'react';
import matchService from '../../services/matchService';
import { API_BACKEND } from '../../utils/constants';
import { MatchSchedule } from '../../components/tournament/MatchSchedule';
import Button from '../../components/common/Button';

export const MatchHistory = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | upcoming | live | completed

  useEffect(() => {
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter]);

  const loadMatches = async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit,
      };

      if (search) params.search = search;

      // map UI filter to backend status values
      const statusMap = {
        upcoming: 'PENDING',
        // live: 'IN_PROGRESS',
        completed: 'DONE',

      };

      if (statusFilter && statusFilter !== 'all') {
        params.status = statusMap[statusFilter];
      }

      const resp = await matchService.getMyTeamMatches(params);
      const payload = resp?.data ?? resp;
      const data = payload?.data ?? payload;

      const serverMatches = (data?.matches && Array.isArray(data.matches)) ? data.matches : [];

      // Helper to resolve avatar URL (handle nested fields and relative paths)
      const resolveAvatar = (obj) => {
        if (!obj) return null;
        // try several common locations
        const candidates = [
          obj.avatar,
          obj.logo,
          obj.team?.avatar,
          obj.team_avatar,
          obj.avatar_url,
        ];

        let url = candidates.find((c) => c !== undefined && c !== null) || null;
        if (!url) return null;
        // Normalize malformed URLs such as repeated host: "http://hosthttp://host/..."
        try {
          url = String(url).trim();
          const lastHttp = url.lastIndexOf('http');
          if (lastHttp > 0) {
            // take the last occurrence (handles duplicated prefixes)
            url = url.substring(lastHttp);
          }
          if (url.startsWith('//')) {
            url = window?.location?.protocol ? `${window.location.protocol}${url}` : `https:${url}`;
          }
          if (url.startsWith('/')) {
            const prefix = API_BACKEND || '';
            return `${prefix}${url}`;
          }
          if (!url.startsWith('http')) {
            return `http://${url}`;
          }
          return url;
        } catch (e) {
          return url;
        }
      };

      // Map server match shape to MatchSchedule expected shape
      const mapped = serverMatches.map((m) => ({
        id: m.id,
        team1: {
          name: m.teamA?.team_name || m.teamA?.team_name || m.teamA?.team_name || m.teamA?.name || 'Team 1',
          logo: resolveAvatar(m.teamA),
          region: m.teamA?.region || '',
        },
        team2: {
          name: m.teamB?.team_name || m.teamB?.team_name || m.teamB?.team_name || m.teamB?.name || 'Team 2',
          logo: resolveAvatar(m.teamB),
          region: m.teamB?.region || '',
        },
        team1Score: m.score_team_a ?? m.score_a ?? m.score1 ?? 0,
        team2Score: m.score_team_b ?? m.score_b ?? m.score2 ?? 0,
        status: (m.status || m.match_status || '').toString().toLowerCase(),
        scheduledAt: m.match_time || m.scheduled_time || m.created_at || null,
        tournamentName: m.tournament?.name || m.tournament_name || '',
        matchFormat: m.match_format || m.format || '',
        round: m.round_number ?? m.round ?? m.roundNumber ?? null,
      }));

      setMatches(mapped);

      const pagination = data?.pagination || {};
      setTotalPages(pagination.totalPages || Math.max(1, Math.ceil((pagination.total || 0) / (pagination.limit || limit))));
    } catch (error) {
      console.error('Failed to load team matches', error);
      setMatches([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Lịch sử thi đấu</h1>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Tìm kiếm đối thủ..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded bg-dark-400 text-white border border-primary-700/30 w-full max-w-md"
        />
      </div>

      {/* Tabs: Sắp diễn ra | Đang diễn ra | Đã kết thúc */}
      <div className="flex items-center space-x-2">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'upcoming', label: 'Sắp diễn ra' },
          { key: 'completed', label: 'Đã kết thúc' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setStatusFilter(t.key); setPage(1); }}
            className={`px-3 py-2 rounded-md text-sm font-medium ${statusFilter === t.key ? 'bg-primary-500 text-white' : 'text-gray-300 bg-dark-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <MatchSchedule matches={matches} loading={loading} />

      <div className="flex items-center justify-center gap-2 mt-4">
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="px-3 py-2 bg-dark-300 rounded disabled:opacity-50 text-white"
        >Trước</Button>
        <span className="text-sm text-white">{page} / {totalPages}</span>
        <Button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="px-3 py-2 bg-dark-300 rounded disabled:opacity-50 text-white"
        >Sau</Button>
      </div>
    </div>
  );
};