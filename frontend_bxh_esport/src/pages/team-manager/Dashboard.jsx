import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Users, Calendar, Target, TrendingUp, 
  Edit, Plus, Save, X, UserPlus, Trash2, Heart, UserCheck, Award, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';
import teamService from '../../services/teamService';
import matchService from '../../services/matchService'; // ✅ THÊM IMPORT
import favoriteTeamService from '../../services/favoriteTeamService';
import { normalizeImageUrl } from '../../utils/imageHelpers';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import TeamHeader from '../../components/team/TeamHeader';
import TabNav from '../../components/team/TabNav';
import MembersList from '../../components/team/MembersList';
import TournamentsList from '../../components/team/TournamentsList';
import ScheduleList from '../../components/team/ScheduleList';

export const TeamManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
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
    if (user) {
      loadData();
    }
  }, [user]);

  // If logged in user isn't a team manager, show a friendly message
  if (user && user.role !== USER_ROLES.TEAM_MANAGER) {
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
      
      // Gọi API lấy thông tin team
      const teamRes = await teamService.getMyTeamInfo();
      console.debug('[Dashboard] raw API response for getMyTeamInfo:', teamRes);
      
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

        // ✅ LOAD MATCHES - Gọi API từ matchService (giống MatchHistory)
        try {
          console.debug('[Dashboard] 🔄 Fetching matches from matchService.getMyTeamMatches...');
          const matchRes = await matchService.getMyTeamMatches({ 
            page: 1, 
            limit: 20,
            status: 'PENDING' // Chỉ lấy upcoming matches cho Schedule tab
          });
          
          console.debug('[Dashboard] 📦 Raw match response:', matchRes);
          
          const matchPayload = matchRes?.data ?? matchRes;
          const matchData = matchPayload?.data ?? matchPayload;
          
          // Handle multiple response formats
          if (Array.isArray(matchData)) {
            matchesArr = matchData;
          } else if (Array.isArray(matchData?.matches)) {
            matchesArr = matchData.matches;
          } else if (Array.isArray(matchPayload?.matches)) {
            matchesArr = matchPayload.matches;
          } else {
            matchesArr = [];
          }
          
          console.debug('[Dashboard] ✅ Loaded matches:', matchesArr.length, matchesArr);
        } catch (err) {
          console.warn('[Dashboard] ⚠️ Không lấy được matches từ API', err);
          // Fallback to team payload
          matchesArr = team.matches || team.upcoming_matches || [];
        }

        setMembers(membersArr);
        setMatches(matchesArr);
        setTournaments(tournamentsArr);
        
        console.debug('[Dashboard] 📊 Final state:', {
          members: membersArr.length,
          matches: matchesArr.length,
          tournaments: tournamentsArr.length
        });
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

  // --- RENDER: LOADING ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-500 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-primary-400 font-semibold">Đang tải dữ liệu đội...</div>
        </div>
      </div>
    );
  }

  // --- RENDER: ERROR ---
  if (apiError) {
    return (
      <div className="min-h-screen bg-dark-500 text-white flex items-start justify-center p-6">
        <div className="max-w-4xl w-full">
          <Card className="p-6">
            <h3 className="text-xl font-bold text-accent-red mb-4">Lỗi khi lấy thông tin đội</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-200 bg-dark-400 p-4 rounded">{JSON.stringify(apiError, null, 2)}</pre>
            <div className="mt-4">
              <Button onClick={() => { setApiError(null); loadData(); }} className="px-4 py-2">Thử lại</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- RENDER: NO TEAM ---
  if (!teamData) {
    return (
      <div className="min-h-screen bg-dark-500 text-white flex items-center justify-center">
        <Card className="text-center p-10 max-w-md">
          <Trophy className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <div className="text-white text-2xl font-bold mb-2">Bạn chưa có đội tuyển</div>
          <p className="text-gray-300 mb-8">Hãy tạo một đội mới để bắt đầu thi đấu.</p>
          <Button onClick={() => navigate('/team-manager/create')} className="px-8 py-3" variant="primary">+ Tạo Đội Mới</Button>
        </Card>
      </div>
    );
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
  return (
    <div className="min-h-screen bg-dark-500 text-white bg-[url('/assets/grid-pattern.png')] bg-repeat">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* === HEADER SECTION === */}
        <TeamHeader team={teamData} onEdit={() => setIsEditingDesc(true)} onShowFollowers={openFollowersModal} onShowFollowing={openFollowingModal} />

        {/* === NAVIGATION TABS === */}
        <TabNav
          tabs={[
            { id: 'overview', label: 'Tổng Quan', icon: <Target className="w-4 h-4"/> },
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
              <Card className="rounded-2xl p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-primary-400">
                  <span className="w-1 h-6 bg-primary-500 rounded-full" /> 
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
                      <div className="mt-3">
                        <Button onClick={handleStartEditDesc} variant="secondary" size="sm" leftIcon={<Edit className="w-4 h-4" />}>Chỉnh sửa mô tả</Button>
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-8 pt-8 border-t border-primary-700/20 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Ngày thành lập</div>
                    <div className="text-white font-medium">
                      {new Date(teamData.created_at || Date.now()).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Liên hệ</div>
                    <div className="text-white font-medium">
                      {(teamData.phone || teamData.contact || teamData.email) ? (
                        <div className="space-y-1">
                          {teamData.phone ? (
                            <div className="flex items-center gap-2"><span className="text-primary-300">📞</span><span>{teamData.phone}</span></div>
                          ) : null}
                          {teamData.email ? (
                            <div className="flex items-center gap-2"><span className="text-primary-300">✉️</span><a href={`mailto:${teamData.email}`} className="text-primary-300 hover:underline">{teamData.email}</a></div>
                          ) : null}
                          {!teamData.phone && !teamData.email && teamData.contact ? <div>{teamData.contact}</div> : null}
                        </div>
                      ) : (
                        'Chưa cập nhật'
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* TAB: PLAYERS */}
            {activeTab === 'players' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <span className="w-1 h-6 bg-primary-500 rounded-full" /> 
                    Đội Hình Chính Thức
                  </h2>
                  <Button 
                    onClick={() => setShowAddMemberModal(true)} 
                    variant="secondary" 
                    size="sm" 
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Thêm Thành Viên
                  </Button>
                </div>
                <MembersList members={members} onRemove={handleRemoveMember} />
              </div>
            )}

            {/* TAB: ACHIEVEMENTS */}
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <span className="w-1 h-6 bg-yellow-500 rounded-full" /> 
                  Lịch Sử Giải Đấu
                </h2>
                <TournamentsList tournaments={teamData.tournaments || tournaments} />
              </div>
            )}

            {/* TAB: SCHEDULE */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <span className="w-1 h-6 bg-blue-500 rounded-full" /> 
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
};