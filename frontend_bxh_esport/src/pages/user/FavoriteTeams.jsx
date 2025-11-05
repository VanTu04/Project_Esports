import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import { TeamList } from '../../components/team/TeamList';

export const FavoriteTeams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      const data = await userService.getFavoriteTeams(user.id);
      setTeams(data.teams || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Đội yêu thích</h1>
      <TeamList teams={teams} loading={loading} emptyMessage="Chưa có đội yêu thích" />
    </div>
  );
};