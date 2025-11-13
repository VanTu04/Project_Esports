import { useState } from "react";
import { CameraIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import userService from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import EditUserModal from "../../components/user/EditUserModal";

export const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const handleAvatarChange = async (e) => {
    if (!e.target.files[0]) return;
    const formData = new FormData();
    formData.append("avatar", e.target.files[0]);

    try {
      setUploading(true);
      const res = await userService.uploadAvatar(formData);

      if (res?.data?.data?.avatar) {
        updateUser({ ...user, avatar: res.data.data.avatar });
      }
    } catch (err) {
      console.error("Upload avatar error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 text-white">

      {/* ===== TITLE + EDIT BUTTON ===== */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Hồ sơ của tôi</h1>

        <button
          onClick={() => setOpenEdit(true)}
          className="px-4 py-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 
                     rounded-md shadow-md transition text-sm font-semibold"
        >
          <PencilSquareIcon className="w-5 h-5" />
          Chỉnh sửa hồ sơ
        </button>
      </div>

      {/* ===== PROFILE CARD ===== */}
      <div className="bg-[#1d1f23] p-6 rounded-xl shadow-lg border border-gray-800 flex gap-8 items-center">

        {/* Avatar */}
        <div className="relative w-32 h-32">
          <img
            src={user?.avatar || "/default-avatar.png"}
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
          />

          <label className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 duration-150 text-white p-1.5 rounded-full cursor-pointer shadow-md">
            {uploading ? (
              <span className="text-xs px-2 py-1">...</span>
            ) : (
              <CameraIcon className="w-5 h-5" />
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2">
          <h2 className="text-3xl font-semibold">
            {user?.full_name || user?.username}
          </h2>

          <p className="text-gray-300">
            <span className="font-semibold text-gray-400">Email:</span>{" "}
            {user?.email}
          </p>

          <p className="text-gray-300">
            <span className="font-semibold text-gray-400">Username:</span>{" "}
            {user?.username}
          </p>

          <p className="text-gray-300">
            <span className="font-semibold text-gray-400">Giới tính:</span>{" "}
            {user?.gender === 1 ? "Nam" : user?.gender === 2 ? "Nữ" : "Chưa cập nhật"}
          </p>

          <p className="text-gray-300">
            <span className="font-semibold text-gray-400">Số điện thoại:</span>{" "}
            {user?.phone || "Chưa cập nhật"}
          </p>

          <p className="text-gray-300">
            <span className="font-semibold text-gray-400">Quyền:</span>{" "}
            {user?.role}
          </p>
        </div>
      </div>

      {/* ===== ACCOUNT INFO ===== */}
      <div className="bg-[#1d1f23] p-6 rounded-xl shadow-lg border border-gray-800">
        <h3 className="text-2xl font-semibold mb-4">Thông tin tài khoản</h3>

        <div className="grid grid-cols-2 gap-4 text-gray-300">
          <div>
            <p className="font-semibold text-gray-400">Ngày tạo:</p>
            <p>{user?.created_at || "Không có dữ liệu"}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-400">ID người dùng:</p>
            <p>{user?.id}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-400">Trạng thái:</p>
            <p className="text-green-400">Hoạt động</p>
          </div>

          <div>
            <p className="font-semibold text-gray-400">Ví Blockchain:</p>
            <p>{user?.wallet_address || "Chưa liên kết"}</p>
          </div>
        </div>
      </div>

      {/* ===== EDIT MODAL ===== */}
      <EditUserModal 
        isOpen={openEdit} 
        onClose={() => setOpenEdit(false)} 
        user={user}
      />
    </div>
  );
};
