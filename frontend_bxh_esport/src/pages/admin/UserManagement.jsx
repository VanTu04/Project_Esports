import { useEffect, useState } from 'react';
import userService from '../../services/userService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import UserActions from '../../components/user/UserActions';
import EditUserModal from '../../components/user/EditUserModal';
import { useNotification } from '../../context/NotificationContext';
import CreateAccountAdmin from '../../components/user/CreateAccountAdmin';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data.users || []);
    } catch (error) {
      showError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, banned) => {
    try {
      await userService.toggleBanUser(userId, banned);
      showSuccess(banned ? 'Đã khóa người dùng' : 'Đã mở khóa người dùng');
      loadUsers();
    } catch (error) {
      showError('Không thể thực hiện hành động');
    }
  };

  const handleAddTeam = async (userId) => {
    try {
      await userService.addTeamToUser(userId);
      showSuccess('Đã thêm team cho người dùng');
      loadUsers();
    } catch (error) {
      showError('Không thể thêm team cho người dùng');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Username', accessor: 'username' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (value) => {
        const active = value === 1 || value === '1' || value === 'active' || value === 'ACTIVE';
        return (
          <span className={`px-2 py-1 rounded text-xs ${active ? 'bg-green-500' : 'bg-red-500'}`}>
            {active ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      header: 'Hành động',
      accessor: 'id',
      render: (value, row) => (
        <UserActions
          onDetails={() => console.log('details', row)}
          onEdit={() => openEditModal(row)}
          onDelete={() => handleDeleteUser(value)}
        />
      ),
    },
  ];

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (userId) => {
    const ok = window.confirm('Bạn có chắc muốn xóa người dùng này không?');
    if (!ok) return;
    try {
      await userService.deleteUser(userId);
      showSuccess('Xóa người dùng thành công');
      loadUsers();
    } catch (err) {
      showError('Không thể xóa người dùng');
    }
  };

  const handleCreated = (res) => {
    setShowCreateModal(false);
    loadUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Quản lý người dùng</h1>
        <div>
          <Button onClick={() => setShowCreateModal(true)}>Tạo tài khoản</Button>
        </div>
      </div>

      <Table columns={columns} data={users} loading={loading} />

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-24">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-end">
              <Button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-800">×</Button>
            </div>
            <div className="p-4">
              <EditUserModal user={selectedUser} onClose={() => setShowEditModal(false)} onSaved={() => { setShowEditModal(false); loadUsers(); }} />
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-24">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-end">
              <Button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-800">×</Button>
            </div>
            <div className="p-4">
              <CreateAccountAdmin onCreated={handleCreated} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
