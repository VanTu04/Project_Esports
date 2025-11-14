import { useEffect, useState } from 'react';
import teamService from '../../services/teamService';
import { useNotification } from '../../context/NotificationContext';
import Modal from '../common/Modal';

export default function TeamDetailModal({ team, user, onClose }) {
  const [teamDetail, setTeamDetail] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();

  useEffect(() => {
    loadTeamDetail();
  }, [team?.id, user?.id]);

  const loadTeamDetail = async () => {
    try {
      setLoading(true);
      
      // Nếu có team.id thì load đầy đủ thông tin
      if (team?.id) {
        const data = await teamService.getTeamById(team.id);
        const teamData = data.data || data;
        setTeamDetail(teamData);
        setTeamMembers(teamData.members || []);
      } 
      // Nếu có user.team_id, load team đó
      else if (user?.team_id) {
        const data = await teamService.getTeamById(user.team_id);
        const teamData = data.data || data;
        setTeamDetail(teamData);
        setTeamMembers(teamData.members || []);
      }
      // Nếu chỉ có user.id (không có team_id), tìm team theo user_id
      else if (user?.id) {
        const data = await teamService.getTeamByUserId(user.id);
        const teamData = data.data || data;
        setTeamDetail(teamData);
        setTeamMembers(teamData.members || []);
      }
    } catch (error) {
      console.error('Load team error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Không thể tải thông tin đội';
      
      // Nếu là lỗi "không tìm thấy đội", không hiển thị error toast
      if (errorMsg.includes('Không tìm thấy đội')) {
        console.log('ℹ️ User chưa có đội');
      } else {
        showError(errorMsg);
      }
      
      setTeamDetail(null);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Modal isOpen={true} title="Chi tiết đội" onClose={onClose} size="lg">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
        </div>
      </Modal>
    );
  }

  if (!teamDetail) {
    return (
      <Modal isOpen={true} title="Chi tiết đội" onClose={onClose} size="lg">
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-lg text-gray-400 mb-2">Người dùng chưa có đội</p>
          <p className="text-sm text-gray-500">
            {user?.full_name || user?.username} chưa tạo hoặc tham gia đội nào
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} title="Chi tiết đội" onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Thông tin đội */}
        <div className="bg-dark-400 rounded-lg p-4 space-y-3">
          <h3 className="text-lg font-semibold text-white mb-4">Thông tin đội</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Tên đội</p>
              <p className="text-white font-medium">{teamDetail.name || teamDetail.team_name}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Quản lý</p>
              <p className="text-white font-medium">
                {teamDetail.leader?.full_name || teamDetail.leader?.username || '-'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Email quản lý</p>
              <p className="text-white font-medium">{teamDetail.leader?.email || '-'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Ngày tạo</p>
              <p className="text-white font-medium">
                {teamDetail.created_date ? new Date(teamDetail.created_date).toLocaleDateString('vi-VN') : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Danh sách thành viên */}
        <div className="bg-dark-400 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            Danh sách thành viên ({teamMembers.length})
          </h3>
          
          {teamMembers.length > 0 ? (
            <div className="space-y-2">
              {teamMembers.map((member, index) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between p-3 bg-dark-300 rounded-lg hover:bg-dark-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <span className="text-cyan-400 font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {member.user?.full_name || member.user?.username || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-400">{member.user?.email || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      member.role === 'LEADER' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {member.role === 'LEADER' ? 'Đội trưởng' : 'Thành viên'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">
              Chưa có thành viên nào
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
