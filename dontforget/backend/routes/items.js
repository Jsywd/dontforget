// backend/routes/items.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// ─── 1. เปลี่ยนการนำเข้าเป็น Cloudinary ─────────────────────────────────────────
// ใช้ uploadCover หรือจะใช้ uploadGallery ก็ได้ตามความเหมาะสมของขนาดรูป
const { uploadCover } = require('../config/cloudinary'); 

// ❌ ลบ Multer Local Storage และ Path เดิมออก

// helper: ตรวจเจ้าของ checklist (คงเดิม)
async function verifyOwner(checklistID, userID) {
  const [rows] = await db.query('SELECT userID FROM checklists WHERE checklistID = ?', [checklistID]);
  return rows.length && rows[0].userID === userID;
}

// ─── POST / — เพิ่ม Item (คงเดิมเพราะไม่มีอัปโหลดรูปในหน้านี้) ──────────────────────
router.post('/', isAuthenticated, async (req, res) => {
  const { checklistID, itemText } = req.body;
  if (!checklistID || !itemText?.trim()) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุ checklistID และ itemText' });
  }
  try {
    const isOwner = await verifyOwner(checklistID, req.user.userID);
    if (!isOwner) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });

    const [[{ maxOrder }]] = await db.query(
      'SELECT COALESCE(MAX(sortOrder), 0) AS maxOrder FROM checklist_items WHERE checklistID = ?',
      [checklistID]
    );

    const [result] = await db.query(
      'INSERT INTO checklist_items (checklistID, itemText, isChecked, sortOrder) VALUES (?, ?, 0, ?)',
      [checklistID, itemText.trim(), maxOrder + 1]
    );
    res.json({ success: true, itemID: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 2. PUT /:id — แก้ไข Item (เปลี่ยนเป็น Cloudinary) ───────────────────────────
router.put('/:id', isAuthenticated, uploadCover.single('image'), async (req, res) => {
  const { itemText, isChecked, sortOrder } = req.body;
  try {
    const [item] = await db.query(
      `SELECT i.*, c.userID FROM checklist_items i
       JOIN checklists c ON i.checklistID = c.checklistID
       WHERE i.itemID = ?`,
      [req.params.id]
    );
    if (!item.length || item[0].userID !== req.user.userID)
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });

    let sql = 'UPDATE checklist_items SET';
    const params = [];
    if (itemText  !== undefined) { sql += ' itemText=?,';  params.push(itemText); }
    if (isChecked !== undefined) { sql += ' isChecked=?,'; params.push(isChecked == '1' || isChecked === true ? 1 : 0); }
    if (sortOrder !== undefined) { sql += ' sortOrder=?,'; params.push(sortOrder); }
    
    // ─── 3. เปลี่ยนการเก็บ path เป็น Cloudinary URL ─────────────────────────────
    if (req.file) { 
      sql += ' imageURL=?,';  
      params.push(req.file.path); // ใช้ URL เต็มจาก Cloudinary
    }

    if (params.length === 0) return res.json({ success: true });

    sql = sql.replace(/,$/, '') + ' WHERE itemID=?';
    params.push(req.params.id);

    await db.query(sql, params);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /:id — ลบ Item (คงเดิม) ───────────────────────────────────────────
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const [item] = await db.query(
      `SELECT i.*, c.userID FROM checklist_items i
       JOIN checklists c ON i.checklistID = c.checklistID
       WHERE i.itemID = ?`,
      [req.params.id]
    );
    if (!item.length || item[0].userID !== req.user.userID)
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });

    await db.query('DELETE FROM checklist_items WHERE itemID = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;