import Card from '../common/Card';

export const PlayerStats = ({ stats }) => {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4">Chi tiết thống kê</h3>
      <div className="space-y-3">
        <StatRow label="Kills" value={stats?.kills || 0} />
        <StatRow label="Deaths" value={stats?.deaths || 0} />
        <StatRow label="Assists" value={stats?.assists || 0} />
        <StatRow label="Total Games" value={stats?.gamesPlayed || 0} />
        <StatRow label="Wins" value={stats?.wins || 0} color="green" />
        <StatRow label="Losses" value={stats?.losses || 0} color="red" />
      </div>
    </Card>
  );
};

const StatRow = ({ label, value, color = 'primary' }) => {
  const colors = {
    primary: 'text-primary-500',
    green: 'text-green-500',
    red: 'text-red-500',
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <span className={`font-bold ${colors[color]}`}>{value}</span>
    </div>
  );
};