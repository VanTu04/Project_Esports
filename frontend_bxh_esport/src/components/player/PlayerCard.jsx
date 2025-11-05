import { Link } from 'react-router-dom';
import Card from '../common/Card';

export const PlayerCard = ({ player }) => {
  return (
    <Card hover>
      <div className="text-center">
        <img
          src={player.avatar || '/default-avatar.png'}
          alt={player.username}
          className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
        />
        <h3 className="text-lg font-bold text-white mb-1">{player.username}</h3>
        <p className="text-sm text-gray-400 mb-4">{player.role || 'Player'}</p>
        
        {player.stats && (
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div>
              <div className="text-primary-500 font-bold">{player.stats.kda}</div>
              <div className="text-gray-400">KDA</div>
            </div>
            <div>
              <div className="text-green-500 font-bold">{player.stats.winRate}%</div>
              <div className="text-gray-400">Win Rate</div>
            </div>
            <div>
              <div className="text-blue-500 font-bold">{player.stats.gamesPlayed}</div>
              <div className="text-gray-400">Games</div>
            </div>
          </div>
        )}

        <Link
          to={`/players/${player.id}`}
          className="block w-full py-2 text-center bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
        >
          Xem hồ sơ
        </Link>
      </div>
    </Card>
  );
};