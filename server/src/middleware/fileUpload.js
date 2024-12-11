const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  // Define allowed MIME types
  const allowedMimes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    // Video
    'video/mp4',
    'video/webm',
    'video/ogg',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 1 // Maximum number of files per upload
  }
});

// Middleware to handle file upload errors
const handleFileUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File size too large. Maximum size is 100MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({
        error: 'Too many files. Maximum is 1 file per upload'
      });
    }
    return res.status(400).json({
      error: `File upload error: ${err.message}`
    });
  }
  if (err.message === 'Invalid file type') {
    return res.status(415).json({
      error: 'Invalid file type. Please upload a supported file type'
    });
  }
  next(err);
};

// Middleware to validate request body
const validateFileUpload = (req, res, next) => {
  if (!req.body.recipientId) {
    return res.status(400).json({
      error: 'Recipient ID is required'
    });
  }
  next();
};

// Helper function to get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Helper function to check if file is an image
const isImage = (mimetype) => {
  return mimetype.startsWith('image/');
};

module.exports = {
  upload,
  handleFileUploadError,
  validateFileUpload,
  getFileExtension,
  isImage
};
