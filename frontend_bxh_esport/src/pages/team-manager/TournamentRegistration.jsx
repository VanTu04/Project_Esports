import { useEffect, useState } from 'react';
import tournamentService from '../../services/tournamentService';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import Button from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../hooks/useAuth';
import { ethers } from 'ethers';
import LeaderboardABI from '../../contracts/Leaderboard.json';

export const TournamentRegistration = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null); // ID của tournament đang đăng ký
  const [registrationStatus, setRegistrationStatus] = useState({}); // {tournamentId: {status: 'PENDING'|'APPROVED'|'REJECTED'}}
  const [activeTab, setActiveTab] = useState('available'); // available, participating, completed
  const { showSuccess, showError, showWarning } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
  try {
    setLoading(true);
    // Lấy tất cả giải đấu, bỏ filter status
    const response = await tournamentService.getAllTournaments();

    // Normalize response to an array (API may return different shapes)
    let tournamentList = [];
    if (Array.isArray(response)) tournamentList = response;
    else if (Array.isArray(response?.data)) tournamentList = response.data;
    else if (Array.isArray(response?.data?.data)) tournamentList = response.data.data;
    else if (response && typeof response === 'object') {
      tournamentList = response.tournaments || response.data?.tournaments || [];
    }

    setTournaments(tournamentList || []);

    // Load registration status for current user for each tournament using the dedicated endpoint
    if (user?.id && tournamentList.length > 0) {
      try {
        const statusEntries = await Promise.all(tournamentList.map(async (t) => {
          try {
            const res = await tournamentService.getMyRegistrationStatus(t.id);
            // API returns { code, status, message, data }
            if (res?.code === 0 && res.data) {
              return [t.id, { status: res.data.registered ? res.data.participant?.status : null, participant: res.data.participant, blockchain: res.data.blockchain }];
            }
            return [t.id, null];
          } catch (e) {
            console.warn(`Failed to fetch registration for tournament ${t.id}:`, e);
            return [t.id, null];
          }
        }));

        const statusMap = Object.fromEntries(statusEntries.filter(([,v]) => v));
        setRegistrationStatus(statusMap);
        console.log('Registration status map loaded:', statusMap);
      } catch (e) {
        console.warn('Error loading registration statuses in parallel:', e);
      }
    }
  } catch (error) {
    showError('Không thể tải danh sách giải đấu');
  } finally {
    setLoading(false);
  }
};

  const loadRegistrationStatus = async (tournamentList) => {
    if (!user?.id) {
      console.log('No user ID, skipping registration status load');
      return;
    }

    console.log('Loading registration status for user:', user.id);
    const statusMap = {};
    
    // Load participants cho từng tournament (tất cả status, không chỉ APPROVED)
    for (const tournament of tournamentList) {
      try {
        // Không truyền status filter để lấy tất cả participants
        const response = await tournamentService.getParticipants(tournament.id);
        
        console.log(`Tournament ${tournament.id} participants response:`, response);
        
        // Backend trả về: {code: 0, data: [...], message: string}
        let participants = [];
        
        if (response?.code === 0) {
          // Success từ backend
          if (Array.isArray(response.data)) {
            participants = response.data;
          } else if (response.data && Array.isArray(response.data.participants)) {
            participants = response.data.participants;
          }
        } else if (Array.isArray(response)) {
          // Trường hợp backend trả về array trực tiếp (không có wrapper)
          participants = response;
        } else if (response?.data && Array.isArray(response.data)) {
          participants = response.data;
        }
        
        console.log(`Tournament ${tournament.id} participants:`, participants);
        
        // Tìm xem user hiện tại đã đăng ký chưa
        const myParticipation = participants.find(p => p.user_id === user.id);
        
        console.log(`My participation for tournament ${tournament.id}:`, myParticipation);
        
        if (myParticipation) {
          statusMap[tournament.id] = {
            status: myParticipation.status, // PENDING, APPROVED, REJECTED
            participantId: myParticipation.id
          };
        }
      } catch (error) {
        console.warn(`Error loading participants for tournament ${tournament.id}:`, error);
      }
    }

    console.log('Final registration status map:', statusMap);
    setRegistrationStatus(statusMap);
  };

  const handleRegister = async (tournamentId) => {
    try {
      console.log("🔹 Bắt đầu đăng ký giải đấu:", tournamentId);
      setRegistering(tournamentId);

      // 1️⃣ Gọi API backend
      console.log("🔹 Gọi API requestJoinTournament...");
      const res = await tournamentService.requestJoinTournament(tournamentId);
      const response = res.data;
      console.log("📦 Response backend:", response);

      if (response?.code !== 0) {
        showError(response?.message || "Không thể lấy thông tin đăng ký");
        return;
      }

      const { signature, amountInWei: backendAmount, contractAddress, participant_id } = response.data;
      console.log("🔹 Backend trả về:", { signature, backendAmount, contractAddress });

      // 2️⃣ Kiểm tra MetaMask
      if (!window.ethereum) {
        showError("MetaMask chưa được cài đặt");
        return;
      }

      // 🎯 Chain ID mục tiêu của RPC bạn (31337 → 0x7A69)
      const TARGET_CHAIN_ID = "0x539";

      // 2.1️⃣ Check current chain MetaMask
      const currentChain = await window.ethereum.request({ method: "eth_chainId" });
      console.log("🌐 MetaMask đang ở chain:", currentChain);

      // 2.2️⃣ Nếu chưa đúng chain → yêu cầu chuyển
      if (currentChain !== TARGET_CHAIN_ID) {
        console.log("⚠️ MetaMask sai mạng, yêu cầu chuyển sang 31337...");

        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: TARGET_CHAIN_ID }],
          });
          console.log("✅ MetaMask đã chuyển sang chain 31337");
        } catch (switchError) {
          if (switchError.code === 4902) {
            console.log("🔧 Chain chưa tồn tại. Đang add mạng 183.81.33.178:8545...");

            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: TARGET_CHAIN_ID,
                  chainName: "MyCustomChain",
                  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                  rpcUrls: ["http://183.81.33.178:8545"],
                },
              ],
            });

            console.log("✅ Đã thêm mạng custom RPC");
          } else {
            throw switchError;
          }
        }
      }

      console.log("💵 backendAmount (wei):", backendAmount);
      console.log("💵 backendAmount (eth):", ethers.formatEther(backendAmount));
      console.log("💵 backendAmount (number):", Number(ethers.formatEther(backendAmount)));


      // 3️⃣ Kết nối MetaMask
      console.log("🔹 Kết nối MetaMask...");
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      console.log("✅ MetaMask address:", userAddress);

      // 4️⃣ Lấy balance từ RPC 183.81.33.178:8545
      const balanceWei = await provider.getBalance(userAddress);
      console.log("💰 Balance RPC hiện tại:", ethers.formatEther(balanceWei), "ETH");

      // ➜ Nếu không đủ tiền → dừng
      if (balanceWei <= 0n) {
        showError("Ví không có ETH trên mạng RPC 183.81.33.178:8545");
        return;
      }

      console.log("🔹 Số ETH gửi:", ethers.formatEther(backendAmount), "ETH");

      // 5️⃣ Tạo instance contract
      const contract = new ethers.Contract(contractAddress, LeaderboardABI.abi, signer);
      console.log("🔹 Contract instance:", contractAddress);

      // 6️⃣ Gửi transaction register
      console.log("🔹 Gửi transaction register...");
      const tx = await contract.register(
        tournamentId,
        backendAmount,
        signature,
        { value: backendAmount }
      );

      showSuccess("Giao dịch đã được gửi, chờ xác nhận...");
      console.log("⏳ Transaction hash:", tx.hash);

      // 7️⃣ Chờ mined
      const receipt = await tx.wait();
      console.log("📄 Transaction receipt:", receipt);

      if (receipt.status === 1) {
        showSuccess("Đăng ký giải đấu thành công!");
        console.log("📌 Số tiền user thực sự gửi (tx.value wei):", tx.value?.toString());
        console.log("📌 Số tiền user gửi (ETH):", ethers.formatEther(tx.value || 0));
        const res = await tournamentService.confirmBlockchainRegistration(participant_id, tx.hash);
        console.log("✅ Đã xác nhận đăng ký với backend:", res);
        // await loadTournaments();
      } else {
        showError("Giao dịch thất bại trên blockchain");
      }

    } catch (error) {
      console.error("❌ Lỗi khi đăng ký:", error);
      if (error.code === 4001) {
        showWarning("Người dùng từ chối giao dịch MetaMask");
      } else {
        showError(error?.message || "Lỗi khi gửi giao dịch");
      }
    } finally {
      setRegistering(null);
      console.log("🔹 Kết thúc handleRegister");
    }
  };



  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const formatPrizePool = (amount) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  // Filter tournaments theo tab
  const getFilteredTournaments = () => {
    // Defensive: ensure `tournaments` is an array
    if (!Array.isArray(tournaments)) return [];
    if (activeTab === 'available') {
      // Giải đấu có thể đăng ký (PENDING) và chưa đăng ký hoặc đang chờ duyệt
      return tournaments.filter(t => 
        t.status === 'PENDING' || 
        (t.status === 'ACTIVE' && registrationStatus[t.id]?.status === 'APPROVED')
      );
    } else if (activeTab === 'participating') {
      // Giải đấu đang tham gia (đã được duyệt và giải đấu đang diễn ra)
      return tournaments.filter(t => 
        registrationStatus[t.id]?.status === 'APPROVED' && t.status === 'ACTIVE'
      );
    } else if (activeTab === 'completed') {
      // Giải đấu đã tham gia và đã kết thúc
      return tournaments.filter(t => 
        registrationStatus[t.id]?.status === 'APPROVED' && t.status === 'COMPLETED'
      );
    }
    return tournaments;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  const filteredTournaments = getFilteredTournaments();

  return (

    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Đăng ký Giải đấu</h1>
          <p className="text-sm text-gray-400 mt-1">
            Chọn giải đấu để tham gia. Yêu cầu của bạn sẽ được gửi đến Admin để duyệt.
          </p>
        </div>
        <Button onClick={loadTournaments} variant="secondary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-primary-700/20 bg-gradient-to-r from-primary-500/5 to-purple-500/5">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('available')}
            className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
              activeTab === 'available'
                ? 'border-cyan-300 text-cyan-300'
                : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Có thể đăng ký</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('participating')}
            className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
              activeTab === 'participating'
                ? 'border-cyan-300 text-cyan-300'
                : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Đang tham gia</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
              activeTab === 'completed'
                ? 'border-cyan-300 text-cyan-300'
                : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Đã tham gia</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tournament List */}
      {filteredTournaments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-300">Không có giải đấu</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'available' && 'Hiện tại chưa có giải đấu nào đang mở đăng ký.'}
              {activeTab === 'participating' && 'Bạn chưa tham gia giải đấu nào đang diễn ra.'}
              {activeTab === 'completed' && 'Bạn chưa hoàn thành giải đấu nào.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <Card key={tournament.id} className="hover:border-primary-500/50 transition-all">
              <div className="p-6 space-y-4">
                {/* Tournament Header */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {tournament.tournament_name || tournament.name}
                  </h3>
                </div>

                {/* Tournament Info */}
                <div className="space-y-2 text-sm">
             

                  <div className="flex items-center text-gray-300">
                    <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Bắt đầu: {formatDate(tournament.start_date)}</span>
                  </div>

                  <div className="flex items-center text-gray-300">
                    <svg className="w-4 h-4 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Kết thúc: {formatDate(tournament.end_date)}</span>
                  </div>

                  <div className="flex items-center text-yellow-400 font-semibold">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Giải thưởng: {formatPrizePool(tournament.prize_pool)}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  {tournament.status === 'ACTIVE' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                      Đã đóng đăng ký
                    </span>
                  ) : tournament.status === 'COMPLETED' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">
                      Đã kết thúc
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Đang mở đăng ký
                    </span>
                  )}
                </div>

                {/* Register Button */}
                {(() => {
                  const status = registrationStatus[tournament.id];
                  
                  // Nếu tournament đã bắt đầu hoặc kết thúc
                  if (tournament.status === 'ACTIVE' || tournament.status === 'COMPLETED') {
                    return (
                      <Button disabled className="w-full bg-gray-500/20 border-gray-500/50 text-gray-300 cursor-not-allowed">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Đã đóng đăng ký
                      </Button>
                    );
                  }
                  
                  if (registering === tournament.id) {
                    return (
                      <Button disabled className="w-full" variant="primary">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang gửi...
                      </Button>
                    );
                  }
                  
                  if (status?.status === 'PENDING') {
                    return (
                      <Button disabled className="w-full bg-yellow-500/20 border-yellow-500/50 text-yellow-300 cursor-not-allowed">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Đã đăng ký
                      </Button>
                    );
                  }
                  
                  if (status?.status === 'APPROVED') {
                    return (
                      <Button disabled className="w-full bg-green-500/20 border-green-500/50 text-green-300 cursor-not-allowed">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Đang tham gia
                      </Button>
                    );
                  }
                  
                  if (status?.status === 'REJECTED') {
                    return (
                      <Button disabled className="w-full bg-red-500/20 border-red-500/50 text-red-300 cursor-not-allowed">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Đã bị từ chối
                      </Button>
                    );
                  }
                  
                  // Chưa đăng ký
                  return (
                    <Button
                      onClick={() => handleRegister(tournament.id)}
                      className="w-full"
                      variant="primary"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Đăng ký tham gia
                    </Button>
                  );
                })()}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

