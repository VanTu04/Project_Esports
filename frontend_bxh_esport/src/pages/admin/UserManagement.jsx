import { useEffect, useState } from 'react';
import userService from '../../services/userService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import UserActions from '../../components/user/UserActions';
import EditUserModal from '../../components/user/EditUserModal';
import UserDetailModal from '../../components/user/UserDetailModal';
import TeamDetailModal from '../../components/user/TeamDetailModal';
import { useNotification } from '../../context/NotificationContext';
import CreateAccountAdmin from '../../components/user/CreateAccountAdmin';

export const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'managers'
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      
      const userList = data.users || data || [];
      
      // Lọc theo role: User/Player (1, 2) và Team Manager (3)
      const regularUsers = userList.filter(user => user.role === 1 || user.role === 2);
      const teamManagers = userList.filter(user => user.role === 3);
      
      setUsers(regularUsers);
      setManagers(teamManagers);
    } catch (error) {
      console.error(' Lỗi khi tải người dùng:', error);
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

  const userColumns = [
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
          onDetails={() => openDetailModal(row)}
          onEdit={() => openEditModal(row)}
          onDelete={() => handleDeleteUser(value)}
        />
      ),
    },
  ];

  const managerColumns = [
    { header: 'Mã', accessor: 'id' },
    { header: 'Tên tài khoản', accessor: 'username' },
    { 
      header: 'Họ và tên', 
      accessor: 'full_name',
      render: (value) => value || '-'
    },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Tên đội', 
      accessor: 'team_name',
      render: (value) => value || <span className="text-gray-500 italic">Chưa có đội</span>
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
          onDetails={() => openTeamDetailModal(row)}
          onEdit={() => openEditModal(row)}
          onDelete={() => handleDeleteUser(value)}
        />
      ),
    },
  ];

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTeamDetailModal, setShowTeamDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const openDetailModal = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const openTeamDetailModal = (user) => {
    setSelectedUser(user);
    setShowTeamDetailModal(true);
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Người dùng 
        </button>
        <button
          onClick={() => setActiveTab('managers')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'managers'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Quản lý đội
        </button>
      </div>

      {/* Content */}
      {activeTab === 'users' && (
        <Table columns={userColumns} data={users} loading={loading} />
      )}

      {activeTab === 'managers' && (
        <Table columns={managerColumns} data={managers} loading={loading} />
      )}

      {/* Modals */}
      {showEditModal && selectedUser && (
        <EditUserModal 
          user={selectedUser} 
          onClose={() => setShowEditModal(false)} 
          onSaved={() => { setShowEditModal(false); loadUsers(); }} 
        />
      )}

      {showDetailModal && selectedUser && (
        <UserDetailModal 
          user={selectedUser} 
          onClose={() => setShowDetailModal(false)} 
        />
      )}

      {showTeamDetailModal && selectedUser && (
        <TeamDetailModal 
          user={selectedUser} 
          onClose={() => setShowTeamDetailModal(false)} 
        />
      )}

      {showCreateModal && (
        <CreateAccountAdmin 
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated} 
        />
      )}
    </div>
  );
};
