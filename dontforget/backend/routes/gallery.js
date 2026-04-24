// backend/routes/gallery.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');
const { uploadGallery } = require('../config/cloudinary'); // ← เปลี่ยนจาก multer local

// POST: อัปโหลดรูปหลายรูป
router.post('/', isAuthenticated, uploadGallery.array('images', 10), async (req, res) => {
  try {
    const { checklistID } = req.body;
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ success: false, message: 'ไม่มีรูปภาพ' });

    for (const file of req.files) {
      // Cloudinary คืน secure_url ใน file.path
      await db.query(
        'INSERT INTO checklist_gallery (checklistID, imageUrl) VALUES (?, ?)',
        [checklistID, file.path]
      );
    }
    res.json({ success: true, message: 'อัปโหลดสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET: ดึงรูปทั้งหมดของ checklist
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
    await db.query('DELETE FROM checklist_gallery WHERE imageID = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;