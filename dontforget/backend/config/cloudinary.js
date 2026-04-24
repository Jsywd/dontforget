// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage สำหรับ coverImage (1 รูป)
const coverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dont-forget/covers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 400, crop: 'limit', quality: 'auto' }],
  },
});

// Storage สำหรับ gallery (หลายรูป)
const galleryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dont-forget/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }],
  },
});

const uploadCover   = multer({ storage: coverStorage,   limits: { fileSize: 5  * 1024 * 1024 } });
const uploadGallery = multer({ storage: galleryStorage, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { cloudinary, uploadCover, uploadGallery };