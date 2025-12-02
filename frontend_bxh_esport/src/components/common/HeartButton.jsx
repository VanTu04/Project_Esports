import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import favoriteTeamService from '../../services/favoriteTeamService';
import { useNotification } from '../../context/NotificationContext';

/**
 * HeartButton Component - Toggle favorite team
 * @param {number} teamId - ID của team
 * @param {boolean} initialIsFavorite - Trạng thái yêu thích ban đầu
 * @param {string} size - Kích thước: 'sm', 'md', 'lg'
 * @param {function} onToggle - Callback khi toggle (optional)
 */
export const HeartButton = ({ teamId, initialIsFavorite = false, size = 'md', onToggle }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);

  // Sync internal state with prop changes
  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showError('Vui lòng đăng nhập để thêm đội yêu thích');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      await favoriteTeamService.toggleFavoriteTeam(teamId, isFavorite);
      
      const newIsFavorite = !isFavorite;
      setIsFavorite(newIsFavorite);
      
      if (newIsFavorite) {
        showSuccess('Đã thêm vào danh sách yêu thích');
      } else {
        showSuccess('Đã xóa khỏi danh sách yêu thích');
      }

      // Call callback if provided
      if (onToggle) {
        onToggle(newIsFavorite);
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      showError('Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full transition-all duration-300 ${
        isFavorite
          ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500'
          : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-red-400'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} group`}
      title={isFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
      aria-label={isFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
    >
      {loading ? (
        <svg className={`${iconSizeClasses[size]} animate-spin`} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg
          className={`${iconSizeClasses[size]} transition-transform duration-300 ${isFavorite ? 'scale-110' : 'group-hover:scale-110'}`}
          fill={isFavorite ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={isFavorite ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  );
};

export default HeartButton;
