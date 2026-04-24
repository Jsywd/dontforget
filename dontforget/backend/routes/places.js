// backend/routes/places.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// ─── POST: Add place to checklist item ────────────────────────────────────────
router.post('/', isAuthenticated, async (req, res) => {
  const { checklistID, itemID, placeName, address, latitude, longitude, placeType, googlePlaceID, imageURL, rating } = req.body;
  if (!checklistID || !placeName)
    return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบ' });

  try {
    const [cl] = await db.query('SELECT userID FROM checklists WHERE checklistID = ?', [checklistID]);
    if (!cl.length || cl[0].userID !== req.user.userID)
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });

    const [result] = await db.query(
      'INSERT INTO places (checklistID, itemID, placeName, address, latitude, longitude, placeType, googlePlaceID, imageURL, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [checklistID, itemID || null, placeName, address || null, latitude || null, longitude || null, placeType || 'other', googlePlaceID || null, imageURL || null, rating || null]
    );
    res.json({ success: true, placeID: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT: Update place ────────────────────────────────────────────────────────
router.put('/:id', isAuthenticated, async (req, res) => {
  const { placeName, address, latitude, longitude, placeType, rating } = req.body;
  try {
    const [place] = await db.query(
      'SELECT p.*, c.userID FROM places p JOIN checklists c ON p.checklistID = c.checklistID WHERE p.placeID = ?',
      [req.params.id]
    );
    if (!place.length || place[0].userID !== req.user.userID)
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });

    await db.query(
      'UPDATE places SET placeName=?, address=?, latitude=?, longitude=?, placeType=?, rating=? WHERE placeID=?',
      [placeName, address || null, latitude || null, longitude || null, placeType || 'other', rating || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE: Remove place ─────────────────────────────────────────────────────
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const [place] = await db.query(
      'SELECT p.*, c.userID FROM places p JOIN checklists c ON p.checklistID = c.checklistID WHERE p.placeID = ?',
      [req.params.id]
    );
    if (!place.length || place[0].userID !== req.user.userID)
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });

    await db.query('DELETE FROM places WHERE placeID = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET: All places in checklist ─────────────────────────────────────────────
router.get('/checklist/:checklistID', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM places WHERE checklistID = ?', [req.params.checklistID]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;