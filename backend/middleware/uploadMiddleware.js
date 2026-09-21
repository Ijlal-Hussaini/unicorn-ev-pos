import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Ensure uploads directory exists in a writable location
// Use UPLOADS_DIR env var if set, otherwise use temp directory in production or local in dev
const uploadsDir = process.env.UPLOADS_DIR || 
  (process.env.NODE_ENV === 'production' 
    ? path.join(os.tmpdir(), 'unicorn-ev-uploads')
    : path.join(process.cwd(), 'uploads'));

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for disk storage with fallback to memory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export default upload;
