import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tournamentService from '../../services/tournamentService';
import { TournamentList } from '../../components/tournament/TournamentList';

export const TournamentBrowse = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTournaments(page);
  }, [page]);

  const loadTournaments = async (p = 1) => {
    setLoading(true);
    try {
      const data = await tournamentService.getAllTournaments({ page: p, limit });
      setTournaments(data?.data?.tournaments || data?.tournaments || []);
      setTotalPages(data?.data?.totalPages || data?.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // navigation to detail handled by TournamentCard link

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Khám phá giải đấu</h1>

      <TournamentList tournaments={tournaments} loading={loading} />

      {/* Pagination */}
      <div className="flex items-center justify-center mt-6">
        <button
          className="px-3 py-1 bg-dark-400 text-white rounded-l disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Trước
        </button>
        <div className="px-4 py-1 bg-dark-300 text-white">
          {page} / {totalPages}
        </div>
        <button
          className="px-3 py-1 bg-dark-400 text-white rounded-r disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Sau
        </button>
      </div>

      {/* Quick-view modal removed — navigating to detail page instead */}
    </div>
  );
};