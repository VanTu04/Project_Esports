import { useEffect, useState } from 'react';
import teamService from '../../services/teamService';
import { TeamList } from '../../components/team/TeamList';
import { TeamForm } from '../../components/team/TeamForm';
import { PlusIcon } from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';

export const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await teamService.getAllTeams();
      setTeams(data.teams || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTeam(null);
    setShowForm(true);
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa đội này không?')) {
      await teamService.deleteTeam(id);
      loadTeams();
    }
  };

  const handleSubmit = async (data) => {
    if (editingTeam) {
      await teamService.updateTeam(editingTeam.id, data);
    } else {
      await teamService.createTeam(data);
    }
    setShowForm(false);
    loadTeams();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Quản lý đội tuyển</h1>
        <Button
          onClick={handleAdd}
          leftIcon={<PlusIcon className="h-5 w-5" />}
        >
          Thêm đội tuyển
        </Button>
      </div>

      {showForm ? (
        <TeamForm
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          initialData={editingTeam}
        />
      ) : (
        <TeamList teams={teams} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  );
};
export default TeamManagement;