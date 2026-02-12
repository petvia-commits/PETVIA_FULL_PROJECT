import multer from "multer";
import fs from "fs";
import path from "path";

export function ensureUploadDir(){
  const dir = process.env.UPLOAD_DIR || "uploads";
  const abs = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
  fs.mkdirSync(abs, { recursive: true });
  return abs;
}

export function makeMulter(){
  const uploadDirAbs = ensureUploadDir();
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDirAbs),
    filename: (_req, file, cb) => {
      const safe = (file.originalname || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}-${safe}`);
    }
  });

  return multer({
    storage,
    limits: { files: 3, fileSize: 7 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ok = ["image/jpeg","image/png","image/webp"].includes(file.mimetype);
      if (!ok) return cb(new Error("INVALID_FILE_TYPE"));
      cb(null, true);
    }
  });
}
