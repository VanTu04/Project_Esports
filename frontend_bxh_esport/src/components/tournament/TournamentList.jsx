import { Loading } from '../common/Loading';
import { TournamentCard } from './TournamentCard';
import { TrophyIcon } from '@heroicons/react/24/outline';

export const TournamentList = ({ tournaments, loading, emptyMessage }) => {
  if (loading) {
    return <Loading />;
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <TrophyIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p>{emptyMessage || 'Không có giải đấu nào'}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {tournaments.map((tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </div>
  );
};

