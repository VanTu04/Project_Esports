import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Trophy, Users, Calendar, Target, TrendingUp, 
  Edit, Plus, Save, X, UserPlus, Trash2, Heart, UserCheck, Award, Clock,
  BarChart3, Activity, Gamepad2, Zap, Phone, Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES, THEME_COLORS } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';
import teamService from '../../services/teamService';
import matchService from '../../services/matchService'; // ✅ THÊM IMPORT
import favoriteTeamService from '../../services/favoriteTeamService';
import { normalizeImageUrl } from '../../utils/imageHelpers';
import PublicLayout from '../../components/layout/PublicLayout';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import TeamHeader from '../../components/team/TeamHeader';
import TabNav from '../../components/team/TabNav';
import MembersList from '../../components/team/MembersList';
import TournamentsList from '../../components/team/TournamentsList';
import ScheduleList from '../../components/team/ScheduleList';

export const TeamManagerDashboard = ({ teamIdOverride = null }) => {
  const navigate = useNavigate();
  const { id: teamIdParam } = useParams(); // Lấy team ID từ URL nếu có
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  // Xác định chế độ: public (xem đội khác) hoặc manager (quản lý đội của mình)
  // Ưu tiên teamIdOverride (khi render trong modal), sau đó mới dùng teamIdParam từ URL
  const effectiveTeamId = teamIdOverride || teamIdParam;
  const isPublicMode = !!effectiveTeamId;
  const isAdminViewing = user?.role === USER_ROLES.ADMIN && isPublicMode;
  const teamIdToLoad = effectiveTeamId || user?.id;
  
  // Kiểm tra có hiển thị nút theo dõi không (admin và team manager không hiện)
  const canFollow = user?.role !== USER_ROLES.ADMIN && user?.role !== USER_ROLES.TEAM_MANAGER;
  
  // --- STATE QUẢN LÝ UI ---
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  
  // --- STATE DỮ LIỆU ---
  const [teamData, setTeamData] = useState(null);
  const [members, setMembers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  // Followers / Following modal state
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followingList, setFollowingList] = useState([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [favoriteMap, setFavoriteMap] = useState({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  // --- STATE FORM ---
  const [editData, setEditData] = useState({
    full_name: '',
    phone: '',
    description: ''
  });
  
  const [newMember, setNewMember] = useState({
    user_id: '',
    name: '',
    position: '',
    in_game_name: '',
    phone: '',
    email: ''
  });

  // Inline description edit (no modal)
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');

  // --- USE EFFECT ---
  useEffect(() => {
    console.debug('[Dashboard] current user from AuthContext:', user);
    console.debug('[Dashboard] teamIdParam:', teamIdParam, 'isPublicMode:', isPublicMode);
    if (isPublicMode || user) {
      loadData();
    }
  }, [user, teamIdParam]);

  // If logged in user isn't a team manager and NOT in public mode, show a friendly message
  if (!isPublicMode && user && user.role !== USER_ROLES.TEAM_MANAGER) {
    return (
      <div className="min-h-screen bg-dark-500 text-white flex items-center justify-center">
        <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700">
          <h2 className="text-2xl font-bold mb-2">Không phải tài khoản quản lý đội</h2>
          <p className="text-gray-400">Tài khoản hiện tại không có quyền quản lý đội. Vui lòng đăng nhập bằng tài khoản Team Manager.</p>
        </div>
      </div>
    );
  }

  // --- HÀM TẢI DỮ LIỆU ---
  const loadData = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      
      // Gọi API lấy thông tin team - public mode dùng getTeamById, manager mode dùng getMyTeamInfo
      let teamRes;
      if (isPublicMode) {
        console.debug('[Dashboard] Loading team by ID:', teamIdToLoad);
        teamRes = await teamService.getTeamById(teamIdToLoad);
      } else {
        console.debug('[Dashboard] Loading my team info');
        teamRes = await teamService.getMyTeamInfo();
      }
      console.debug('[Dashboard] raw API response:', teamRes);
      
      const raw = teamRes?.data?.data || teamRes?.data || teamRes;

      if (raw) {
        const team = { ...raw };

        // Normalize team name
        if (!team.team_name) {
          team.team_name = team.full_name || team.name || team.username || team.display_name || '';
        }

        // Normalize avatar
        if (!team.avatar) {
          team.avatar = team.avatar_url || team.image || team.photo || team.profile_picture || '';
        }

        // Parse followers/following
        const parseCount = (val) => {
          if (val == null) return 0;
          if (typeof val === 'number') return val;
          if (Array.isArray(val)) return val.length;
          if (typeof val === 'string') {
            if (val.includes(',')) return val.split(',').filter(Boolean).length;
            const asNum = parseInt(val, 10);
            return isNaN(asNum) ? (val.trim() ? 1 : 0) : asNum;
          }
          return 0;
        };

        team.followers = parseCount(team.followers || team.followers_list || team.followers_count || team.followersIds);
        team.following = parseCount(team.following || team.following_list || team.following_count || team.followingIds);

        // Stats
        if (team.stats) {
          team.wins = team.wins || team.stats.wins || 0;
          team.losses = team.losses || team.stats.losses || 0;
          team.total_matches = team.total_matches || team.stats.total_matches || (team.wins + team.losses);
        } else {
          team.wins = team.wins || 0;
          team.losses = team.losses || 0;
          team.total_matches = team.total_matches || (team.wins + team.losses);
        }

        // Normalize created_at
        if (!team.created_at && team.created_date) {
          team.created_at = team.created_date;
        }

        let membersArr = team.members || team.team_members || team.members_list || [];
        const tournamentsArr = team.tournaments || team.tournaments_participated || team.participations || [];
        let matchesArr = team.matches || team.upcoming_matches || team.schedule || [];

        console.debug('[Dashboard] 📊 Tournaments data:', {
          fromTeam: team.tournaments,
          tournamentsArr: tournamentsArr,
          count: tournamentsArr.length,
          isPublicMode: isPublicMode
        });

        setTeamData(team);
        console.debug('[Dashboard] team.followers after normalize:', team.followers, ' following:', team.following);
        console.debug('[Dashboard] normalized team object:', team);
        
        setEditData({
          full_name: team.team_name || '',
          phone: team.phone || team.contact || '',
          description: team.description || team.bio || ''
        });
        // Initialize inline description draft
        setDescDraft(team.description || team.bio || '');

        // ✅ LOAD MEMBERS - Gọi API riêng nếu payload không có
        if ((!membersArr || membersArr.length === 0) && team.id) {
          try {
            const mRes = await teamService.getMyTeamMembers();
            console.debug('[Dashboard] raw API response for getMyTeamMembers:', mRes);
            const mData = mRes?.data?.data || mRes?.data || mRes;
            membersArr = Array.isArray(mData) ? mData : (mData?.members || []);
          } catch (err) {
            console.warn('Không lấy được members từ API', err);
          }
        }

        // ✅ LOAD MATCHES - Gọi API từ matchService
        try {
          console.debug('[Dashboard] 🔄 Fetching matches...');
          let matchRes;
          
          if (isPublicMode && team.id) {
            // Xem đội khác: lấy lịch theo team ID (tất cả trận)
            console.debug('[Dashboard] Public mode - fetching matches for team:', team.id);
            matchRes = await matchService.getMatchesByTeam(team.id, { 
              page: 1, 
              limit: 100
            });
          } else {
            // Xem đội của mình: lấy lịch của user đăng nhập (tất cả trận)
            console.debug('[Dashboard] Manager mode - fetching my team matches');
            matchRes = await matchService.getMyTeamMatches({ 
              page: 1, 
              limit: 100
            });
          }
          
          console.debug('[Dashboard] 📦 Raw match response:', matchRes);
          console.debug('[Dashboard] 📊 Response structure:', {
            hasData: !!matchRes?.data,
            dataKeys: matchRes?.data ? Object.keys(matchRes.data) : [],
            data: matchRes?.data
          });
          
          const matchPayload = matchRes?.data ?? matchRes;
          const matchData = matchPayload?.data ?? matchPayload;
          
          // Handle multiple response formats
          let allMatches = [];
          if (Array.isArray(matchData)) {
            allMatches = matchData;
          } else if (Array.isArray(matchData?.matches)) {
            allMatches = matchData.matches;
          } else if (Array.isArray(matchPayload?.matches)) {
            allMatches = matchPayload.matches;
          } else {
            allMatches = [];
          }
          
          // Hiển thị tất cả lịch thi đấu (không lọc theo thời gian)
          matchesArr = allMatches;
          
          console.debug('[Dashboard] ✅ Loaded matches:', {
            total: allMatches.length,
            matches: matchesArr,
            apiMessage: matchPayload?.message || matchData?.message
          });
        } catch (err) {
          console.error('[Dashboard] ⚠️ Error loading matches from API:', err);
          console.error('[Dashboard] Error details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status
          });
          // Fallback to team payload
          matchesArr = team.matches || team.upcoming_matches || [];
        }

        setMembers(membersArr);
        setMatches(matchesArr);
        setTournaments(tournamentsArr);
        
        console.debug('[Dashboard] 🎯 State updated - tournaments count:', tournamentsArr.length);
        
        // Check favorite status in public mode
        if (isPublicMode && user) {
          try {
            const status = await favoriteTeamService.getFavoriteStatus([team.id]);
            const favIds = status?.favoriteTeamIds || [];
            setIsFavorite(favIds.includes(parseInt(team.id)));
          } catch (error) {
            console.error('Error checking favorite status:', error);
          }
        }
        
     
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu đội:", error);
      const errMsg = error?.response?.data || error?.message || String(error);
      setApiError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- HÀM XỬ LÝ SỰ KIỆN ---
  const handleSaveChanges = async () => {
    try {
      // await teamService.updateTeam(teamData.id, editData);
      showSuccess("Cập nhật thông tin thành công!");
      setShowEditModal(false);
      loadData();
    } catch (e) {
      showError("Không thể cập nhật thông tin.");
    }
  };

  // --- INLINE DESCRIPTION HANDLERS ---
  const handleStartEditDesc = () => {
    setDescDraft(teamData?.description || '');
    setIsEditingDesc(true);
  };

  const handleCancelEditDesc = () => {
    setDescDraft(teamData?.description || '');
    setIsEditingDesc(false);
  };

  const handleSaveDescription = async () => {
    try {
      if (teamService.updateMyTeam) {
        await teamService.updateMyTeam({ description: descDraft });
        showSuccess('Cập nhật mô tả thành công!');
        // update local state quickly
        setTeamData(prev => ({ ...prev, description: descDraft }));
      } else {
        setTeamData(prev => ({ ...prev, description: descDraft }));
        showSuccess('Cập nhật mô tả thành công!');
      }
      setIsEditingDesc(false);
    } catch (err) {
      console.error('Lỗi khi lưu mô tả:', err);
      showError('Không thể lưu mô tả. Vui lòng thử lại.');
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name && !newMember.user_id) {
      showError("Vui lòng nhập Họ Tên hoặc User ID.");
      return;
    }

    const payload = {
      full_name: newMember.name || undefined,
      user_id: newMember.user_id ? (isNaN(Number(newMember.user_id)) ? newMember.user_id : Number(newMember.user_id)) : undefined,
      phone: newMember.phone || undefined,
      email: newMember.email || undefined
    };

    try {
      const resp = await teamService.addTeamMember(payload);
      const data = resp?.data ?? resp;
      showSuccess('Thêm thành viên thành công!');
      setShowAddMemberModal(false);
      setNewMember({ user_id: '', name: '', position: '', in_game_name: '', phone: '', email: '' });

      const created = data?.data ?? data;
      if (created && (created.id || created.user_id)) {
        const memberObj = {
          id: created.id || null,
          user_id: created.user_id || created.user_id || null,
          name: created.full_name || created.name || created.username || '',
          full_name: created.full_name || created.full_name || created.name || '',
          username: created.username || null,
          avatar: created.avatar || null,
          phone: created.phone || null,
          email: created.email || null,
          role: created.role || 'Player',
          status: created.status || 'APPROVED'
        };
        setMembers(prev => [memberObj, ...(prev || [])]);
      } else {
        try {
          const mRes = await teamService.getMyTeamMembers();
          const mData = mRes?.data?.data || mRes?.data || mRes;
          const membersArr = Array.isArray(mData) ? mData : (mData?.members || []);
          setMembers(membersArr);
        } catch (e) {
          loadData();
        }
      }
    } catch (e) {
      const errMsg = e?.response?.data?.message || e?.message || 'Lỗi khi thêm thành viên.';
      showError(errMsg);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Bạn có chắc muốn xóa thành viên này?")) return;
    try {
      await teamService.removeTeamMember(memberId);
      showSuccess('Đã xóa thành viên');
      loadData();
    } catch (error) {
      showError('Không thể xóa thành viên');
    }
  };

  // --- FOLLOWERS / FOLLOWING HANDLERS ---
  const openFollowersModal = async () => {
    if (!teamData?.id) return;
    setFollowersLoading(true);
    setShowFollowersModal(true);
    try {
      const res = await favoriteTeamService.getFollowers(teamData.id);
      // res expected shape: { users: [...] }
      setFollowersList(res?.users || res?.data || []);
    } catch (err) {
      console.error('Error loading followers', err);
      setFollowersList([]);
    } finally {
      setFollowersLoading(false);
    }
    // determine favorite status for any follower who is a team
    try {
      const teamIds = (followersList || []).filter(u => u?.role === 3).map(u => u.id);
      if (teamIds.length > 0) {
        const status = await favoriteTeamService.getFavoriteStatus(teamIds);
        // status.favoriteTeamIds expected
        const favIds = status?.favoriteTeamIds || status?.favoriteTeamIds || status?.favoriteTeamIds || [];
        const map = {};
        teamIds.forEach(id => { map[id] = favIds.includes(id); });
        setFavoriteMap(prev => ({ ...prev, ...map }));
      }
    } catch (e) {
      // ignore
    }
  };

  const openFollowingModal = async () => {
    if (!teamData?.id) return;
    setFollowingLoading(true);
    setShowFollowingModal(true);
    try {
      const res = await favoriteTeamService.getFollowing(teamData.id);
      setFollowingList(res?.teams || res?.data?.teams || res?.data || []);
    } catch (err) {
      console.error('Error loading following', err);
      setFollowingList([]);
    } finally {
      setFollowingLoading(false);
    }
      // check favorite status for the current user against listed teams
      try {
        const ids = (followingList || []).map(t => t.id).filter(Boolean);
        if (ids.length > 0) {
          const status = await favoriteTeamService.getFavoriteStatus(ids);
          const favIds = status?.favoriteTeamIds || [];
          const map = {};
          ids.forEach(id => { map[id] = favIds.includes(id); });
          setFavoriteMap(prev => ({ ...prev, ...map }));
        }
      } catch (e) {
        // ignore
      }
  };

  const toggleFavorite = async (teamId) => {
    try {
      const currently = !!favoriteMap[teamId];
      await favoriteTeamService.toggleFavoriteTeam(teamId, currently);
      setFavoriteMap(prev => ({ ...prev, [teamId]: !currently }));
    } catch (err) {
      console.error('toggleFavorite error', err);
    }
  };

  const toggleTeamFavorite = async () => {
    if (!user) {
      showError('Vui lòng đăng nhập để theo dõi đội');
      navigate('/login');
      return;
    }

    if (favoriteLoading) return;

    try {
      setFavoriteLoading(true);
      await favoriteTeamService.toggleFavoriteTeam(teamData.id, isFavorite);
      setIsFavorite(!isFavorite);
      showSuccess(isFavorite ? 'Đã bỏ theo dõi đội' : 'Đã theo dõi đội');
      
      // Keep loading for a short moment to show feedback
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      showError('Không thể cập nhật trạng thái theo dõi');
    } finally {
      setFavoriteLoading(false);
    }
  };

  // --- RENDER: LOADING ---
  if (isLoading) {
    const loadingContent = (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Đang tải thông tin đội...</p>
        </div>
      </div>
    );
    // Admin viewing uses current layout (already has DashboardLayout wrapper from routes)
    // Public mode uses PublicLayout
    // Team manager mode uses no wrapper
    return (isPublicMode && !isAdminViewing) ? <PublicLayout>{loadingContent}</PublicLayout> : loadingContent;
  }

  // --- RENDER: ERROR ---
  if (apiError) {
    const errorContent = (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Không tìm thấy đội</p>
          <Button onClick={() => navigate('/teams')}>Quay lại danh sách</Button>
        </div>
      </div>
    );
    return (isPublicMode && !isAdminViewing) ? <PublicLayout>{errorContent}</PublicLayout> : errorContent;
  }

  // --- RENDER: NO TEAM ---
  if (!teamData) {
    const noTeamContent = (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Không tìm thấy đội</p>
          <Button onClick={() => navigate(isPublicMode ? '/teams' : '/team-manager/create')}>
            {isPublicMode ? 'Quay lại danh sách' : '+ Tạo Đội Mới'}
          </Button>
        </div>
      </div>
    );
    return (isPublicMode && !isAdminViewing) ? <PublicLayout>{noTeamContent}</PublicLayout> : noTeamContent;
  }

  // --- TÍNH TOÁN THỐNG KÊ ---
  const stats = {
    totalMatches: teamData.total_matches || 0,
    wins: teamData.wins || 0,
    losses: teamData.losses || 0,
    winRate: teamData.total_matches > 0 
      ? ((teamData.wins / teamData.total_matches) * 100).toFixed(0) 
      : 0
  };

  // --- RENDER: MAIN DASHBOARD ---
  const mainContent = (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button for public mode */}
        {isPublicMode && (
          <div className="mb-4">
            <Button 
              onClick={() => navigate(-1)} 
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <span>←</span> Quay lại
            </Button>
          </div>
        )}

        {/* === HEADER SECTION === */}
        <TeamHeader 
          team={teamData}
          members={members}
          tournaments={tournaments}
          onEdit={() => setIsEditingDesc(true)}
          onShowFollowers={openFollowersModal}
          onShowFollowing={openFollowingModal}
          onToggleFavorite={canFollow ? toggleTeamFavorite : null}
          isFavorite={isFavorite}
          favoriteLoading={favoriteLoading}
          isPublicMode={isPublicMode}
        />

        {/* === NAVIGATION TABS === */}
        <TabNav
          tabs={[
            { id: 'overview', label: 'Tổng Quan', icon: <BarChart3 className="w-4 h-4"/> },
            { id: 'players', label: 'Tuyển Thủ', icon: <Users className="w-4 h-4"/> },
            { id: 'achievements', label: 'Thành Tích', icon: <Trophy className="w-4 h-4"/> },
            { id: 'schedule', label: 'Lịch Thi Đấu', icon: <Calendar className="w-4 h-4"/> }
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {/* === MAIN CONTENT === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3 space-y-8">
            
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <>
                <Card className="rounded-2xl p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: THEME_COLORS.primary }}>
                  <BarChart3 className="w-6 h-6" style={{ color: THEME_COLORS.primary }} />
                  Giới Thiệu Đội Tuyển
                </h2>
                <div className="prose prose-invert max-w-none">
                  {isEditingDesc ? (
                    <div>
                      <textarea
                        value={descDraft}
                        onChange={(e) => setDescDraft(e.target.value)}
                        className="w-full bg-dark-500 border border-primary-700/20 rounded-lg px-4 py-3 focus:border-primary-500 outline-none text-white min-h-[140px] resize-none"
                        placeholder="Chỉnh sửa mô tả đội tuyển..."
                      />
                      <div className="mt-3 flex gap-3">
                        <Button onClick={handleSaveDescription} variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />}>Lưu</Button>
                        <Button onClick={handleCancelEditDesc} variant="secondary" size="sm">Hủy</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-300 leading-loose whitespace-pre-wrap text-lg">{teamData.description || 'Chưa có mô tả giới thiệu về đội.'}</p>
                      {!isPublicMode && (
                        <div className="mt-3">
                          <Button onClick={handleStartEditDesc} variant="secondary" size="sm" leftIcon={<Edit className="w-4 h-4" />}>Chỉnh sửa mô tả</Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-8 pt-8 border-t border-primary-700/20">
                  <div className="text-sm text-gray-500 mb-3">Liên hệ</div>
                  <div className="text-white font-medium">
                    {(teamData.phone || teamData.contact || teamData.email) ? (
                      <div className="space-y-2">
                        {teamData.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" style={{ color: THEME_COLORS.primary }} />
                            <span>{teamData.phone}</span>
                          </div>
                        ) : null}
                        {teamData.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" style={{ color: THEME_COLORS.primary }} />
                            <a href={`mailto:${teamData.email}`} className="hover:underline" style={{ color: THEME_COLORS.primary }}>{teamData.email}</a>
                          </div>
                        ) : null}
                        {!teamData.phone && !teamData.email && teamData.contact ? <div>{teamData.contact}</div> : null}
                      </div>
                    ) : (
                      'Chưa cập nhật'
                    )}
                  </div>
                </div>
                
                {/* Biểu đồ thống kê */}
                <div className="mt-8 pt-8 border-t border-primary-700/20">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: THEME_COLORS.primary }}>
                    <BarChart3 className="w-5 h-5" />
                    Thống Kê Hiệu Suất
                  </h3>
                  
                  {/* Combined Stats Chart */}
                  <div className="bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-gray-900/50 rounded-xl p-8 border-2" style={{ borderColor: THEME_COLORS.primary }}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      {/* Win Rate Circle */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 mb-4">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <circle cx="64" cy="64" r="56" fill="none" stroke="#1a1a1a" strokeWidth="8"/>
                            <circle 
                              cx="64" 
                              cy="64" 
                              r="56" 
                              fill="none" 
                              stroke={THEME_COLORS.primary}
                              strokeWidth="8"
                              strokeDasharray={`${(stats.winRate / 100) * 352} 352`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl font-bold" style={{ color: THEME_COLORS.primary }}>{stats.winRate}%</div>
                              <div className="text-xs text-gray-500">Win Rate</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400 text-center">Tỷ lệ thắng</div>
                      </div>

                      {/* Wins/Losses Bars */}
                      <div className="flex flex-col justify-center space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Thắng</span>
                            <span className="font-bold" style={{ color: THEME_COLORS.success }}>{stats.wins}</span>
                          </div>
                          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ 
                              width: `${stats.totalMatches > 0 ? (stats.wins / stats.totalMatches * 100) : 0}%`,
                              backgroundColor: THEME_COLORS.success
                            }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Thua</span>
                            <span className="font-bold" style={{ color: THEME_COLORS.error }}>{stats.losses}</span>
                          </div>
                          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ 
                              width: `${stats.totalMatches > 0 ? (stats.losses / stats.totalMatches * 100) : 0}%`,
                              backgroundColor: THEME_COLORS.error
                            }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Total Matches */}
                      <div className="flex flex-col items-center justify-center">
                        <Activity className="w-12 h-12 mb-3" style={{ color: THEME_COLORS.secondary }} />
                        <div className="text-4xl font-bold mb-1" style={{ color: THEME_COLORS.secondary }}>{stats.totalMatches}</div>
                        <div className="text-sm text-gray-400">Tổng trận đấu</div>
                      </div>

                      {/* Team Info */}
                      <div className="flex flex-col justify-center space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                          <div className="flex items-center gap-2">
                            <Gamepad2 className="w-5 h-5" style={{ color: THEME_COLORS.primary }} />
                            <span className="text-sm text-gray-400">Giải đấu</span>
                          </div>
                          <span className="text-xl font-bold" style={{ color: THEME_COLORS.primary }}>{tournaments?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5" style={{ color: THEME_COLORS.warning }} />
                            <span className="text-sm text-gray-400">Tuyển thủ</span>
                          </div>
                          <span className="text-xl font-bold" style={{ color: THEME_COLORS.warning }}>{members?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              </>
            )}

            {/* TAB: PLAYERS */}
            {activeTab === 'players' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: THEME_COLORS.primary }}>
                    <Users className="w-7 h-7" style={{ color: THEME_COLORS.primary }} />
                    Đội Hình Chính Thức
                  </h2>
                  {!isPublicMode && (
                    <Button 
                      onClick={() => setShowAddMemberModal(true)} 
                      variant="primary" 
                      size="sm" 
                      leftIcon={<Plus className="w-4 h-4" />}
                      className="shadow-lg hover:shadow-xl transition-shadow"
                      style={{ boxShadow: `0 4px 14px ${THEME_COLORS.primary}60` }}
                    >
                      Thêm Tuyển Thủ
                    </Button>
                  )}
                </div>
                <MembersList members={members} onRemove={isPublicMode ? null : handleRemoveMember} />
              </div>
            )}

            {/* TAB: ACHIEVEMENTS */}
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: THEME_COLORS.warning }}>
                  <Trophy className="w-7 h-7" style={{ color: THEME_COLORS.warning }} />
                  Lịch Sử Giải Đấu
                </h2>
                <TournamentsList tournaments={teamData.tournaments || tournaments} />
              </div>
            )}

            {/* TAB: SCHEDULE */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: THEME_COLORS.secondary }}>
                  <Calendar className="w-7 h-7" style={{ color: THEME_COLORS.secondary }} />
                  Lịch Thi Đấu Sắp Tới
                </h2>
                <ScheduleList matches={matches} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit modal removed: inline editor handles description now */}

      {/* Followers Modal (larger, show resolved avatar, brighter text) */}
      <Modal isOpen={showFollowersModal} onClose={() => setShowFollowersModal(false)} title={`Followers (${followersList.length})`} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-auto">
          {followersLoading ? (
            <div className="text-center text-gray-400">Đang tải...</div>
          ) : followersList.length === 0 ? (
            <div className="text-gray-400">Chưa có người hâm mộ</div>
          ) : (
            followersList.map(u => {
              const src = normalizeImageUrl(u?.avatar) || u?.avatar || '/assets/default-avatar.png';
              return (
                <div key={u.id} className="flex items-center gap-4 p-3 rounded hover:bg-dark-400">
                  <img src={src} alt={u.full_name || u.username} className="w-16 h-16 rounded-full object-cover border-2 border-primary-700/30" />
                  <div>
                    <div className="text-white text-lg font-semibold">{u.full_name || u.username}</div>
                    <div className="text-sm text-gray-400">{u.email || ''}</div>
                  </div>
                  <div className="ml-auto">
                    {u.role === USER_ROLES.TEAM_MANAGER && (
                      <Button size="sm" onClick={() => toggleFavorite(u.id)} variant={favoriteMap[u.id] ? 'secondary' : 'primary'}>
                        {favoriteMap[u.id] ? 'Đã theo' : 'Theo dõi'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Following Modal (larger, show resolved avatar, brighter text) */}
      <Modal isOpen={showFollowingModal} onClose={() => setShowFollowingModal(false)} title={`Following (${followingList.length})`} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-auto">
          {followingLoading ? (
            <div className="text-center text-gray-400">Đang tải...</div>
          ) : followingList.length === 0 ? (
            <div className="text-gray-400">Chưa theo đội nào</div>
          ) : (
            followingList.map(t => {
              const src = normalizeImageUrl(t?.avatar) || t?.avatar || '/assets/default-avatar.png';
              return (
                <div key={t.id} className="flex items-center gap-4 p-3 rounded hover:bg-dark-400">
                  <img src={src} alt={t.full_name || t.username} className="w-16 h-16 rounded-full object-cover border-2 border-primary-700/30" />
                  <div>
                    <div className="text-white text-lg font-semibold">{t.full_name || t.username}</div>
                    <div className="text-sm text-gray-400">{t.email || ''}</div>
                  </div>
                  <div className="ml-auto">
                    {t.role === USER_ROLES.TEAM_MANAGER && (
                      <Button size="sm" onClick={() => toggleFavorite(t.id)} variant={favoriteMap[t.id] ? 'secondary' : 'primary'}>
                        {favoriteMap[t.id] ? 'Đã theo' : 'Theo'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* === MODAL ADD MEMBER === */}
      <Modal 
        isOpen={showAddMemberModal} 
        onClose={() => setShowAddMemberModal(false)} 
        title="Thêm Thành Viên Mới" 
        size="md" 
        footer={
          <div className="flex gap-3 w-full">
            <Button onClick={() => setShowAddMemberModal(false)} variant="secondary" className="flex-1">Hủy bỏ</Button>
            <Button onClick={handleAddMember} variant="primary" className="flex-1">Xác nhận thêm</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">User ID (Tùy chọn)</label>
            <input 
              type="text"
              value={newMember.user_id}
              onChange={(e) => setNewMember({...newMember, user_id: e.target.value})}
              className="w-full bg-dark-500 border border-primary-700/20 rounded-lg px-4 py-2.5 focus:border-primary-500 outline-none text-white text-sm"
              placeholder="Nhập ID nếu có tài khoản"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
              Họ Tên <span className="text-accent-red">*</span>
            </label>
            <input 
              type="text"
              value={newMember.name}
              onChange={(e) => setNewMember({...newMember, name: e.target.value})}
              className="w-full bg-dark-500 border border-primary-700/20 rounded-lg px-4 py-2.5 focus:border-primary-500 outline-none text-white text-sm"
              placeholder="Ví dụ: Nguyễn Văn A"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                Vị Trí <span className="text-accent-red">*</span>
              </label>
              <input 
                type="text"
                value={newMember.position}
                onChange={(e) => setNewMember({...newMember, position: e.target.value})}
                className="w-full bg-dark-500 border border-primary-700/20 rounded-lg px-4 py-2.5 focus:border-primary-500 outline-none text-white text-sm"
                placeholder="Mid, Top..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">IGN</label>
              <input 
                type="text"
                value={newMember.in_game_name}
                onChange={(e) => setNewMember({...newMember, in_game_name: e.target.value})}
                className="w-full bg-dark-500 border border-primary-700/20 rounded-lg px-4 py-2.5 focus:border-primary-500 outline-none text-white text-sm"
                placeholder="Ingame Name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Số điện thoại</label>
              <input
                type="text"
                value={newMember.phone}
                onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                className="w-full bg-dark-500 border border-primary-700/20 rounded-lg px-4 py-2.5 focus:border-primary-500 outline-none text-white text-sm"
                placeholder="Ví dụ: 0123456789"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                className="w-full bg-dark-500 border border-primary-700/20 rounded-lg px-4 py-2.5 focus:border-primary-500 outline-none text-white text-sm"
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );

  return (isPublicMode && !isAdminViewing) ? <PublicLayout>{mainContent}</PublicLayout> : mainContent;
};