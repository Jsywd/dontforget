const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { isAuthenticated } = require("../middleware/auth");

const { uploadGallery } = require("../config/cloudinary");

router.post(
  "/",
  isAuthenticated,
  uploadGallery.array("images", 10),
  async (req, res) => {
    try {
      const { checklistID } = req.body;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "ไม่มีรูปภาพ" });
      }

      for (const file of req.files) {
        const imageUrl = file.path;

        await db.query(
          "INSERT INTO checklist_gallery (checklistID, imageUrl) VALUES (?, ?)",
          [checklistID, imageUrl],
        );
      }

      res.json({ success: true, message: "อัปโหลดขึ้น Cloudinary สำเร็จ" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// ดึงรูป 
router.get("/:checklistID", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM checklist_gallery WHERE checklistID = ? ORDER BY imageID DESC",
      [req.params.checklistID],
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ลบรูปใน Gallery
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const imageID = req.params.id;

    const [imageData] = await db.query(
      `SELECT g.* FROM checklist_gallery g
       JOIN checklists c ON g.checklistID = c.checklistID
       WHERE g.imageID = ? AND c.userID = ?`,
      [imageID, req.user.userID],
    );

    if (imageData.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "ไม่มีสิทธิ์ลบรูปนี้" });
    }

    await db.query("DELETE FROM checklist_gallery WHERE imageID = ?", [
      imageID,
    ]);

    res.json({ success: true, message: "ลบรูปสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
