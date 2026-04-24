// backend/server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ 
  origin: process.env.APP_URL,
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dontforget_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000 
} // 7 days
}));

app.use(passport.initialize());
app.use(passport.session());

// ─── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/auth', require('./routes/auth'));
app.use('/api/checklists', require('./routes/checklists'));
app.use('/api/items', require('./routes/items'));
app.use('/api/places', require('./routes/places'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/checklist-gallery', require('./routes/gallery'));

// ─── Serve HTML pages ─────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
app.get('/pages/*', (req, res) => {
  const page = path.join(__dirname, '../frontend', req.path);
  res.sendFile(page, err => {
    if (err) res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });
});

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Not found' }));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
