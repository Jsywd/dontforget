// backend/routes/gallery.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ตรวจสอบว่า path นี้มีอยู่จริง (ระดับเดียวกับ backend)
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, 'gallery-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // เพิ่มเป็น 10MB ต่อรูป
});

// POST: อัปโหลด
router.post('/', isAuthenticated, upload.array('images', 10), async (req, res) => {
  try {
    const { checklistID } = req.body;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'ไม่มีรูปภาพ' });
    }

    // วนลูปบันทึกลง DB
    for (const file of req.files) {
      const imageUrl = `/uploads/${file.filename}`;
      await db.query(
        'INSERT INTO checklist_gallery (checklistID, imageUrl) VALUES (?, ?)',
        [checklistID, imageUrl]
      );
    }
    res.json({ success: true, message: 'อัปโหลดสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET: ดึงรูป (ไม่ต้อง login ก็ดูได้)
router.get('/:checklistID', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM checklist_gallery WHERE checklistID = ? ORDER BY imageID DESC', 
      [req.params.checklistID]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE: ลบรูป
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    // เพิ่มการเช็คความเป็นเจ้าของ (ถ้าต้องการความปลอดภัยสูง)
    await db.query('DELETE FROM checklist_gallery WHERE imageID = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;