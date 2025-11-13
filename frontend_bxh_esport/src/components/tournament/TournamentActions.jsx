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
  isLastRow = false
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Bắt đầu giải đấu - Chỉ upcoming */}
      {tournament.status === 'upcoming' && (
        <Button
          variant="success"
          size="sm"
          onClick={() => onStartTournament?.(tournament.id)}
        >
          Bắt đầu
        </Button>
      )}

      {/* Xem BXH - Chỉ live hoặc completed */}
      {(tournament.status === 'live' || tournament.status === 'completed') && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => onViewRanking(tournament.id)}
        >
          Xem BXH
        </Button>
      )}

      {/* Xóa - Chỉ upcoming */}
      {tournament.status === 'upcoming' && (
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
