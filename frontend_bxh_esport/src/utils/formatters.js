/**
 * Format ETH amount consistently across the app
 * @param {number|string} amount - The ETH amount to format
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted ETH string
 */
export const formatETH = (amount, decimals = 4) => {
  if (amount == null || amount === '') return '0';
  const num = Number(amount);
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
};

/**
 * Format match score
 */
export const formatMatchScore = (team1Score, team2Score) => {
  return `${team1Score} - ${team2Score}`;
};

/**
 * Format tournament prize
 */
export const formatPrize = (amount, currency = 'VND') => {
  if (!amount) return '0';
  
  if (currency === 'VND') {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)} tỷ`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} triệu`;
    }
    return `${amount.toLocaleString('vi-VN')}`;
  }
  
  if (currency === 'ETH') {
    return `${amount.toFixed(4)} ETH`;
  }
  
  return `${amount.toLocaleString('vi-VN')} ${currency}`;
};

/**
 * Format player stats
 */
export const formatPlayerStats = (stats) => {
  if (!stats) return {};
  
  return {
    kda: stats.kda ? stats.kda.toFixed(2) : '0.00',
    winRate: stats.winRate ? `${stats.winRate.toFixed(1)}%` : '0%',
    kills: stats.kills || 0,
    deaths: stats.deaths || 0,
    assists: stats.assists || 0,
    gamesPlayed: stats.gamesPlayed || 0,
  };
};

/**
 * Format team rank
 */
export const formatRank = (rank) => {
  if (!rank) return '-';
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

/**
 * Format duration (seconds to hh:mm:ss)
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format match result for display
 */
export const formatMatchResult = (match) => {
  if (!match) return null;
  
  const winner = match.winnerId === match.team1Id ? match.team1 : match.team2;
  const loser = match.winnerId === match.team1Id ? match.team2 : match.team1;
  
  return {
    winner: winner?.name || 'TBD',
    loser: loser?.name || 'TBD',
    score: formatMatchScore(match.team1Score, match.team2Score),
    winnerLogo: winner?.logo,
    loserLogo: loser?.logo,
  };
};

/**
 * Format tournament bracket round name
 */
export const formatRoundName = (roundNumber, totalRounds) => {
  if (roundNumber === totalRounds) return 'Chung kết';
  if (roundNumber === totalRounds - 1) return 'Bán kết';
  if (roundNumber === totalRounds - 2) return 'Tứ kết';
  return `Vòng ${roundNumber}`;
};

/**
 * Format transaction hash
 */
export const formatTxHash = (hash, startChars = 10, endChars = 8) => {
  if (!hash) return '';
  if (hash.length <= startChars + endChars) return hash;
  return `${hash.substring(0, startChars)}...${hash.substring(hash.length - endChars)}`;
};

/**
 * Format blockchain explorer URL
 */
export const formatExplorerUrl = (hash, type = 'tx', network = 'etherscan') => {
  const baseUrls = {
    etherscan: 'https://etherscan.io',
    bscscan: 'https://bscscan.com',
    polygonscan: 'https://polygonscan.com',
  };
  
  const baseUrl = baseUrls[network] || baseUrls.etherscan;
  return `${baseUrl}/${type}/${hash}`;
};

/**
 * Format player position/role
 */
export const formatPlayerRole = (role) => {
  const roles = {
    top: 'Top Laner',
    jungle: 'Jungle',
    mid: 'Mid Laner',
    adc: 'ADC',
    support: 'Support',
    carry: 'Carry',
    offlane: 'Offlane',
    midlane: 'Midlane',
    safelane: 'Safelane',
  };
  
  return roles[role?.toLowerCase()] || role;
};

/**
 * Format notification message
 */
export const formatNotification = (notification) => {
  if (!notification) return '';
  
  const templates = {
    team_invite: `Bạn đã được mời vào đội {teamName}`,
    match_result: `Trận đấu {team1} vs {team2} đã có kết quả`,
    tournament_registration: `Đăng ký tham gia giải {tournamentName} của bạn đã được {status}`,
    reward_received: `Bạn đã nhận {amount} từ giải {tournamentName}`,
  };
  
  let message = templates[notification.type] || notification.message;
  
  if (notification.data) {
    Object.keys(notification.data).forEach(key => {
      message = message.replace(`{${key}}`, notification.data[key]);
    });
  }
  
  return message;
};

/**
 * Format API error message
 */
export const formatApiError = (error) => {
  if (!error) return 'Đã có lỗi xảy ra';
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Đã có lỗi xảy ra';
};

/**
 * Format array to string with separator
 */
export const formatArrayToString = (arr, separator = ', ', lastSeparator = ' và ') => {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return '';
  if (arr.length === 1) return arr[0];
  
  const allButLast = arr.slice(0, -1).join(separator);
  const last = arr[arr.length - 1];
  
  return `${allButLast}${lastSeparator}${last}`;
};