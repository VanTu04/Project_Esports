// src/components/team/TeamForm.jsx
import { useState, useEffect } from 'react';

export const TeamForm = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    membersCount: 0,
    tournamentsCount: 0,
    logo: '',
  });
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setPreview(initialData.logo || '');
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
      setFormData((prev) => ({ ...prev, logo: imageUrl }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 p-6 rounded-2xl text-white space-y-5 shadow-lg border border-gray-700"
    >
      {/* --- Tên đội --- */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Tên đội <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="name"
          placeholder="Nhập tên đội"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* --- Khu vực --- */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Khu vực
        </label>
        <input
          type="text"
          name="region"
          placeholder="Ví dụ: Việt Nam, SEA, EU..."
          value={formData.region}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* --- Thành viên + Giải đấu --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Số thành viên
          </label>
          <input
            type="number"
            name="membersCount"
            min="0"
            value={formData.membersCount}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Số giải đấu đã tham gia
          </label>
          <input
            type="number"
            name="tournamentsCount"
            min="0"
            value={formData.tournamentsCount}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
      </div>

      {/* --- Logo --- */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Logo đội
        </label>

        {preview && (
          <div className="mb-3">
            <img
              src={preview}
              alt="Preview logo"
              className="w-24 h-24 object-cover rounded-lg border border-gray-700"
            />
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full text-sm text-gray-300
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-600 file:text-white
                     hover:file:bg-blue-700
                     transition"
        />
      </div>

      {/* --- Buttons --- */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium transition shadow-md"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold shadow-md transition"
        >
          Lưu
        </button>
      </div>
    </form>
  );
};
