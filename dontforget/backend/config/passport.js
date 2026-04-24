// backend/config/passport.js
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcryptjs");
const db = require("./db");
require("dotenv").config();

// Serialize / Deserialize
passport.serializeUser((user, done) => done(null, user.userID));
passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE userID = ?", [id]);
    done(null, rows[0] || false);
  } catch (err) {
    done(err);
  }
});

// ─── Local Strategy ───────────────────────────────────────────────────────────
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
          email,
        ]);
        if (!rows.length)
          return done(null, false, { message: "ไม่พบอีเมลนี้ในระบบ" });

        const user = rows[0];
        if (!user.password)
          return done(null, false, { message: "กรุณาเข้าสู่ระบบด้วย Google" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return done(null, false, { message: "รหัสผ่านไม่ถูกต้อง" });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

// ─── Google OAuth Strategy ────────────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const avatar = profile.photos[0]?.value || null;

        // Check existing user by googleID or email
        let [rows] = await db.query(
          "SELECT * FROM users WHERE googleID = ? OR email = ?",
          [profile.id, email],
        );

        if (rows.length) {
          // Update googleID if missing
          if (!rows[0].googleID) {
            await db.query(
              "UPDATE users SET googleID = ?, avatar = ? WHERE userID = ?",
              [profile.id, avatar, rows[0].userID],
            );
          }
          return done(null, rows[0]);
        }

        // Create new user
        const [result] = await db.query(
          "INSERT INTO users (username, email, googleID, avatar) VALUES (?, ?, ?, ?)",
          [profile.displayName, email, profile.id, avatar],
        );
        const [newUser] = await db.query(
          "SELECT * FROM users WHERE userID = ?",
          [result.insertId],
        );
        return done(null, newUser[0]);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

module.exports = passport;
