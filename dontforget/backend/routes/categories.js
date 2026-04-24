// backend/routes/categories.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { isAuthenticated } = require("../middleware/auth");

// GET all categories
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM categories ORDER BY categoryName",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET/SET user interests
router.get("/interests", isAuthenticated, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT c.* FROM categories c JOIN user_interests ui ON c.categoryID = ui.categoryID WHERE ui.userID = ?",
      [req.user.userID],
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/interests", isAuthenticated, async (req, res) => {
  const { categoryIDs } = req.body; // array of IDs
  try {
    await db.query("DELETE FROM user_interests WHERE userID = ?", [
      req.user.userID,
    ]);
    for (const id of categoryIDs) {
      await db.query(
        "INSERT IGNORE INTO user_interests (userID, categoryID) VALUES (?, ?)",
        [req.user.userID, id],
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
