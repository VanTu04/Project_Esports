import Button from '../common/Button';

/**
 * Component hiển thị các nút thao tác cho một giải đấu
 * Bao gồm: Bắt đầu giải đấu, Xem BXH, Xóa giải đấu
 */
export const TournamentActions = ({ 
  tournament,
  onViewRanking, 
  onDelete,
  onStartTournament,
  onOpenRegistration,
  onEdit,
  isLastRow = false
}) => {
  // Determine readiness (support multiple naming conventions)
  const isReady = tournament?.isReady ?? tournament?.is_ready ?? tournament?.is_ready_flag ?? null;
  const isReadyNumeric = isReady === 1 || isReady === '1';
  const notReady = !isReadyNumeric;

  return (
    <div className="flex items-center gap-2">
      {/* Open registration (Admin) - show when not ready */}
      {notReady && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenRegistration?.(tournament.id)}
          disabled={tournament.__processingOpen === true}
        >
          {tournament.__processingOpen ? 'Đang mở...' : 'Mở đăng ký'}
        </Button>
      )}

      {/* Edit - show when not ready */}
      {notReady && (
        <Button
          variant="primary"
          size="sm"
          className="text-white border-2 hover:opacity-90"
          style={{ backgroundColor: '#8B5E3C', borderColor: '#7A4B2E' }}
          onClick={() => onEdit?.(tournament)}
        >
          Sửa
        </Button>
      )}

      {/* Bắt đầu giải đấu - Chỉ upcoming và chỉ khi đã mở đăng ký (isReady != 0) */}
      {!notReady && tournament.status === 'upcoming' && (
        <Button
          variant="success"
          size="sm"
          onClick={() => onStartTournament?.(tournament.id)}
        >
          Bắt đầu
        </Button>
      )}

      {/* Xem BXH - Chỉ live hoặc completed, và chỉ khi đã mở đăng ký */}
      {!notReady && (tournament.status === 'live' || tournament.status === 'completed') && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => onViewRanking(tournament.id)}
        >
          Xem BXH
        </Button>
      )}

      {/* Xóa - Chỉ cho giải đấu chưa mở đăng ký (status = 'notOpen' hoặc isReady = 0) */}
      {(tournament.status === 'notOpen' || (tournament.status === 'upcoming' && (isReady === 0 || isReady === '0' || isReady === false))) && (
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(tournament.id)}
        >
           Xóa
        </Button>
      )}
    </div>
  );
};
