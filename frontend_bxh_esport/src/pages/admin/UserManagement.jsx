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
      console.log('🔍 Đang tải danh sách người dùng...');
      
      // Check token
      const token = sessionStorage.getItem('AUTH_TOKEN');
      console.log('🔑 Token hiện tại:', token ? 'Có token' : '❌ KHÔNG CÓ TOKEN');
      
      const data = await userService.getAllUsers();
      console.log('✅ Dữ liệu nhận được:', data);
      console.log('👥 Danh sách users:', data.users);
      
      const userList = data.users || data || [];
      // Lọc bỏ các user có role = 4 (admin)
      const filteredUsers = userList.filter(user => user.role !== 4);
      console.log('📋 Số lượng users (không bao gồm admin):', filteredUsers.length);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('❌ Lỗi khi tải người dùng:', error);
      showError(`Không thể tải danh sách người dùng: ${error.message || JSON.stringify(error)}`);
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

  const getRoleName = (role) => {
    const roleMap = {
      1: 'Người dùng',
      2: 'Cầu thủ',
      3: 'Quản lý đội',
      4: 'Quản trị viên'
    };
    return roleMap[role] || 'Không xác định';
  };

  const columns = [
    { header: 'Mã', accessor: 'id' },
    { header: 'Tên tài khoản', accessor: 'username' },
    { 
      header: 'Họ và tên', 
      accessor: 'full_name',
      render: (value) => value || '-'
    },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Vai trò', 
      accessor: 'role',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value === 4 ? 'bg-red-500/20 text-red-300' :
          value === 3 ? 'bg-blue-500/20 text-blue-300' :
          value === 2 ? 'bg-green-500/20 text-green-300' :
          'bg-gray-500/20 text-gray-300'
        }`}>
          {getRoleName(value)}
        </span>
      )
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (value) => {
        const active = value === 1 || value === '1' || value === 'active' || value === 'ACTIVE';
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {active ? 'Hoạt động' : 'Không hoạt động'}
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
