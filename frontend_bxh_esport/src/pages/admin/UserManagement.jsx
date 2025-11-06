import { useEffect, useState } from 'react';
import userService from '../../services/userService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Username', accessor: 'username' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs ${
          value === 'active' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {value}
        </span>
      ),
    },
    {
      header: 'Hành động',
      accessor: 'id',
      render: (value, row) => (
        <Button
          size="sm"
          variant={row.status === 'banned' ? 'success' : 'danger'}
          onClick={() => handleBanUser(value, row.status !== 'banned')}
        >
          {row.status === 'banned' ? 'Mở khóa' : 'Khóa'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Quản lý người dùng</h1>
      <Table columns={columns} data={users} loading={loading} />
    </div>
  );
};
