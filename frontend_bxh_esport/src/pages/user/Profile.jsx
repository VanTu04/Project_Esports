import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { PencilIcon } from '@heroicons/react/24/outline';

export const UserProfile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Hồ sơ của tôi</h1>
        <Button leftIcon={<PencilIcon className="h-5 w-5" />}>
          Chỉnh sửa
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-6">
          <img
            src={user?.avatar || '/default-avatar.png'}
            alt={user?.username}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold text-white">{user?.username}</h2>
            <p className="text-gray-400">{user?.email}</p>
            <p className="text-sm text-gray-500 mt-1">Role: {user?.role}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
