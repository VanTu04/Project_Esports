import { useEffect, useState } from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
import tournamentService from '../../services/tournamentService';
import { getAllGames } from '../../services/gameService';
import { TournamentList } from '../../components/tournament/TournamentList';

export const TournamentPublic = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  // Search + status filter
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' = all
  const [gameFilter, setGameFilter] = useState(''); // '' = all

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    loadTournaments(page, pageSize, debouncedSearch, statusFilter, gameFilter);
  }, [page, pageSize, debouncedSearch, statusFilter, gameFilter]);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Keep current page within available range when total/pageSize change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil((total || tournaments.length) / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [total, pageSize, tournaments.length]);

  const loadGames = async () => {
    try {
      const response = await getAllGames();
      console.log('Games API response:', response);
      
      // Backend returns { data: { code, status, message, data: [...] } }
      // The actual games array is in response.data.data
      let gamesList = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        gamesList = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        gamesList = response.data;
      } else if (Array.isArray(response)) {
        gamesList = response;
      }
      
      setGames(gamesList);
      console.log('Games loaded:', gamesList);
    } catch (error) {
      console.error('Lỗi load games:', error);
      setGames([]);
    }
  };

  const loadTournaments = async (p = 1, size = 10, q = '', status = '', gameId = '') => {
    setLoading(true);
    try {
      // Request with pagination + search + status + game
      const params = { page: p, limit: size };
      if (q) params.search = q;
      if (status) params.status = status;
      if (gameId) params.game_id = gameId;
      const data = await tournamentService.getAllTournaments(params);

      let list = [];
      // Normalize list (several possible shapes)
      if (!data) {
        list = [];
      } else if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.tournaments)) {
        list = data.tournaments;
      } else if (Array.isArray(data.items)) {
        list = data.items;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      } else if (data && data.data && Array.isArray(data.data.tournaments)) {
        list = data.data.tournaments;
      } else if (data && data.data && Array.isArray(data.data.items)) {
        list = data.data.items;
      } else {
        list = [];
      }

      // Try to extract total count from common locations
      let totalCount = 0;
      if (typeof data.totalItems === 'number') totalCount = data.totalItems;
      else if (typeof data.total === 'number') totalCount = data.total;
      else if (data && data.data && typeof data.data.totalItems === 'number') totalCount = data.data.totalItems;
      else if (data && data.data && typeof data.data.total === 'number') totalCount = data.data.total;
      else if (data && data.meta && typeof data.meta.total === 'number') totalCount = data.meta.total;
      else if (data && data.pagination && typeof data.pagination.total === 'number') totalCount = data.pagination.total;
      else if (Array.isArray(list)) totalCount = list.length; // fallback

      setTournaments(list || []);
      setTotal(totalCount);
      console.debug('TournamentPublic: api response', { raw: data, normalized: list, total: totalCount, page: p, limit: size });
    } catch (error) {
      console.error('Lỗi load tournaments:', error);
      setTournaments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
        <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Giải đấu</h1>

          {/* Filters section */}
          <div className="mb-6 space-y-4">
            {/* Status filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="text-sm font-medium text-gray-300">Trạng thái:</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { v: '', label: 'Tất cả' },
                  { v: 'PENDING', label: 'Đang mở đăng ký' },
                  { v: 'ACTIVE', label: 'Đang diễn ra' },
                  { v: 'COMPLETED', label: 'Đã kết thúc' },
                ].map((s) => {
                  const active = statusFilter === s.v;
                  return (
                    <button
                      key={s.v || 'all'}
                      onClick={() => { setStatusFilter(s.v); setPage(1); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        active 
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >{s.label}</button>
                  );
                })}
              </div>
            </div>

            {/* Game filter and Search box */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="text-sm font-medium text-gray-300">Game:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setGameFilter(''); setPage(1); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      gameFilter === '' 
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >Tất cả</button>
                  {games.map((game) => {
                    const active = gameFilter === String(game.id);
                    return (
                      <button
                        key={game.id}
                        onClick={() => { setGameFilter(String(game.id)); setPage(1); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          active 
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >{game.game_name}</button>
                    );
                  })}
                </div>
              </div>

              {/* Search box - moved to right */}
              <div className="relative w-full lg:w-80">
                <input
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  placeholder="Tìm kiếm giải đấu..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <TournamentList tournaments={tournaments} loading={loading} />

          {!loading && tournaments.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-lg">Không tìm thấy giải đấu nào.</div>
            </div>
          )}

          {/* Pagination controls */}
          {!loading && tournaments.length > 0 && (
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-300">Hiển thị {Math.min((page - 1) * pageSize + 1, total || tournaments.length)} — {Math.min(page * pageSize, total || tournaments.length)} / {total || tournaments.length}</div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >Trước</button>

                {/* Numbered pages with simple truncation */}
                {(() => {
                  const totalPages = Math.max(1, Math.ceil((total || tournaments.length) / pageSize));
                  const pages = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    let start = Math.max(2, page - 2);
                    let end = Math.min(totalPages - 1, page + 2);
                    if (start > 2) pages.push('left-ellipsis');
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (end < totalPages - 1) pages.push('right-ellipsis');
                    pages.push(totalPages);
                  }

                  return pages.map((pItem, idx) => {
                    if (pItem === 'left-ellipsis' || pItem === 'right-ellipsis') {
                      return <span key={`ell-${idx}`} className="px-2">...</span>;
                    }
                    const isActive = pItem === page;
                    return (
                      <button
                        key={pItem}
                        onClick={() => setPage(pItem)}
                        className={`px-3 py-1.5 border rounded ${isActive ? 'bg-primary-500 text-white border-primary-600' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                      >
                        {pItem}
                      </button>
                    );
                  });
                })()}

                <button
                  className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded disabled:opacity-50"
                  disabled={(page * pageSize) >= (total || tournaments.length)}
                  onClick={() => setPage(p => p + 1)}
                >Sau</button>

                {/* pageSize selector removed per UX request */}
              </div>
            </div>
          )}
        </div>
        </main>
      </div>
    </PublicLayout>
  );
};

export default TournamentPublic;
