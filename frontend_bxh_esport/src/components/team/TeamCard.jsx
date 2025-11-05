import { Link } from 'react-router-dom';
import { UsersIcon, TrophyIcon } from '@heroicons/react/24/outline';
import Card from '../common/Card';

export const TeamCard = ({ team }) => {
  return (
    <Card hover>
      <div className="flex items-start gap-4">
        <img
          src={team.logo || '/default-team.png'}
          alt={team.name}
          className="w-20 h-20 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{team.name}</h3>
          <p className="text-sm text-gray-400 mb-3">{team.region}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <UsersIcon className="h-4 w-4" />
              <span>{team.membersCount || 0} thành viên</span>
            </div>
            <div className="flex items-center gap-1">
              <TrophyIcon className="h-4 w-4" />
              <span>{team.tournamentsCount || 0} giải đấu</span>
            </div>
          </div>
        </div>
      </div>
      
      <Link
        to={`/teams/${team.id}`}
        className="block w-full mt-4 py-2 text-center bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
      >
        Xem chi tiết
      </Link> 
    </Card>
  );
};