import { Link } from 'react-router-dom';
import { CalendarIcon, TrophyIcon, UsersIcon } from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { getStatusColor, getStatusText } from '../../utils/helpers';
import Card from '../common/Card';

export const TournamentCard = ({ tournament }) => {
  return (
    <Card hover className="overflow-hidden">
      {/* Banner */}
      <div className="h-32 bg-gradient-gold relative overflow-hidden">
        {tournament.banner && (
          <img
            src={tournament.banner}
            alt={tournament.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-2 right-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              tournament.status
            )} text-white`}
          >
            {getStatusText(tournament.status)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-2">{tournament.name}</h3>
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
          {tournament.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <CalendarIcon className="h-4 w-4" />
            <span>{formatDate(tournament.startDate, 'dd/MM/yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <TrophyIcon className="h-4 w-4" />
            <span>{formatCurrency(tournament.prize, 'VND')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <UsersIcon className="h-4 w-4" />
            <span>{tournament.participantsCount || 0} đội</span>
          </div>
        </div>

        <Link
          to={`/tournaments/${tournament.id}`}
          className="block w-full py-2 text-center bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
        >
          Xem chi tiết
        </Link>
      </div>
    </Card>
  );
};

