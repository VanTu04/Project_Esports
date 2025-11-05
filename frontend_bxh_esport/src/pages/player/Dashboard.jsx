import { useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import { TrophyIcon, FlagIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export const PlayerDashboard = () => {
  const [stats, setStats] = useState({
    tournaments: 0,
    matches: 0,
    winRate: 0,
    kda: 0,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Player Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={TrophyIcon} label="Giải đấu" value={stats.tournaments} />
        <StatCard icon={FlagIcon} label="Trận đấu" value={stats.matches} />
        <StatCard icon={ChartBarIcon} label="Win Rate" value={`${stats.winRate}%`} />
        <StatCard icon={ChartBarIcon} label="KDA" value={stats.kda} />
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">Hoạt động gần đây</h2>
        <div className="text-gray-400">Chưa có hoạt động nào</div>
      </Card>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <Card>
    <div className="flex items-center gap-4">
      <div className="p-3 bg-primary-500/10 rounded-lg">
        <Icon className="h-8 w-8 text-primary-500" />
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </Card>
);