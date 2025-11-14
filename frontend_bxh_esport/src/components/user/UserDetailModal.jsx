import { useEffect, useState } from 'react';
import userService from '../../services/userService';
import { useNotification } from '../../context/NotificationContext';
import Modal from '../common/Modal';

export default function UserDetailModal({ user, onClose }) {
  const [userDetail, setUserDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();

  useEffect(() => {
    loadUserDetail();
  }, [user.id]);

  const loadUserDetail = async () => {
    try {
      setLoading(true);
      // Nếu có API getUserById thì gọi, không thì dùng data truyền vào
      setUserDetail(user);
    } catch (error) {
      showError('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <Modal isOpen={true} title="Chi tiết người dùng" onClose={onClose} size="lg">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
        </div>
      </Modal>
    );
  }

  if (!userDetail) {
    return (
      <Modal isOpen={true} title="Chi tiết người dùng" onClose={onClose} size="lg">
        <div className="text-center py-8 text-gray-400">Không tìm thấy thông tin người dùng</div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} title="Chi tiết người dùng" onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Thông tin cơ bản */}
        <div className="bg-dark-400 rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Thông tin cơ bản</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Mã người dùng</p>
              <p className="text-white font-medium">{userDetail.id}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Tên tài khoản</p>
              <p className="text-white font-medium">{userDetail.username}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Họ và tên</p>
              <p className="text-white font-medium">{userDetail.full_name || '-'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white font-medium">{userDetail.email || '-'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Vai trò</p>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                userDetail.role === 4 ? 'bg-red-500/20 text-red-300' :
                userDetail.role === 3 ? 'bg-blue-500/20 text-blue-300' :
                userDetail.role === 2 ? 'bg-green-500/20 text-green-300' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                {getRoleName(userDetail.role)}
              </span>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Trạng thái</p>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                userDetail.status === 1 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {userDetail.status === 1 ? 'Hoạt động' : 'Không hoạt động'}
              </span>
            </div>
          </div>
        </div>

        {/* Thông tin đội */}
        {(userDetail.role === 2 || userDetail.role === 3) && (
          <div className="bg-dark-400 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Thông tin đội</h3>
            
            {userDetail.team_name ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Tên đội</p>
                  <p className="text-white font-medium">{userDetail.team_name}</p>
                </div>
                
                {userDetail.role === 3 && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Quản lý đội này</span>
                  </div>
                )}
                
                {userDetail.role === 2 && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span className="text-sm">Thành viên đội</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                Chưa thuộc đội nào
              </div>
            )}
          </div>
        )}

        {/* Thông tin tài khoản */}
        <div className="bg-dark-400 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Thông tin tài khoản</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Ngày tạo</p>
              <p className="text-white font-medium">
                {userDetail.created_date ? new Date(userDetail.created_date).toLocaleDateString('vi-VN') : '-'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Cập nhật lần cuối</p>
              <p className="text-white font-medium">
                {userDetail.updated_date ? new Date(userDetail.updated_date).toLocaleDateString('vi-VN') : '-'}
              </p>
            </div>
            
            {userDetail.google_id && (
              <div className="col-span-2">
                <p className="text-sm text-gray-400">Đăng nhập bằng</p>
                <div className="flex items-center gap-2 mt-1">
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.9 0 7.2 1.4 9.7 3.6l7.2-7.2C35 2.2 29.9 0 24 0 14.7 0 6.9 5.6 3.1 13.6l8.6 6.7C13.5 15.1 18.3 9.5 24 9.5z"/>
                    <path fill="#34A853" d="M46.5 24c0-1.6-.1-3.1-.4-4.6H24v9h12.7c-.5 2.7-2 5-4.3 6.6l6.8 5.3C44.6 36.4 46.5 30.5 46.5 24z"/>
                    <path fill="#4A90E2" d="M11.7 28.3C10.8 26.5 10.3 24.6 10.3 22.5c0-2.1.5-4 1.4-5.8L3.1 10C1.1 13.8 0 18 0 22.5s1.1 8.7 3.1 12.5l8.6-6.7z"/>
                    <path fill="#FBBC05" d="M24 48c6.5 0 12-2.1 16-5.9l-7.6-6.1c-2.5 1.7-5.6 2.7-8.4 2.7-5.7 0-10.5-4.6-11.8-10.7L3.1 34.5C6.9 42.4 14.7 48 24 48z"/>
                  </svg>
                  <span className="text-white">Google</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
