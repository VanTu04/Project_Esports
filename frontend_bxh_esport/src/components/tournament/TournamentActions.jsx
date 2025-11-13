import { useState } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

/**
 * Component hiển thị menu thao tác 3 chấm cho một giải đấu
 * Bao gồm: Bắt đầu giải đấu, Xem BXH, Xóa giải đấu
 */
export const TournamentActions = ({ 
  tournament,
  onViewRanking, 
  onDelete,
  onStartTournament,
  isLastRow = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
      >
        <EllipsisVerticalIcon className="w-5 h-5 text-gray-400 hover:text-white" />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu - Hiển thị lên trên nếu là hàng cuối */}
          <div className={`absolute right-0 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 flex flex-col ${isLastRow ? 'bottom-full mb-2' : 'mt-2'}`}>
            {/* Bắt đầu giải đấu - Chỉ upcoming */}
            {tournament.status === 'upcoming' && (
              <button
                onClick={() => {
                  onStartTournament?.(tournament.id);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-green-500/20 transition-colors first:rounded-t-lg"
              >
                Bắt đầu giải đấu
              </button>
            )}

            {/* Xem BXH - Chỉ live hoặc completed */}
            {(tournament.status === 'live' || tournament.status === 'completed') && (
              <button
                onClick={() => {
                  onViewRanking(tournament.id);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-primary-500/20 transition-colors first:rounded-t-lg"
              >
                Xem bảng xếp hạng
              </button>
            )}

            {/* Xóa - Chỉ upcoming */}
            {tournament.status === 'upcoming' && (
              <button
                onClick={() => {
                  onDelete(tournament.id);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 transition-colors last:rounded-b-lg border-t border-primary-700/30"
              >
                Xóa giải đấu
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
