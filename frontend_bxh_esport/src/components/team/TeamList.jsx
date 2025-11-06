import { Loading } from '../common/Loading';
import { TeamCard } from './TeamCard';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid';

export const TeamList = ({ teams, loading, onEdit, onDelete }) => {
  if (loading) return <p className="text-white text-center">Đang tải...</p>;
  if (!teams.length) return <p className="text-white text-center">Chưa có đội nào</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team) => (
        <div
          key={team.id}
          className="relative group rounded-xl overflow-hidden hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300"
        >
          {/* Thẻ Team */}
          <TeamCard team={team} />

          {/* Nút hành động (hiện khi hover) */}
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Nút Sửa */}
            <button
              onClick={() => onEdit(team)}
              className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-500 hover:to-indigo-500 shadow-md hover:shadow-blue-400/40 transition-all duration-300"
              title="Chỉnh sửa đội"
            >
              <PencilSquareIcon className="w-4 h-4" />
              <span>Sửa</span>
            </button>

            {/* Nút Xóa */}
            <button
              onClick={() => onDelete(team.id)}
              className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-red-500 hover:to-pink-500 shadow-md hover:shadow-red-400/40 transition-all duration-300"
              title="Xóa đội"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Xóa</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
export default TeamList;