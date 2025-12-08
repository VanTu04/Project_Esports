import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { TeamManagerDashboard } from '../../pages/team-manager/Dashboard';
import { USER_ROLES } from '../../utils/constants';

export default function TeamDetailModal({ team, user, onClose }) {
  // Nếu user có role TEAM_MANAGER, thì user.id chính là team ID
  // (vì mỗi user TEAM_MANAGER chỉ có 1 team và team.id = user.id)
  const isTeamManager = user?.role === USER_ROLES.TEAM_MANAGER;
  const teamId = team?.id || (isTeamManager ? user?.id : null);

  if (!teamId || !isTeamManager) {
    return (
      <Modal isOpen={true} title="Chi tiết đội" onClose={onClose} size="full">
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
    <Modal isOpen={true} title={`Chi tiết đội - ${team?.team_name || team?.full_name || user?.full_name || ''}`} onClose={onClose} size="full">
      <div className="h-[80vh] overflow-y-auto">
        {/* Render Dashboard component với teamId từ prop thay vì từ URL */}
        <TeamManagerDashboardWrapper teamId={teamId} />
      </div>
    </Modal>
  );
}

// Wrapper component để inject teamId vào Dashboard
function TeamManagerDashboardWrapper({ teamId }) {
  return (
    <div className="relative">
      <style>{`
        /* Hide back button in modal */
        .team-dashboard-modal .back-button { display: none; }
      `}</style>
      <div className="team-dashboard-modal">
        <TeamManagerDashboard teamIdOverride={teamId} />
      </div>
    </div>
  );
}
