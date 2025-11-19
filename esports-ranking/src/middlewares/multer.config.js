import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

// Thư mục upload nằm ngang cấp src
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// MIME types hợp lệ
const allowedMimes = ["image/jpeg", "image/png", "image/webp"];

// Filter file nguy hiểm
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const blockedExt = [".xml", ".html", ".php", ".svg", ".exe", ".js", ".json", ".sh"];
  if (blockedExt.includes(ext)) return cb(new Error("File type not allowed!"), false);
  if (!allowedMimes.includes(file.mimetype)) return cb(new Error("Only jpg/png/webp allowed!"), false);
  cb(null, true);
};

// Storage an toàn
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}_${Date.now()}${ext}`);
  },
});

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
});
