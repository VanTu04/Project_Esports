import { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import teamService from '../../services/teamService';
import { TeamMemberList } from '../../components/team/TeamMemberList';
import { TeamInviteModal } from '../../components/team/TeamInviteModal';
import Button from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';

export const PlayerManagement = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const teamId = 1; // Get from context
      const data = await teamService.getTeamMembers(teamId);
      setMembers(data.members || []);
    } catch (error) {
      showError('Không thể tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId) => {
    try {
      const teamId = 1;
      await teamService.invitePlayer(teamId, userId);
      showSuccess('Đã gửi lời mời');
    } catch (error) {
      showError('Không thể gửi lời mời');
    }
  };

  const handleRemove = async (playerId) => {
    try {
      const teamId = 1;
      await teamService.removePlayer(teamId, playerId);
      showSuccess('Đã loại bỏ thành viên');
      loadMembers();
    } catch (error) {
      showError('Không thể loại bỏ thành viên');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Quản lý thành viên</h1>
        <Button
          leftIcon={<PlusIcon className="h-5 w-5" />}
          onClick={() => setInviteModalOpen(true)}
        >
          Mời thành viên
        </Button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <TeamMemberList
          members={members}
          onRemove={handleRemove}
          canManage={true}
        />
      )}

      <TeamInviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
};