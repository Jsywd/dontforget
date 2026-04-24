// backend/routes/checklists.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');
const { uploadCover } = require('../config/cloudinary'); // ← เปลี่ยนจาก multer local

// ─── GET: My checklists ───────────────────────────────────────────────────────
router.get('/my', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, cat.categoryName, cat.icon,
        (SELECT COUNT(*) FROM checklist_items WHERE checklistID = c.checklistID) as itemCount,
        (SELECT COUNT(*) FROM checklist_items WHERE checklistID = c.checklistID AND isChecked = 1) as checkedCount
      FROM checklists c
      LEFT JOIN categories cat ON c.categoryID = cat.categoryID
      WHERE c.userID = ?
      ORDER BY c.updated_at DESC
    `, [req.user.userID]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET: Popular checklists ──────────────────────────────────────────────────
router.get('/popular', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, u.username, u.avatar, cat.categoryName, cat.icon,
        (SELECT COUNT(*) FROM checklist_items WHERE checklistID = c.checklistID) as itemCount
      FROM checklists c
      JOIN users u ON c.userID = u.userID
      LEFT JOIN categories cat ON c.categoryID = cat.categoryID
      WHERE c.isPublic = 1
      ORDER BY c.copyCount DESC, c.created_at DESC
      LIMIT 20
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET: Recommended by interests ───────────────────────────────────────────
router.get('/recommended', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, u.username, u.avatar, cat.categoryName, cat.icon,
        (SELECT COUNT(*) FROM checklist_items WHERE checklistID = c.checklistID) as itemCount
      FROM checklists c
      JOIN users u ON c.userID = u.userID
      LEFT JOIN categories cat ON c.categoryID = cat.categoryID
      JOIN user_interests ui ON ui.categoryID = c.categoryID AND ui.userID = ?
      WHERE c.isPublic = 1 AND c.userID != ?
      ORDER BY c.copyCount DESC
      LIMIT 10
    `, [req.user.userID, req.user.userID]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET: Search / Community checklists ──────────────────────────────────────
router.get('/', async (req, res) => {
  const { category, categoryID, q } = req.query;
  const catID = category || categoryID;
  try {
    let sql = `
      SELECT c.*, u.username, cat.categoryName, cat.icon
      FROM checklists c
      JOIN users u ON c.userID = u.userID
      LEFT JOIN categories cat ON c.categoryID = cat.categoryID
      WHERE c.isPublic = 1
    `;
    const params = [];
    if (catID) { sql += ` AND c.categoryID = ?`; params.push(catID); }
    if (q)     { sql += ` AND (c.title LIKE ? OR c.description LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }
    sql += ` ORDER BY c.created_at DESC`;
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET: Single checklist ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [cl] = await db.query(`
      SELECT c.*, u.username, u.avatar, cat.categoryName
      FROM checklists c
      JOIN users u ON c.userID = u.userID
      LEFT JOIN categories cat ON c.categoryID = cat.categoryID
      WHERE c.checklistID = ?
    `, [req.params.id]);

    if (!cl.length) return res.status(404).json({ success: false, message: 'ไม่พบ Checklist' });

    const checklist = cl[0];
    const isOwner = req.isAuthenticated() && req.user.userID === checklist.userID;

    if (!checklist.isPublic && !isOwner)
      return res.status(403).json({ success: false, message: 'Checklist นี้เป็นส่วนตัว' });

    const [items] = await db.query(`
      SELECT i.*, p.placeName, p.address, p.latitude, p.longitude, p.placeID
      FROM checklist_items i
      LEFT JOIN places p ON p.itemID = i.itemID
      WHERE i.checklistID = ?
      ORDER BY i.sortOrder, i.itemID
    `, [req.params.id]);

    const [allPlaces] = await db.query(`SELECT * FROM places WHERE checklistID = ?`, [req.params.id]);

    res.json({ success: true, data: { ...checklist, items, allPlaces, isOwner } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST: Create checklist ───────────────────────────────────────────────────
router.post('/', isAuthenticated, uploadCover.single('coverImage'), async (req, res) => {
  const { title, description, categoryID, isPublic } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อ Checklist' });

  // Cloudinary คืน secure_url ใน req.file.path
  const coverImage = req.file ? req.file.path : null;

  try {
    const [result] = await db.query(
      'INSERT INTO checklists (userID, title, description, categoryID, coverImage, isPublic) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.userID, title, description || null, categoryID || null, coverImage, isPublic ? 1 : 0]
    );
    res.json({ success: true, checklistID: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT: Update checklist ────────────────────────────────────────────────────
router.put('/:id', isAuthenticated, uploadCover.single('coverImage'), async (req, res) => {
  const { title, description, categoryID, isPublic } = req.body;
  try {
    const [cl] = await db.query('SELECT userID FROM checklists WHERE checklistID = ?', [req.params.id]);
    if (!cl.length || cl[0].userID !== req.user.userID)
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์แก้ไข' });

    let sql = 'UPDATE checklists SET title=?, description=?, categoryID=?, isPublic=?';
    const params = [title, description || null, categoryID || null, isPublic ? 1 : 0];

    // Cloudinary คืน secure_url ใน req.file.path
    if (req.file) { sql += ', coverImage=?'; params.push(req.file.path); }

    sql += ' WHERE checklistID=?';
    params.push(req.params.id);

    await db.query(sql, params);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE: Delete checklist ─────────────────────────────────────────────────
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const [cl] = await db.query('SELECT userID FROM checklists WHERE checklistID = ?', [req.params.id]);
    if (!cl.length || cl[0].userID !== req.user.userID)
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ลบ' });
    await db.query('DELETE FROM checklists WHERE checklistID = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST: Copy checklist ─────────────────────────────────────────────────────
router.post('/:id/copy', isAuthenticated, async (req, res) => {
  try {
    const [cl] = await db.query('SELECT * FROM checklists WHERE checklistID = ? AND isPublic = 1', [req.params.id]);
    if (!cl.length) return res.status(404).json({ success: false, message: 'ไม่พบ Checklist' });

    const [newCL] = await db.query(
      'INSERT INTO checklists (userID, title, description, categoryID, isPublic) VALUES (?, ?, ?, ?, 0)',
      [req.user.userID, cl[0].title + ' (สำเนา)', cl[0].description, cl[0].categoryID]
    );
    const [items] = await db.query('SELECT * FROM checklist_items WHERE checklistID = ?', [req.params.id]);
    for (const item of items) {
      await db.query('INSERT INTO checklist_items (checklistID, itemText, sortOrder) VALUES (?, ?, ?)',
        [newCL.insertId, item.itemText, item.sortOrder]);
    }
    await db.query('UPDATE checklists SET copyCount = copyCount + 1 WHERE checklistID = ?', [req.params.id]);
    await db.query('INSERT INTO checklist_copies (originalChecklistID, copiedByUserID) VALUES (?, ?)', [req.params.id, req.user.userID]);

    res.json({ success: true, checklistID: newCL.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST: Report ─────────────────────────────────────────────────────────────
router.post('/reports', async (req, res) => {
  try {
    const { checklistID, reasonType, reasonDetails } = req.body;
    if (!req.isAuthenticated())
      return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' });
    await db.query(
      'INSERT INTO reports (checklistID, reporterID, reasonType, reasonDetails) VALUES (?, ?, ?, ?)',
      [checklistID, req.user.userID, reasonType, reasonDetails]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// ─── Admin: Get all pending reports ──────────────────────────────────────────
router.get('/admin/reports', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, c.title, c.coverImage, u.username
      FROM reports r
      JOIN checklists c ON r.checklistID = c.checklistID
      JOIN users u ON r.reporterID = u.userID
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// ─── Admin: Resolve (delete) a report ────────────────────────────────────────
router.put('/admin/reports/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM reports WHERE reportID = ?', [req.params.id]);
    res.json({ success: true, message: 'ลบรายการแจ้งรีพอร์ตออกแล้ว (โพสต์ยังอยู่)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// ─── Admin: Delete a post ─────────────────────────────────────────────────────
router.delete('/admin/posts/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM checklists WHERE checklistID = ?', [req.params.id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;