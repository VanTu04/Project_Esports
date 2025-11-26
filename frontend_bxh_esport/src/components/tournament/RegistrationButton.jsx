import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../hooks/useAuth';
import tournamentService from '../../services/tournamentService';
import { ethers } from 'ethers';
import LeaderboardABI from '../../contracts/Leaderboard.json';

const RegistrationButton = ({ tournament, isTeamView = true }) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const { user } = useAuth();
  const [registering, setRegistering] = useState(null);
  const [myRegistration, setMyRegistration] = useState(null);

  const handleRegister = async (tournamentItem) => {
    const tournamentId = tournamentItem?.id;
    try {
      setRegistering(tournamentId);

      if (!window.ethereum) {
        showError('MetaMask chưa được cài đặt');
        return;
      }

      const TARGET_CHAIN_ID = '0x539'; // 31337
      const currentChain = await window.ethereum.request({ method: 'eth_chainId' });

      if (currentChain !== TARGET_CHAIN_ID) {
        try {
          await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: TARGET_CHAIN_ID }] });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: TARGET_CHAIN_ID,
                chainName: 'MyCustomChain',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['http://183.81.33.178:8545'],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      await window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        showError('Không có tài khoản MetaMask nào được cấp phép');
        return;
      }

      const currentWalletAddress = accounts[0];
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(currentWalletAddress);

      const apiResponse = await tournamentService.requestJoinTournament(tournamentId);
      if (!apiResponse || apiResponse.code !== 0) {
        showError(apiResponse?.message || 'Không thể lấy thông tin đăng ký');
        return;
      }

      const responseData = apiResponse.data;
      if (!responseData) {
        showError('Không nhận được dữ liệu từ backend');
        return;
      }

      const { contractAddress, wallet_address, amountInWei: backendAmount, signature, participant_id } = responseData;

      if (wallet_address.toLowerCase() !== currentWalletAddress.toLowerCase()) {
        showError(`Vui lòng dùng đúng ví để đăng ký! Ví backend trả về: ${wallet_address}`);
        return;
      }

      const balanceWei = await provider.getBalance(currentWalletAddress);
      const backendAmountBig = typeof backendAmount === 'bigint' ? backendAmount : BigInt(String(backendAmount));
      if (balanceWei < backendAmountBig) {
        showError(`Không đủ số dư: cần ${ethers.formatEther(backendAmountBig)} ETH`);
        return;
      }

      const contract = new ethers.Contract(contractAddress, LeaderboardABI.abi, signer);
      const tx = await contract.register(tournamentId, backendAmountBig, signature, { value: backendAmountBig });
      showSuccess('Giao dịch đã gửi, chờ xác nhận...');
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        showSuccess('Đăng ký giải đấu thành công!');
        try {
          const confirmRes = await tournamentService.confirmBlockchainRegistration(participant_id, tx.hash);
          const payload = confirmRes?.data?.data ?? confirmRes?.data ?? confirmRes;
          const participant = payload?.data?.participant ?? payload?.participant ?? null;
          setMyRegistration(participant ? { status: participant.status, participant } : { status: 'PENDING' });
        } catch (e) {
          console.warn('Xác nhận backend thất bại:', e);
          setMyRegistration({ status: 'PENDING' });
        }
      } else {
        showError('Giao dịch thất bại trên blockchain');
      }
    } catch (error) {
      console.error('Lỗi khi đăng ký:', error);
      if (error?.code === 4001) {
        showWarning('Người dùng từ chối giao dịch MetaMask');
      } else {
        showError(error?.message || 'Lỗi khi gửi giao dịch');
      }
    } finally {
      setRegistering(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadMyRegistration = async () => {
      if (!user?.id || !tournament?.id) return;
      try {
        const res = await tournamentService.getMyRegistrationStatus(tournament.id);
        const payload = res?.data?.data ?? res?.data ?? res;
        const registered = payload?.data?.registered ?? payload?.registered ?? (payload?.code === 0 && payload?.data?.participant);
        const participant = payload?.data?.participant ?? payload?.participant ?? (registered ? payload.data.participant : null);
        if (!cancelled) {
          if (participant) setMyRegistration({ status: participant.status, participant });
          else if (registered) setMyRegistration({ status: 'PENDING' });
          else setMyRegistration(null);
        }
      } catch (e) {
        console.warn('Không tải được trạng thái đăng ký của user:', e);
      }
    };
    loadMyRegistration();
    return () => { cancelled = true; };
  }, [user, tournament?.id]);

  if (!isTeamView) return null;

  if (!(String(tournament.status).toUpperCase() === 'PENDING' && (tournament.isReady === 1 || tournament.is_ready === 1 || tournament.isReady === true))) {
    return null;
  }

  return (
    <div>
      {myRegistration?.status === 'PENDING' || myRegistration?.status === 'WAITING_APPROVAL' ? (
        <Button disabled className="w-full bg-yellow-500/20 border-yellow-500/50 text-yellow-300 cursor-not-allowed">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Đã đăng ký
        </Button>
      ) : myRegistration?.status === 'APPROVED' ? (
        <Button disabled className="w-full bg-green-500/20 border-green-500/50 text-green-300 cursor-not-allowed">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Đang tham gia
        </Button>
      ) : myRegistration?.status === 'REJECTED' ? (
        <Button disabled className="w-full bg-red-500/20 border-red-500/50 text-red-300 cursor-not-allowed">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Đã bị từ chối
        </Button>
      ) : (
        <Button onClick={() => handleRegister(tournament)} disabled={registering === tournament.id} className="w-full py-3 text-lg" variant="primary">
          {registering === tournament.id ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang gửi...
            </>
          ) : (
            'Đăng ký ngay'
          )}
        </Button>
      )}
    </div>
  );
};

export default RegistrationButton;
