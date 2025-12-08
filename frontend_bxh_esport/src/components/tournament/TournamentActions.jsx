import { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';

export const TournamentActions = ({
  tournament,
  onViewRanking,
  onDelete,
  onStartTournament,
  onOpenRegistration,
  onEdit,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const isReady = tournament?.isReady ?? tournament?.is_ready ?? tournament?.is_ready_flag ?? null;
  const isReadyNumeric = isReady === 1 || isReady === '1' || isReady === true;
  const notReady = !isReadyNumeric;

  // Xử lý click ra ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Xử lý bật tắt menu
  const toggleMenu = (e) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài (ví dụ click vào hàng bảng)
    setOpen(!open);
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Nút 3 chấm */}
      <button 
        onClick={toggleMenu}
        className={`p-1 rounded-full hover:bg-white/10 transition-colors ${open ? 'bg-white/10 text-white' : 'text-gray-400'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
        </svg>
      </button>

      {/* Menu Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-48 origin-top-right bg-[#1a1d24] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden ring-1 ring-black ring-opacity-5 focus:outline-none flex flex-col p-1"
          onClick={(e) => e.stopPropagation()} // Ngăn click vào menu làm đóng menu (nếu muốn click item đóng menu thì bỏ dòng này hoặc xử lý từng nút)
        >
          <div className="flex flex-col gap-1">
            
            {/* --- NHÓM 1: CHƯA SẴN SÀNG (DRAFT) --- */}
            {notReady && (
              <>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-primary-600 hover:text-white rounded-md transition-colors flex items-center gap-2"
                  onClick={() => {
                    onOpenRegistration?.(tournament.id);
                    setOpen(false);
                  }}
                >
                  {/* Icon Mở đăng ký */}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Mở đăng ký
                </button>

                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-primary-600 hover:text-white rounded-md transition-colors flex items-center gap-2"
                  onClick={() => {
                    onEdit?.(tournament);
                    setOpen(false);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Chỉnh sửa
                </button>
              </>
            )}

            {/* --- NHÓM 2: SẮP DIỄN RA / ĐÃ MỞ ĐĂNG KÝ --- */}
            {!notReady && (tournament.status === 'upcoming' || tournament.status === 'PENDING') && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-green-900/30 rounded-md transition-colors flex items-center gap-2"
                onClick={() => {
                  onStartTournament?.(tournament.id);
                  setOpen(false);
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Bắt đầu giải
              </button>
            )}

            {/* --- NHÓM 3: ĐANG/ĐÃ DIỄN RA --- */}
            {!notReady && (tournament.status === 'live' || tournament.status === 'ACTIVE' || tournament.status === 'completed' || tournament.status === 'COMPLETED') && (
              <button
                className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-blue-900/30 rounded-md transition-colors flex items-center gap-2"
                onClick={() => {
                  onViewRanking(tournament.id);
                  setOpen(false);
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Xem BXH
              </button>
            )}

            {/* --- NHÓM 4: XÓA (Luôn hiện nếu chưa bắt đầu) --- */}
            {(notReady || tournament.status === 'upcoming' || tournament.status === 'PENDING') && (
              <>
                <div className="h-px bg-gray-700 my-1"></div>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 rounded-md transition-colors flex items-center gap-2"
                  onClick={() => {
                    onDelete(tournament.id);
                    setOpen(false);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Xóa giải đấu
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};