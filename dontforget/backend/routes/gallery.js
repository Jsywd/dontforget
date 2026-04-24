// backend/routes/gallery.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { isAuthenticated } = require("../middleware/auth");

// ─── 1. เปลี่ยนการนำเข้าจาก Multer Local เป็น Cloudinary ──────────────────────
// เรียกใช้ uploadGallery ที่คุณตั้งค่า Storage ไว้สำหรับหลายรูป
const { uploadGallery } = require("../config/cloudinary");

// ❌ ลบ Multer config และ Path เดิมออกได้เลย เพราะไม่ได้ใช้เก็บในเครื่องแล้ว

// POST: อัปโหลด (เปลี่ยนเป็น Cloudinary)
// ใช้ uploadGallery.array เพื่อรับรูปหลายรูป (สูงสุด 10 รูปตามเดิม)
router.post(
  "/",
  isAuthenticated,
  uploadGallery.array("images", 10),
  async (req, res) => {
    try {
      const { checklistID } = req.body;

      // ตรวจสอบว่ามีไฟล์ส่งมาไหม
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "ไม่มีรูปภาพ" });
      }

      // ─── 2. วนลูปบันทึก URL จาก Cloudinary ลง TiDB ────────────────────────────
      for (const file of req.files) {
        // file.path จะเป็น URL เต็มจาก Cloudinary (https://res.cloudinary.com/...)
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

// GET: ดึงรูป (ไม่ต้องแก้ Logic เพราะ Query จาก DB เหมือนเดิม)
router.get("/:checklistID", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM checklist_gallery WHERE checklistID = ? ORDER BY imageID DESC",
      [req.params.checklistID],
    );
    // ข้อมูลใน rows[i].imageUrl จะเป็น URL ของ Cloudinary พร้อมแสดงผลทันที
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE: ลบรูปใน Gallery
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const imageID = req.params.id;

    // 1. เช็คก่อนว่ารูปนี้เป็นของ User คนที่ล็อกอินอยู่จริงไหม (Join กับตาราง checklists)
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

    // 2. ลบข้อมูลใน TiDB
    await db.query("DELETE FROM checklist_gallery WHERE imageID = ?", [
      imageID,
    ]);

    res.json({ success: true, message: "ลบรูปสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
