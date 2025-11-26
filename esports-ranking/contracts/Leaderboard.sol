// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Leaderboard {

    // ============================================================
    // PHẦN 1: TỰ ĐỊNH NGHĨA QUYỀN OWNER (Thay cho import Ownable)
    // ============================================================
    address public owner;

    // Modifier để chỉ cho phép Admin gọi hàm
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    // ============================================================
    // PHẦN 2: CẤU TRÚC DỮ LIỆU (DATA STRUCTURES)
    // ============================================================
    
    // --- Cho Leaderboard ---
    struct ParticipantScore {
        address participant;
        uint256 score;
    }

    // Mapping: TournamentId => RoundNumber => Danh sách điểm
    mapping(uint256 => mapping(uint256 => ParticipantScore[])) private tournamentLeaderboards;

    // --- Cho Đăng ký (Registration) ---
    enum RegistrationStatus { None, Pending, Approved, Rejected }

    struct Registration {
        uint256 amountDeposited; 
        RegistrationStatus status;
    }

    // Mapping: TournamentId => UserAddress => Thông tin đăng ký
    mapping(uint256 => mapping(address => Registration)) public registrations;

    // Địa chỉ ví Backend dùng để ký xác thực (Signer)
    address public signerWallet;

    // ============================================================
    // EVENTS
    // ============================================================
    event LeaderboardUpdated(uint256 indexed tournamentId, uint256 indexed roundNumber);
    event Registered(uint256 indexed tournamentId, address indexed user, uint256 amount);
    event RegistrationApproved(uint256 indexed tournamentId, address indexed user);
    event RegistrationRejected(uint256 indexed tournamentId, address indexed user, uint256 amountRefunded);

    // Constructor chạy 1 lần khi deploy
    constructor(address _signerWallet) {
        owner = msg.sender; // Set người deploy là Admin
        signerWallet = _signerWallet;
    }

    // ============================================================
    // MODULE A: LEADERBOARD (QUẢN LÝ ĐIỂM SỐ)
    // ============================================================

    function updateLeaderboard(
        uint256 tournamentId,
        uint256 roundNumber,
        address[] memory participants,
        uint256[] memory scores
    ) public onlyOwner {
        require(participants.length == scores.length, "Mismatched lengths");

        // Xóa dữ liệu cũ để tránh trùng lặp
        delete tournamentLeaderboards[tournamentId][roundNumber];

        // Lưu dữ liệu mới
        for (uint i = 0; i < participants.length; i++) {
            tournamentLeaderboards[tournamentId][roundNumber].push(
                ParticipantScore(participants[i], scores[i])
            );
        }

        emit LeaderboardUpdated(tournamentId, roundNumber);
    }

    function getLeaderboard(uint256 tournamentId, uint256 roundNumber)
        public
        view
        returns (address[] memory participants, uint256[] memory scores)
    {
        ParticipantScore[] memory roundData = tournamentLeaderboards[tournamentId][roundNumber];
        uint256 len = roundData.length;

        participants = new address[](len);
        scores = new uint256[](len);

        for (uint i = 0; i < len; i++) {
            participants[i] = roundData[i].participant;
            scores[i] = roundData[i].score;
        }
    }

    // ============================================================
    // MODULE B: ĐĂNG KÝ & QUẢN LÝ TIỀN (REGISTRATION FLOW)
    // ============================================================

    /**
     * @dev User đăng ký: Verify chữ ký thủ công (không dùng thư viện)
     */
    function register(
        uint256 _tournamentId, 
        uint256 _amountFromDB, 
        bytes calldata _signature
    ) external payable {
        // 1. Kiểm tra số tiền gửi vào
        require(msg.value == _amountFromDB, "Incorrect ETH amount sent");
        require(registrations[_tournamentId][msg.sender].status == RegistrationStatus.None, "Already registered");

        // 2. --- LOGIC XÁC THỰC CHỮ KÝ (MANUAL VERIFY) ---
        
        // Băm dữ liệu gốc: (User + TournamentId + Amount)
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, _tournamentId, _amountFromDB));
        
        // Thêm prefix chuẩn Ethereum: "\x19Ethereum Signed Message:\n32"
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        // Khôi phục địa chỉ ví người ký từ chữ ký gửi lên
        address recoveredSigner = recoverSigner(ethSignedMessageHash, _signature);
        
        // So sánh xem người ký có phải là Server của mình không
        require(recoveredSigner == signerWallet, "Invalid signature / Wrong fee");

        // 3. Lưu trạng thái Pending
        registrations[_tournamentId][msg.sender] = Registration(_amountFromDB, RegistrationStatus.Pending);

        emit Registered(_tournamentId, msg.sender, _amountFromDB);
    }

    /**
     * @dev Admin DUYỆT -> Tiền về Admin
     */
    function approveRegistration(uint256 _tournamentId, address _user) external onlyOwner {
        Registration storage reg = registrations[_tournamentId][_user];
        require(reg.status == RegistrationStatus.Pending, "User not pending");

        uint256 amount = reg.amountDeposited;
        reg.status = RegistrationStatus.Approved;

        // Chuyển tiền cho Owner
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Transfer to admin failed");

        emit RegistrationApproved(_tournamentId, _user);
    }

    /**
     * @dev Admin TỪ CHỐI -> Hoàn tiền User
     */
    function rejectRegistration(uint256 _tournamentId, address payable _user) external onlyOwner {
        Registration storage reg = registrations[_tournamentId][_user];
        require(reg.status == RegistrationStatus.Pending, "User not pending");

        uint256 amount = reg.amountDeposited;
        
        // Reset trạng thái
        reg.status = RegistrationStatus.Rejected;
        reg.amountDeposited = 0;

        // Hoàn tiền
        (bool success, ) = _user.call{value: amount}("");
        require(success, "Refund failed");

        emit RegistrationRejected(_tournamentId, _user, amount);
    }

    function setSignerWallet(address _newSigner) external onlyOwner {
        signerWallet = _newSigner;
    }

    // ============================================================
    // CÁC HÀM HỖ TRỢ MÃ HÓA (INTERNAL HELPER FUNCTIONS)
    // Thay thế cho thư viện ECDSA / MessageHashUtils
    // ============================================================

    function getEthSignedMessageHash(bytes32 _messageHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");

        assembly {
            // 32 bytes đầu là length.
            // Nhảy qua 32 bytes đầu để lấy r
            r := mload(add(sig, 32))
            // Nhảy tiếp 32 bytes để lấy s
            s := mload(add(sig, 64))
            // Lấy byte cuối cùng cho v
            v := byte(0, mload(add(sig, 96)))
        }
    }

    // ============================================================
    // MODULE C: PHÂN PHỐI PHẦN THƯỞNG (REWARD DISTRIBUTION)
    // ============================================================

    event RewardDistributed(address indexed recipient, uint256 amount);

    /**
     * @dev Admin phân phối phần thưởng cho người thắng cuộc
     */
    function distributeReward(address payable _recipient, uint256 _amount) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient address");
        require(_amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= _amount, "Insufficient contract balance");

        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "Transfer failed");

        emit RewardDistributed(_recipient, _amount);
    }

    /**
     * @dev Admin nạp tiền vào contract để chuẩn bị phân phối
     */
    function fundContract() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH");
    }

    /**
     * @dev Xem số dư của contract
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Hàm nhận tiền fallback (để Contract có thể nhận ETH trực tiếp nếu cần)
    receive() external payable {}
}