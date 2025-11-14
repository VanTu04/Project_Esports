import dotenv from 'dotenv';
import { getLeaderboardFromChain } from '../src/services/BlockchainService.js';

dotenv.config();

async function testReadLeaderboard() {
  try {
    const tournamentId = 3;   // id giống dữ liệu đã ghi
    const roundNumber = 999;  // round đặc biệt cho BXH cuối

    console.log('Đang lấy BXH từ blockchain...');
    const leaderboard = await getLeaderboardFromChain(tournamentId, roundNumber);

    if (leaderboard.length === 0) {
      console.log('Chưa có dữ liệu trên blockchain cho round này.');
    } else {
      console.log('BXH trên blockchain:');
      leaderboard.forEach((item, idx) => {
        console.log(`${idx + 1}. Wallet: ${item.wallet}, Score: ${item.score}`);
      });
    }

  } catch (err) {
    console.error('Lỗi khi đọc BXH:', err);
  }
}

testReadLeaderboard();
