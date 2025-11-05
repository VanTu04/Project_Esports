import Card, { CardHeader, CardTitle, CardContent } from '../common/Card';

export const PlayerProfile = ({ player }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Avatar & Basic Info */}
      <Card>
        <div className="text-center">
          <img
            src={player.avatar || '/default-avatar.png'}
            alt={player.username}
            className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-white mb-2">
            {player.username}
          </h2>
          <p className="text-gray-400">{player.email}</p>
        </div>
      </Card>

      {/* Stats */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Thống kê</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500">
                {player.stats?.kda || '0.0'}
              </div>
              <div className="text-sm text-gray-400">KDA</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">
                {player.stats?.winRate || '0'}%
              </div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">
                {player.stats?.gamesPlayed || 0}
              </div>
              <div className="text-sm text-gray-400">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500">
                {player.stats?.mvpCount || 0}
              </div>
              <div className="text-sm text-gray-400">MVP</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};