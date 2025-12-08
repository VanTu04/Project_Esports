import { Link } from 'react-router-dom';
import { UsersIcon, TrophyIcon } from '@heroicons/react/24/outline';
import Card from '../common/Card';
import { HeartButton } from '../common/HeartButton';
import { normalizeImageUrl, resolveTeamLogo } from '../../utils/imageHelpers';

export const TeamCard = ({ team, isFavorite = false, onFavoriteChange }) => {
  // Support both team object and user object (user with role = team)
  const displayName = team.full_name || team.name || team.username;
  const displaySubtitle = team.email || team.region || team.username;
  const resolvedAvatar = resolveTeamLogo(team) || normalizeImageUrl(team.avatar || team.logo || team.image) || null;

  return (
    <Card hover>
      <div className="flex items-start gap-4">
        {resolvedAvatar ? (
          <img
            src={resolvedAvatar}
            alt={displayName}
            className="w-20 h-20 rounded-lg object-cover"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default-logo.png'; }}
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-primary-700/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">{displayName}</h3>
              <p className="text-sm text-gray-400 mb-3">@{displaySubtitle}</p>
            </div>
            <HeartButton
              teamId={team.id}
              initialIsFavorite={isFavorite}
              size="sm"
              onToggle={(newIsFavorite) => {
                if (onFavoriteChange) {
                  onFavoriteChange(team.id, newIsFavorite);
                }
              }}
            />
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-300">
            {team.wallet_address && (
              <div className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="truncate max-w-[120px]">{team.wallet_address.substring(0, 10)}...</span>
              </div>
            )}
            {team.membersCount !== undefined && (
              <div className="flex items-center gap-1">
                <UsersIcon className="h-4 w-4" />
                <span>{team.membersCount || 0} thành viên</span>
              </div>
            )}
            {team.tournamentsCount !== undefined && (
              <div className="flex items-center gap-1">
                <TrophyIcon className="h-4 w-4" />
                <span>{team.tournamentsCount || 0} giải đấu</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Link
        to={`/teams/${team.id}`}
        className="block w-full mt-4 py-2 text-center bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
      >
        Xem chi tiết
      </Link> 
    </Card>
  );
};