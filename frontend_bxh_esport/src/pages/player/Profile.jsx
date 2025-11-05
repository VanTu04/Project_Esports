import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import playerService from '../../services/playerService';
import { PlayerProfile as PlayerProfileComp } from '../../components/player/PlayerProfile';
import { PlayerStats } from '../../components/player/PlayerStats';

export const PlayerProfile = () => {
  const { user } = useAuth();
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadPlayerData();
    }
  }, [user]);

  const loadPlayerData = async () => {
    try {
      const [playerData, statsData] = await Promise.all([
        playerService.getPlayerById(user.id),
        playerService.getPlayerStats(user.id),
      ]);
      setPlayer(playerData);
      setStats(statsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Hồ sơ của tôi</h1>
      {player && <PlayerProfileComp player={player} />}
      {stats && <PlayerStats stats={stats} />}
    </div>
  );
};