import db from '../models/index.js';

const RankingBoard = db.RankingBoard;
const Ranking = db.Ranking;
const Team = db.Team;

export const createRankingBoard = async (req, res) => {
  try {
    const { tournament_id, status, teams } = req.body;

    const board = await RankingBoard.create({ tournament_id, status });
    for (const teamId of teams) {
      await Ranking.create({
        ranking_board_id: board.id,
        team_id: teamId,
        wins: 0,
        losses: 0,
        points: 0,
      });
    }

    res.status(201).json({ message: 'Tạo bảng xếp hạng thành công', board_id: board.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi tạo bảng xếp hạng' });
  }
};

export const getRankingBoard = async (req, res) => {
  try {
    const { tournament_id } = req.params;
    const board = await RankingBoard.findOne({
      where: { tournament_id },
      include: [{ model: Ranking, include: [Team] }],
    });
    if (!board) return res.status(404).json({ message: 'Chưa có bảng xếp hạng' });
    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi tải bảng xếp hạng' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await RankingBoard.update({ status }, { where: { id } });
    res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái' });
  }
};
