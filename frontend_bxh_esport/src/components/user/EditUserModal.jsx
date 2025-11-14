import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import userService from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

const EditUserModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    gender: 0,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || 0,
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const saveProfile = async () => {
    try {
      const res = await userService.updateProfile(formData);

      if (res?.data?.success) {
        // Cập nhật user vào AuthContext
        updateUser(res.data.data);

        // Đóng modal
        onClose();
      }
    } catch (err) {
      console.error("Update profile error:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-[420px] bg-[#18191c] text-white p-6 rounded-xl border border-gray-700 shadow-xl">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold">Chỉnh sửa hồ sơ</h2>
          <XMarkIcon
            className="w-6 h-6 cursor-pointer hover:text-red-400"
            onClick={onClose}
          />
        </div>

        {/* FORM */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">Họ tên</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full mt-1 p-2 rounded bg-[#202226] border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full mt-1 p-2 rounded bg-[#202226] border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full mt-1 p-2 rounded bg-[#202226] border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Số điện thoại</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full mt-1 p-2 rounded bg-[#202226] border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Giới tính</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full mt-1 p-2 rounded bg-[#202226] border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value={0}>Chưa chọn</option>
              <option value={1}>Nam</option>
              <option value={2}>Nữ</option>
            </select>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700"
          >
            Hủy
          </button>

          <button
            onClick={saveProfile}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
