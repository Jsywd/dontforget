// backend/middleware/auth.js

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบ" });
}

function isAuthenticatedPage(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/pages/login.html");
}

module.exports = { isAuthenticated, isAuthenticatedPage };
