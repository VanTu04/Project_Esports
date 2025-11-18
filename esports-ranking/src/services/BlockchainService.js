import { ethers } from 'ethers';
import { leaderboardContract, adminWallet } from '../init/blockchain.js';

// ================= Ghi BXH =================
export const updateLeaderboardOnChain = async ({ tournamentId, roundNumber, participantsArr, scoresArr }) => {
  if (!Array.isArray(participantsArr) || !Array.isArray(scoresArr)) {
    throw new Error("participantsArr và scoresArr phải là mảng");
  }
  if (participantsArr.length !== scoresArr.length) {
    throw new Error("participantsArr và scoresArr phải có cùng độ dài");
  }

  const tx = await leaderboardContract.updateLeaderboard(
    tournamentId,
    roundNumber,
    participantsArr,
    scoresArr
  );

  const receipt = await tx.wait();
  return {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber
  };
};

// ================= Lấy BXH =================
export const getLeaderboardFromChain = async (tournamentId, roundNumber) => {
  console.log("Getting leaderboard from chain for tournamentId:", tournamentId, "roundNumber:", roundNumber);

  const [participantsResult, scoresResult] = await leaderboardContract.getLeaderboard(tournamentId, roundNumber);

  // Chuyển Result sang array JS thuần
  const participants = Array.from(participantsResult);
  const scores = Array.from(scoresResult).map(s => Number(s)); // Convert bigint sang number

  console.log("participants:", participants, "scores:", scores);

  return participants.map((wallet, index) => ({
    wallet,
    score: scores[index]
  }));
};


// ================= TẠO CHỮ KÝ CHO ĐĂNG KÝ =================
/**
 * Backend tạo chữ ký xác thực giá tiền
 * @param {string} userAddress - Địa chỉ ví user
 * @param {number} tournamentId - ID giải đấu
 * @param {string} amountInWei - Số tiền (wei) dạng string, ví dụ: "100000000000000000" (0.1 ETH)
 * @returns {string} signature - Chữ ký để user gửi lên contract
 */
export const generateRegistrationSignature = async (userAddress, tournamentId, amountInWei) => {
  try {
    // Kiểm tra địa chỉ hợp lệ
    if (!ethers.isAddress(userAddress)) {
      throw new Error("Invalid user address");
    }

    // Tạo hash giống như trong Smart Contract
    const hash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256'],
      [userAddress, tournamentId, amountInWei]
    );

    // Admin ký hash này
    const signature = await adminWallet.signMessage(ethers.getBytes(hash));

    console.log("✅ Generated signature:", signature);
    return signature;
  } catch (error) {
    console.error("❌ Error generating signature:", error);
    throw error;
  }
};

// ================= KIỂM TRA TRẠNG THÁI ĐĂNG KÝ =================
/**
 * Lấy thông tin đăng ký của user
 * @param {number} tournamentId - ID giải đấu
 * @param {string} userAddress - Địa chỉ ví user
 * @returns {Object} { amountDeposited: string, status: number }
 */
export const getRegistrationStatus = async (tournamentId, userAddress) => {
  try {
    const registration = await leaderboardContract.registrations(tournamentId, userAddress);
    console.log("✅ Fetched registration status:", registration);
    // registration trả về tuple: [amountDeposited, status]
    const statusMap = {
      0: 'NONE',
      1: 'PENDING',
      2: 'APPROVED',
      3: 'REJECTED'
    };

    return {
      amountDeposited: registration[0].toString(), // BigInt -> string
      status: Number(registration[1]), // 0, 1, 2, 3
      statusName: statusMap[Number(registration[1])]
    };
  } catch (error) {
    console.error("❌ Error getting registration status:", error);
    throw error;
  }
};

// ================= ADMIN DUYỆT ĐĂNG KÝ =================
/**
 * Admin duyệt đăng ký → Tiền chuyển về ví Admin
 * @param {number} tournamentId - ID giải đấu
 * @param {string} userAddress - Địa chỉ ví user cần duyệt
 * @returns {Object} { txHash, blockNumber }
 */
export const approveRegistration = async (tournamentId, userAddress) => {
  try {
    console.log(`🔄 Approving registration for user ${userAddress} in tournament ${tournamentId}...`);

    // Kiểm tra trạng thái trước khi duyệt
    const regStatus = await getRegistrationStatus(tournamentId, userAddress);
    if (regStatus.status !== 1) { // 1 = Pending
      throw new Error(`Cannot approve. Current status: ${regStatus.statusName}`);
    }

    // Lưu amount trước khi gọi transaction (vì sau đó contract có thể thay đổi state)
    const amountBeforeTx = regStatus.amountDeposited;

    const tx = await leaderboardContract.approveRegistration(tournamentId, userAddress);
    const receipt = await tx.wait();

    console.log(`✅ Approved! TxHash: ${tx.hash}`);
    console.log(`💰 Amount transferred to admin: ${amountBeforeTx} wei`);

    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      amountTransferred: amountBeforeTx // Dùng giá trị đã lưu trước transaction
    };
  } catch (error) {
    console.error("❌ Error approving registration:", error);
    throw error;
  }
};

// ================= ADMIN TỪ CHỐI ĐĂNG KÝ =================
/**
 * Admin từ chối đăng ký → Tiền hoàn lại cho User
 * @param {number} tournamentId - ID giải đấu
 * @param {string} userAddress - Địa chỉ ví user cần từ chối
 * @returns {Object} { txHash, blockNumber, amountRefunded }
 */
export const rejectRegistration = async (tournamentId, userAddress) => {
  try {
    console.log(`🔄 Rejecting registration for user ${userAddress} in tournament ${tournamentId}...`);

    // Kiểm tra trạng thái trước khi từ chối
    const regStatus = await getRegistrationStatus(tournamentId, userAddress);
    if (regStatus.status !== 1) { // 1 = Pending
      throw new Error(`Cannot reject. Current status: ${regStatus.statusName}`);
    }

    // Lưu amount trước khi gọi transaction
    const amountBeforeTx = regStatus.amountDeposited;
    console.log(`💰 Amount to be refunded: ${amountBeforeTx} wei`);

    const tx = await leaderboardContract.rejectRegistration(tournamentId, userAddress);
    const receipt = await tx.wait();

    console.log(`✅ Rejected and refunded! TxHash: ${tx.hash}`);

    // Parse event RegistrationRejected từ receipt để lấy số tiền thực tế đã hoàn
    let amountRefunded = amountBeforeTx; // Fallback

    try {
      // Tìm event RegistrationRejected trong receipt
      for (const log of receipt.logs) {
        try {
          const parsedLog = leaderboardContract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'RegistrationRejected') {
            // Event: RegistrationRejected(uint256 indexed tournamentId, address indexed user, uint256 amountRefunded)
            amountRefunded = parsedLog.args.amountRefunded.toString();
            console.log(`🔎 Parsed from event - Amount refunded: ${amountRefunded} wei`);
            break;
          }
        } catch (e) {
          // Bỏ qua log không thuộc contract này
        }
      }
    } catch (parseError) {
      console.warn('⚠️ Could not parse RegistrationRejected event, using pre-tx amount:', parseError.message);
    }

    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      amountRefunded
    };
  } catch (error) {
    console.error("❌ Error rejecting registration:", error);
    throw error;
  }
};

// ================= LẤY DANH SÁCH ĐĂNG KÝ CHỜ DUYỆT =================
/**
 * Lấy tất cả user có trạng thái Pending cho 1 giải đấu
 * LƯU Ý: Smart Contract không lưu danh sách user, nên bạn cần:
 * - Option 1: Lắng nghe event "Registered" từ blockchain
 * - Option 2: Lưu danh sách user vào Database, dùng hàm này để check status
 * 
 * Hàm này demo Option 2
 */
export const getPendingRegistrations = async (tournamentId, userAddresses) => {
  try {
    const pendingUsers = [];

    for (const userAddress of userAddresses) {
      const regStatus = await getRegistrationStatus(tournamentId, userAddress);
      if (regStatus.status === 1) { // Pending
        pendingUsers.push({
          userAddress,
          amountDeposited: regStatus.amountDeposited
        });
      }
    }

    return pendingUsers;
  } catch (error) {
    console.error("❌ Error getting pending registrations:", error);
    throw error;
  }
};

// ================= TIỆN ÍCH: CHUYỂN ĐỔI ETH <-> WEI =================
export const ethToWei = (ethAmount) => {
  return ethers.parseEther(ethAmount.toString()).toString();
};

export const weiToEth = (weiAmount) => {
  return ethers.formatEther(weiAmount.toString());
};

// ================= TIỆN ÍCH: ĐỔI SIGNER WALLET =================
/**
 * Admin đổi địa chỉ ví Signer (nếu lộ Private Key)
 */
export const setSignerWallet = async (newSignerAddress) => {
  try {
    if (!ethers.isAddress(newSignerAddress)) {
      throw new Error("Invalid signer address");
    }

    const tx = await leaderboardContract.setSignerWallet(newSignerAddress);
    const receipt = await tx.wait();

    console.log(`✅ Signer wallet updated to: ${newSignerAddress}`);
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("❌ Error setting signer wallet:", error);
    throw error;
  }
};







/**
 * Lấy số dư ETH của một ví
 */
export const getWalletBalance = async (address) => {
  if (!ethers.isAddress(address)) throw new Error("Địa chỉ ví không hợp lệ");
  const balanceWei = await provider.getBalance(address);
  return parseFloat(ethers.formatEther(balanceWei));
};

/**
 * Lấy lịch sử giao dịch dựa trên event Distribute
 */
export const getWalletTransactions = async (address) => {
  if (!ethers.isAddress(address)) throw new Error("Địa chỉ ví không hợp lệ");

  // Event phải có trong ABI: Distribute(address indexed to, uint256 amountWei)
  const filter = leaderboardContract.filters.Distribute(address);
  const events = await leaderboardContract.queryFilter(filter, 0, "latest");

  const txs = await Promise.all(events.map(async (e) => {
    const block = await provider.getBlock(e.blockNumber);
    return {
      txHash: e.transactionHash,
      to: e.args.to,
      amount: parseFloat(ethers.formatEther(e.args.amount)),
      blockNumber: e.blockNumber,
      timestamp: block.timestamp,
    };
  }));

  return txs;
};

/**
 * Admin phân phối ETH từ contract
 */
export const distributeRewardOnChain = async (to, amountEth) => {
  if (!ethers.isAddress(to)) throw new Error("Địa chỉ nhận không hợp lệ");

  // Kiểm tra số dư contract
  const contractBalance = await provider.getBalance(leaderboardContract.address);
  if (parseFloat(ethers.formatEther(contractBalance)) < amountEth) {
    throw new Error("Contract không đủ ETH để phân phối");
  }

  const tx = await leaderboardContract.connect(adminWallet).distribute(
    to,
    ethers.parseEther(amountEth.toString())
  );

  const receipt = await tx.wait();
  return {
    to,
    amount: amountEth,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
  };
};