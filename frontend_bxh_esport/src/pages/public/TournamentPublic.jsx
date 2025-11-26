import { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import tournamentService from '../../services/tournamentService';
import { TournamentList } from '../../components/tournament/TournamentList';

export const TournamentPublic = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRaw, setShowRaw] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  // Search + status filter
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' = all

  useEffect(() => {
    loadTournaments(page, pageSize, debouncedSearch, statusFilter);
  }, [page, pageSize, debouncedSearch, statusFilter]);

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

  const loadTournaments = async (p = 1, size = 10, q = '', status = '') => {
    setLoading(true);
    try {
      // Request with pagination + search + status
      const params = { page: p, pageSize: size };
      if (q) params.q = q; // backend may expect `q` or `search`
      if (status) params.status = status;
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
      if (typeof data.total === 'number') totalCount = data.total;
      else if (typeof data.totalItems === 'number') totalCount = data.totalItems;
      else if (data && data.data && typeof data.data.total === 'number') totalCount = data.data.total;
      else if (data && data.meta && typeof data.meta.total === 'number') totalCount = data.meta.total;
      else if (data && data.pagination && typeof data.pagination.total === 'number') totalCount = data.pagination.total;
      else if (Array.isArray(list)) totalCount = list.length; // fallback

      setTournaments(list || []);
      setTotal(totalCount);
      console.debug('TournamentPublic: api response', { raw: data, normalized: list, total: totalCount });
    } catch (error) {
      console.error('Lỗi load tournaments:', error);
      setTournaments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
      <Header />

      <main className="flex-1 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Giải đấu</h1>

          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">Lọc:</div>
                <div className="flex items-center bg-gray-900 rounded overflow-hidden">
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
                        className={`px-3 py-1 text-sm ${active ? 'bg-primary-500 text-black' : 'text-gray-300 hover:bg-gray-800'}`}
                      >{s.label}</button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-1/3">
                <input
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  placeholder="Tìm theo tên giải đấu..."
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          <TournamentList tournaments={tournaments} loading={loading} />

          {!loading && tournaments.length === 0 && (
            <div className="mt-6 text-sm text-gray-400">
              <div>Không tìm thấy giải đấu nào.</div>
              <div className="mt-2 flex gap-2">
                <button onClick={loadTournaments} className="px-3 py-1.5 bg-purple-600 rounded text-sm">Tải lại</button>
                <button onClick={() => setShowRaw(s => !s)} className="px-3 py-1.5 border border-gray-700 rounded text-sm">{showRaw ? 'Ẩn JSON' : 'Xem JSON'}</button>
              </div>
              {showRaw && (
                <pre className="mt-3 max-h-64 overflow-auto text-xs text-gray-300 bg-black/30 p-3 rounded">{JSON.stringify(tournaments, null, 2)}</pre>
              )}
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

      <Footer />
    </div>
  );
};

export default TournamentPublic;
