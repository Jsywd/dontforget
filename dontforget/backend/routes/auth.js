const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
require("dotenv").config();

// Register 
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res
      .status(400)
      .json({ success: false, message: "กรอกข้อมูลให้ครบ" });

  try {
    const [existing] = await db.query(
      "SELECT userID FROM users WHERE email = ?",
      [email],
    );
    if (existing.length)
      return res
        .status(409)
        .json({ success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashed],
    );
    const [newUser] = await db.query("SELECT * FROM users WHERE userID = ?", [
      result.insertId,
    ]);

    req.login(newUser[0], (err) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "เกิดข้อผิดพลาด" });
      res.json({
        success: true,
        user: {
          userID: newUser[0].userID,
          username: newUser[0].username,
          email: newUser[0].email,
          avatar: newUser[0].avatar,
        },
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err)
      return res.status(500).json({ success: false, message: err.message });
    if (!user)
      return res
        .status(401)
        .json({
          success: false,
          message: info?.message || "เข้าสู่ระบบไม่สำเร็จ",
        });

    req.login(user, (err) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "เกิดข้อผิดพลาด" });

      res.json({
        success: true,
        user: {
          userID: user.userID,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
      });
    });
  })(req, res, next);
});

// Logout 
router.post("/logout", (req, res) => {
  req.logout(() => res.json({ success: true }));
});

// Get current user 
router.get("/me", (req, res) => {
  if (!req.isAuthenticated()) return res.json({ loggedIn: false });

  const { userID, username, email, avatar, role } = req.user;
  res.json({
    loggedIn: true,
    user: { userID, username, email, avatar, role },
  });
});

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/pages/login.html" }),
  (req, res) => {
    const user = req.user;
    if (user.role === "admin") {
      res.redirect("/pages/admin.html");
    } else {
      res.redirect("/pages/dashboard.html");
    }
  },
);

module.exports = router;
