import { UserMinusIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Card from '../common/Card';

export const TeamMemberList = ({ members, onRemove, canManage }) => {
  if (!members || members.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Chưa có thành viên nào
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <Card key={member.id} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={member.avatar || '/default-avatar.png'}
              alt={member.username}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h4 className="font-semibold text-white">{member.username}</h4>
              <p className="text-sm text-gray-400">{member.role || 'Member'}</p>
            </div>
          </div>

          {canManage && member.role !== 'captain' && (
            <Button
              size="sm"
              variant="danger"
              leftIcon={<UserMinusIcon className="h-4 w-4" />}
              onClick={() => onRemove(member.id)}
            >
              Loại bỏ
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
};
