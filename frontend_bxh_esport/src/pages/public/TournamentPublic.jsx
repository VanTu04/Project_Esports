import { useEffect, useState } from 'react';
import tournamentService from '../../services/tournamentService';
import { TournamentList } from '../../components/tournament/TournamentList';

export const TournamentPublic = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const data = await tournamentService.getAllTournaments({ status: 'ongoing' });
      setTournaments(data.tournaments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Giải đấu</h1>
      <TournamentList tournaments={tournaments} loading={loading} />
    </div>
  );
};
